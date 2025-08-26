/**
 * System Manager
 * Unified conversion of system-related C files
 */
export class SF3SystemManager {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastFrameTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "frameCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "running", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "gameLoop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                if (!this.running)
                    return;
                const currentTime = performance.now();
                const deltaTime = currentTime - this.lastFrameTime;
                this.updateMetrics(deltaTime);
                this.update(deltaTime);
                this.render();
                this.lastFrameTime = currentTime;
                if (this.config.vsync) {
                    requestAnimationFrame(this.gameLoop);
                }
                else {
                    setTimeout(this.gameLoop, 1000 / this.config.targetFPS);
                }
            }
        });
        this.config = {
            targetFPS: 60,
            vsync: true,
            audioEnabled: true,
            debugMode: false,
            ...config
        };
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            drawCalls: 0
        };
    }
    start() {
        this.running = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }
    stop() {
        this.running = false;
    }
    updateMetrics(deltaTime) {
        this.frameCount++;
        this.metrics.frameTime = deltaTime;
        if (this.frameCount % 60 === 0) {
            this.metrics.fps = Math.round(1000 / deltaTime);
            this.metrics.memoryUsage = this.getMemoryUsage();
        }
    }
    getMemoryUsage() {
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
    }
    update(deltaTime) {
        // Update all game systems
        // This would call update methods on various subsystems
    }
    render() {
        // Render frame
        this.metrics.drawCalls = 0; // Reset for new frame
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        Object.assign(this.config, updates);
    }
}
//# sourceMappingURL=SystemManager.js.map