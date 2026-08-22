import * as THREE from 'three';
import { Artwork } from '../types';
import { Lighting } from './Lighting';
import { PaintingManager, InteractiveArtworkMesh } from './PaintingManager';

export { PaintingManager };
export type { InteractiveArtworkMesh };

export class GallerySystem {
  public paintingManager: PaintingManager;

  constructor(lighting: Lighting) {
    this.paintingManager = new PaintingManager(lighting);
  }

  public get galleryGroup(): THREE.Group {
    return this.paintingManager.galleryGroup;
  }

  public get interactiveArtworks(): InteractiveArtworkMesh[] {
    return this.paintingManager.interactiveArtworks;
  }

  public buildGalleries(): void {
    this.paintingManager.initAllArtworks();
  }

  public getNearestArtwork(playerPos: THREE.Vector3): { artwork: Artwork; distance: number } | null {
    return this.paintingManager.getNearestArtwork(playerPos);
  }

  public getArtworkByNumber(num: number): Artwork | undefined {
    return this.paintingManager.getArtworkByNumber(num);
  }
}
