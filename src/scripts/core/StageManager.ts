import HD2DRenderer from '../graphics/HD2DRenderer.js';

// Define a type for the stage data, based on the JSON structure
type StageLayer = {
    name: string;
    depth: number;
    parallaxMultiplier: number;
    texturePath: string;
    position: [number, number];
    scale: [number, number];
    tint?: [number, number, number, number];
    shader?: string;
    animation?: any;
};

type StageData = {
    stageId: string;
    name: string;
    backgroundLayers: StageLayer[];
    foregroundLayers: StageLayer[];
    // Add other properties from the JSON as needed
};

class StageManager {
    private app: pc.Application;
    private hd2dRenderer: HD2DRenderer;
    private currentStage: pc.Entity | null = null;

    constructor(app: pc.Application, hd2dRenderer: HD2DRenderer) {
        this.app = app;
        this.hd2dRenderer = hd2dRenderer;
    }

    public async loadStage(stageData: StageData) {
        console.log(`Loading stage: ${stageData.name}`);

        if (this.currentStage) {
            this.currentStage.destroy();
        }

        this.currentStage = new pc.Entity(stageData.stageId);
        this.app.root.addChild(this.currentStage);

        // Process background layers
        for (const layerData of stageData.backgroundLayers) {
            const layerEntity = await this.createLayerEntity(layerData);
            this.currentStage.addChild(layerEntity);
            const renderLayerName = this.getRenderLayerName(layerData.depth, false);
            this.hd2dRenderer.addEntityToLayer(layerEntity, renderLayerName);
        }

        // Process foreground layers
        for (const layerData of stageData.foregroundLayers) {
            const layerEntity = await this.createLayerEntity(layerData);
            this.currentStage.addChild(layerEntity);
            const renderLayerName = this.getRenderLayerName(layerData.depth, true);
            this.hd2dRenderer.addEntityToLayer(layerEntity, renderLayerName);
        }

        console.log(`Stage ${stageData.name} loaded successfully.`);
    }

    private async createLayerEntity(layerData: StageLayer): Promise<pc.Entity> {
        const entity = new pc.Entity(layerData.name);

        // For now, we'll create a simple plane with a placeholder texture
        // In a real implementation, you would load the texture from layerData.texturePath
        const material = new pc.StandardMaterial();
        if (layerData.tint) {
            material.diffuse = new pc.Color(...layerData.tint);
        }
        material.update();

        entity.addComponent('render', {
            type: 'plane',
            material: material,
        });

        entity.setPosition(layerData.position[0], layerData.position[1], layerData.depth);
        entity.setLocalScale(layerData.scale[0], layerData.scale[1], 1);

        return entity;
    }

    private getRenderLayerName(depth: number, isForeground: boolean): string {
        if (isForeground) {
            return 'foreground';
        }

        // For background layers, map depth to a layer name
        if (depth <= -3.0) {
            return 'background';
        } else if (depth <= -1.0) {
            return 'midground';
        } else {
            return 'playground';
        }
    }

    public getCurrentStage(): pc.Entity | null {
        return this.currentStage;
    }

    public destroyStage() {
        if (this.currentStage) {
            this.currentStage.destroy();
            this.currentStage = null;
        }
    }
}

export default StageManager;
