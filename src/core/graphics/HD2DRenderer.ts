/**
 * HD-2D Renderer - Octopath Traveler Style Fighting Game Rendering
 * Combines 2D sprites with 3D depth and lighting for stunning visual effects
 * Features: Multi-layer depth, dynamic lighting, pixel-perfect rendering, atmospheric effects
 */

import * as pc from 'playcanvas';
import { HD2DDepthManager } from './HD2DDepthManager';
import { HD2DLightingSystem } from './HD2DLightingSystem';
import { HD2DShaderManager } from './HD2DShaderManager';
import { HD2DPostProcessor } from './HD2DPostProcessor';
import { HD2DCharacterRenderer } from './HD2DCharacterRenderer';
import { HD2DStageRenderer } from './HD2DStageRenderer';

export interface HD2DConfig {
  // Rendering Quality
  pixelPerfect: boolean;
  pixelScale: number;
  antiAliasing: boolean;
  superSampling: number;
  
  // Depth Layers
  depthLayers: number;
  depthRange: number;
  parallaxStrength: number;
  
  // Lighting
  dynamicLighting: boolean;
  shadowQuality: 'low' | 'medium' | 'high' | 'ultra';
  ambientOcclusion: boolean;
  globalIllumination: boolean;
  
  // Effects
  atmosphericPerspective: boolean;
  depthOfField: boolean;
  bloom: boolean;
  colorGrading: boolean;
  
  // Performance
  maxDrawCalls: number;
  cullingDistance: number;
  lodBias: number;
}

export interface HD2DLayer {
  id: string;
  depth: number;
  parallaxSpeed: number;
  opacity: number;
  blendMode: string;
  entities: pc.Entity[];
  lighting: boolean;
  shadows: boolean;
}

export class HD2DRenderer {
  private app: pc.Application;
  private config: HD2DConfig;
  private initialized: boolean = false;
  
  // Core Systems
  private depthManager: HD2DDepthManager;
  private lightingSystem: HD2DLightingSystem;
  private shaderManager: HD2DShaderManager;
  private postProcessor: HD2DPostProcessor;
  private characterRenderer: HD2DCharacterRenderer;
  private stageRenderer: HD2DStageRenderer;
  
  // Rendering State
  private layers: Map<string, HD2DLayer> = new Map();
  private renderQueue: pc.Entity[] = [];
  private camera: pc.Entity | null = null;
  private mainLight: pc.Entity | null = null;
  
  // Performance Tracking
  private frameTime: number = 0;
  private drawCalls: number = 0;
  private triangles: number = 0;
  
  constructor(app: pc.Application, config?: Partial<HD2DConfig>) {
    this.app = app;
    this.config = this.createDefaultConfig(config);
    this.initializeSystems();
  }
  
  private createDefaultConfig(overrides?: Partial<HD2DConfig>): HD2DConfig {
    return {
      pixelPerfect: true,
      pixelScale: 1.0,
      antiAliasing: true,
      superSampling: 1.0,
      depthLayers: 8,
      depthRange: 100.0,
      parallaxStrength: 1.0,
      dynamicLighting: true,
      shadowQuality: 'high',
      ambientOcclusion: true,
      globalIllumination: true,
      atmosphericPerspective: true,
      depthOfField: true,
      bloom: true,
      colorGrading: true,
      maxDrawCalls: 1000,
      cullingDistance: 200.0,
      lodBias: 0.0,
      ...overrides
    };
  }
  
  private initializeSystems(): void {
    // Initialize core HD-2D systems
    this.depthManager = new HD2DDepthManager(this.app, this.config);
    this.lightingSystem = new HD2DLightingSystem(this.app, this.config);
    this.shaderManager = new HD2DShaderManager(this.app, this.config);
    this.postProcessor = new HD2DPostProcessor(this.app, this.config);
    this.characterRenderer = new HD2DCharacterRenderer(this.app, this.config);
    this.stageRenderer = new HD2DStageRenderer(this.app, this.config);
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Renderer...');
    
    try {
      // Initialize all subsystems
      await this.depthManager.initialize();
      await this.lightingSystem.initialize();
      await this.shaderManager.initialize();
      await this.postProcessor.initialize();
      await this.characterRenderer.initialize();
      await this.stageRenderer.initialize();
      
      // Setup camera and lighting
      this.setupCamera();
      this.setupLighting();
      
      // Create default depth layers
      this.createDefaultLayers();
      
      // Setup update loop
      this.app.on('update', this.update.bind(this));
      
      this.initialized = true;
      console.log('HD-2D Renderer initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Renderer:', error);
      throw error;
    }
  }
  
  private setupCamera(): void {
    this.camera = this.app.root.findByName('MainCamera');
    if (!this.camera) {
      // Create HD-2D optimized camera
      this.camera = new pc.Entity('HD2DCamera');
      this.camera.addComponent('camera', {
        clearColor: new pc.Color(0.1, 0.1, 0.1, 1.0),
        projection: pc.PROJECTION_ORTHOGRAPHIC,
        orthoHeight: 10.0,
        nearClip: 0.1,
        farClip: 1000.0
      });
      this.app.root.addChild(this.camera);
    }
    
    // Configure camera for HD-2D
    if (this.config.pixelPerfect) {
      this.setupPixelPerfectCamera();
    }
  }
  
  private setupPixelPerfectCamera(): void {
    if (!this.camera) return;
    
    const camera = this.camera.camera;
    const device = this.app.graphicsDevice;
    
    // Calculate pixel-perfect orthographic height
    const screenHeight = device.height;
    const pixelScale = this.config.pixelScale;
    const targetHeight = screenHeight / pixelScale;
    
    camera.orthoHeight = targetHeight;
    
    // Ensure pixel-perfect positioning
    const worldToScreen = 1.0 / (targetHeight / 2.0);
    const pixelSize = 1.0 / (screenHeight / 2.0);
    
    // Round camera position to pixel boundaries
    const cameraPos = this.camera.getPosition();
    const roundedX = Math.round(cameraPos.x * worldToScreen) / worldToScreen;
    const roundedY = Math.round(cameraPos.y * worldToScreen) / worldToScreen;
    
    this.camera.setPosition(roundedX, roundedY, cameraPos.z);
  }
  
  private setupLighting(): void {
    // Create main directional light for HD-2D
    this.mainLight = new pc.Entity('HD2DMainLight');
    this.mainLight.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1.0, 0.95, 0.9),
      intensity: 1.2,
      castShadows: this.config.shadowQuality !== 'low',
      shadowBias: 0.1,
      shadowNormalOffset: 0.1
    });
    
    // Position light for dramatic HD-2D lighting
    this.mainLight.setEulerAngles(45, 30, 0);
    this.app.root.addChild(this.mainLight);
    
    // Setup ambient light
    const ambientLight = new pc.Entity('HD2DAmbientLight');
    ambientLight.addComponent('light', {
      type: pc.LIGHTTYPE_AMBIENT,
      color: new pc.Color(0.3, 0.4, 0.5),
      intensity: 0.4
    });
    this.app.root.addChild(ambientLight);
  }
  
  private createDefaultLayers(): void {
    // Create depth layers for HD-2D rendering
    const layerConfigs = [
      { id: 'skybox', depth: -100, parallaxSpeed: 0.05, opacity: 0.8, blendMode: 'normal' },
      { id: 'far_background', depth: -50, parallaxSpeed: 0.1, opacity: 0.9, blendMode: 'normal' },
      { id: 'mid_background', depth: -25, parallaxSpeed: 0.3, opacity: 0.95, blendMode: 'normal' },
      { id: 'near_background', depth: -15, parallaxSpeed: 0.5, opacity: 1.0, blendMode: 'normal' },
      { id: 'stage_floor', depth: -8, parallaxSpeed: 0.7, opacity: 1.0, blendMode: 'normal' },
      { id: 'characters', depth: 0, parallaxSpeed: 1.0, opacity: 1.0, blendMode: 'normal' },
      { id: 'stage_foreground', depth: 5, parallaxSpeed: 1.1, opacity: 1.0, blendMode: 'normal' },
      { id: 'effects', depth: 10, parallaxSpeed: 1.2, opacity: 1.0, blendMode: 'additive' }
    ];
    
    layerConfigs.forEach(layerConfig => {
      this.createLayer(layerConfig);
    });
  }
  
  public createLayer(config: {
    id: string;
    depth: number;
    parallaxSpeed: number;
    opacity: number;
    blendMode: string;
    lighting?: boolean;
    shadows?: boolean;
  }): HD2DLayer {
    const layer: HD2DLayer = {
      id: config.id,
      depth: config.depth,
      parallaxSpeed: config.parallaxSpeed,
      opacity: config.opacity,
      blendMode: config.blendMode,
      entities: [],
      lighting: config.lighting ?? true,
      shadows: config.shadows ?? true
    };
    
    this.layers.set(config.id, layer);
    return layer;
  }
  
  public addEntityToLayer(layerId: string, entity: pc.Entity): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.warn(`Layer ${layerId} not found`);
      return false;
    }
    
    // Set entity depth based on layer
    const position = entity.getPosition();
    entity.setPosition(position.x, position.y, layer.depth);
    
    // Apply HD-2D material if entity has render component
    if (entity.render) {
      this.applyHD2DMaterial(entity, layer);
    }
    
    layer.entities.push(entity);
    return true;
  }
  
  private applyHD2DMaterial(entity: pc.Entity, layer: HD2DLayer): void {
    if (!entity.render) return;
    
    // Get appropriate HD-2D material based on layer and entity type
    const material = this.shaderManager.getHD2DMaterial(entity, layer);
    if (material) {
      entity.render.material = material;
    }
  }
  
  public renderCharacter(character: pc.Entity, layerId: string = 'characters'): void {
    this.characterRenderer.renderCharacter(character, layerId);
    this.addEntityToLayer(layerId, character);
  }
  
  public renderStage(stageData: any): void {
    this.stageRenderer.renderStage(stageData);
  }
  
  public update(deltaTime: number): void {
    if (!this.initialized) return;
    
    this.frameTime = deltaTime;
    
    // Update all subsystems
    this.depthManager.update(deltaTime);
    this.lightingSystem.update(deltaTime);
    this.shaderManager.update(deltaTime);
    this.postProcessor.update(deltaTime);
    this.characterRenderer.update(deltaTime);
    this.stageRenderer.update(deltaTime);
    
    // Update camera for pixel-perfect rendering
    if (this.config.pixelPerfect) {
      this.updatePixelPerfectCamera();
    }
    
    // Update parallax layers
    this.updateParallaxLayers(deltaTime);
    
    // Update performance stats
    this.updatePerformanceStats();
  }
  
  private updatePixelPerfectCamera(): void {
    if (!this.camera) return;
    
    const device = this.app.graphicsDevice;
    const screenHeight = device.height;
    const pixelScale = this.config.pixelScale;
    const targetHeight = screenHeight / pixelScale;
    
    const camera = this.camera.camera;
    camera.orthoHeight = targetHeight;
    
    // Round camera position to pixel boundaries
    const cameraPos = this.camera.getPosition();
    const worldToScreen = 1.0 / (targetHeight / 2.0);
    const roundedX = Math.round(cameraPos.x * worldToScreen) / worldToScreen;
    const roundedY = Math.round(cameraPos.y * worldToScreen) / worldToScreen;
    
    this.camera.setPosition(roundedX, roundedY, cameraPos.z);
  }
  
  private updateParallaxLayers(deltaTime: number): void {
    if (!this.camera) return;
    
    const cameraPos = this.camera.getPosition();
    
    this.layers.forEach(layer => {
      // Calculate parallax offset
      const parallaxOffset = cameraPos.x * (layer.parallaxSpeed - 1.0) * this.config.parallaxStrength;
      
      // Update layer entities
      layer.entities.forEach(entity => {
        const position = entity.getPosition();
        entity.setPosition(position.x + parallaxOffset, position.y, layer.depth);
      });
    });
  }
  
  private updatePerformanceStats(): void {
    // Track rendering performance
    this.drawCalls = this.app.graphicsDevice.drawCalls;
    this.triangles = this.app.graphicsDevice.triangles;
  }
  
  // Public API
  public setPixelScale(scale: number): void {
    this.config.pixelScale = Math.max(0.5, Math.min(4.0, scale));
    if (this.config.pixelPerfect) {
      this.setupPixelPerfectCamera();
    }
  }
  
  public setDepthRange(range: number): void {
    this.config.depthRange = range;
    this.depthManager.setDepthRange(range);
  }
  
  public setLightingQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.config.shadowQuality = quality;
    this.lightingSystem.setShadowQuality(quality);
  }
  
  public enableEffect(effect: string, enabled: boolean): void {
    switch (effect) {
      case 'atmosphericPerspective':
        this.config.atmosphericPerspective = enabled;
        break;
      case 'depthOfField':
        this.config.depthOfField = enabled;
        this.postProcessor.setDepthOfField(enabled);
        break;
      case 'bloom':
        this.config.bloom = enabled;
        this.postProcessor.setBloom(enabled);
        break;
      case 'colorGrading':
        this.config.colorGrading = enabled;
        this.postProcessor.setColorGrading(enabled);
        break;
    }
  }
  
  public getPerformanceStats(): any {
    return {
      frameTime: this.frameTime,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      layers: this.layers.size,
      entities: Array.from(this.layers.values()).reduce((sum, layer) => sum + layer.entities.length, 0)
    };
  }
  
  public getLayer(layerId: string): HD2DLayer | undefined {
    return this.layers.get(layerId);
  }
  
  public getAllLayers(): HD2DLayer[] {
    return Array.from(this.layers.values());
  }
  
  public destroy(): void {
    // Clean up all systems
    this.depthManager?.destroy();
    this.lightingSystem?.destroy();
    this.shaderManager?.destroy();
    this.postProcessor?.destroy();
    this.characterRenderer?.destroy();
    this.stageRenderer?.destroy();
    
    // Clear layers
    this.layers.clear();
    this.renderQueue = [];
    
    this.initialized = false;
    console.log('HD-2D Renderer destroyed');
  }
}