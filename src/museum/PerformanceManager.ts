import * as THREE from 'three';

export type PerformanceMode = 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AdaptiveLevel = 'LEVEL_0_FULL' | 'LEVEL_1_CPU' | 'LEVEL_2_LIGHTS' | 'LEVEL_3_RESOLUTION';
export type PerformanceTier = 'TIER_A_CAPABLE' | 'TIER_B_MODERATE' | 'TIER_C_WEAK';

export interface PerformanceStats {
  instantFps: number;
  avgFps: number;
  frameTimeMs: number;
  minFrameTimeMs: number;
  maxFrameTimeMs: number;
  spikeCount: number;
  // Lightweight CPU Profiler metrics (ms)
  jsUpdateTimeMs: number;
  playerUpdateTimeMs: number;
  collisionTimeMs: number;
  nearestArtworkTimeMs: number;
  renderTimeMs: number;
  reactUpdatesPerSec: number;
}

export class PerformanceManager {
  public static PERFORMANCE_MODE: PerformanceMode = 'AUTO';
  public currentAdaptiveLevel: AdaptiveLevel = 'LEVEL_0_FULL';
  public detectedTier: PerformanceTier = 'TIER_A_CAPABLE';
  
  // Secondary point light budget (full = 30)
  public lightBudget = 30;

  private static readonly BUFFER_SIZE = 60;
  private fpsBuffer = new Float32Array(PerformanceManager.BUFFER_SIZE);
  private frameTimeBuffer = new Float32Array(PerformanceManager.BUFFER_SIZE);
  private bufferIndex = 0;
  private bufferCount = 0;
  private runningFpsSum = 0;
  private runningFrameTimeSum = 0;
  private sampleCount = 0;
  private cooldownFrames = 180; // 3-second startup grace period (avoids prewarm noise)

  // Hysteresis counters to prevent oscillation
  private sustainedDegradationCount = 0;
  private sustainedRecoveryCount = 0;

  // React notification tracking
  private reactNotifyCounter = 0;
  private lastNotifySec = performance.now();

  // Real-time diagnostics
  public stats: PerformanceStats = {
    instantFps: 60,
    avgFps: 60,
    frameTimeMs: 16.67,
    minFrameTimeMs: 16.67,
    maxFrameTimeMs: 16.67,
    spikeCount: 0,
    jsUpdateTimeMs: 0,
    playerUpdateTimeMs: 0,
    collisionTimeMs: 0,
    nearestArtworkTimeMs: 0,
    renderTimeMs: 0,
    reactUpdatesPerSec: 0,
  };

  // Callbacks
  private onAdaptiveChange?: (level: AdaptiveLevel) => void;

  constructor(onAdaptiveChange?: (level: AdaptiveLevel) => void) {
    this.onAdaptiveChange = onAdaptiveChange;
    this.applyMode(PerformanceManager.PERFORMANCE_MODE, false);
  }

  public setMode(mode: PerformanceMode): void {
    PerformanceManager.PERFORMANCE_MODE = mode;
    this.applyMode(mode, true);
  }

  private applyMode(mode: PerformanceMode, notify = true): void {
    if (mode === 'HIGH') {
      this.currentAdaptiveLevel = 'LEVEL_0_FULL';
      this.lightBudget = 30;
    } else if (mode === 'MEDIUM') {
      this.currentAdaptiveLevel = 'LEVEL_2_LIGHTS';
      this.lightBudget = 16;
    } else if (mode === 'LOW') {
      this.currentAdaptiveLevel = 'LEVEL_3_RESOLUTION';
      this.lightBudget = 8;
    } else {
      // AUTO mode starts at Level 0 Full Quality on startup
      this.currentAdaptiveLevel = 'LEVEL_0_FULL';
      this.lightBudget = 30;
      this.cooldownFrames = 180; // 3s evaluation window
      this.sustainedDegradationCount = 0;
      this.sustainedRecoveryCount = 0;
    }

    if (notify && this.onAdaptiveChange) {
      this.onAdaptiveChange(this.currentAdaptiveLevel);
    }
  }

  /**
   * Monitor frame delta times, record FPS metrics and evaluate sustained performance pressure.
   * Uses a zero-allocation circular buffer and running sum.
   */
  public recordFrame(deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;

    const frameTimeMs = deltaSeconds * 1000;
    const fps = Math.min(240, 1.0 / deltaSeconds);

    const oldFps = this.fpsBuffer[this.bufferIndex];
    const oldFt = this.frameTimeBuffer[this.bufferIndex];

    this.fpsBuffer[this.bufferIndex] = fps;
    this.frameTimeBuffer[this.bufferIndex] = frameTimeMs;

    if (this.bufferCount < PerformanceManager.BUFFER_SIZE) {
      this.bufferCount++;
      this.runningFpsSum += fps;
      this.runningFrameTimeSum += frameTimeMs;
    } else {
      this.runningFpsSum += fps - oldFps;
      this.runningFrameTimeSum += frameTimeMs - oldFt;
    }

    this.bufferIndex = (this.bufferIndex + 1) % PerformanceManager.BUFFER_SIZE;

    // Check for frame time spikes (> 33.3ms / sub-30 FPS single-frame stall)
    if (frameTimeMs > 33.3) {
      this.stats.spikeCount++;
    }

    // Update real-time stats
    this.stats.instantFps = Math.round(fps);
    this.stats.frameTimeMs = parseFloat(frameTimeMs.toFixed(2));

    // Update React notification frequency
    const now = performance.now();
    if (now - this.lastNotifySec >= 1000) {
      this.stats.reactUpdatesPerSec = this.reactNotifyCounter;
      this.reactNotifyCounter = 0;
      this.lastNotifySec = now;
    }

    this.sampleCount++;
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--;
      return;
    }

    // Evaluate average performance every 60 frames (~1s on 60Hz)
    if (this.sampleCount >= 60) {
      this.sampleCount = 0;

      const avgFps = this.runningFpsSum / this.bufferCount;
      this.stats.avgFps = Math.round(avgFps);

      let minFt = Infinity;
      let maxFt = -Infinity;
      for (let i = 0; i < this.bufferCount; i++) {
        const ft = this.frameTimeBuffer[i];
        if (ft < minFt) minFt = ft;
        if (ft > maxFt) maxFt = ft;
      }
      this.stats.minFrameTimeMs = parseFloat(minFt.toFixed(2));
      this.stats.maxFrameTimeMs = parseFloat(maxFt.toFixed(2));

      // In manual modes (HIGH, MEDIUM, LOW), skip auto adaptation
      if (PerformanceManager.PERFORMANCE_MODE !== 'AUTO') return;

      // Update Detected Hardware Tier
      if (avgFps >= 55) {
        this.detectedTier = 'TIER_A_CAPABLE';
      } else if (avgFps >= 38) {
        this.detectedTier = 'TIER_B_MODERATE';
      } else {
        this.detectedTier = 'TIER_C_WEAK';
      }

      // AUTO ADAPTIVE LOGIC WITH HYSTERESIS
      // Downgrade requires sustained degradation across multiple seconds
      if (avgFps < 48) {
        this.sustainedDegradationCount++;
        this.sustainedRecoveryCount = 0;

        if (this.sustainedDegradationCount >= 3) {
          this.sustainedDegradationCount = 0;
          this.cooldownFrames = 180; // 3s cooldown between downgrades
          this.stepDownLevel();
        }
      } else if (avgFps >= 57) {
        this.sustainedRecoveryCount++;
        this.sustainedDegradationCount = 0;

        // Upgrades require a longer sustained stable period (5 seconds) to prevent oscillation
        if (this.sustainedRecoveryCount >= 5) {
          this.sustainedRecoveryCount = 0;
          this.cooldownFrames = 240; // 4s cooldown
          this.stepUpLevel();
        }
      } else {
        // Stable intermediate band
        this.sustainedDegradationCount = 0;
        this.sustainedRecoveryCount = 0;
      }
    }
  }

  private stepDownLevel(): void {
    let nextLevel: AdaptiveLevel = this.currentAdaptiveLevel;
    if (this.currentAdaptiveLevel === 'LEVEL_0_FULL') {
      nextLevel = 'LEVEL_1_CPU';
      this.lightBudget = 30;
    } else if (this.currentAdaptiveLevel === 'LEVEL_1_CPU') {
      nextLevel = 'LEVEL_2_LIGHTS';
      this.lightBudget = 16;
    } else if (this.currentAdaptiveLevel === 'LEVEL_2_LIGHTS') {
      nextLevel = 'LEVEL_3_RESOLUTION';
      this.lightBudget = 10;
    }
    if (nextLevel !== this.currentAdaptiveLevel) {
      this.currentAdaptiveLevel = nextLevel;
      if (this.onAdaptiveChange) this.onAdaptiveChange(this.currentAdaptiveLevel);
    }
  }

  private stepUpLevel(): void {
    let nextLevel: AdaptiveLevel = this.currentAdaptiveLevel;
    if (this.currentAdaptiveLevel === 'LEVEL_3_RESOLUTION') {
      nextLevel = 'LEVEL_2_LIGHTS';
      this.lightBudget = 16;
    } else if (this.currentAdaptiveLevel === 'LEVEL_2_LIGHTS') {
      nextLevel = 'LEVEL_1_CPU';
      this.lightBudget = 30;
    } else if (this.currentAdaptiveLevel === 'LEVEL_1_CPU') {
      nextLevel = 'LEVEL_0_FULL';
      this.lightBudget = 30;
    }
    if (nextLevel !== this.currentAdaptiveLevel) {
      this.currentAdaptiveLevel = nextLevel;
      if (this.onAdaptiveChange) this.onAdaptiveChange(this.currentAdaptiveLevel);
    }
  }

  public recordReactNotification(): void {
    this.reactNotifyCounter++;
  }

  public getPixelRatio(deviceRatio: number): number {
    switch (this.currentAdaptiveLevel) {
      case 'LEVEL_3_RESOLUTION':
        return Math.max(0.80, Math.min(deviceRatio * 0.85, 1.0));
      case 'LEVEL_2_LIGHTS':
      case 'LEVEL_1_CPU':
      case 'LEVEL_0_FULL':
      default:
        return Math.min(deviceRatio, 1.5);
    }
  }
}

