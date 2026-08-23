import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface BatchItem {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrix: THREE.Matrix4;
  castShadow: boolean;
  receiveShadow: boolean;
  zoneId: string;
}

export interface BatchStats {
  originalMeshCount: number;
  successfullyBatchedMeshCount: number;
  fallbackMeshCount: number;
  failedMergeGroupCount: number;
  mergedGeometryCount: number;
  finalBatchedMeshCount: number;
  zonesCount: number;
  originalGeometriesDisposed: number;
  reductionPercentage: number;
  shadowCasterMeshCount: number;
  nonShadowCasterMeshCount: number;
  shadowBatchCount: number;
  nonShadowBatchCount: number;
  shadowBatchTriangles: number;
  nonShadowBatchTriangles: number;
}

export class StaticGeometryBatcher {
  private currentZoneId: string = 'general';
  private items: BatchItem[] = [];
  public static BATCHING_ENABLED = true;

  // Spatial zones definition for automatic classification fallback
  private static readonly ZONES: { id: string; minX: number; maxX: number; minZ: number; maxZ: number }[] = [
    { id: 'entrance', minX: -9, maxX: 9, minZ: 44, maxZ: 58 },
    { id: 'lobby', minX: -13, maxX: 13, minZ: 20, maxZ: 44 },
    { id: 'corridor_south', minX: -7, maxX: 7, minZ: 11, maxZ: 20 },
    { id: 'rotunda', minX: -14, maxX: 14, minZ: -11, maxZ: 11 },
    { id: 'corridor_west', minX: -21, maxX: -13, minZ: -25, maxZ: 20 },
    { id: 'corridor_east', minX: 13, maxX: 21, minZ: -25, maxZ: 20 },
    { id: 'corridor_north', minX: -7, maxX: 7, minZ: -29, maxZ: -11 },
    { id: 'hall_01', minX: -42, maxX: -20, minZ: 0, maxZ: 21 },
    { id: 'hall_02', minX: -42, maxX: -20, minZ: -26, maxZ: 0 },
    { id: 'hall_03', minX: 20, maxX: 42, minZ: 0, maxZ: 21 },
    { id: 'hall_04', minX: 20, maxX: 42, minZ: -26, maxZ: 0 },
    { id: 'hall_05', minX: -28, maxX: -4, minZ: -48, maxZ: -29 },
    { id: 'hall_06', minX: 4, maxX: 28, minZ: -48, maxZ: -29 },
    { id: 'passage_mid', minX: -5, maxX: 5, minZ: -48, maxZ: -29 },
    { id: 'passage_final', minX: -7, maxX: 7, minZ: -60, maxZ: -48 },
    { id: 'final_hall', minX: -13, maxX: 13, minZ: -78, maxZ: -60 },
    { id: 'exit_terrace', minX: -11, maxX: 11, minZ: -92, maxZ: -78 },
    { id: 'envelope', minX: -50, maxX: 50, minZ: -95, maxZ: 60 }
  ];

  public setZone(zoneId: string): void {
    this.currentZoneId = zoneId;
  }

  public getZone(): string {
    return this.currentZoneId;
  }

  public static findZoneForPosition(x: number, z: number): string {
    for (const zDef of StaticGeometryBatcher.ZONES) {
      if (x >= zDef.minX && x <= zDef.maxX && z >= zDef.minZ && z <= zDef.maxZ) {
        return zDef.id;
      }
    }
    return 'general';
  }

  /**
   * Adds an individual mesh or entire hierarchical group to be batched statically.
   */
  public add(object: THREE.Object3D, zoneId?: string): void {
    const targetZone = zoneId || this.currentZoneId;
    object.updateMatrixWorld(true);

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry && child.material) {
        const mat = child.material as THREE.Material;
        
        let itemZone = targetZone;
        if (itemZone === 'general') {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          itemZone = StaticGeometryBatcher.findZoneForPosition(worldPos.x, worldPos.z);
        }

        this.items.push({
          geometry: child.geometry,
          material: mat,
          matrix: child.matrixWorld.clone(),
          castShadow: child.castShadow,
          receiveShadow: child.receiveShadow,
          zoneId: itemZone
        });
      }
    });
  }

  /**
   * Normalizes buffer attributes and index compatibility so BufferGeometryUtils.mergeGeometries
   * merges cleanly without attribute mismatches or index errors.
   */
  private prepareTransformedGeometry(geo: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry | null {
    if (!geo.attributes.position) {
      return null;
    }

    // Always convert to non-indexed triangle list so that 100% of geometries share
    // the exact same index-less representation. This guarantees complete merge compatibility
    // across BoxGeometry, CylinderGeometry, PlaneGeometry, ExtrudeGeometry, etc.
    let normalized: THREE.BufferGeometry;
    if (geo.index) {
      normalized = geo.toNonIndexed();
    } else {
      normalized = geo.clone();
    }

    // Ensure normal attribute exists
    if (!normalized.attributes.normal) {
      normalized.computeVertexNormals();
    }

    // Ensure standard uv attribute exists
    if (!normalized.attributes.uv) {
      const count = normalized.attributes.position.count;
      const uvs = new Float32Array(count * 2);
      normalized.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    // Strip non-standard attributes to keep layout 100% compatible
    const standardAttrs = ['position', 'normal', 'uv'];
    for (const key of Object.keys(normalized.attributes)) {
      if (!standardAttrs.includes(key)) {
        normalized.deleteAttribute(key);
      }
    }

    // Apply matrix transformation in-place to vertices and normals
    normalized.applyMatrix4(matrix);
    return normalized;
  }

  /**
   * Processes all queued static items, groups by Zone, Material, CastShadow and ReceiveShadow,
   * merges compatible geometries, and populates the target sceneGroup.
   */
  public buildBatches(targetGroup: THREE.Group): BatchStats {
    const originalMeshCount = this.items.length;
    let successfullyBatchedMeshCount = 0;
    let fallbackMeshCount = 0;
    let failedMergeGroupCount = 0;
    let mergedGeometryCount = 0;
    let finalBatchedMeshCount = 0;
    let originalGeometriesDisposed = 0;

    let shadowCasterMeshCount = 0;
    let nonShadowCasterMeshCount = 0;
    let shadowBatchCount = 0;
    let nonShadowBatchCount = 0;
    let shadowBatchTriangles = 0;
    let nonShadowBatchTriangles = 0;

    for (const item of this.items) {
      if (item.castShadow) {
        shadowCasterMeshCount++;
      } else {
        nonShadowCasterMeshCount++;
      }
    }

    // Group items by: zoneId + materialId + castShadow + receiveShadow
    const groups: Map<string, {
      zoneId: string;
      material: THREE.Material;
      castShadow: boolean;
      receiveShadow: boolean;
      items: BatchItem[];
    }> = new Map();

    for (const item of this.items) {
      const mat = item.material;
      const matId = mat.uuid;
      const key = `${item.zoneId}__${matId}__${item.castShadow ? '1' : '0'}__${item.receiveShadow ? '1' : '0'}`;

      let group = groups.get(key);
      if (!group) {
        group = {
          zoneId: item.zoneId,
          material: mat,
          castShadow: item.castShadow,
          receiveShadow: item.receiveShadow,
          items: []
        };
        groups.set(key, group);
      }
      group.items.push(item);
    }

    // Create zone container groups to preserve hierarchical spatial culling
    const zoneGroups: Map<string, THREE.Group> = new Map();

    const getZoneGroup = (zoneId: string): THREE.Group => {
      let zg = zoneGroups.get(zoneId);
      if (!zg) {
        zg = new THREE.Group();
        zg.name = `BatchZone_${zoneId}`;
        zg.matrixAutoUpdate = false;
        targetGroup.add(zg);
        zoneGroups.set(zoneId, zg);
      }
      return zg;
    };

    const isBatchingActive = StaticGeometryBatcher.BATCHING_ENABLED;

    // Build batches
    for (const [key, group] of groups.entries()) {
      const zg = getZoneGroup(group.zoneId);

      if (!isBatchingActive || group.items.length === 1) {
        // Unmerged / single geometry path
        for (const item of group.items) {
          const singleGeo = this.prepareTransformedGeometry(item.geometry, item.matrix);
          if (!singleGeo) continue;

          singleGeo.computeBoundingSphere();
          singleGeo.computeBoundingBox();

          const mesh = new THREE.Mesh(singleGeo, group.material);
          mesh.castShadow = group.castShadow;
          mesh.receiveShadow = group.receiveShadow;
          mesh.matrixAutoUpdate = false;
          mesh.updateMatrix();
          mesh.frustumCulled = true;

          zg.add(mesh);
          finalBatchedMeshCount++;
          if (isBatchingActive) {
            successfullyBatchedMeshCount++;
          } else {
            fallbackMeshCount++;
          }

          const triCount = singleGeo.attributes.position ? singleGeo.attributes.position.count / 3 : 0;
          if (group.castShadow) {
            shadowBatchCount++;
            shadowBatchTriangles += triCount;
          } else {
            nonShadowBatchCount++;
            nonShadowBatchTriangles += triCount;
          }
        }
      } else {
        // Multiple geometries candidate for merging
        const transformedGeos: THREE.BufferGeometry[] = [];

        for (const item of group.items) {
          const tGeo = this.prepareTransformedGeometry(item.geometry, item.matrix);
          if (tGeo) {
            transformedGeos.push(tGeo);
          }
        }

        if (transformedGeos.length === 0) {
          continue;
        }

        let mergedSuccessfully = false;
        try {
          const merged = BufferGeometryUtils.mergeGeometries(transformedGeos, false);
          if (merged) {
            merged.computeBoundingSphere();
            merged.computeBoundingBox();

            const mergedMesh = new THREE.Mesh(merged, group.material);
            mergedMesh.castShadow = group.castShadow;
            mergedMesh.receiveShadow = group.receiveShadow;
            mergedMesh.matrixAutoUpdate = false;
            mergedMesh.updateMatrix();
            mergedMesh.frustumCulled = true;

            zg.add(mergedMesh);
            finalBatchedMeshCount++;
            mergedGeometryCount++;
            successfullyBatchedMeshCount += group.items.length;
            mergedSuccessfully = true;

            const triCount = merged.attributes.position ? merged.attributes.position.count / 3 : 0;
            if (group.castShadow) {
              shadowBatchCount++;
              shadowBatchTriangles += triCount;
            } else {
              nonShadowBatchCount++;
              nonShadowBatchTriangles += triCount;
            }
          }
        } catch (err) {
          failedMergeGroupCount++;
          console.warn(`[STATIC BATCHER] Merge fallback for zone ${group.zoneId}:`, err);
        }

        if (!mergedSuccessfully) {
          // Fallback to individual meshes if merge failed
          failedMergeGroupCount++;
          fallbackMeshCount += transformedGeos.length;
          for (const tGeo of transformedGeos) {
            tGeo.computeBoundingSphere();
            tGeo.computeBoundingBox();
            const mesh = new THREE.Mesh(tGeo, group.material);
            mesh.castShadow = group.castShadow;
            mesh.receiveShadow = group.receiveShadow;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.frustumCulled = true;
            zg.add(mesh);
            finalBatchedMeshCount++;
          }
        } else {
          // Dispose temporary individual cloned geometries
          for (const tGeo of transformedGeos) {
            tGeo.dispose();
            originalGeometriesDisposed++;
          }
        }
      }
    }

    // Freeze all zone groups matrices
    for (const zg of zoneGroups.values()) {
      zg.updateMatrix();
      zg.matrixAutoUpdate = false;
    }

    targetGroup.updateMatrixWorld(true);

    const reductionPercentage = originalMeshCount > 0
      ? parseFloat(((1 - finalBatchedMeshCount / originalMeshCount) * 100).toFixed(1))
      : 0;

    const stats: BatchStats = {
      originalMeshCount,
      successfullyBatchedMeshCount,
      fallbackMeshCount,
      failedMergeGroupCount,
      mergedGeometryCount,
      finalBatchedMeshCount,
      zonesCount: zoneGroups.size,
      originalGeometriesDisposed,
      reductionPercentage,
      shadowCasterMeshCount,
      nonShadowCasterMeshCount,
      shadowBatchCount,
      nonShadowBatchCount,
      shadowBatchTriangles: Math.round(shadowBatchTriangles),
      nonShadowBatchTriangles: Math.round(nonShadowBatchTriangles)
    };

    console.log(
      `[STATIC BATCHER] Batched ${originalMeshCount} original static meshes -> ${finalBatchedMeshCount} render meshes across ${zoneGroups.size} spatial zones (${reductionPercentage}% reduction, ${mergedGeometryCount} merged groups, ${fallbackMeshCount} fallback meshes, ${failedMergeGroupCount} failed groups).\n` +
      `  • Shadow Casters (Cat A+B): ${shadowCasterMeshCount} meshes -> ${shadowBatchCount} batches (${Math.round(shadowBatchTriangles).toLocaleString()} tris)\n` +
      `  • Non-Shadow Casters (Cat C): ${nonShadowCasterMeshCount} meshes -> ${nonShadowBatchCount} batches (${Math.round(nonShadowBatchTriangles).toLocaleString()} tris)`
    );

    // Clear queue
    this.items = [];
    return stats;
  }
}

