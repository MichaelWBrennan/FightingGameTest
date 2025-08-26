
/**
 * Game Timer System - High precision timing for fighting game mechanics
 */

export interface TimerConfig {
  targetFPS: number;
  fixedTimeStep: number;
  maxFrameTime: number;
  enableVSync: boolean;
}

export interface FrameStats {
  frameCount: number;
  fps: number;
  frameTime: number;
  deltaTime: number;
  fixedDelta: number;
  gameTime: number;
  realTime: number;
}

export class GameTimer {
  private config: TimerConfig;
  private frameStats: FrameStats;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private frameCounter: number = 0;
  private fpsTimer: number = 0;
  private paused: boolean = false;
  private timeScale: number = 1.0;

  constructor(config: Partial<TimerConfig> = {}) {
    this.config = {
      targetFPS: 60,
      fixedTimeStep: 1/60,
      maxFrameTime: 1/30,
      enableVSync: true,
      ...config
    };

    this.frameStats = {
      frameCount: 0,
      fps: 0,
      frameTime: 0,
      deltaTime: 0,
      fixedDelta: this.config.fixedTimeStep,
      gameTime: 0,
      realTime: 0
    };

    this.lastTime = performance.now() / 1000;
  }

  /**
   * Update timer and return frame information
   */
  update(): FrameStats {
    const currentTime = performance.now() / 1000;
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp delta time to prevent spiral of death
    if (deltaTime > this.config.maxFrameTime) {
      deltaTime = this.config.maxFrameTime;
    }

    // Apply time scale
    deltaTime *= this.timeScale;

    // Update frame stats
    this.frameStats.frameCount++;
    this.frameStats.deltaTime = deltaTime;
    this.frameStats.frameTime = deltaTime;
    this.frameStats.realTime = currentTime;

    if (!this.paused) {
      this.frameStats.gameTime += deltaTime;
      this.accumulator += deltaTime;
    }

    // Calculate FPS
    this.fpsTimer += deltaTime;
    this.frameCounter++;

    if (this.fpsTimer >= 1.0) {
      this.frameStats.fps = this.frameCounter / this.fpsTimer;
      this.frameCounter = 0;
      this.fpsTimer = 0;
    }

    return { ...this.frameStats };
  }

  /**
   * Check if fixed update should run
   */
  shouldFixedUpdate(): boolean {
    return this.accumulator >= this.config.fixedTimeStep;
  }

  /**
   * Consume fixed time step
   */
  consumeFixedUpdate(): void {
    this.accumulator -= this.config.fixedTimeStep;
  }

  /**
   * Get interpolation alpha for smooth rendering
   */
  getInterpolationAlpha(): number {
    return this.accumulator / this.config.fixedTimeStep;
  }

  /**
   * Pause/unpause timer
   */
  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  /**
   * Set time scale (for slow motion, fast forward, etc.)
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  /**
   * Reset timer
   */
  reset(): void {
    this.frameStats.frameCount = 0;
    this.frameStats.gameTime = 0;
    this.accumulator = 0;
    this.lastTime = performance.now() / 1000;
  }

  /**
   * Get current frame stats
   */
  getFrameStats(): FrameStats {
    return { ...this.frameStats };
  }

  /**
   * Get timer configuration
   */
  getConfig(): TimerConfig {
    return { ...this.config };
  }

  /**
   * Update timer configuration
   */
  updateConfig(config: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...config };
    this.frameStats.fixedDelta = this.config.fixedTimeStep;
  }
}

// Global timer instance
export const gameTimer = new GameTimer();
