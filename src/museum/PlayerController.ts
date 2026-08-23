import * as THREE from 'three';
import { CollisionSystem } from './CollisionSystem';
import { GallerySystem } from './GallerySystem';
import { MUSEUM_HALLS } from './MuseumData';
import { DiagnosticProfiler } from './DiagnosticProfiler';
import { PlayerState, Artwork } from '../types';

export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private collisionSystem: CollisionSystem;
  private gallerySystem: GallerySystem;
  private domElement: HTMLElement;

  // Camera transform state
  public position = new THREE.Vector3(0, 1.7, 50); // Start at Grand Entrance
  private pitch = 0; // Look up/down (X axis rotation)
  private yaw = Math.PI; // Look left/right (Y axis rotation, facing North -Z)

  // Movement speed configuration
  private walkSpeed = 3.5; // m/s
  private sprintSpeed = 6.0; // m/s
  private mouseSensitivity = 0.0022;

  // Keyboard input state
  private keys: { [key: string]: boolean } = {};

  // Pointer lock & frame-aligned mouse input accumulation
  public isPointerLocked = false;
  private pendingMouseX = 0;
  private pendingMouseY = 0;
  private mouseEventsInFrame = 0;

  // Diagnostic metrics for input alignment
  public lastMouseEventsPerFrame = 0;
  public lastAccumulatedMouseX = 0;
  public lastAccumulatedMouseY = 0;
  public lastYawDelta = 0;
  public lastPitchDelta = 0;

  // Inspect / Fullscreen Mode
  public isInspectMode = false;
  public inspectArtwork: Artwork | null = null;

  // Smooth Camera Navigation Animation
  private isNavigating = false;
  private navStartPos = new THREE.Vector3();
  private navTargetPos = new THREE.Vector3();
  private navStartYaw = 0;
  private navTargetYaw = 0;
  private navStartPitch = 0;
  private navTargetPitch = 0;
  private navProgress = 0;
  private navDuration = 0.8; // 800ms smooth cinematic travel

  // Number Navigation Buffer
  private numBuffer = '';
  private numTimer: ReturnType<typeof setTimeout> | null = null;

  // Center Raycaster for direct target inspection
  private raycaster = new THREE.Raycaster();
  private centerScreen = new THREE.Vector2(0, 0);

  // Callbacks and state throttling
  private onStateUpdate?: (state: PlayerState) => void;
  private onFocusArtwork?: (artwork: Artwork) => void;
  private lastStateNotifyTime = 0;
  private lastHallId = '';
  private lastNotifiedHallId = '';
  private lastHallName = 'Grand Entrance';
  private lastHallCheckX = Infinity;
  private lastHallCheckZ = Infinity;
  private lastNearestArtworkNum: number | null = null;
  private lastPointerLock = false;
  private lastInspectMode = false;
  private lastInspectArtwork: Artwork | null = null;

  // Reusable static calculation objects to avoid GC overhead
  private tempMoveVector = new THREE.Vector3();
  private tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private cachedPosArray: [number, number, number] = [0, 0, 0];
  private cachedRotArray: [number, number] = [0, 0];

  constructor(
    camera: THREE.PerspectiveCamera,
    collisionSystem: CollisionSystem,
    gallerySystem: GallerySystem,
    domElement: HTMLElement,
    onStateUpdate?: (state: PlayerState) => void,
    onFocusArtwork?: (artwork: Artwork) => void
  ) {
    this.camera = camera;
    this.collisionSystem = collisionSystem;
    this.gallerySystem = gallerySystem;
    this.domElement = domElement;
    this.onStateUpdate = onStateUpdate;
    this.onFocusArtwork = onFocusArtwork;

    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('pointerlockerror', this.handlePointerLockError);
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  public dispose(): void {
    if (this.numTimer) {
      clearTimeout(this.numTimer);
      this.numTimer = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('pointerlockerror', this.handlePointerLockError);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  public requestPointerLock(): void {
    if (document.pointerLockElement === this.domElement) return;
    try {
      const promise = this.domElement.requestPointerLock() as unknown;
      if (promise && typeof (promise as Promise<void>).catch === 'function') {
        (promise as Promise<void>).catch(() => {
          // Gracefully handle browser user gesture or pointer lock rejection
        });
      }
    } catch {
      // Gracefully handle synchronous pointer lock exception
    }
  }

  public unlockPointer(): void {
    this.pendingMouseX = 0;
    this.pendingMouseY = 0;
    this.mouseEventsInFrame = 0;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private handlePointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
    if (!this.isPointerLocked) {
      this.pendingMouseX = 0;
      this.pendingMouseY = 0;
      this.mouseEventsInFrame = 0;
    }
    this.notifyState(true);
  };

  private handlePointerLockError = (): void => {
    // Prevent unhandled pointer lock error events
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isPointerLocked || this.isInspectMode || this.isNavigating) return;

    // Accumulate raw movement deltas without modifying camera rotation asynchronously
    this.pendingMouseX += (e.movementX || 0);
    this.pendingMouseY += (e.movementY || 0);
    this.mouseEventsInFrame++;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Ignore keyboard shortcuts if user is typing inside an HTML text field
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      return;
    }

    this.keys[e.code] = true;

    // [F] key -> Toggle Artwork Inspect Mode
    if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
      this.handleFKey();
      return;
    }

    // [ESC] key -> Exit Artwork Inspect Mode
    if (e.code === 'Escape' || e.key === 'Escape') {
      if (this.isInspectMode) {
        this.exitInspectMode();
      }
      return;
    }

    // Numeric keys (0 - 9) -> Artwork Number Navigation
    if (/^[0-9]$/.test(e.key)) {
      this.handleDigitKey(e.key);
      return;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  /**
   * Handles F key trigger for Artwork Inspect Mode
   */
  public handleFKey(): void {
    if (this.isInspectMode) {
      this.exitInspectMode();
      return;
    }

    let targetArt: Artwork | null = null;

    // 1. Raycast from camera center to check if player is directly looking at an artwork
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const activeArtworks = this.gallerySystem.interactiveArtworks;
    const targetMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < activeArtworks.length; i++) {
      if (activeArtworks[i].mesh && activeArtworks[i].mesh.visible) {
        targetMeshes.push(activeArtworks[i].mesh);
      }
    }

    const intersects = this.raycaster.intersectObjects(targetMeshes);
    if (intersects.length > 0 && intersects[0].distance <= 6.0) {
      const hitMesh = intersects[0].object;
      const found = activeArtworks.find(a => a.mesh === hitMesh);
      if (found) {
        targetArt = found.artwork;
      }
    }

    // 2. Fallback: select nearest artwork within a 4.0 meter distance threshold
    if (!targetArt) {
      const nearest = this.gallerySystem.getNearestArtwork(this.position);
      if (nearest && nearest.distance <= 4.0) {
        targetArt = nearest.artwork;
      }
    }

    // 3. If a valid artwork is found, enter Inspect Mode
    if (targetArt) {
      this.enterInspectMode(targetArt);
    }
  }

  /**
   * Enters ARTWORK INSPECT MODE for a given artwork
   */
  public enterInspectMode(art: Artwork): void {
    this.inspectArtwork = art;
    this.isInspectMode = true;

    // Orient 3D camera smoothly toward artwork
    this.navigateToArtwork(art);

    if (this.onFocusArtwork) {
      this.onFocusArtwork(art);
    }

    this.notifyState();
  }

  /**
   * Exits ARTWORK INSPECT MODE and returns to normal 1st-person view
   */
  public exitInspectMode(): void {
    if (!this.isInspectMode) return;
    this.isInspectMode = false;
    this.inspectArtwork = null;

    this.requestPointerLock();
    this.notifyState();
  }

  /**
   * Handles digit key input buffer with 700ms timeout
   */
  private handleDigitKey(digit: string): void {
    this.numBuffer += digit;

    if (this.numTimer) {
      clearTimeout(this.numTimer);
      this.numTimer = null;
    }

    if (this.numBuffer.length >= 2) {
      this.processNumBuffer();
    } else {
      this.numTimer = setTimeout(() => {
        this.processNumBuffer();
      }, 700);
    }
  }

  private processNumBuffer(): void {
    if (!this.numBuffer) return;
    const num = parseInt(this.numBuffer, 10);
    this.numBuffer = '';
    if (this.numTimer) {
      clearTimeout(this.numTimer);
      this.numTimer = null;
    }

    if (isNaN(num) || num < 1 || num > 36) {
      // Out of valid range (1..36): do nothing
      return;
    }

    const artwork = this.gallerySystem.getArtworkByNumber(num);
    if (artwork) {
      this.navigateToArtwork(artwork);
    }
  }

  /**
   * Smoothly moves and rotates camera to a safe viewing position in front of an artwork
   */
  public navigateToArtwork(art: Artwork): void {
    if (!art.position) return;

    const artPos = new THREE.Vector3(art.position[0], art.position[1], art.position[2]);
    const rotY = art.rotation ? art.rotation[1] : 0;

    // Normal vector pointing away from wall surface
    const forward = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));

    // Ideal viewing distance (2.5 meters in front)
    const viewDist = 2.5;
    const rawX = artPos.x + forward.x * viewDist;
    const rawZ = artPos.z + forward.z * viewDist;

    // Resolve collision to prevent spawning inside wall or column geometry
    const [resX, resZ] = this.collisionSystem.resolveCollision(rawX, rawZ);

    // Calculate exact horizontal direction from final player position toward the artwork
    const dirX = artPos.x - resX;
    const dirZ = artPos.z - resZ;
    const targetYaw = Math.atan2(dirX, dirZ) + Math.PI;

    // Normalize yaw difference to shortest angle direction across [-PI, PI]
    let currentYaw = this.yaw;
    let diff = (targetYaw - currentYaw) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;

    this.navStartPos.copy(this.position);
    this.navTargetPos.set(resX, 1.7, resZ);

    this.navStartYaw = currentYaw;
    this.navTargetYaw = currentYaw + diff;

    this.navStartPitch = this.pitch;
    this.navTargetPitch = 0;

    this.navProgress = 0;
    this.isNavigating = true;

    if (this.isInspectMode) {
      this.inspectArtwork = art;
    }

    this.notifyState();
  }

  public update(delta: number): void {
    if (this.isNavigating) {
      // Clear pending mouse inputs during cinematic navigation
      this.pendingMouseX = 0;
      this.pendingMouseY = 0;
      this.mouseEventsInFrame = 0;

      // Smooth cinematic travel easing (easeInOutQuad / smoothstep)
      this.navProgress += delta / this.navDuration;
      const t = Math.min(1.0, this.navProgress);
      const ease = t * t * (3 - 2 * t);

      this.position.lerpVectors(this.navStartPos, this.navTargetPos, ease);
      this.yaw = THREE.MathUtils.lerp(this.navStartYaw, this.navTargetYaw, ease);
      this.pitch = THREE.MathUtils.lerp(this.navStartPitch, this.navTargetPitch, ease);

      if (t >= 1.0) {
        this.isNavigating = false;
      }
    } else if (!this.isInspectMode) {
      // 1. Consume accumulated frame-aligned mouse look delta (applied once per RAF frame)
      if (this.isPointerLocked) {
        const mouseX = this.pendingMouseX;
        const mouseY = this.pendingMouseY;
        this.lastMouseEventsPerFrame = this.mouseEventsInFrame;
        this.lastAccumulatedMouseX = mouseX;
        this.lastAccumulatedMouseY = mouseY;

        this.pendingMouseX = 0;
        this.pendingMouseY = 0;
        this.mouseEventsInFrame = 0;

        if (mouseX !== 0 || mouseY !== 0) {
          const yawDelta = mouseX * this.mouseSensitivity;
          const pitchDelta = mouseY * this.mouseSensitivity;

          this.yaw -= yawDelta;
          this.pitch -= pitchDelta;

          // Clamp pitch between -85 deg and +85 deg (preserving exact original limits)
          const maxPitch = Math.PI / 2 - 0.08;
          this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

          this.lastYawDelta = yawDelta;
          this.lastPitchDelta = pitchDelta;
        } else {
          this.lastYawDelta = 0;
          this.lastPitchDelta = 0;
        }
      } else {
        this.pendingMouseX = 0;
        this.pendingMouseY = 0;
        this.mouseEventsInFrame = 0;
        this.lastYawDelta = 0;
        this.lastPitchDelta = 0;
      }

      // 2. Standard FPS WASD movement
      const speed = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? this.sprintSpeed : this.walkSpeed;
      const moveDistance = speed * delta;

      this.tempMoveVector.set(0, 0, 0);

      if (this.keys['KeyW']) this.tempMoveVector.z -= 1;
      if (this.keys['KeyS']) this.tempMoveVector.z += 1;
      if (this.keys['KeyA']) this.tempMoveVector.x -= 1;
      if (this.keys['KeyD']) this.tempMoveVector.x += 1;

      if (this.tempMoveVector.lengthSq() > 0) {
        this.tempMoveVector.normalize();

        const sinY = Math.sin(this.yaw);
        const cosY = Math.cos(this.yaw);

        const worldMoveX = this.tempMoveVector.x * cosY + this.tempMoveVector.z * sinY;
        const worldMoveZ = -this.tempMoveVector.x * sinY + this.tempMoveVector.z * cosY;

        const targetX = this.position.x + worldMoveX * moveDistance;
        const targetZ = this.position.z + worldMoveZ * moveDistance;

        const [resolvedX, resolvedZ] = this.collisionSystem.resolveCollision(targetX, targetZ);
        this.position.x = resolvedX;
        this.position.z = resolvedZ;
      }
    } else {
      this.pendingMouseX = 0;
      this.pendingMouseY = 0;
      this.mouseEventsInFrame = 0;
    }

    // Update camera matrix
    this.camera.position.copy(this.position);

    this.tempEuler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.tempEuler);

    this.notifyState();
  }

  private notifyState(force = false): void {
    if (!this.onStateUpdate) return;

    // 1. Spatial Hall Detection (Throttled by 0.5m movement threshold)
    const dxHall = this.position.x - this.lastHallCheckX;
    const dzHall = this.position.z - this.lastHallCheckZ;
    if (force || (dxHall * dxHall + dzHall * dzHall) > 0.25) {
      this.lastHallCheckX = this.position.x;
      this.lastHallCheckZ = this.position.z;

      let hallId = 'entrance';
      let hallName = 'Grand Entrance';

      for (let i = 0; i < MUSEUM_HALLS.length; i++) {
        const hall = MUSEUM_HALLS[i];
        const [cx, cy, cz] = hall.center;
        const [w, h, d] = hall.size;

        if (
          Math.abs(this.position.x - cx) <= w / 2 + 1 &&
          Math.abs(this.position.z - cz) <= d / 2 + 1
        ) {
          hallId = hall.id;
          hallName = `${hall.code}: ${hall.title}`;
          break;
        }
      }

      if (this.position.z > 42) {
        hallId = 'entrance';
        hallName = 'Grand Entrance';
      } else if (this.position.z > 20 && Math.abs(this.position.x) < 12) {
        hallId = 'lobby';
        hallName = 'Grand Lobby';
      } else if (Math.abs(this.position.z) <= 12 && Math.abs(this.position.x) <= 12) {
        hallId = 'rotunda';
        hallName = 'Central Rotunda';
      } else if (this.position.z < -52) {
        hallId = 'final_hall';
        hallName = 'Final Revelation Gallery';
      }

      this.lastHallId = hallId;
      this.lastHallName = hallName;
    }

    // 2. Query nearest artwork (using cached distance in GallerySystem)
    const nearest = this.gallerySystem.getNearestArtwork(this.position, force);
    const nearestNum = nearest ? nearest.artwork.number : null;

    // 3. Evaluate whether UI-visible React state has ACTUALLY changed
    const stateChanged =
      force ||
      this.lastHallId !== this.lastNotifiedHallId ||
      nearestNum !== this.lastNearestArtworkNum ||
      this.isPointerLocked !== this.lastPointerLock ||
      this.isInspectMode !== this.lastInspectMode ||
      this.inspectArtwork !== this.lastInspectArtwork;

    // DO NOT invoke React callback unless UI state genuinely changed
    if (!stateChanged) {
      return;
    }

    this.lastStateNotifyTime = performance.now();
    this.lastNotifiedHallId = this.lastHallId;
    this.lastNearestArtworkNum = nearestNum;
    this.lastPointerLock = this.isPointerLocked;
    this.lastInspectMode = this.isInspectMode;
    this.lastInspectArtwork = this.inspectArtwork;

    this.cachedPosArray[0] = this.position.x;
    this.cachedPosArray[1] = this.position.y;
    this.cachedPosArray[2] = this.position.z;

    this.cachedRotArray[0] = this.pitch;
    this.cachedRotArray[1] = this.yaw;

    this.onStateUpdate({
      position: this.cachedPosArray,
      rotation: this.cachedRotArray,
      currentHallId: this.lastHallId,
      currentHallName: this.lastHallName,
      nearestArtwork: nearest ? nearest.artwork : null,
      distanceToNearestArtwork: nearest ? nearest.distance : Infinity,
      isPointerLocked: this.isPointerLocked,
      isFocusedOnArtwork: this.isInspectMode,
      focusedArtwork: this.inspectArtwork,
      isInspectMode: this.isInspectMode,
      inspectArtwork: this.inspectArtwork
    });
  }

  public get currentHallId(): string {
    return this.lastHallId || 'entrance';
  }

  public get currentHallName(): string {
    return this.lastHallName || 'Grand Entrance';
  }

  public teleportTo(x: number, y: number, z: number, yaw: number = Math.PI): void {
    this.position.set(x, y, z);
    this.yaw = yaw;
    this.pitch = 0;
    this.isInspectMode = false;
    this.inspectArtwork = null;
  }
}
