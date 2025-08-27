/**
 * Street Fighter III Background System
 * Converted from bg_sub.c and related background files
 */
export interface BackgroundLayer {
    id: number;
    texture: string;
    scrollSpeed: number;
    depth: number;
    position: {
        x: number;
        y: number;
    };
    scale: {
        x: number;
        y: number;
    };
    alpha: number;
    visible: boolean;
}
export interface StageData {
    name: string;
    layers: BackgroundLayer[];
    bounds: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    music: string;
}
export interface SuziOffset {
    x: number;
    y: number;
}
export declare class SF3BackgroundSystem {
    private stages;
    private currentStage;
    private cameraPosition;
    private suziOffset;
    constructor();
    private initializeStages;
    setStage(stageName: string): boolean;
    getCurrentStage(): StageData | null;
    setCameraPosition(x: number, y: number): void;
    private updateLayerPositions;
    setSuziOffset(x: number, y: number): void;
    setBgFamily(familyIndex: number): void;
    getLayerAtDepth(depth: number): BackgroundLayer | null;
    setLayerVisibility(layerId: number, visible: boolean): void;
    update(): void;
    getVisibleLayers(): BackgroundLayer[];
    getStageBounds(): {
        left: number;
        right: number;
        top: number;
        bottom: number;
    } | null;
}
