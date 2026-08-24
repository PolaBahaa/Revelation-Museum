import * as THREE from 'three';
import { Artwork } from '../types';
import { ALL_ARTWORKS } from './MuseumData';
import { Lighting } from './Lighting';
import { DiagnosticProfiler } from './DiagnosticProfiler';
import { TextureGenerator } from './TextureGenerator';

export interface InteractiveArtworkMesh {
  artwork: Artwork;
  mesh: THREE.Mesh;
  worldPosition: THREE.Vector3;
  isRealPNG: boolean;
}

export interface WallSlot {
  artworkNumber: number;
  pos: [number, number, number];
  rotY: number;
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
// MAX_ARTWORK_WIDTH = 2.95m guarantees a visible 0.35m - 0.50m architectural clearance gap.
const MAX_ARTWORK_WIDTH = 2.95;
const MAX_ARTWORK_HEIGHT = 2.45;

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

  // All 36 artwork slots centered directly within architectural wall bays between pilasters
  private wallSlots: WallSlot[] = [
    // -----------------------------------------------------------------
    // HALL 01: THE SEVEN SEALS (Artworks 01 - 06)
    // Bounds X: [-40, -20], Z: [0, 20] | Pilasters at X: -40, -36, -32, -28, -24, -20
    // -----------------------------------------------------------------
    { artworkNumber: 1, pos: [-34.0, 2.6, 0.22], rotY: 0 },           // North Wall Bay 1 (Center -34)
    { artworkNumber: 2, pos: [-26.0, 2.6, 0.22], rotY: 0 },           // North Wall Bay 2 (Center -26)
    { artworkNumber: 3, pos: [-34.0, 2.6, 19.78], rotY: Math.PI },    // South Wall Bay 1 (Center -34)
    { artworkNumber: 4, pos: [-26.0, 2.6, 19.78], rotY: Math.PI },    // South Wall Bay 2 (Center -26)
    { artworkNumber: 5, pos: [-39.78, 2.6, 6.0], rotY: Math.PI / 2 },  // West Wall Bay 1 (Center 6)
    { artworkNumber: 6, pos: [-39.78, 2.6, 14.0], rotY: Math.PI / 2 }, // West Wall Bay 2 (Center 14)

    // -----------------------------------------------------------------
    // HALL 02: THE SEVEN TRUMPETS (Artworks 07 - 12)
    // Bounds X: [-40, -20], Z: [-25, -5] | Pilasters at X: -40, -36, -32, -28, -24, -20
    // -----------------------------------------------------------------
    { artworkNumber: 7, pos: [-34.0, 2.6, -24.78], rotY: 0 },          // North Wall Bay 1
    { artworkNumber: 8, pos: [-26.0, 2.6, -24.78], rotY: 0 },          // North Wall Bay 2
    { artworkNumber: 9, pos: [-34.0, 2.6, -5.22], rotY: Math.PI },     // South Wall Bay 1
    { artworkNumber: 10, pos: [-26.0, 2.6, -5.22], rotY: Math.PI },    // South Wall Bay 2
    { artworkNumber: 11, pos: [-39.78, 2.6, -19.0], rotY: Math.PI / 2 },// West Wall Bay 1
    { artworkNumber: 12, pos: [-39.78, 2.6, -11.0], rotY: Math.PI / 2 },// West Wall Bay 2

    // -----------------------------------------------------------------
    // HALL 03: THE HEAVENLY VISION (Artworks 13 - 18)
    // Bounds X: [20, 40], Z: [0, 20] | Pilasters at X: 20, 24, 28, 32, 36, 40
    // -----------------------------------------------------------------
    { artworkNumber: 13, pos: [26.0, 2.6, 0.22], rotY: 0 },           // North Wall Bay 1 (Center 26)
    { artworkNumber: 14, pos: [34.0, 2.6, 0.22], rotY: 0 },           // North Wall Bay 2 (Center 34)
    { artworkNumber: 15, pos: [26.0, 2.6, 19.78], rotY: Math.PI },    // South Wall Bay 1 (Center 26)
    { artworkNumber: 16, pos: [34.0, 2.6, 19.78], rotY: Math.PI },    // South Wall Bay 2 (Center 34)
    { artworkNumber: 17, pos: [39.78, 2.6, 6.0], rotY: -Math.PI / 2 }, // East Wall Bay 1 (Center 6)
    { artworkNumber: 18, pos: [39.78, 2.6, 14.0], rotY: -Math.PI / 2 },// East Wall Bay 2 (Center 14)

    // -----------------------------------------------------------------
    // HALL 04: THE SEVEN BOWLS (Artworks 19 - 24)
    // Bounds X: [20, 40], Z: [-25, -5] | Pilasters at X: 20, 24, 28, 32, 36, 40
    // -----------------------------------------------------------------
    { artworkNumber: 19, pos: [26.0, 2.6, -24.78], rotY: 0 },         // North Wall Bay 1
    { artworkNumber: 20, pos: [34.0, 2.6, -24.78], rotY: 0 },         // North Wall Bay 2
    { artworkNumber: 21, pos: [26.0, 2.6, -5.22], rotY: Math.PI },    // South Wall Bay 1
    { artworkNumber: 22, pos: [34.0, 2.6, -5.22], rotY: Math.PI },    // South Wall Bay 2
    { artworkNumber: 23, pos: [39.78, 2.6, -19.0], rotY: -Math.PI / 2 },// East Wall Bay 1
    { artworkNumber: 24, pos: [39.78, 2.6, -11.0], rotY: -Math.PI / 2 },// East Wall Bay 2

    // -----------------------------------------------------------------
    // HALL 05: THE FINAL VICTORY (Artworks 25 - 30)
    // Bounds X: [-26, -4], Z: [-48, -28]
    // -----------------------------------------------------------------
    { artworkNumber: 25, pos: [-20.5, 2.6, -47.78], rotY: 0 },        // North Wall Bay 1
    { artworkNumber: 26, pos: [-9.5, 2.6, -47.78], rotY: 0 },         // North Wall Bay 2
    { artworkNumber: 27, pos: [-20.5, 2.6, -28.22], rotY: Math.PI },  // South Wall Bay 1
    { artworkNumber: 28, pos: [-9.5, 2.6, -28.22], rotY: Math.PI },   // South Wall Bay 2
    { artworkNumber: 29, pos: [-25.78, 2.6, -42.0], rotY: Math.PI / 2 },// West Wall Bay 1
    { artworkNumber: 30, pos: [-25.78, 2.6, -34.0], rotY: Math.PI / 2 },// West Wall Bay 2

    // -----------------------------------------------------------------
    // HALL 06: THE NEW JERUSALEM (Artworks 31 - 36)
    // Bounds X: [4, 26], Z: [-48, -28]
    // -----------------------------------------------------------------
    { artworkNumber: 31, pos: [9.5, 2.6, -47.78], rotY: 0 },          // North Wall Bay 1
    { artworkNumber: 32, pos: [20.5, 2.6, -47.78], rotY: 0 },         // North Wall Bay 2
    { artworkNumber: 33, pos: [9.5, 2.6, -28.22], rotY: Math.PI },    // South Wall Bay 1
    { artworkNumber: 34, pos: [20.5, 2.6, -28.22], rotY: Math.PI },   // South Wall Bay 2
    { artworkNumber: 35, pos: [25.78, 2.6, -42.0], rotY: -Math.PI / 2 },// East Wall Bay 1
    { artworkNumber: 36, pos: [25.78, 2.6, -34.0], rotY: -Math.PI / 2 } // East Wall Bay 2
  ];

  constructor(lighting: Lighting) {
    this.lighting = lighting;
  }

  public dispose(): void {
    this.isDisposed = true;
  }

  public initAllArtworks(): void {
    if (this.slotRuntimeItems.length > 0) return;

    for (const slot of this.wallSlots) {
      const art = ALL_ARTWORKS.find(a => a.number === slot.artworkNumber);
      if (!art) continue;

      art.position = slot.pos;
      art.rotation = [0, slot.rotY, 0];

      this.setupArtworkSlot(art, slot);
    }
  }

  /**
   * Calculates proportional dimensions with strict architectural clearance constraints.
   * Guarantees that artworks never overlap pilasters, columns, dado rails, or upper cornices.
   */
  private calculateArtworkDimensions(imgWidth: number, imgHeight: number): { width: number; height: number } {
    const aspect = imgWidth / imgHeight;
    const preferredHeight = 2.4;
    const preferredWidth = preferredHeight * aspect;

    // 1. Constrain to maximum allowable wall bay width
    let targetWidth = Math.min(preferredWidth, MAX_ARTWORK_WIDTH);
    let targetHeight = targetWidth / aspect;

    // 2. Constrain to vertical clearance (dado rail at Y=1.2m and upper frieze at Y=5.35m)
    if (targetHeight > MAX_ARTWORK_HEIGHT) {
      targetHeight = MAX_ARTWORK_HEIGHT;
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

    // Initial guaranteed visible artwork mesh with high-resolution masterpiece canvas
    const initialTexture = TextureGenerator.createArtworkMasterpieceTexture(art);
    const initialDims = this.calculateArtworkDimensions(1536, 1024);
    const initialGeo = new THREE.PlaneGeometry(initialDims.width, initialDims.height);
    const initialMat = new THREE.MeshStandardMaterial({
      map: initialTexture,
      transparent: true,
      alphaTest: 0.005,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.FrontSide
    });

    const paintingMesh = new THREE.Mesh(initialGeo, initialMat);
    paintingMesh.position.set(0, 0, 0.01);
    paintingMesh.castShadow = false;
    paintingMesh.receiveShadow = false;
    group.add(paintingMesh);

    paintingMesh.updateMatrix();
    paintingMesh.updateMatrixWorld(true);
    paintingMesh.matrixAutoUpdate = false;

    group.updateMatrix();
    group.updateMatrixWorld(true);
    group.matrixAutoUpdate = false;

    const interactiveItem: InteractiveArtworkMesh = {
      artwork: art,
      mesh: paintingMesh,
      worldPosition: new THREE.Vector3(slot.pos[0], slot.pos[1], slot.pos[2]),
      isRealPNG: false
    };
    this.interactiveArtworks.push(interactiveItem);

    this.slotRuntimeItems.push({
      art,
      slot,
      group,
      interactiveItem,
      mesh: paintingMesh,
      texture: initialTexture,
      loaded: false
    });
  }

  /**
   * Preloads all 36 artwork textures, configures their colorSpace & anisotropy,
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
      if (onProgress) onProgress(36, 36, 'Ready (Prewarming skipped)');
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
    const pngPath = `/paintings/${numStr}.png`;
    const profiler = DiagnosticProfiler.getInstance();

    const texture = await this.fetchTextureCached(pngPath, item.art.number);
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
        const dims = this.calculateArtworkDimensions(img.width, img.height);
        const targetW = dims.width;
        const targetH = dims.height;

        item.art.width = targetW;
        item.art.height = targetH;

        if (item.mesh) {
          item.mesh.geometry.dispose();
          const newGeo = new THREE.PlaneGeometry(targetW, targetH);
          item.mesh.geometry = newGeo;
          const mat = item.mesh.material as THREE.MeshStandardMaterial;
          mat.map = texture;
          mat.transparent = true;
          mat.alphaTest = 0.005;
          mat.depthWrite = true;
          mat.roughness = 0.25;
          mat.metalness = 0.02;
          mat.side = THREE.FrontSide;
          mat.needsUpdate = true;

          // Perform bounding box validation
          newGeo.computeBoundingBox();
          if (newGeo.boundingBox) {
            const currentWidth = newGeo.boundingBox.max.x - newGeo.boundingBox.min.x;
            if (currentWidth > MAX_ARTWORK_WIDTH + 0.01) {
              const scaleFactor = MAX_ARTWORK_WIDTH / currentWidth;
              item.mesh.scale.set(scaleFactor, scaleFactor, 1.0);
            }
          }

          item.mesh.updateMatrix();
          item.mesh.updateMatrixWorld(true);
          item.mesh.getWorldPosition(item.interactiveItem.worldPosition);
          item.interactiveItem.isRealPNG = true;
          item.interactiveItem.mesh = item.mesh;
        }

        item.texture = texture;
        item.loaded = true;

        // Explicit GPU Texture Initialization
        renderer.initTexture(texture);
        profiler.recordTextureGpuInit(item.art.number);
      }
    } catch (err) {
      console.warn(`[PaintingManager] Error setting up artwork ${numStr}:`, err);
    }
  }

  // Cached nearest artwork query to eliminate allocations and per-frame distance calculations
  private lastQueryPos = new THREE.Vector3(Infinity, Infinity, Infinity);
  private lastQueryTime = 0;
  private cachedNearestResult: { artwork: Artwork; distance: number } = {
    artwork: ALL_ARTWORKS[0],
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
      return this.hasCachedNearest ? this.cachedNearestResult : null;
    }

    this.lastQueryPos.copy(playerPos);
    this.lastQueryTime = now;

    let nearest: Artwork | null = null;
    let minDistanceSq = Infinity;
    const maxThresholdSq = 6.0 * 6.0; // 36.0 m^2

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
      return this.cachedNearestResult;
    }

    this.hasCachedNearest = false;
    return null;
  }

  public getArtworkByNumber(num: number): Artwork | undefined {
    return ALL_ARTWORKS.find(a => a.number === num);
  }
}


