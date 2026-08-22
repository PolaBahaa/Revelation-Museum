import * as THREE from 'three';
import { Artwork } from '../types';
import { ALL_ARTWORKS } from './MuseumData';
import { Lighting } from './Lighting';

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

// Architectural Bay Constraints:
// Pilaster spacing in standard gallery halls is ~3.6m to 4.0m with 0.46m capital widths.
// MAX_ARTWORK_WIDTH = 2.95m guarantees a visible 0.35m - 0.50m architectural clearance gap.
const MAX_ARTWORK_WIDTH = 2.95;
const MAX_ARTWORK_HEIGHT = 2.45;

export class PaintingManager {
  public galleryGroup: THREE.Group = new THREE.Group();
  public interactiveArtworks: InteractiveArtworkMesh[] = [];
  private lighting: Lighting;
  private textureLoader = new THREE.TextureLoader();

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

  public initAllArtworks(): void {
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
    const numStr = String(art.number).padStart(2, '0');
    const pngPath = `/paintings/${numStr}.png`;

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

    // Initial placeholder item record
    const dummyMesh = new THREE.Mesh();
    const interactiveItem: InteractiveArtworkMesh = {
      artwork: art,
      mesh: dummyMesh,
      worldPosition: new THREE.Vector3(slot.pos[0], slot.pos[1], slot.pos[2]),
      isRealPNG: false
    };
    this.interactiveArtworks.push(interactiveItem);

    if (art.number === 1) {
      console.log(`[Artwork 01 Dev Diagnostic] Initializing Artwork ${numStr}`);
      console.log(`Artwork ID: ${numStr}`);
      console.log(`Expected URL: ${pngPath}`);
      console.log(`Position: x=${slot.pos[0]}, y=${slot.pos[1]}, z=${slot.pos[2]}`);
    }

    // Asynchronously load PNG image
    this.textureLoader.load(
      pngPath,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const img = texture.image;

        if (img && img.width > 0 && img.height > 0) {
          const dims = this.calculateArtworkDimensions(img.width, img.height);
          let targetW = dims.width;
          let targetH = dims.height;

          art.width = targetW;
          art.height = targetH;

          // Create clean PNG plane mesh directly attached to museum wall with 0.01m offset
          const pngGeo = new THREE.PlaneGeometry(targetW, targetH);
          const pngMat = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            roughness: 0.25,
            metalness: 0.02,
            side: THREE.FrontSide
          });

          const pngMesh = new THREE.Mesh(pngGeo, pngMat);
          pngMesh.position.set(0, 0, 0.01);
          pngMesh.castShadow = false;
          pngMesh.receiveShadow = false;

          group.add(pngMesh);

          // Update local and world matrices explicitly so Three.js renders it immediately
          pngMesh.updateMatrix();
          pngMesh.updateMatrixWorld(true);
          pngMesh.matrixAutoUpdate = false;

          group.updateMatrix();
          group.updateMatrixWorld(true);
          group.matrixAutoUpdate = false;

          // Perform one-time initialization bounding box validation
          pngGeo.computeBoundingBox();
          if (pngGeo.boundingBox) {
            const currentWidth = pngGeo.boundingBox.max.x - pngGeo.boundingBox.min.x;
            if (currentWidth > MAX_ARTWORK_WIDTH + 0.01) {
              const scaleFactor = MAX_ARTWORK_WIDTH / currentWidth;
              pngMesh.scale.set(scaleFactor, scaleFactor, 1.0);
              pngMesh.updateMatrix();
              pngMesh.updateMatrixWorld(true);
            }
          }

          // Update interaction record
          interactiveItem.mesh = pngMesh;
          interactiveItem.isRealPNG = true;
          pngMesh.getWorldPosition(interactiveItem.worldPosition);

          if (art.number === 1) {
            console.log(`[Artwork 01 Dev Diagnostic] SUCCESS: Artwork ${numStr} Loaded!`);
            console.log(`Texture loaded: YES (${img.width}x${img.height} px)`);
            console.log(`Scale: w=${targetW.toFixed(2)}m, h=${targetH.toFixed(2)}m (Max bay width: ${MAX_ARTWORK_WIDTH}m)`);
          }
        }
      },
      undefined,
      (err) => {
        if (art.number === 1) {
          console.error(`[Artwork 01 Dev Diagnostic] ERROR: Failed to load texture at URL: ${pngPath}`, err);
        }
      }
    );
  }

  public getNearestArtwork(playerPos: THREE.Vector3): { artwork: Artwork; distance: number } | null {
    let nearest: Artwork | null = null;
    let minDistance = Infinity;

    for (const item of this.interactiveArtworks) {
      const dist = playerPos.distanceTo(item.worldPosition);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = item.artwork;
      }
    }

    if (nearest && minDistance <= 6.0) {
      return { artwork: nearest, distance: minDistance };
    }
    return null;
  }

  public getArtworkByNumber(num: number): Artwork | undefined {
    return ALL_ARTWORKS.find(a => a.number === num);
  }
}


