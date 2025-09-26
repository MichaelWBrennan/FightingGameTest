import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import { ProceduralStageGenerator, ProcStageOptions } from './ProceduralStageGenerator';

export interface StageAsset {
  id: string;
  type: string;
  data: any;
  loaded: boolean;
  entity?: pc.Entity;
  texture?: pc.Texture;
  material?: pc.Material;
  mesh?: pc.Mesh;
}

export interface StageCache {
  [key: string]: StageAsset;
}

export class RealTimeStageManager {
  private app: pc.Application;
  private stageGenerator: ProceduralStageGenerator;
  private assetCache: StageCache = {};
  private currentStage: any = null;
  private stageEntities: pc.Entity[] = [];
  private particleSystems: pc.ParticleSystem[] = [];

  constructor(app: pc.Application) {
    this.app = app;
    this.stageGenerator = new ProceduralStageGenerator();
    this.initializeAssetPools();
  }

  public async generateStage(options: ProcStageOptions = {}): Promise<any> {
    try {
      Logger.info('Generating real-time stage with options:', options);
      
      // Generate stage data
      const stageData = this.stageGenerator.generate(options);
      
      // Clear previous stage
      this.clearCurrentStage();
      
      // Create stage entities
      await this.createStageEntities(stageData);
      
      // Set current stage
      this.currentStage = stageData;
      
      Logger.info('Stage generated successfully:', stageData.name);
      return stageData;
      
    } catch (error) {
      Logger.error('Error generating stage:', error);
      throw error;
    }
  }

  private async createStageEntities(stageData: any): Promise<void> {
    // Create skybox
    if (stageData.layers.skybox) {
      await this.createSkybox(stageData.layers.skybox);
    }

    // Create background layers
    if (stageData.layers.farBackground) {
      await this.createBackgroundLayer(stageData.layers.farBackground, 'far');
    }
    if (stageData.layers.midBackground) {
      await this.createBackgroundLayer(stageData.layers.midBackground, 'mid');
    }
    if (stageData.layers.nearBackground) {
      await this.createBackgroundLayer(stageData.layers.nearBackground, 'near');
    }

    // Create playground
    if (stageData.layers.playground) {
      await this.createPlayground(stageData.layers.playground);
    }

    // Create lighting
    if (stageData.lighting) {
      await this.createLighting(stageData.lighting);
    }

    // Create particles
    if (stageData.particles) {
      await this.createParticles(stageData.particles);
    }

    // Create hazards
    if (stageData.hazards) {
      await this.createHazards(stageData.hazards);
    }

    // Create interactive elements
    if (stageData.interactiveElements) {
      await this.createInteractiveElements(stageData.interactiveElements);
    }

    // Create weather effects
    if (stageData.weather) {
      await this.createWeatherEffects(stageData.weather);
    }

    // Create decorations
    if (stageData.details && stageData.details.decoration) {
      await this.createDecorations(stageData.details.decoration);
    }
  }

  private async createSkybox(skyboxData: any): Promise<void> {
    const skyboxEntity = new pc.Entity('DarkSkybox');
    
    // Create dark skybox material
    const skyboxMaterial = new pc.StandardMaterial();
    skyboxMaterial.diffuse = new pc.Color(0.2, 0.2, 0.2); // Dark atmospheric sky
    skyboxMaterial.emissive = new pc.Color(0.1, 0.1, 0.1);
    skyboxMaterial.update();
    
    // Create skybox mesh
    const skyboxMesh = pc.createBox(this.app.graphicsDevice, {
      width: 200,
      height: 100,
      depth: 200
    });
    
    const skyboxMeshInstance = new pc.MeshInstance(skyboxMesh, skyboxMaterial);
    skyboxEntity.addComponent('model', {
      meshInstances: [skyboxMeshInstance]
    });
    
    skyboxEntity.setPosition(0, 0, 0);
    this.app.root.addChild(skyboxEntity);
    this.stageEntities.push(skyboxEntity);
  }

  private async createBackgroundLayer(layerData: any, layerType: string): Promise<void> {
    if (!layerData.elements) return;

    for (const element of layerData.elements) {
      const entity = await this.createElementEntity(element, layerType);
      if (entity) {
        this.stageEntities.push(entity);
      }
    }
  }

  private async createElementEntity(element: any, layerType: string): Promise<pc.Entity | null> {
    const entity = new pc.Entity(`${element.type}_${layerType}`);
    
    try {
      switch (element.type) {
        case 'mountain':
        case 'floating_island':
        case 'building':
        case 'tower':
        case 'cathedral':
          return await this.createStructureEntity(entity, element);
        
        case 'tree':
        case 'magical_object':
        case 'divine_statue':
        case 'wildlife':
          return await this.createObjectEntity(entity, element);
        
        case 'celestial_cloud':
        case 'crystal_formation':
        case 'void_structure':
          return await this.createEffectEntity(entity, element);
        
        default:
          return await this.createGenericEntity(entity, element);
      }
    } catch (error) {
      Logger.error(`Error creating element entity ${element.type}:`, error);
      return null;
    }
  }

  private async createStructureEntity(entity: pc.Entity, element: any): Promise<pc.Entity> {
    // Create structure mesh
    const mesh = pc.createBox(this.app.graphicsDevice, {
      width: element.width || 20,
      height: element.height || 40,
      depth: element.depth || 20
    });
    
    // Create material
    const material = new pc.StandardMaterial();
    material.diffuse = this.hexToColor(element.color || '#666666');
    material.update();
    
    // Add model component
    const meshInstance = new pc.MeshInstance(mesh, material);
    entity.addComponent('model', {
      meshInstances: [meshInstance]
    });
    
    // Set position
    entity.setPosition(element.x || 0, element.y || 0, this.getLayerDepth('structure'));
    
    // Add to scene
    this.app.root.addChild(entity);
    
    return entity;
  }

  private async createObjectEntity(entity: pc.Entity, element: any): Promise<pc.Entity> {
    // Create object mesh (simplified as sphere for now)
    const mesh = pc.createSphere(this.app.graphicsDevice, {
      radius: (element.scale || 1) * 5
    });
    
    // Create material
    const material = new pc.StandardMaterial();
    material.diffuse = this.hexToColor(element.color || '#888888');
    material.update();
    
    // Add model component
    const meshInstance = new pc.MeshInstance(mesh, material);
    entity.addComponent('model', {
      meshInstances: [meshInstance]
    });
    
    // Set position
    entity.setPosition(element.x || 0, element.y || 0, this.getLayerDepth('object'));
    
    // Add to scene
    this.app.root.addChild(entity);
    
    return entity;
  }

  private async createEffectEntity(entity: pc.Entity, element: any): Promise<pc.Entity> {
    // Create effect mesh
    const mesh = pc.createPlane(this.app.graphicsDevice, {
      width: element.width || 20,
      height: element.height || 20
    });
    
    // Create material
    const material = new pc.StandardMaterial();
    material.diffuse = this.hexToColor(element.color || '#FFFFFF');
    material.emissive = this.hexToColor(element.color || '#FFFFFF');
    material.opacity = element.opacity || 0.8;
    material.blendType = pc.BLEND_ADDITIVE;
    material.update();
    
    // Add model component
    const meshInstance = new pc.MeshInstance(mesh, material);
    entity.addComponent('model', {
      meshInstances: [meshInstance]
    });
    
    // Set position
    entity.setPosition(element.x || 0, element.y || 0, this.getLayerDepth('effect'));
    
    // Add to scene
    this.app.root.addChild(entity);
    
    return entity;
  }

  private async createGenericEntity(entity: pc.Entity, element: any): Promise<pc.Entity> {
    // Create generic mesh
    const mesh = pc.createBox(this.app.graphicsDevice, {
      width: element.width || 10,
      height: element.height || 10,
      depth: element.depth || 10
    });
    
    // Create material
    const material = new pc.StandardMaterial();
    material.diffuse = this.hexToColor(element.color || '#999999');
    material.update();
    
    // Add model component
    const meshInstance = new pc.MeshInstance(mesh, material);
    entity.addComponent('model', {
      meshInstances: [meshInstance]
    });
    
    // Set position
    entity.setPosition(element.x || 0, element.y || 0, this.getLayerDepth('generic'));
    
    // Add to scene
    this.app.root.addChild(entity);
    
    return entity;
  }

  private async createPlayground(playgroundData: any): Promise<void> {
    if (!playgroundData.elements) return;

    for (const element of playgroundData.elements) {
      const entity = new pc.Entity(`playground_${element.type}`);
      
      // Create platform mesh
      const mesh = pc.createBox(this.app.graphicsDevice, {
        width: element.width || 50,
        height: element.height || 3,
        depth: element.depth || 20
      });
      
      // Create material
      const material = new pc.StandardMaterial();
      material.diffuse = this.hexToColor(element.color || '#444444');
      material.update();
      
      // Add model component
      const meshInstance = new pc.MeshInstance(mesh, material);
      entity.addComponent('model', {
        meshInstances: [meshInstance]
      });
      
      // Set position
      entity.setPosition(element.x || 0, element.y || 0, 0);
      
      // Add to scene
      this.app.root.addChild(entity);
      this.stageEntities.push(entity);
    }
  }

  private async createLighting(lightingData: any): Promise<void> {
    const lightEntity = new pc.Entity('DarkLight');
    
    // Create dark directional light
    lightEntity.addComponent('light', {
      type: 'directional',
      color: this.hexToColor(lightingData.color || '#8B0000'),
      intensity: lightingData.intensity || 0.5,
      castShadows: lightingData.shadows || true
    });
    
    // Set dramatic light direction
    lightEntity.setEulerAngles(60, 45, 0);
    
    // Add to scene
    this.app.root.addChild(lightEntity);
    this.stageEntities.push(lightEntity);
    
    // Add ambient light for dark atmosphere
    const ambientEntity = new pc.Entity('DarkAmbient');
    ambientEntity.addComponent('light', {
      type: 'ambient',
      color: this.hexToColor(lightingData.ambient || '#2F2F2F'),
      intensity: 0.3
    });
    
    this.app.root.addChild(ambientEntity);
    this.stageEntities.push(ambientEntity);
  }

  private async createParticles(particlesData: any): Promise<void> {
    for (const [particleType, particles] of Object.entries(particlesData)) {
      if (Array.isArray(particles)) {
        await this.createParticleSystem(particleType, particles);
      }
    }
  }

  private async createParticleSystem(particleType: string, particles: any[]): Promise<void> {
    const particleEntity = new pc.Entity(`ParticleSystem_${particleType}`);
    
    // Create particle system
    particleEntity.addComponent('particlesystem', {
      numParticles: particles.length,
      lifetime: 5.0,
      rate: 10.0,
      startAngle: 0,
      endAngle: 360,
      startSize: 0.1,
      endSize: 0.05,
      startColor: this.hexToColor('#FFFFFF'),
      endColor: this.hexToColor('#000000'),
      startOpacity: 1.0,
      endOpacity: 0.0
    });
    
    // Set position
    particleEntity.setPosition(0, 0, 0);
    
    // Add to scene
    this.app.root.addChild(particleEntity);
    this.stageEntities.push(particleEntity);
    this.particleSystems.push(particleEntity.getComponent('particlesystem'));
  }

  private async createHazards(hazards: any[]): Promise<void> {
    for (const hazard of hazards) {
      const entity = new pc.Entity(`hazard_${hazard.type}`);
      
      // Create hazard mesh
      const mesh = pc.createBox(this.app.graphicsDevice, {
        width: 2,
        height: 2,
        depth: 2
      });
      
      // Create material
      const material = new pc.StandardMaterial();
      material.diffuse = new pc.Color(1, 0, 0); // Red for hazards
      material.emissive = new pc.Color(0.5, 0, 0);
      material.update();
      
      // Add model component
      const meshInstance = new pc.MeshInstance(mesh, material);
      entity.addComponent('model', {
        meshInstances: [meshInstance]
      });
      
      // Set position
      entity.setPosition(hazard.x || 0, hazard.y || 0, 0);
      
      // Add to scene
      this.app.root.addChild(entity);
      this.stageEntities.push(entity);
    }
  }

  private async createInteractiveElements(elements: any[]): Promise<void> {
    for (const element of elements) {
      const entity = new pc.Entity(`interactive_${element.type}`);
      
      // Create interactive element mesh
      const mesh = pc.createSphere(this.app.graphicsDevice, {
        radius: 1
      });
      
      // Create material
      const material = new pc.StandardMaterial();
      material.diffuse = new pc.Color(0, 1, 0); // Green for interactive
      material.emissive = new pc.Color(0, 0.5, 0);
      material.update();
      
      // Add model component
      const meshInstance = new pc.MeshInstance(mesh, material);
      entity.addComponent('model', {
        meshInstances: [meshInstance]
      });
      
      // Set position
      entity.setPosition(element.x || 0, element.y || 0, 0);
      
      // Add to scene
      this.app.root.addChild(entity);
      this.stageEntities.push(entity);
    }
  }

  private async createWeatherEffects(weatherData: any): Promise<void> {
    if (weatherData.particles) {
      await this.createParticleSystem('weather', weatherData.particles);
    }
  }

  private async createDecorations(decorations: any[]): Promise<void> {
    for (const decoration of decorations) {
      const entity = new pc.Entity(`decoration_${decoration.type}`);
      
      // Create decoration mesh
      const mesh = pc.createBox(this.app.graphicsDevice, {
        width: 0.5,
        height: 0.5,
        depth: 0.5
      });
      
      // Create material
      const material = new pc.StandardMaterial();
      material.diffuse = new pc.Color(0.8, 0.8, 0.8);
      material.update();
      
      // Add model component
      const meshInstance = new pc.MeshInstance(mesh, material);
      entity.addComponent('model', {
        meshInstances: [meshInstance]
      });
      
      // Set position
      entity.setPosition(decoration.x || 0, decoration.y || 0, this.getLayerDepth('decoration'));
      
      // Add to scene
      this.app.root.addChild(entity);
      this.stageEntities.push(entity);
    }
  }

  private getLayerDepth(layerType: string): number {
    const depths: Record<string, number> = {
      skybox: 100,
      far: 80,
      mid: 60,
      near: 40,
      structure: 30,
      object: 20,
      effect: 15,
      decoration: 10,
      generic: 5,
      playground: 0
    };
    return depths[layerType] || 0;
  }

  private hexToColor(hex: string): pc.Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return new pc.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      );
    }
    return new pc.Color(1, 1, 1);
  }

  private clearCurrentStage(): void {
    // Remove all stage entities
    for (const entity of this.stageEntities) {
      if (entity && entity.parent) {
        entity.parent.removeChild(entity);
        entity.destroy();
      }
    }
    
    // Clear arrays
    this.stageEntities = [];
    this.particleSystems = [];
    
    // Clear current stage
    this.currentStage = null;
  }

  private initializeAssetPools(): void {
    // Pre-create common materials
    this.createCommonMaterials();
    
    // Pre-create common meshes
    this.createCommonMeshes();
  }

  private createCommonMaterials(): void {
    // Create common materials for different themes
    const themes = ['arcane', 'divine', 'elemental', 'shadow', 'nature', 'crystal', 'void', 'celestial', 'infernal', 'primal'];
    
    for (const theme of themes) {
      const material = new pc.StandardMaterial();
      material.diffuse = this.getThemeColor(theme);
      material.update();
      
      this.assetCache[`material_${theme}`] = {
        id: `material_${theme}`,
        type: 'material',
        data: material,
        loaded: true,
        material: material
      };
    }
  }

  private createCommonMeshes(): void {
    // Create common meshes
    const meshes = {
      box: pc.createBox(this.app.graphicsDevice, { width: 1, height: 1, depth: 1 }),
      sphere: pc.createSphere(this.app.graphicsDevice, { radius: 1 }),
      plane: pc.createPlane(this.app.graphicsDevice, { width: 1, height: 1 }),
      cylinder: pc.createCylinder(this.app.graphicsDevice, { radius: 1, height: 1 })
    };
    
    for (const [name, mesh] of Object.entries(meshes)) {
      this.assetCache[`mesh_${name}`] = {
        id: `mesh_${name}`,
        type: 'mesh',
        data: mesh,
        loaded: true,
        mesh: mesh
      };
    }
  }

  private getThemeColor(theme: string): pc.Color {
    const colors: Record<string, pc.Color> = {
      arcane: new pc.Color(0.54, 0.0, 0.55), // Purple
      divine: new pc.Color(1.0, 0.84, 0.0), // Gold
      elemental: new pc.Color(0.0, 0.75, 1.0), // Blue
      shadow: new pc.Color(0.29, 0.0, 0.51), // Dark Purple
      nature: new pc.Color(0.2, 0.8, 0.2), // Green
      crystal: new pc.Color(1.0, 0.41, 0.71), // Pink
      void: new pc.Color(0.0, 0.0, 0.0), // Black
      celestial: new pc.Color(0.53, 0.81, 0.92), // Light Blue
      infernal: new pc.Color(1.0, 0.27, 0.0), // Red
      primal: new pc.Color(0.55, 0.27, 0.07) // Brown
    };
    return colors[theme] || new pc.Color(0.5, 0.5, 0.5);
  }

  public getCurrentStage(): any {
    return this.currentStage;
  }

  public getStageEntities(): pc.Entity[] {
    return this.stageEntities;
  }

  public getParticleSystems(): pc.ParticleSystem[] {
    return this.particleSystems;
  }

  public updateStage(deltaTime: number): void {
    // Update particle systems
    for (const particleSystem of this.particleSystems) {
      if (particleSystem && particleSystem.enabled) {
        particleSystem.update(deltaTime);
      }
    }
    
    // Update stage entities
    for (const entity of this.stageEntities) {
      if (entity && entity.enabled) {
        // Add any stage-specific updates here
        this.updateStageEntity(entity, deltaTime);
      }
    }
  }

  private updateStageEntity(entity: pc.Entity, deltaTime: number): void {
    // Add entity-specific updates based on type
    const entityName = entity.name.toLowerCase();
    
    if (entityName.includes('particle')) {
      // Update particle systems
      const particleSystem = entity.getComponent('particlesystem');
      if (particleSystem) {
        particleSystem.update(deltaTime);
      }
    }
    
    if (entityName.includes('effect')) {
      // Update effect entities
      this.updateEffectEntity(entity, deltaTime);
    }
  }

  private updateEffectEntity(entity: pc.Entity, deltaTime: number): void {
    // Add effect-specific updates
    // For example, rotating effects, pulsing lights, etc.
  }

  public destroy(): void {
    this.clearCurrentStage();
    this.assetCache = {};
  }
}