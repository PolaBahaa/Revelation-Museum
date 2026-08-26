import * as THREE from 'three';
import { Artwork, WallSlot } from '../types';
import { FINAL_ARTWORKS, getSlotForArtwork } from './MuseumData';
import { Lighting } from './Lighting';
import { DiagnosticProfiler } from './DiagnosticProfiler';

export interface InteractiveArtworkMesh {
  artwork: Artwork;
  mesh: THREE.Mesh;
  worldPosition: THREE.Vector3;
  isRealPNG: boolean;
}

interface SlotRuntimeItem {
  art: Artwork;
  slot: WallSlot;
  group: THREE.Group;
  interactiveItem: InteractiveArtworkMesh;
  loaded: boolean;
  texture?: THREE.Texture;
  mesh?: THREE.Mesh;
}

// Architectural Bay Constraints:
// Pilaster spacing in standard gallery halls is ~3.6m to 4.0m with 0.46m capital widths.
// MAX_ARTWORK_WIDTH = 2.60m and corridor width = 2.30m guarantee a visible 0.35m - 0.65m architectural clearance gap.
const MAX_ARTWORK_WIDTH = 2.60;
const MAX_ARTWORK_HEIGHT = 2.35;

export class PaintingManager {
  public static PREWARMING_ENABLED = true;
  private static globalTextureCache = new Map<string, Promise<THREE.Texture | null>>();
  private static loadedTexturesMap = new Map<string, THREE.Texture>();

  public galleryGroup: THREE.Group = new THREE.Group();
  public interactiveArtworks: InteractiveArtworkMesh[] = [];
  private lighting: Lighting;
  private textureLoader = new THREE.TextureLoader();
  private slotRuntimeItems: SlotRuntimeItem[] = [];
  private isPrewarmed = false;
  private prewarmPromise: Promise<void> | null = null;
  private isDisposed = false;

  constructor(lighting: Lighting) {
    this.lighting = lighting;
  }

  public dispose(): void {
    this.isDisposed = true;
  }

  public initAllArtworks(): void {
    if (this.slotRuntimeItems.length > 0) return;

    for (const art of FINAL_ARTWORKS) {
      const slot = getSlotForArtwork(art);
      if (!slot) {
        // If an artwork does not have an assigned legitimate physical wall slot, DO NOT render a mesh
        continue;
      }
      art.position = slot.pos;
      art.rotation = [0, slot.rotY, 0];
      art.slotId = slot.id;

      this.setupArtworkSlot(art, slot);
    }
  }

  /**
   * Calculates proportional dimensions with strict architectural clearance constraints.
   * Guarantees that artworks never overlap pilasters, columns, dado rails, or upper cornices.
   */
  private calculateArtworkDimensions(imgWidth: number, imgHeight: number, slot?: WallSlot): { width: number; height: number } {
    const aspect = imgWidth / imgHeight;
    let maxBayWidth = MAX_ARTWORK_WIDTH;
    let maxBayHeight = MAX_ARTWORK_HEIGHT;

    if (slot) {
      const isCorridor = slot.hallId.startsWith('corridor_') || slot.hallId === 'passage_final' || slot.slotIndex >= 79;
      if (isCorridor) {
        maxBayWidth = 2.30;
        maxBayHeight = 2.20;
      } else {
        maxBayWidth = 2.60;
        maxBayHeight = 2.35;
      }
    }

    const preferredHeight = Math.min(2.35, maxBayHeight);
    const preferredWidth = preferredHeight * aspect;

    // 1. Constrain to maximum allowable wall bay width
    let targetWidth = Math.min(preferredWidth, maxBayWidth);
    let targetHeight = targetWidth / aspect;

    // 2. Constrain to vertical clearance (dado rail at Y=1.2m and upper frieze at Y=5.35m)
    if (targetHeight > maxBayHeight) {
      targetHeight = maxBayHeight;
      targetWidth = targetHeight * aspect;
    }

    return { width: targetWidth, height: targetHeight };
  }

  private setupArtworkSlot(art: Artwork, slot: WallSlot): void {
    const group = new THREE.Group();
    group.position.set(slot.pos[0], slot.pos[1], slot.pos[2]);
    group.rotation.y = slot.rotY;

    // Create slot spotlight overhead
    const spotOffset = 1.0;
    const spotPos = new THREE.Vector3(0, 1.8, spotOffset)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), slot.rotY)
      .add(new THREE.Vector3(slot.pos[0], slot.pos[1], slot.pos[2]));
    const targetPos = new THREE.Vector3(slot.pos[0], slot.pos[1], slot.pos[2]);

    const spotGroup = this.lighting.createArtworkSpotlight(
      spotPos.x, spotPos.y, spotPos.z,
      targetPos.x, targetPos.y, targetPos.z
    );
    this.galleryGroup.add(spotGroup);
    this.galleryGroup.add(group);

    const interactiveItem: InteractiveArtworkMesh = {
      artwork: art,
      mesh: null as unknown as THREE.Mesh,
      worldPosition: new THREE.Vector3(slot.pos[0], slot.pos[1], slot.pos[2]),
      isRealPNG: false
    };

    this.slotRuntimeItems.push({
      art,
      slot,
      group,
      interactiveItem,
      loaded: false
    });
  }

  /**
   * Preloads all canonical artwork textures dynamically, configures their colorSpace & anisotropy,
   * constructs the physical meshes, and explicitly prewarms/uploads them into GPU memory.
   * Uses Promise-caching to guarantee strictly one logical texture load per URL.
   */
  public preloadAndPrewarmAll(
    renderer: THREE.WebGLRenderer,
    onProgress?: (loaded: number, total: number, msg: string) => void
  ): Promise<void> {
    if (this.isPrewarmed) {
      return Promise.resolve();
    }
    if (this.prewarmPromise) {
      return this.prewarmPromise;
    }

    if (!PaintingManager.PREWARMING_ENABLED) {
      console.log('[PaintingManager] Prewarming disabled via configuration switch.');
      this.isPrewarmed = true;
      const total = FINAL_ARTWORKS.length;
      if (onProgress) onProgress(total, total, 'Ready (Prewarming skipped)');
      return Promise.resolve();
    }

    this.prewarmPromise = this.executePrewarm(renderer, onProgress);
    return this.prewarmPromise;
  }

  private async executePrewarm(
    renderer: THREE.WebGLRenderer,
    onProgress?: (loaded: number, total: number, msg: string) => void
  ): Promise<void> {
    this.initAllArtworks();

    const profiler = DiagnosticProfiler.getInstance();
    profiler.recordPrewarmStart();

    const total = this.slotRuntimeItems.length;
    let completedCount = 0;
    const maxAnisotropy = renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 8;
    const chunkSize = 4;

    for (let i = 0; i < total; i += chunkSize) {
      if (this.isDisposed) return;

      const chunk = this.slotRuntimeItems.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map((item) =>
          this.loadAndPrewarmSingleArtwork(item, renderer, maxAnisotropy).then(() => {
            completedCount++;
            if (onProgress && !this.isDisposed) {
              onProgress(
                completedCount,
                total,
                `Preparing artwork ${completedCount} of ${total}...`
              );
            }
          })
        )
      );

      // Yield execution to browser event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    this.isPrewarmed = true;
  }

  /**
   * Fetches a texture with global caching to guarantee exactly one network request per URL.
   */
  private fetchTextureCached(url: string, artworkNumber: number): Promise<THREE.Texture | null> {
    const profiler = DiagnosticProfiler.getInstance();

    if (PaintingManager.loadedTexturesMap.has(url)) {
      const tex = PaintingManager.loadedTexturesMap.get(url)!;
      const img = tex.image as HTMLImageElement | undefined;
      profiler.recordTextureRequest(artworkNumber, url);
      profiler.recordTextureLoaded(artworkNumber, img?.width || 512, img?.height || 512);
      return Promise.resolve(tex);
    }

    if (PaintingManager.globalTextureCache.has(url)) {
      profiler.recordTextureRequest(artworkNumber, url);
      return PaintingManager.globalTextureCache.get(url)!;
    }

    profiler.recordTextureRequest(artworkNumber, url);

    const loadPromise = new Promise<THREE.Texture | null>((resolve) => {
      this.textureLoader.load(
        url,
        (texture) => {
          PaintingManager.loadedTexturesMap.set(url, texture);
          resolve(texture);
        },
        undefined,
        (err) => {
          profiler.recordTextureError(artworkNumber, url, err);
          resolve(null);
        }
      );
    });

    PaintingManager.globalTextureCache.set(url, loadPromise);
    return loadPromise;
  }

  private async loadAndPrewarmSingleArtwork(
    item: SlotRuntimeItem,
    renderer: THREE.WebGLRenderer,
    maxAnisotropy: number
  ): Promise<void> {
    if (item.loaded || this.isDisposed) {
      return;
    }

    const numStr = String(item.art.number).padStart(2, '0');
    const url = item.art.textureUrl || `/paintings/${numStr}.png`;
    const profiler = DiagnosticProfiler.getInstance();
    const texture = await this.fetchTextureCached(url, item.art.number);
    if (!texture || this.isDisposed) {
      return;
    }

    try {
      // Configure exact color space & texture filtering
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(maxAnisotropy, 8);
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;

      const img = texture.image as HTMLImageElement | undefined;
      if (img && img.width > 0 && img.height > 0) {
        profiler.recordTextureLoaded(item.art.number, img.width, img.height);
        const dims = this.calculateArtworkDimensions(img.width, img.height, item.slot);
        const targetW = dims.width;
        const targetH = dims.height;

        item.art.width = targetW;
        item.art.height = targetH;

        const geo = new THREE.PlaneGeometry(targetW, targetH);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.005,
          depthWrite: true,
          roughness: 0.25,
          metalness: 0.02,
          side: THREE.FrontSide
        });

        const paintingMesh = new THREE.Mesh(geo, mat);
        paintingMesh.position.set(0, 0, 0.01);
        paintingMesh.castShadow = false;
        paintingMesh.receiveShadow = false;

        item.group.add(paintingMesh);

        // Perform bounding box validation
        geo.computeBoundingBox();
        if (geo.boundingBox) {
          const currentWidth = geo.boundingBox.max.x - geo.boundingBox.min.x;
          const isCorridor = item.slot.hallId.startsWith('corridor_') || item.slot.hallId === 'passage_final' || item.slot.slotIndex >= 79;
          const maxAllowedWidth = isCorridor ? 2.30 : MAX_ARTWORK_WIDTH;
          if (currentWidth > maxAllowedWidth + 0.01) {
            const scaleFactor = maxAllowedWidth / currentWidth;
            paintingMesh.scale.set(scaleFactor, scaleFactor, 1.0);
          }
        }

        paintingMesh.updateMatrix();
        paintingMesh.updateMatrixWorld(true);
        paintingMesh.matrixAutoUpdate = false;

        item.group.updateMatrix();
        item.group.updateMatrixWorld(true);
        item.group.matrixAutoUpdate = false;

        item.mesh = paintingMesh;
        item.interactiveItem.mesh = paintingMesh;
        item.interactiveItem.isRealPNG = true;
        paintingMesh.getWorldPosition(item.interactiveItem.worldPosition);

        // Only register into interactiveArtworks now that it has a real physical mesh
        if (!this.interactiveArtworks.includes(item.interactiveItem)) {
          this.interactiveArtworks.push(item.interactiveItem);
        }

        item.texture = texture;
        item.loaded = true;

        // Explicit GPU Texture Initialization
        renderer.initTexture(texture);
        profiler.recordTextureGpuInit(item.art.number);
      }
    } catch (err) {
      console.warn(`[PaintingManager] Error setting up artwork ${item.art.number}:`, err);
    }
  }

  // Cached nearest artwork query to eliminate allocations and per-frame distance calculations
  private lastQueryPos = new THREE.Vector3(Infinity, Infinity, Infinity);
  private lastQueryTime = 0;
  private cachedNearestResult: { artwork: Artwork | null; distance: number } = {
    artwork: FINAL_ARTWORKS.length > 0 ? FINAL_ARTWORKS[0] : null,
    distance: Infinity,
  };
  private hasCachedNearest = false;

  public getNearestArtwork(playerPos: THREE.Vector3, forceRecalculate = false): { artwork: Artwork; distance: number } | null {
    const now = performance.now();
    const dxPos = playerPos.x - this.lastQueryPos.x;
    const dzPos = playerPos.z - this.lastQueryPos.z;
    const distMovedSq = dxPos * dxPos + dzPos * dzPos;

    // Return cached result if player has moved less than 0.25m and within 100ms
    if (!forceRecalculate && distMovedSq < 0.0625 && (now - this.lastQueryTime) < 100) {
      return (this.hasCachedNearest && this.cachedNearestResult.artwork)
        ? (this.cachedNearestResult as { artwork: Artwork; distance: number })
        : null;
    }

    this.lastQueryPos.copy(playerPos);
    this.lastQueryTime = now;

    let nearest: Artwork | null = null;
    let minDistanceSq = Infinity;
    const maxThresholdSq = 6.0 * 6.0;

    for (let i = 0; i < this.interactiveArtworks.length; i++) {
      const item = this.interactiveArtworks[i];
      const dx = playerPos.x - item.worldPosition.x;
      const dy = playerPos.y - item.worldPosition.y;
      const dz = playerPos.z - item.worldPosition.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearest = item.artwork;
      }
    }

    if (nearest && minDistanceSq <= maxThresholdSq) {
      this.cachedNearestResult.artwork = nearest;
      this.cachedNearestResult.distance = Math.sqrt(minDistanceSq);
      this.hasCachedNearest = true;
      return { artwork: nearest, distance: this.cachedNearestResult.distance };
    }

    this.hasCachedNearest = false;
    return null;
  }

  public getArtworkByNumber(num: number): Artwork | undefined {
    return FINAL_ARTWORKS.find(a => a.number === num);
  }

  public getArtworkCount(): number {
    return FINAL_ARTWORKS.length;
  }

  public getMaxArtworkNumber(): number {
    if (FINAL_ARTWORKS.length === 0) return 0;
    let max = 0;
    for (let i = 0; i < FINAL_ARTWORKS.length; i++) {
      if (FINAL_ARTWORKS[i].number > max) {
        max = FINAL_ARTWORKS[i].number;
      }
    }
    return max;
  }
}


