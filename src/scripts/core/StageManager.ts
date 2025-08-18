import { StageLayerManager } from '../components/graphics/StageLayerManager';
import { ISystem } from '../../../types/core';

// Define a type for the stage data, based on the JSON structure
export interface StageLayerData {
    name: string;
    depth: number;
    parallaxMultiplier: number;
    texturePath: string;
    position: [number, number];
    scale: [number, number];
    tint?: [number, number, number, number];
}

export interface StageData {
    stageId: string;
    name: string;
    backgroundLayers: StageLayerData[];
    foregroundLayers: StageLayerData[];
}

class StageManager implements ISystem {
    private app: pc.Application;
    private stageLayerManager: StageLayerManager;
    private currentStageId: string | null = null;

    constructor(app: pc.Application, stageLayerManager: StageLayerManager) {
        this.app = app;
        this.stageLayerManager = stageLayerManager;
    }

    public async loadStage(stageData: StageData): Promise<void> {
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

    public getCurrentStageId(): string | null {
        return this.currentStageId;
    }

    public destroyStage(): void {
        if (this.currentStageId) {
            this.stageLayerManager.clearLayers();
            this.currentStageId = null;
            console.log('Current stage cleared.');
        }
    }
}

export default StageManager;
