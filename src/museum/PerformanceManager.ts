import * as THREE from 'three';

export type QualityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'EMERGENCY';

export class PerformanceManager {
  public qualityLevel: QualityLevel = 'MEDIUM';
  private fpsHistory: number[] = [];
  private sampleCount = 0;
  private cooldownFrames = 0;

  // Frame pacing configuration
  public targetFps = 45; // Default smooth target
  public frameInterval = 1000 / 45; // ~22.2 ms

  // Callbacks
  private onQualityChange?: (level: QualityLevel) => void;

  constructor(onQualityChange?: (level: QualityLevel) => void) {
    this.onQualityChange = onQualityChange;
    this.setQuality('MEDIUM', false);
  }

  public recordFrame(deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;
    const fps = 1.0 / deltaSeconds;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 45) this.fpsHistory.shift();

    this.sampleCount++;
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--;
      return;
    }

    // Evaluate average FPS every 30 frames (~0.75s)
    if (this.sampleCount >= 30) {
      this.sampleCount = 0;
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

      if (avgFps < 22 && this.qualityLevel !== 'EMERGENCY') {
        this.setQuality('EMERGENCY');
        this.cooldownFrames = 120; // Wait 2s before considering upgrade
      } else if (avgFps < 32) {
        if (this.qualityLevel === 'HIGH') {
          this.setQuality('MEDIUM');
          this.cooldownFrames = 90;
        } else if (this.qualityLevel === 'MEDIUM') {
          this.setQuality('LOW');
          this.cooldownFrames = 90;
        }
      } else if (avgFps > 55) {
        if (this.qualityLevel === 'EMERGENCY') {
          this.setQuality('LOW');
          this.cooldownFrames = 120;
        } else if (this.qualityLevel === 'LOW') {
          this.setQuality('MEDIUM');
          this.cooldownFrames = 120;
        }
      }
    }
  }

  public setQuality(level: QualityLevel, notify = true): void {
    this.qualityLevel = level;
    if (level === 'EMERGENCY') {
      this.targetFps = 30;
      this.frameInterval = 1000 / 30;
    } else if (level === 'LOW') {
      this.targetFps = 35;
      this.frameInterval = 1000 / 35;
    } else if (level === 'MEDIUM') {
      this.targetFps = 45;
      this.frameInterval = 1000 / 45;
    } else if (level === 'HIGH') {
      this.targetFps = 60;
      this.frameInterval = 1000 / 60;
    }

    if (notify && this.onQualityChange) {
      this.onQualityChange(level);
    }
  }

  public getPixelRatio(deviceRatio: number): number {
    switch (this.qualityLevel) {
      case 'EMERGENCY':
        return 0.75;
      case 'LOW':
        return 0.85;
      case 'MEDIUM':
        return Math.min(deviceRatio, 1.0);
      case 'HIGH':
        return Math.min(deviceRatio, 1.25);
    }
  }

  public getShadowMapSize(): number {
    switch (this.qualityLevel) {
      case 'EMERGENCY':
        return 256;
      case 'LOW':
        return 512;
      case 'MEDIUM':
        return 1024;
      case 'HIGH':
        return 1024;
    }
  }

  public shouldRenderShadows(): boolean {
    return this.qualityLevel !== 'EMERGENCY';
  }
}
