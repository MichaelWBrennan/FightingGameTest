import { ISystem } from '../../../types/core';
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
declare class StageManager implements ISystem {
    private app;
    private stageLayerManager;
    private currentStageId;
    constructor(app: pc.Application, stageLayerManager: StageLayerManager);
    loadStage(stageData: StageData): Promise<void>;
    getCurrentStageId(): string | null;
    destroyStage(): void;
}
export default StageManager;
