class StageManager {
    constructor(app, stageLayerManager) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stageLayerManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "currentStageId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.app = app;
        this.stageLayerManager = stageLayerManager;
    }
    async loadStage(stageData) {
        console.log(`Loading stage: ${stageData.name}`);
        if (this.currentStageId) {
            this.destroyStage();
        }
        this.currentStageId = stageData.stageId;
        this.stageLayerManager.clearLayers();
        const allLayers = [...stageData.backgroundLayers, ...stageData.foregroundLayers];
        for (const layerData of allLayers) {
            this.stageLayerManager.addLayer(layerData);
        }
        console.log(`Stage ${stageData.name} loaded successfully.`);
    }
    getCurrentStageId() {
        return this.currentStageId;
    }
    destroyStage() {
        if (this.currentStageId) {
            this.stageLayerManager.clearLayers();
            this.currentStageId = null;
            console.log('Current stage cleared.');
        }
    }
}
export default StageManager;
//# sourceMappingURL=StageManager.js.map