/**
 * Game Timer System - High precision timing for fighting game mechanics
 */
export class GameTimer {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frameStats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "accumulator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "frameCounter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "fpsTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "paused", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "timeScale", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1.0
        });
        this.config = {
            targetFPS: 60,
            fixedTimeStep: 1 / 60,
            maxFrameTime: 1 / 30,
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
    update() {
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
    shouldFixedUpdate() {
        return this.accumulator >= this.config.fixedTimeStep;
    }
    /**
     * Consume fixed time step
     */
    consumeFixedUpdate() {
        this.accumulator -= this.config.fixedTimeStep;
    }
    /**
     * Get interpolation alpha for smooth rendering
     */
    getInterpolationAlpha() {
        return this.accumulator / this.config.fixedTimeStep;
    }
    /**
     * Pause/unpause timer
     */
    setPaused(paused) {
        this.paused = paused;
    }
    /**
     * Set time scale (for slow motion, fast forward, etc.)
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }
    /**
     * Reset timer
     */
    reset() {
        this.frameStats.frameCount = 0;
        this.frameStats.gameTime = 0;
        this.accumulator = 0;
        this.lastTime = performance.now() / 1000;
    }
    /**
     * Get current frame stats
     */
    getFrameStats() {
        return { ...this.frameStats };
    }
    /**
     * Get timer configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update timer configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.frameStats.fixedDelta = this.config.fixedTimeStep;
    }
}
// Global timer instance
export const gameTimer = new GameTimer();
//# sourceMappingURL=GameTimer.js.map