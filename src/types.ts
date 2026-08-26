export interface Artwork {
  id: string;
  number: number;
  title: string;
  subTitle: string;
  scripture: string;
  passage: string;
  description: string;
  hallId: string;
  hallName: string;
  slotId?: string; // Explicit assigned display slot ID (e.g. 'hall_01_slot_01')
  textureUrl?: string; // Optional custom texture url (defaults to `/paintings/${pad(number)}.png`)
  position?: [number, number, number]; // [x, y, z] in world space
  rotation?: [number, number, number]; // [rx, ry, rz]
  width?: number;
  height?: number;
  canvasColorPrimary?: string;
  canvasColorSecondary?: string;
  symbolism?: string;
}

export interface WallSlot {
  id: string;             // Unique identifier (e.g. 'hall_01_slot_01')
  slotIndex: number;      // 1-based index (1 to 48)
  hallId: string;         // 'hall_01', 'hall_02', ..., 'final_hall', 'lobby', 'rotunda'
  hallName: string;       // Human-readable hall name
  wallDescription: string;// Descriptive location on wall (e.g. 'North Wall Bay 1')
  pos: [number, number, number]; // World [x, y, z]
  rotY: number;           // Rotation around Y axis
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
  height?: number;
  roomId?: string;
  isObstacle?: boolean; // For pillars/columns
}

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  activeLights: number;
  qualityLevel: string;
  adaptiveLevel?: string;
  performanceMode?: string;
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

export interface PrewarmState {
  loaded: number;
  total: number;
  isComplete: boolean;
  statusMessage: string;
}
