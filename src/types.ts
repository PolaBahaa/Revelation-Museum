export interface Artwork {
  id: string;
  number: number; // 1 to 36
  title: string;
  subTitle: string;
  scripture: string;
  passage: string;
  description: string;
  hallId: string;
  hallName: string;
  position?: [number, number, number]; // [x, y, z] in world space
  rotation?: [number, number, number]; // [rx, ry, rz]
  width?: number;
  height?: number;
  canvasColorPrimary?: string;
  canvasColorSecondary?: string;
  symbolism?: string;
}

export interface Hall {
  id: string;
  code: string; // e.g. "Hall 01"
  title: string;
  subTitle: string;
  theme: string;
  description: string;
  center: [number, number, number]; // x, y, z
  size: [number, number, number]; // width, height, depth
  artworks: Artwork[];
}

export interface WallBoundingBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
  isObstacle?: boolean; // For pillars/columns
}

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  activeLights: number;
  qualityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'EMERGENCY';
}

export interface PlayerState {
  position: [number, number, number];
  rotation: [number, number]; // pitch (x), yaw (y)
  currentHallId: string;
  currentHallName: string;
  nearestArtwork: Artwork | null;
  distanceToNearestArtwork: number;
  isPointerLocked: boolean;
  isFocusedOnArtwork: boolean;
  focusedArtwork: Artwork | null;
  isInspectMode?: boolean;
  inspectArtwork?: Artwork | null;
  perfStats?: PerformanceStats;
}

export type QualitySetting = 'low' | 'medium' | 'high';
