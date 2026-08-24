import * as THREE from 'three';
import { Timer } from 'three';
import { Architecture } from './Architecture';
import { Lighting } from './Lighting';
import { GallerySystem, PaintingManager } from './GallerySystem';
import { CollisionSystem } from './CollisionSystem';
import { PlayerController } from './PlayerController';
import { PerformanceManager, AdaptiveLevel } from './PerformanceManager';
import { DiagnosticProfiler } from './DiagnosticProfiler';
import { StaticGeometryBatcher } from './StaticGeometryBatcher';
import { PlayerState, Artwork, PrewarmState } from '../types';

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
  private isDisposed = false;
  private prewarmPromise: Promise<void> | null = null;

  // Static Global Directional Shadow Map System (Phase 4A)
  public static SHADOW_TEST_MODE: 'CURRENT' | 'OFF' | 'STATIC' = 'STATIC';
  public static currentSceneInstance: MuseumScene | null = null;
  private staticShadowBaked = false;

  private onStateUpdate?: (state: PlayerState) => void;
  private onFocusArtwork?: (artwork: Artwork) => void;
  private onPrewarmProgress?: (state: PrewarmState) => void;
  private onToggleMap?: () => void;

  public static setShadowTestMode(mode: 'CURRENT' | 'OFF' | 'STATIC'): void {
    MuseumScene.SHADOW_TEST_MODE = mode;
    DiagnosticProfiler.getInstance().setShadowMode(mode);
    if (MuseumScene.currentSceneInstance) {
      MuseumScene.currentSceneInstance.applyShadowMode(mode);
    }
  }

  constructor(
    container: HTMLElement,
    onStateUpdate?: (state: PlayerState) => void,
    onFocusArtwork?: (artwork: Artwork) => void,
    onPrewarmProgress?: (state: PrewarmState) => void,
    onToggleMap?: () => void
  ) {
    this.container = container;
    this.onStateUpdate = onStateUpdate;
    this.onFocusArtwork = onFocusArtwork;
    this.onPrewarmProgress = onPrewarmProgress;
    this.onToggleMap = onToggleMap;
    MuseumScene.currentSceneInstance = this;

    // Expose development-only diagnostic configuration switches
    (window as any).__MUSEUM_CONFIG__ = {
      get BATCHING_ENABLED() { return StaticGeometryBatcher.BATCHING_ENABLED; },
      set BATCHING_ENABLED(val: boolean) { StaticGeometryBatcher.BATCHING_ENABLED = val; },
      get PREWARMING_ENABLED() { return PaintingManager.PREWARMING_ENABLED; },
      set PREWARMING_ENABLED(val: boolean) { PaintingManager.PREWARMING_ENABLED = val; },
      get SHADOW_TEST_MODE() { return MuseumScene.SHADOW_TEST_MODE; },
      set SHADOW_TEST_MODE(val: 'CURRENT' | 'OFF' | 'STATIC') {
        MuseumScene.setShadowTestMode(val);
      },
      get PERFORMANCE_MODE() { return PerformanceManager.PERFORMANCE_MODE; },
      set PERFORMANCE_MODE(val: 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW') {
        MuseumScene.setPerformanceMode(val);
      }
    };

    this.performanceManager = new PerformanceManager((level) => this.onAdaptiveChange(level));

    this.initThree();
    this.initModules();
    this.initEvents();
    this.startLoop();
    this.startPrewarm();
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
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = false;

    this.timer.connect(document);

    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Bakes the static directional architectural shadow map once onto the GPU.
   * Auto-update is disabled, leaving the shadow map static for the entire session.
   */
  public bakeStaticShadowMap(trigger = 'Initial Static Bake'): void {
    if (!this.lighting || !this.lighting.dirLight || !this.renderer.shadowMap.enabled) return;
    if (MuseumScene.SHADOW_TEST_MODE === 'OFF') {
      this.lighting.dirLight.castShadow = false;
      this.renderer.shadowMap.needsUpdate = false;
      return;
    }

    this.lighting.dirLight.castShadow = true;
    this.lighting.dirLight.updateMatrixWorld();
    this.lighting.dirLight.target.updateMatrixWorld();
    this.renderer.shadowMap.needsUpdate = true;
    this.staticShadowBaked = true;
    DiagnosticProfiler.getInstance().recordShadowUpdate(
      new THREE.Vector3(0, 0, 0),
      0,
      0,
      trigger
    );
  }

  public applyShadowMode(mode: 'CURRENT' | 'OFF' | 'STATIC'): void {
    if (!this.lighting || !this.lighting.dirLight) return;

    if (mode === 'OFF') {
      this.lighting.dirLight.castShadow = false;
      this.renderer.shadowMap.enabled = false;
      this.renderer.shadowMap.needsUpdate = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.lighting.dirLight.castShadow = true;
      this.bakeStaticShadowMap(`Shadow Mode Switch (${mode})`);
    }
  }

  public static setPerformanceMode(mode: 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW'): void {
    PerformanceManager.PERFORMANCE_MODE = mode;
    if (MuseumScene.currentSceneInstance && MuseumScene.currentSceneInstance.performanceManager) {
      MuseumScene.currentSceneInstance.performanceManager.setMode(mode);
    }
  }

  private onAdaptiveChange(level: AdaptiveLevel): void {
    if (!this.performanceManager || !this.renderer) return;
    const ratio = this.performanceManager.getPixelRatio(window.devicePixelRatio);
    this.renderer.setPixelRatio(ratio);
  }

  private initModules(): void {
    // Collision system
    this.collisionSystem = new CollisionSystem();

    // Lighting
    this.lighting = new Lighting();

    // Architecture (builds static architecture geometry and batches lighting static fixtures)
    this.architecture = new Architecture(this.collisionSystem);
    this.architecture.buildMuseum(this.lighting);

    this.scene.add(this.lighting.lightingGroup);
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
        this.performanceManager.recordReactNotification();
        if (this.onStateUpdate) {
          const activeLights = this.lighting ? this.lighting.getActiveLightCount() : 0;
          this.onStateUpdate({
            ...state,
            perfStats: {
              fps: this.performanceManager.stats.avgFps || 60,
              drawCalls: this.renderer ? this.renderer.info.render.calls : 0,
              triangles: this.renderer ? this.renderer.info.render.triangles : 0,
              textures: this.renderer ? this.renderer.info.memory.textures : 0,
              geometries: this.renderer ? this.renderer.info.memory.geometries : 0,
              activeLights,
              qualityLevel: this.performanceManager.currentAdaptiveLevel,
              adaptiveLevel: this.performanceManager.currentAdaptiveLevel,
              performanceMode: PerformanceManager.PERFORMANCE_MODE
            }
          });
        }
      },
      this.onFocusArtwork,
      this.onToggleMap
    );
  }

  private initEvents(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  private handleResize = (): void => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleClick = (e: MouseEvent): void => {
    if (this.isDisposed) return;
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
    let lastFrameTime = performance.now();

    const render = (timestamp: number = performance.now()) => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(render);

      const tFrameStart = performance.now();
      const callbackGapMs = (timestamp - lastFrameTime);
      lastFrameTime = timestamp;

      // Frame-rate independent delta calculation with safety clamping
      this.timer.update(timestamp);
      const rawDelta = this.timer.getDelta();
      const delta = Math.min(0.033, Math.max(0.0001, rawDelta));

      this.performanceManager.recordFrame(delta);

      // 1. Precise, lightweight performance timing breakdown (Req 7)
      const tPlayerStart = performance.now();
      this.playerController.update(delta);
      const playerUpdateTimeMs = performance.now() - tPlayerStart;

      const pos = this.playerController.position;

      const tSceneStart = performance.now();

      if (this.lighting && this.lighting.playerLantern) {
        this.lighting.playerLantern.position.set(pos.x, pos.y - 0.2, pos.z);
      }

      frameCount++;

      // Distance Culling throttled to every 6 frames (or every 12 frames in LEVEL_1_CPU to reduce runtime workload)
      const cullInterval = this.performanceManager.currentAdaptiveLevel === 'LEVEL_0_FULL' ? 6 : 12;
      if (frameCount % cullInterval === 0) {
        if (this.lighting) {
          const budget = this.performanceManager.lightBudget;
          this.lighting.updateSecondaryPointLights(pos, budget);

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
      const sceneUpdateTimeMs = performance.now() - tSceneStart;

      // 2. Render execution
      const isShadowUpdateFrame = this.renderer.shadowMap.enabled && this.renderer.shadowMap.needsUpdate;
      const tRenderStart = performance.now();
      this.renderer.render(this.scene, this.camera);
      const renderTimeMs = performance.now() - tRenderStart;

      // Total synchronous JS execution time in this RAF callback
      const executionTimeMs = performance.now() - tFrameStart;

      // 3. Ultra-lightweight Diagnostic Profiler recording (Part 1, 3, 4)
      const profiler = DiagnosticProfiler.getInstance();
      if (isShadowUpdateFrame) {
        const baseline = this.performanceManager.stats.renderTimeMs || 7.5;
        const shadowPassDuration = Math.max(0.5, renderTimeMs - baseline);
        profiler.recordShadowPassDuration(shadowPassDuration);
      }

      const activeLightCount = this.lighting ? this.lighting.getActiveLightCount() : 0;

      profiler.recordFrame(
        callbackGapMs,
        executionTimeMs,
        this.renderer,
        pos,
        this.playerController.currentHallId,
        this.playerController.currentHallName,
        activeLightCount,
        playerUpdateTimeMs,
        sceneUpdateTimeMs,
        renderTimeMs
      );

      if (frameCount % 30 === 0) {
        this.performanceManager.stats.playerUpdateTimeMs = parseFloat(playerUpdateTimeMs.toFixed(2));
        this.performanceManager.stats.jsUpdateTimeMs = parseFloat((playerUpdateTimeMs + sceneUpdateTimeMs).toFixed(2));
        this.performanceManager.stats.renderTimeMs = parseFloat(renderTimeMs.toFixed(2));
      }
    };

    render();
  }

  public startPrewarm(): Promise<void> {
    if (this.prewarmPromise) {
      return this.prewarmPromise;
    }

    this.prewarmPromise = this.executePrewarm();
    return this.prewarmPromise;
  }

  private async executePrewarm(): Promise<void> {
    if (this.isDisposed) return;
    const profiler = DiagnosticProfiler.getInstance();

    try {
      // 1. Asynchronously preload and prewarm all 36 artwork textures on GPU
      await this.gallerySystem.preloadAndPrewarmAll(this.renderer, (loaded, total, msg) => {
        if (!this.isDisposed && this.onPrewarmProgress) {
          this.onPrewarmProgress({
            loaded,
            total,
            isComplete: false,
            statusMessage: msg
          });
        }
      });

      if (this.isDisposed) return;

      // 2. Yield to browser thread before shader precompilation
      if (this.onPrewarmProgress) {
        this.onPrewarmProgress({
          loaded: 36,
          total: 36,
          isComplete: false,
          statusMessage: 'Compiling museum shaders...'
        });
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (this.isDisposed) return;

      // 3. Precompile complete scene shader variants and bake static architectural shadow map
      this.bakeStaticShadowMap('Prewarm Initial Bake');

      const initialPrograms = this.renderer.info.programs ? this.renderer.info.programs.length : 0;
      profiler.recordShaderPrecompileStart(initialPrograms);

      this.renderer.compile(this.scene, this.camera);

      const finalPrograms = this.renderer.info.programs ? this.renderer.info.programs.length : 0;
      profiler.recordShaderPrecompileComplete(finalPrograms);
      profiler.recordPrewarmComplete();

      // 4. Prewarm completed
      if (!this.isDisposed && this.onPrewarmProgress) {
        this.onPrewarmProgress({
          loaded: 36,
          total: 36,
          isComplete: true,
          statusMessage: 'Exhibition Ready'
        });
      }
    } catch (err) {
      console.warn('[MuseumScene] Prewarm encountered non-fatal notice:', err);
      if (!this.isDisposed && this.onPrewarmProgress) {
        this.onPrewarmProgress({
          loaded: 36,
          total: 36,
          isComplete: true,
          statusMessage: 'Exhibition Ready'
        });
      }
    }
  }

  public teleportPlayer(x: number, y: number, z: number, yaw?: number): void {
    if (this.playerController) {
      this.playerController.teleport(x, y, z, yaw);
    }
  }

  public navigateToArtwork(art: Artwork): void {
    if (this.playerController) {
      this.playerController.navigateToArtwork(art);
    }
  }

  public dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('click', this.handleClick);
    }

    if (this.paintingManager) {
      this.paintingManager.dispose();
    }
    if (this.playerController) {
      this.playerController.dispose();
    }
    this.timer.dispose();

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}

