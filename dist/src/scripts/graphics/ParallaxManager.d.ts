/**
 * ParallaxManager - HD-2D Multi-layer Parallax Background System
 * Creates depth and immersion through layered parallax scrolling
 * Features: Multiple depth layers, speed variation, dynamic backgrounds
 */
import * as pc from 'playcanvas';
import { ISystem } from '../../../types/core';
declare class ParallaxManager implements ISystem {
    private app;
    private initialized;
    private layerConfig;
    private parallaxLayers;
    private layerEntities;
    private cameraPosition;
    private lastCameraPosition;
    private cameraVelocity;
    private dynamicElements;
    private animatedElements;
    private currentStage;
    private stageData;
    private performance;
    private effects;
    private parallaxContainer;
    private mainCamera;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private setupDefaultStages;
    private createParallaxLayers;
    private setupCameraTracking;
    loadStage(stageId: string): Promise<void>;
    private loadStageLayer;
    private createElement;
    private createMountainElement;
    private createBuildingElement;
    private addBuildingWindows;
    private createTreeElement;
    private createPlatformElement;
    private createLampElement;
    private createSpectatorGroup;
    private createGenericElement;
    private createSolidMaterial;
    private createEmissiveMaterial;
    private createElementAnimation;
    private setupUpdateLoop;
    update(dt: number): void;
    private updateCameraTracking;
    private updateParallaxLayers;
    private updateAnimatedElements;
    private updateSwayAnimation;
    private updatePulseAnimation;
    private applyStageLighting;
    private applyStageAtmosphere;
    private clearAllLayers;
    setParallaxSpeed(layerName: string, speed: number): void;
    setWeatherEffect(weather: string): void;
    setTimeOfDay(time: number): void;
    addDynamicElement(layerName: string, elementData: any): pc.Entity | null;
    removeDynamicElement(element: pc.Entity): void;
    getParallaxStats(): any;
    destroy(): void;
}
export default ParallaxManager;
//# sourceMappingURL=ParallaxManager.d.ts.map