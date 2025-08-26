/**
 * System Manager
 * Unified conversion of system-related C files
 */
export interface SystemConfig {
    targetFPS: number;
    vsync: boolean;
    audioEnabled: boolean;
    debugMode: boolean;
}
export interface SystemMetrics {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    drawCalls: number;
}
export declare class SF3SystemManager {
    private config;
    private metrics;
    private lastFrameTime;
    private frameCount;
    private running;
    constructor(config?: Partial<SystemConfig>);
    start(): void;
    stop(): void;
    private gameLoop;
    private updateMetrics;
    private getMemoryUsage;
    private update;
    private render;
    getMetrics(): SystemMetrics;
    getConfig(): SystemConfig;
    updateConfig(updates: Partial<SystemConfig>): void;
}
//# sourceMappingURL=SystemManager.d.ts.map