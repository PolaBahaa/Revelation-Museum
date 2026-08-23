import { WallBoundingBox } from '../types';

export class CollisionSystem {
  private wallBoxes: WallBoundingBox[] = [];
  private playerRadius = 0.45; // meters
  private resolvedPos: [number, number] = [0, 0];

  // Spatial Hash Grid for fast collision broad-phase
  private static readonly CELL_SIZE = 10.0;
  private grid: Map<number, number[]> = new Map();
  private isGridDirty = true;

  // Reusable query cache to prevent per-frame allocations
  private candidateIndices: number[] = [];
  private visitedQueryTags = new Uint32Array(512);
  private currentQueryTag = 1;

  public setWalls(boxes: WallBoundingBox[]): void {
    this.wallBoxes = boxes;
    this.isGridDirty = true;
  }

  public addWall(box: WallBoundingBox): void {
    this.wallBoxes.push(box);
    this.isGridDirty = true;
  }

  private buildGrid(): void {
    this.grid.clear();
    const cellSize = CollisionSystem.CELL_SIZE;

    for (let i = 0; i < this.wallBoxes.length; i++) {
      const box = this.wallBoxes[i];
      const minCellX = Math.floor(box.minX / cellSize);
      const maxCellX = Math.floor(box.maxX / cellSize);
      const minCellZ = Math.floor(box.minZ / cellSize);
      const maxCellZ = Math.floor(box.maxZ / cellSize);

      for (let cx = minCellX; cx <= maxCellX; cx++) {
        for (let cz = minCellZ; cz <= maxCellZ; cz++) {
          const key = (cx * 73856093) ^ (cz * 19349663);
          let cellList = this.grid.get(key);
          if (!cellList) {
            cellList = [];
            this.grid.set(key, cellList);
          }
          cellList.push(i);
        }
      }
    }

    if (this.visitedQueryTags.length < this.wallBoxes.length + 32) {
      this.visitedQueryTags = new Uint32Array(this.wallBoxes.length + 64);
    }

    this.isGridDirty = false;
  }

  /**
   * Resolves collision for a target position (x, z) against nearby wall bounding boxes.
   * Returns corrected position tuple [x, z] using cached memory.
   */
  public resolveCollision(x: number, z: number): [number, number] {
    if (this.isGridDirty) {
      this.buildGrid();
    }

    let resolvedX = x;
    let resolvedZ = z;

    // Gather candidate wall boxes in proximity using spatial grid
    this.currentQueryTag++;
    if (this.currentQueryTag === 0xffffffff) {
      this.visitedQueryTags.fill(0);
      this.currentQueryTag = 1;
    }

    const cellSize = CollisionSystem.CELL_SIZE;
    const minCellX = Math.floor((x - 8.0) / cellSize);
    const maxCellX = Math.floor((x + 8.0) / cellSize);
    const minCellZ = Math.floor((z - 8.0) / cellSize);
    const maxCellZ = Math.floor((z + 8.0) / cellSize);

    let candidateCount = 0;

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cz = minCellZ; cz <= maxCellZ; cz++) {
        const key = (cx * 73856093) ^ (cz * 19349663);
        const cellList = this.grid.get(key);
        if (!cellList) continue;

        for (let k = 0; k < cellList.length; k++) {
          const boxIdx = cellList[k];
          if (this.visitedQueryTags[boxIdx] !== this.currentQueryTag) {
            this.visitedQueryTags[boxIdx] = this.currentQueryTag;
            if (candidateCount < this.candidateIndices.length) {
              this.candidateIndices[candidateCount] = boxIdx;
            } else {
              this.candidateIndices.push(boxIdx);
            }
            candidateCount++;
          }
        }
      }
    }

    // 1. Resolve X-Axis Collisions
    for (let i = 0; i < candidateCount; i++) {
      const box = this.wallBoxes[this.candidateIndices[i]];
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

    // 2. Resolve Z-Axis Collisions
    for (let i = 0; i < candidateCount; i++) {
      const box = this.wallBoxes[this.candidateIndices[i]];
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


