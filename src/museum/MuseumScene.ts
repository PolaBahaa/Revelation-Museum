import * as THREE from 'three';
import { Timer } from 'three';
import { Architecture } from './Architecture';
import { Lighting } from './Lighting';
import { GallerySystem, PaintingManager } from './GallerySystem';
import { CollisionSystem } from './CollisionSystem';
import { PlayerController } from './PlayerController';
import { PerformanceManager, QualityLevel } from './PerformanceManager';
import { PlayerState, Artwork } from '../types';

export class MuseumScene {
  private container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;

  public architecture!: Architecture;
  public lighting!: Lighting;
  public gallerySystem!: GallerySystem;
  public paintingManager!: PaintingManager;
  public collisionSystem!: CollisionSystem;
  public playerController!: PlayerController;
  public performanceManager!: PerformanceManager;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private animationFrameId: number | null = null;
  private timer = new Timer();

  private onStateUpdate?: (state: PlayerState) => void;
  private onFocusArtwork?: (artwork: Artwork) => void;

  constructor(
    container: HTMLElement,
    onStateUpdate?: (state: PlayerState) => void,
    onFocusArtwork?: (artwork: Artwork) => void
  ) {
    this.container = container;
    this.onStateUpdate = onStateUpdate;
    this.onFocusArtwork = onFocusArtwork;

    this.performanceManager = new PerformanceManager((level) => this.onQualityChange(level));

    this.initThree();
    this.initModules();
    this.initEvents();
    this.startLoop();
  }

  private initThree(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x180d14);
    this.scene.fog = new THREE.FogExp2(0x180d14, 0.0008);

    // 2. Camera (Eye height 1.7m, FOV 70)
    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 150);

    // 3. WebGLRenderer with capped pixel ratio for performance stability
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.performanceManager.getPixelRatio(window.devicePixelRatio));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.70;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.timer.connect(document);

    this.container.appendChild(this.renderer.domElement);
  }

  private onQualityChange(level: QualityLevel): void {
    if (!this.performanceManager || !this.renderer) return;
    const ratio = this.performanceManager.getPixelRatio(window.devicePixelRatio);
    this.renderer.setPixelRatio(ratio);

    if (this.lighting && this.lighting.dirLight) {
      if (!this.performanceManager.shouldRenderShadows()) {
        this.renderer.shadowMap.enabled = false;
        this.lighting.dirLight.castShadow = false;
      } else {
        this.renderer.shadowMap.enabled = true;
        this.lighting.dirLight.castShadow = true;
        const shadowSize = this.performanceManager.getShadowMapSize();
        if (this.lighting.dirLight.shadow.mapSize.width !== shadowSize) {
          this.lighting.dirLight.shadow.mapSize.set(shadowSize, shadowSize);
          this.lighting.dirLight.shadow.map?.dispose();
          this.lighting.dirLight.shadow.map = null;
        }
      }
    }
  }

  private initModules(): void {
    // Collision system
    this.collisionSystem = new CollisionSystem();

    // Lighting
    this.lighting = new Lighting();
    this.lighting.initLighting();
    this.scene.add(this.lighting.lightingGroup);

    // Architecture
    this.architecture = new Architecture(this.collisionSystem);
    this.architecture.buildMuseum();
    this.scene.add(this.architecture.sceneGroup);

    // Gallery & Artworks
    this.gallerySystem = new GallerySystem(this.lighting);
    this.paintingManager = this.gallerySystem.paintingManager;
    this.gallerySystem.buildGalleries();
    this.scene.add(this.gallerySystem.galleryGroup);

    // Player Controller
    this.playerController = new PlayerController(
      this.camera,
      this.collisionSystem,
      this.gallerySystem,
      this.renderer.domElement,
      (state) => {
        if (this.onStateUpdate) {
          let activeLightCount = 0;
          if (this.lighting && this.lighting.lightingGroup) {
            this.lighting.lightingGroup.traverse((obj) => {
              if (obj.visible && (obj as THREE.Light).isLight) activeLightCount++;
            });
          }
          this.onStateUpdate({
            ...state,
            perfStats: {
              fps: Math.round(this.performanceManager.targetFps),
              drawCalls: this.renderer ? this.renderer.info.render.calls : 0,
              triangles: this.renderer ? this.renderer.info.render.triangles : 0,
              textures: this.renderer ? this.renderer.info.memory.textures : 0,
              geometries: this.renderer ? this.renderer.info.memory.geometries : 0,
              activeLights: activeLightCount,
              qualityLevel: this.performanceManager.qualityLevel,
            }
          });
        }
      },
      this.onFocusArtwork
    );
  }

  private initEvents(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  private handleResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.playerController.isPointerLocked) {
      this.playerController.requestPointerLock();
      return;
    }

    this.mouse.set(0, 0);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const activeArtworks = this.gallerySystem.interactiveArtworks;
    const targetMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < activeArtworks.length; i++) {
      if (activeArtworks[i].mesh && activeArtworks[i].mesh.visible) {
        targetMeshes.push(activeArtworks[i].mesh);
      }
    }

    const intersects = this.raycaster.intersectObjects(targetMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const found = activeArtworks.find(item => item.mesh === hitMesh);
      if (found) {
        this.playerController.enterInspectMode(found.artwork);
      }
    }
  };

  private startLoop(): void {
    let frameCount = 0;
    let lastRenderTime = performance.now();

    const render = (timestamp: number = performance.now()) => {
      this.animationFrameId = requestAnimationFrame(render);

      // Frame pacing: Cap frame rate according to PerformanceManager target to prevent CPU/GPU overheating
      const frameInterval = this.performanceManager.frameInterval;
      const elapsed = timestamp - lastRenderTime;

      if (elapsed < frameInterval - 1.0) {
        return; // Skip rendering frame to maintain FPS cap
      }

      lastRenderTime = timestamp - (elapsed % frameInterval);

      this.timer.update(timestamp);
      const delta = Math.min(0.05, this.timer.getDelta());

      // Track frame delta for adaptive quality management
      this.performanceManager.recordFrame(delta);

      // Update player position and controls
      this.playerController.update(delta);
      const pos = this.playerController.position;

      // 1. Directional Light Shadow Camera follows player position
      if (this.lighting && this.lighting.dirLight) {
        this.lighting.dirLight.position.set(pos.x + 14, pos.y + 24, pos.z + 18);
        this.lighting.dirLight.target.position.set(pos.x, pos.y, pos.z);
      }

      // 2. Sync player handheld lantern position with player camera
      if (this.lighting && this.lighting.playerLantern) {
        this.lighting.playerLantern.position.set(pos.x, pos.y - 0.2, pos.z);
      }

      frameCount++;

      // 3. Distance Culling for Artwork meshes and Room Lights (Throttled to every 6 frames)
      if (frameCount % 6 === 0) {
        // Distance culling for room point lights
        if (this.lighting) {
          const cullDistSq = 38 * 38;
          const lights = this.lighting.dynamicPointLights;
          for (let i = 0; i < lights.length; i++) {
            const item = lights[i];
            const dx = pos.x - item.pos.x;
            const dz = pos.z - item.pos.z;
            item.light.visible = (dx * dx + dz * dz) < cullDistSq;
          }

          // Dynamic Artwork Focus Spotlight
          const nearest = this.gallerySystem.getNearestArtwork(pos);
          if (nearest && (nearest.distance < 8.0 || this.playerController.isInspectMode)) {
            const spot = this.lighting.focusSpotlight;
            const artPos = nearest.artwork.position || [0, 2.5, 0];
            spot.position.set(artPos[0], artPos[1] + 2.5, artPos[2] + 2.0);
            spot.target.position.set(artPos[0], artPos[1], artPos[2]);
            spot.intensity = this.playerController.isInspectMode ? 4.0 : 2.5;
            spot.visible = true;
          } else {
            this.lighting.focusSpotlight.visible = false;
          }
        }

        // Distance culling for interactive artwork planes (70m radius)
        const artCullDistSq = 70 * 70;
        const artworks = this.gallerySystem.interactiveArtworks;
        for (let i = 0; i < artworks.length; i++) {
          const art = artworks[i];
          const artPos = art.artwork.position || [0, 0, 0];
          const dx = pos.x - artPos[0];
          const dz = pos.z - artPos[2];
          art.mesh.visible = (dx * dx + dz * dz) < artCullDistSq;
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('click', this.handleClick);

    this.timer.dispose();
    this.playerController.dispose();

    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
