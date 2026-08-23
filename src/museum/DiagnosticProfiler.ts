import * as THREE from 'three';
import { PerformanceManager } from './PerformanceManager';
import { MuseumScene } from './MuseumScene';

export interface TextureDiagnosticRecord {
  artworkNumber: number;
  url: string;
  requestStartTime: number;
  loadCompleteTime: number;
  gpuInitCompleteTime: number | null;
  width: number;
  height: number;
  status: 'pending' | 'loaded' | 'gpu_ready' | 'error';
  errorMessage?: string;
}

export interface FrameSpikeRecord {
  id: number;
  timestamp: number;
  callbackGapMs: number;
  executionTimeMs: number;
  position: [number, number, number];
  hallId: string;
  hallName: string;
  activeLights: number;
  drawCalls: number;
  triangles: number;
  playerUpdateTimeMs: number;
  sceneUpdateTimeMs: number;
  renderTimeMs: number;
  shadowTestMode: 'CURRENT' | 'OFF' | 'STATIC';
  probableTrigger: string;
  category: 'GPU_RENDER' | 'MAIN_THREAD_CPU' | 'TAB_SUSPENSION' | 'PHYSICS' | 'SCENE_GRAPH';
}

export interface FrameTimingBreakdown {
  playerUpdateTimeMs: number;
  sceneUpdateTimeMs: number;
  renderTimeMs: number;
  executionTimeMs: number;
  callbackGapMs: number;
  shadowTestMode: 'CURRENT' | 'OFF' | 'STATIC';
}

export interface ModePerformanceMetrics {
  mode: 'CURRENT' | 'OFF' | 'STATIC';
  sampleCount: number;
  fpsP50: number;
  frameP95: number;
  frameP99: number;
  realExecP95: number;
  renderP95: number;
  shadowUpdates: number;
  avgShadowPassMs: number;
  maxShadowPassMs: number;
  mainThreadSpikes: number;
  tabSuspensions: number;
}

export class DiagnosticProfiler {
  private static instance: DiagnosticProfiler;

  public currentShadowMode: 'CURRENT' | 'OFF' | 'STATIC' = 'STATIC';

  public textureRecords: Map<number, TextureDiagnosticRecord> = new Map();
  public spikeRecords: FrameSpikeRecord[] = [];
  public mainThreadSpikes: FrameSpikeRecord[] = [];
  public duplicateTextureRequestsBlocked = 0;

  // Prewarming & Compilation Diagnostics
  public prewarmStartTime = 0;
  public prewarmCompleteTime = 0;
  public shaderPrecompileStartTime = 0;
  public shaderPrecompileCompleteTime = 0;
  public initialShaderProgramsCount = 0;
  public finalShaderProgramsCount = 0;
  public gpuInitializedCount = 0;
  public textureErrorCount = 0;
  public uniqueFailedUrls: Set<string> = new Set();

  // Shadow Map Diagnostics (Static Global Architectural Shadow)
  public shadowUpdateCount = 0;
  public get directionalShadowUpdateCount(): number {
    return this.shadowUpdateCount;
  }
  public lastShadowUpdateTime = 0;
  public lastShadowPassDurationMs = 0;
  public totalShadowPassDurationMs = 0;
  public shadowPassMeasurements: number[] = [];
  public minShadowPassDurationMs = 0;
  public maxShadowPassDurationMs = 0;
  public avgShadowPassDurationMs = 0;

  // Batching Diagnostics
  public batchStats: {
    originalMeshCount: number;
    successfullyBatchedMeshCount: number;
    fallbackMeshCount: number;
    failedMergeGroupCount: number;
    mergedGeometryCount: number;
    finalBatchedMeshCount: number;
    zonesCount: number;
    originalGeometriesDisposed: number;
    reductionPercentage: number;
    shadowCasterMeshCount?: number;
    nonShadowCasterMeshCount?: number;
    shadowBatchCount?: number;
    nonShadowBatchCount?: number;
    shadowBatchTriangles?: number;
    nonShadowBatchTriangles?: number;
  } | null = null;

  // Frame timing stats
  public lastTiming: FrameTimingBreakdown = {
    playerUpdateTimeMs: 0,
    sceneUpdateTimeMs: 0,
    renderTimeMs: 0,
    executionTimeMs: 0,
    callbackGapMs: 16.67,
    shadowTestMode: 'STATIC'
  };

  public tabSuspensionCount = 0;
  public lastTabSuspensionDuration = 0;

  // Per-mode rolling samples (max 1000 per mode)
  private modeSamples: Record<'CURRENT' | 'OFF' | 'STATIC', {
    callbackGaps: number[];
    executionTimes: number[];
    renderTimes: number[];
    playerTimes: number[];
    sceneTimes: number[];
    shadowPasses: number[];
    shadowUpdates: number;
    mainThreadSpikes: number;
    tabSuspensions: number;
  }> = {
    CURRENT: { callbackGaps: [], executionTimes: [], renderTimes: [], playerTimes: [], sceneTimes: [], shadowPasses: [], shadowUpdates: 0, mainThreadSpikes: 0, tabSuspensions: 0 },
    OFF: { callbackGaps: [], executionTimes: [], renderTimes: [], playerTimes: [], sceneTimes: [], shadowPasses: [], shadowUpdates: 0, mainThreadSpikes: 0, tabSuspensions: 0 },
    STATIC: { callbackGaps: [], executionTimes: [], renderTimes: [], playerTimes: [], sceneTimes: [], shadowPasses: [], shadowUpdates: 0, mainThreadSpikes: 0, tabSuspensions: 0 }
  };

  private spikeCounter = 0;
  private maxSpikeRecords = 100;
  private lastPeriodicSummaryTime = performance.now();

  public static getInstance(): DiagnosticProfiler {
    if (!DiagnosticProfiler.instance) {
      DiagnosticProfiler.instance = new DiagnosticProfiler();
      (window as any).__MUSEUM_DIAGNOSTICS__ = DiagnosticProfiler.instance;
      (window as any).__MUSEUM_DIAGNOSTICS__.getReport = () => DiagnosticProfiler.instance.getReport();
      (window as any).__MUSEUM_DIAGNOSTICS__.getComparisonTable = () => DiagnosticProfiler.instance.getComparisonTable();
    }
    return DiagnosticProfiler.instance;
  }

  // 1. Texture Loading Diagnostics
  public recordTextureRequest(artworkNumber: number, url: string): void {
    if (this.textureRecords.has(artworkNumber)) {
      this.duplicateTextureRequestsBlocked++;
      return;
    }

    this.textureRecords.set(artworkNumber, {
      artworkNumber,
      url,
      requestStartTime: performance.now(),
      loadCompleteTime: 0,
      gpuInitCompleteTime: null,
      width: 0,
      height: 0,
      status: 'pending'
    });
  }

  public recordTextureLoaded(artworkNumber: number, width: number, height: number): void {
    const record = this.textureRecords.get(artworkNumber);
    if (record) {
      record.loadCompleteTime = performance.now();
      record.width = width;
      record.height = height;
      if (record.status === 'pending') {
        record.status = 'loaded';
      }
    }
  }

  public recordTextureGpuInit(artworkNumber: number): void {
    const record = this.textureRecords.get(artworkNumber);
    if (record) {
      record.gpuInitCompleteTime = performance.now();
      record.status = 'gpu_ready';
      this.gpuInitializedCount++;
    }
  }

  public recordTextureError(artworkNumber: number, url: string, error?: any): void {
    const record = this.textureRecords.get(artworkNumber);
    if (record) {
      record.status = 'error';
      record.errorMessage = error ? String(error) : 'File not found or network error';
    }
    this.textureErrorCount++;
    this.uniqueFailedUrls.add(url);
  }

  public recordPrewarmStart(): void {
    this.prewarmStartTime = performance.now();
    console.log(`[DIAGNOSTIC PREWARM] Starting texture and shader initialization...`);
  }

  public recordShaderPrecompileStart(initialCount: number): void {
    this.shaderPrecompileStartTime = performance.now();
    this.initialShaderProgramsCount = initialCount;
  }

  public recordShaderPrecompileComplete(finalCount: number): void {
    this.shaderPrecompileCompleteTime = performance.now();
    this.finalShaderProgramsCount = finalCount;
    const duration = this.shaderPrecompileCompleteTime - this.shaderPrecompileStartTime;
    const diff = finalCount - this.initialShaderProgramsCount;
    console.log(
      `[DIAGNOSTIC PREWARM] Shader precompilation complete in ${duration.toFixed(1)}ms. Compiled programs: +${diff} (Total: ${finalCount} shader programs)`
    );
  }

  public recordPrewarmComplete(): void {
    this.prewarmCompleteTime = performance.now();
    const totalDuration = this.prewarmCompleteTime - this.prewarmStartTime;
    
    // Aggregated texture summary (Req 9, 10)
    console.log(
      `[DIAGNOSTIC PREWARM SUMMARY in ${totalDuration.toFixed(1)}ms]\n` +
      `  • Textures: ${this.gpuInitializedCount}/36 GPU-initialized (${this.textureErrorCount} failed, ${this.uniqueFailedUrls.size} unique missing URLs)\n` +
      `  • Shaders: ${this.finalShaderProgramsCount} programs compiled\n` +
      `  • Duplicate requests blocked: ${this.duplicateTextureRequestsBlocked}`
    );

    if (this.uniqueFailedUrls.size > 0) {
      console.log(
        `[DIAGNOSTIC TEXTURE ASSETS] Missing artwork URLs (${this.uniqueFailedUrls.size}):`,
        Array.from(this.uniqueFailedUrls)
      );
    }
  }

  // 2. Ultra-Lightweight Frame-Time Spike Detection & Suspension Filter
  public setShadowMode(mode: 'CURRENT' | 'OFF' | 'STATIC'): void {
    this.currentShadowMode = mode;
  }

  public recordFrame(
    callbackGapMs: number,
    executionTimeMs: number,
    renderer: THREE.WebGLRenderer,
    pos: THREE.Vector3,
    hallId: string,
    hallName: string,
    activeLights: number,
    playerUpdateTimeMs: number,
    sceneUpdateTimeMs: number,
    renderTimeMs: number
  ): void {
    this.lastTiming.playerUpdateTimeMs = parseFloat(playerUpdateTimeMs.toFixed(2));
    this.lastTiming.sceneUpdateTimeMs = parseFloat(sceneUpdateTimeMs.toFixed(2));
    this.lastTiming.renderTimeMs = parseFloat(renderTimeMs.toFixed(2));
    this.lastTiming.executionTimeMs = parseFloat(executionTimeMs.toFixed(2));
    this.lastTiming.callbackGapMs = parseFloat(callbackGapMs.toFixed(2));
    this.lastTiming.shadowTestMode = this.currentShadowMode;

    const currentModeBucket = this.modeSamples[this.currentShadowMode];

    // Requirement: Distinguish browser tab suspension from actual CPU/GPU frame spikes
    if (callbackGapMs > 1000.0 && executionTimeMs < 35.0) {
      this.tabSuspensionCount++;
      this.lastTabSuspensionDuration = callbackGapMs;
      currentModeBucket.tabSuspensions++;
      // Excluded from normal frame-time percentiles to avoid skewing telemetry
      return;
    }

    // Record valid frame metrics in mode ring buffers (max 1000 items)
    if (currentModeBucket.callbackGaps.length >= 1000) {
      currentModeBucket.callbackGaps.shift();
      currentModeBucket.executionTimes.shift();
      currentModeBucket.renderTimes.shift();
      currentModeBucket.playerTimes.shift();
      currentModeBucket.sceneTimes.shift();
    }
    currentModeBucket.callbackGaps.push(callbackGapMs);
    currentModeBucket.executionTimes.push(executionTimeMs);
    currentModeBucket.renderTimes.push(renderTimeMs);
    currentModeBucket.playerTimes.push(playerUpdateTimeMs);
    currentModeBucket.sceneTimes.push(sceneUpdateTimeMs);

    // Identify real spikes (high execution time or severe wall-clock pause)
    const isRealExecutionSpike = executionTimeMs > 25.0;
    const isWallClockSpike = callbackGapMs > 50.0;

    if (isRealExecutionSpike || isWallClockSpike) {
      let category: FrameSpikeRecord['category'] = 'MAIN_THREAD_CPU';
      let probableTrigger = 'Main thread CPU load / GC / background event';

      if (renderTimeMs > 20.0) {
        category = 'GPU_RENDER';
        probableTrigger = 'GPU draw command submission / shadow depth pass';
      } else if (playerUpdateTimeMs > 15.0) {
        category = 'PHYSICS';
        probableTrigger = 'Player physics / collision resolution';
      } else if (sceneUpdateTimeMs > 15.0) {
        category = 'SCENE_GRAPH';
        probableTrigger = 'Scene graph / distance culling update';
      } else if (isRealExecutionSpike && playerUpdateTimeMs < 5.0 && sceneUpdateTimeMs < 5.0 && renderTimeMs < 10.0) {
        category = 'MAIN_THREAD_CPU';
        probableTrigger = 'Unaccounted main-thread JS / React update / microtask queue';
      }

      const spike: FrameSpikeRecord = {
        id: ++this.spikeCounter,
        timestamp: performance.now(),
        callbackGapMs: parseFloat(callbackGapMs.toFixed(1)),
        executionTimeMs: parseFloat(executionTimeMs.toFixed(1)),
        position: [
          parseFloat(pos.x.toFixed(1)),
          parseFloat(pos.y.toFixed(1)),
          parseFloat(pos.z.toFixed(1))
        ],
        hallId,
        hallName,
        activeLights,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        playerUpdateTimeMs: parseFloat(playerUpdateTimeMs.toFixed(1)),
        sceneUpdateTimeMs: parseFloat(sceneUpdateTimeMs.toFixed(1)),
        renderTimeMs: parseFloat(renderTimeMs.toFixed(1)),
        shadowTestMode: this.currentShadowMode,
        probableTrigger,
        category
      };

      if (this.spikeRecords.length >= this.maxSpikeRecords) {
        this.spikeRecords.shift();
      }
      this.spikeRecords.push(spike);

      if (category === 'MAIN_THREAD_CPU' && isRealExecutionSpike) {
        currentModeBucket.mainThreadSpikes++;
        if (this.mainThreadSpikes.length >= 50) {
          this.mainThreadSpikes.shift();
        }
        this.mainThreadSpikes.push(spike);
      }
    }

    // Periodic aggregated diagnostic summary every 15s (Zero console spam during movement)
    const now = performance.now();
    if (now - this.lastPeriodicSummaryTime > 15000) {
      this.lastPeriodicSummaryTime = now;
      const metrics = this.getModeMetrics(this.currentShadowMode);
      console.log(
        `[MUSEUM DIAGNOSTICS (${this.currentShadowMode})] FPS p50: ${metrics.fpsP50} | Frame p95: ${metrics.frameP95}ms | Exec p95: ${metrics.realExecP95}ms | Render p95: ${metrics.renderP95}ms | Shadow Updates: ${metrics.shadowUpdates}`
      );
    }
  }

  // 3. Shadow Map Update Tracking & Duration Isolation
  public recordShadowUpdate(
    pos: THREE.Vector3,
    snappedX: number,
    snappedZ: number,
    trigger: string
  ): void {
    const now = performance.now();
    this.shadowUpdateCount++;
    this.lastShadowUpdateTime = now;
    this.modeSamples[this.currentShadowMode].shadowUpdates++;
    // Data recorded silently into telemetry buffer (no per-step console spam)
  }

  public recordShadowPassDuration(durationMs: number): void {
    this.lastShadowPassDurationMs = parseFloat(durationMs.toFixed(2));
    this.totalShadowPassDurationMs += durationMs;
    this.shadowPassMeasurements.push(this.lastShadowPassDurationMs);
    this.modeSamples[this.currentShadowMode].shadowPasses.push(this.lastShadowPassDurationMs);

    if (this.shadowPassMeasurements.length > 100) {
      this.shadowPassMeasurements.shift();
    }

    if (this.minShadowPassDurationMs === 0 || durationMs < this.minShadowPassDurationMs) {
      this.minShadowPassDurationMs = parseFloat(durationMs.toFixed(2));
    }
    if (durationMs > this.maxShadowPassDurationMs) {
      this.maxShadowPassDurationMs = parseFloat(durationMs.toFixed(2));
    }

    const sum = this.shadowPassMeasurements.reduce((acc, v) => acc + v, 0);
    this.avgShadowPassDurationMs = parseFloat((sum / this.shadowPassMeasurements.length).toFixed(2));
  }

  // 4. Geometry Batching Diagnostics
  public recordBatchStats(stats: {
    originalMeshCount: number;
    successfullyBatchedMeshCount: number;
    fallbackMeshCount: number;
    failedMergeGroupCount: number;
    mergedGeometryCount: number;
    finalBatchedMeshCount: number;
    zonesCount: number;
    originalGeometriesDisposed: number;
    reductionPercentage: number;
    shadowCasterMeshCount?: number;
    nonShadowCasterMeshCount?: number;
    shadowBatchCount?: number;
    nonShadowBatchCount?: number;
    shadowBatchTriangles?: number;
    nonShadowBatchTriangles?: number;
  }): void {
    this.batchStats = stats;
  }

  // 5. Percentile & Metric Computations
  private calculatePercentile(values: number[], p: number): number {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
    return parseFloat(sorted[index].toFixed(2));
  }

  public getModeMetrics(mode: 'CURRENT' | 'OFF' | 'STATIC'): ModePerformanceMetrics {
    const bucket = this.modeSamples[mode];
    const n = bucket.callbackGaps.length;

    if (n === 0) {
      return {
        mode,
        sampleCount: 0,
        fpsP50: 60,
        frameP95: 16.67,
        frameP99: 16.67,
        realExecP95: 5.0,
        renderP95: 4.5,
        shadowUpdates: bucket.shadowUpdates,
        avgShadowPassMs: 0,
        maxShadowPassMs: 0,
        mainThreadSpikes: bucket.mainThreadSpikes,
        tabSuspensions: bucket.tabSuspensions
      };
    }

    const gapP50 = this.calculatePercentile(bucket.callbackGaps, 50) || 16.67;
    const fpsP50 = parseFloat((1000 / gapP50).toFixed(1));
    const frameP95 = this.calculatePercentile(bucket.callbackGaps, 95);
    const frameP99 = this.calculatePercentile(bucket.callbackGaps, 99);
    const realExecP95 = this.calculatePercentile(bucket.executionTimes, 95);
    const renderP95 = this.calculatePercentile(bucket.renderTimes, 95);

    const shadowPasses = bucket.shadowPasses;
    const avgShadowPassMs = shadowPasses.length > 0
      ? parseFloat((shadowPasses.reduce((a, b) => a + b, 0) / shadowPasses.length).toFixed(2))
      : 0;
    const maxShadowPassMs = shadowPasses.length > 0
      ? parseFloat(Math.max(...shadowPasses).toFixed(2))
      : 0;

    return {
      mode,
      sampleCount: n,
      fpsP50,
      frameP95,
      frameP99,
      realExecP95,
      renderP95,
      shadowUpdates: bucket.shadowUpdates,
      avgShadowPassMs,
      maxShadowPassMs,
      mainThreadSpikes: bucket.mainThreadSpikes,
      tabSuspensions: bucket.tabSuspensions
    };
  }

  public getComparisonTable(): string {
    const modes: ('CURRENT' | 'OFF' | 'STATIC')[] = ['CURRENT', 'OFF', 'STATIC'];
    const metrics = modes.map(m => this.getModeMetrics(m));

    let table = '| Mode | FPS p50 | Frame p95 | Frame p99 | Real Exec p95 | Render p95 | Shadow Updates | Shadow Pass Cost | Main Thread Spikes |\n';
    table += '|------|---------|-----------|-----------|---------------|------------|----------------|------------------|--------------------|\n';

    for (const m of metrics) {
      const passCost = m.mode === 'OFF' ? 'N/A' : `${m.avgShadowPassMs}ms (max ${m.maxShadowPassMs}ms)`;
      table += `| ${m.mode} | ${m.fpsP50} | ${m.frameP95}ms | ${m.frameP99}ms | ${m.realExecP95}ms | ${m.renderP95}ms | ${m.shadowUpdates} | ${passCost} | ${m.mainThreadSpikes} |\n`;
    }

    return table;
  }

  public getReport(): Record<string, any> {
    const currentMetrics = this.getModeMetrics('CURRENT');
    const offMetrics = this.getModeMetrics('OFF');
    const staticMetrics = this.getModeMetrics('STATIC');

    const scene = MuseumScene.currentSceneInstance;
    const perfMgr = scene?.performanceManager;

    return {
      performanceMode: PerformanceManager.PERFORMANCE_MODE,
      detectedPerformanceTier: perfMgr?.detectedTier ?? 'TIER_A_CAPABLE',
      currentAdaptiveLevel: perfMgr?.currentAdaptiveLevel ?? 'LEVEL_0_FULL',
      currentPixelRatio: scene?.renderer?.getPixelRatio() ?? 1.0,
      activeLightBudget: perfMgr?.lightBudget ?? 30,
      fpsP50: staticMetrics.fpsP50,
      frameP95: staticMetrics.frameP95,
      frameP99: staticMetrics.frameP99,
      realFrameSpikeCount: this.spikeRecords.length,
      activeShadowTestMode: this.currentShadowMode,
      comparisonMetrics: {
        CURRENT: currentMetrics,
        OFF: offMetrics,
        STATIC: staticMetrics
      },
      markdownComparisonTable: this.getComparisonTable(),
      prewarm: {
        totalDurationMs: this.prewarmCompleteTime ? parseFloat((this.prewarmCompleteTime - this.prewarmStartTime).toFixed(1)) : 'in_progress',
        gpuInitializedTextures: this.gpuInitializedCount,
        failedTextures: this.textureErrorCount,
        uniqueFailedUrls: Array.from(this.uniqueFailedUrls),
        shaderPrograms: this.finalShaderProgramsCount,
        duplicateRequestsBlocked: this.duplicateTextureRequestsBlocked
      },
      batching: this.batchStats,
      shadowOptimization: {
        currentMode: this.currentShadowMode,
        totalShadowMapUpdates: this.shadowUpdateCount,
        lastShadowPassDurationMs: this.lastShadowPassDurationMs,
        avgShadowPassDurationMs: this.avgShadowPassDurationMs,
        minShadowPassDurationMs: this.minShadowPassDurationMs,
        maxShadowPassDurationMs: this.maxShadowPassDurationMs,
        shadowCasterMeshCount: this.batchStats?.shadowCasterMeshCount ?? 0,
        nonShadowCasterMeshCount: this.batchStats?.nonShadowCasterMeshCount ?? 0,
        shadowBatchCount: this.batchStats?.shadowBatchCount ?? 0,
        nonShadowBatchCount: this.batchStats?.nonShadowBatchCount ?? 0,
        shadowBatchTriangles: this.batchStats?.shadowBatchTriangles ?? 0,
        nonShadowBatchTriangles: this.batchStats?.nonShadowBatchTriangles ?? 0
      },
      lastTiming: this.lastTiming,
      tabSuspensions: {
        detectedCount: this.tabSuspensionCount,
        lastDurationMs: parseFloat(this.lastTabSuspensionDuration.toFixed(1))
      },
      executionSpikeCount: this.spikeRecords.length,
      recentExecutionSpikes: this.spikeRecords.slice(-5),
      mainThreadUnaccountedSpikes: this.mainThreadSpikes.slice(-5)
    };
  }

  public getSummaryReport(): Record<string, any> {
    return this.getReport();
  }
}

