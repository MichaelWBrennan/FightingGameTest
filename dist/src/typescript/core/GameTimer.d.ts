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
export declare class GameTimer {
    private config;
    private frameStats;
    private lastTime;
    private accumulator;
    private frameCounter;
    private fpsTimer;
    private paused;
    private timeScale;
    constructor(config?: Partial<TimerConfig>);
    /**
     * Update timer and return frame information
     */
    update(): FrameStats;
    /**
     * Check if fixed update should run
     */
    shouldFixedUpdate(): boolean;
    /**
     * Consume fixed time step
     */
    consumeFixedUpdate(): void;
    /**
     * Get interpolation alpha for smooth rendering
     */
    getInterpolationAlpha(): number;
    /**
     * Pause/unpause timer
     */
    setPaused(paused: boolean): void;
    /**
     * Set time scale (for slow motion, fast forward, etc.)
     */
    setTimeScale(scale: number): void;
    /**
     * Reset timer
     */
    reset(): void;
    /**
     * Get current frame stats
     */
    getFrameStats(): FrameStats;
    /**
     * Get timer configuration
     */
    getConfig(): TimerConfig;
    /**
     * Update timer configuration
     */
    updateConfig(config: Partial<TimerConfig>): void;
}
export declare const gameTimer: GameTimer;
//# sourceMappingURL=GameTimer.d.ts.map