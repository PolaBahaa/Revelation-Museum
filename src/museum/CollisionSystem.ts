import { WallBoundingBox } from '../types';

export class CollisionSystem {
  private wallBoxes: WallBoundingBox[] = [];
  private playerRadius = 0.45; // meters
  private resolvedPos: [number, number] = [0, 0];

  public setWalls(boxes: WallBoundingBox[]): void {
    this.wallBoxes = boxes;
  }

  public addWall(box: WallBoundingBox): void {
    this.wallBoxes.push(box);
  }

  /**
   * Resolves collision for a target position (x, z) against nearby wall bounding boxes.
   * Returns corrected position tuple [x, z] using a cached array to eliminate GC allocations.
   */
  public resolveCollision(x: number, z: number): [number, number] {
    let resolvedX = x;
    let resolvedZ = z;

    // Filter wall boxes within 8 meters proximity for extreme performance
    for (let i = 0; i < this.wallBoxes.length; i++) {
      const box = this.wallBoxes[i];
      // Fast proximity test
      if (
        resolvedX + 8.0 < box.minX ||
        resolvedX - 8.0 > box.maxX ||
        z + 8.0 < box.minZ ||
        z - 8.0 > box.maxZ
      ) {
        continue;
      }

      if (this.isPointInsideBox(resolvedX, z, this.playerRadius, box)) {
        if (x > (box.minX + box.maxX) * 0.5) {
          resolvedX = box.maxX + this.playerRadius;
        } else {
          resolvedX = box.minX - this.playerRadius;
        }
      }
    }

    for (let i = 0; i < this.wallBoxes.length; i++) {
      const box = this.wallBoxes[i];
      if (
        resolvedX + 8.0 < box.minX ||
        resolvedX - 8.0 > box.maxX ||
        resolvedZ + 8.0 < box.minZ ||
        resolvedZ - 8.0 > box.maxZ
      ) {
        continue;
      }

      if (this.isPointInsideBox(resolvedX, resolvedZ, this.playerRadius, box)) {
        if (z > (box.minZ + box.maxZ) * 0.5) {
          resolvedZ = box.maxZ + this.playerRadius;
        } else {
          resolvedZ = box.minZ - this.playerRadius;
        }
      }
    }

    this.resolvedPos[0] = resolvedX;
    this.resolvedPos[1] = resolvedZ;
    return this.resolvedPos;
  }

  private isPointInsideBox(px: number, pz: number, r: number, box: WallBoundingBox): boolean {
    return (
      px + r > box.minX &&
      px - r < box.maxX &&
      pz + r > box.minZ &&
      pz - r < box.maxZ
    );
  }

  public getWallBoxes(): WallBoundingBox[] {
    return this.wallBoxes;
  }
}

