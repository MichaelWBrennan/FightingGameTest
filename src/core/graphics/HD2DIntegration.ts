/**
 * HD-2D Integration - Integrates all HD-2D systems with existing codebase
 * Provides a unified interface for cutting-edge HD-2D rendering
 */

import * as pc from 'playcanvas';
import { FightForgeGraphicsManager } from '../../scripts/graphics/FightForgeGraphicsManager';
import { CuttingEdgeHD2D } from './CuttingEdgeHD2D';
import { ModernRenderingPipeline } from './ModernRenderingPipeline';
import { HD2DEnhancements } from './HD2DEnhancements';
import { HD2DAssetProcessor } from './HD2DAssetProcessor';

export interface HD2DIntegrationConfig {
  // System Integration
  enableCuttingEdge: boolean;
  enableModernRendering: boolean;
  enableEnhancements: boolean;
  enableAssetProcessing: boolean;
  
  // Performance Settings
  targetFrameRate: number;
  adaptiveQuality: boolean;
  dynamicResolution: boolean;
  
  // Visual Quality
  pixelPerfect: boolean;
  pixelScale: number;
  hdr: boolean;
  wideColorGamut: boolean;
  
  // Advanced Features
  rayTracing: boolean;
  dlss: boolean;
  fsr: boolean;
  temporalUpsampling: boolean;
}

export interface HD2DSystemStatus {
  initialized: boolean;
  systems: {
    graphicsManager: boolean;
    cuttingEdge: boolean;
    modernRendering: boolean;
    enhancements: boolean;
    assetProcessor: boolean;
  };
  performance: {
    fps: number;
    frameTime: number;
    qualityLevel: string;
    gpuMemory: number;
  };
  capabilities: {
    dlss: boolean;
    fsr: boolean;
    rayTracing: boolean;
    meshShaders: boolean;
    hdr: boolean;
  };
}

export class HD2DIntegration {
  private app: pc.Application;
  private config: HD2DIntegrationConfig;
  private initialized: boolean = false;
  
  // Core systems
  private graphicsManager: FightForgeGraphicsManager;
  private cuttingEdgeHD2D: CuttingEdgeHD2D | null = null;
  private modernRendering: ModernRenderingPipeline | null = null;
  private enhancements: HD2DEnhancements | null = null;
  private assetProcessor: HD2DAssetProcessor | null = null;
  
  // Status tracking
  private status: HD2DSystemStatus;
  
  constructor(app: pc.Application, config?: Partial<HD2DIntegrationConfig>) {
    this.app = app;
    this.config = this.createDefaultConfig(config);
    this.status = this.createDefaultStatus();
    
    // Initialize graphics manager (existing system)
    this.graphicsManager = new FightForgeGraphicsManager(app);
  }
  
  private createDefaultConfig(overrides?: Partial<HD2DIntegrationConfig>): HD2DIntegrationConfig {
    return {
      enableCuttingEdge: true,
      enableModernRendering: true,
      enableEnhancements: true,
      enableAssetProcessing: true,
      targetFrameRate: 60,
      adaptiveQuality: true,
      dynamicResolution: true,
      pixelPerfect: true,
      pixelScale: 1.0,
      hdr: true,
      wideColorGamut: true,
      rayTracing: false, // Will be auto-detected
      dlss: false, // Will be auto-detected
      fsr: true,
      temporalUpsampling: true,
      ...overrides
    };
  }
  
  private createDefaultStatus(): HD2DSystemStatus {
    return {
      initialized: false,
      systems: {
        graphicsManager: false,
        cuttingEdge: false,
        modernRendering: false,
        enhancements: false,
        assetProcessor: false
      },
      performance: {
        fps: 0,
        frameTime: 0,
        qualityLevel: 'unknown',
        gpuMemory: 0
      },
      capabilities: {
        dlss: false,
        fsr: false,
        rayTracing: false,
        meshShaders: false,
        hdr: false
      }
    };
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Integration System...');
    
    try {
      // Initialize core graphics manager
      await this.initializeGraphicsManager();
      
      // Initialize cutting-edge HD-2D system
      if (this.config.enableCuttingEdge) {
        await this.initializeCuttingEdgeHD2D();
      }
      
      // Initialize modern rendering pipeline
      if (this.config.enableModernRendering) {
        await this.initializeModernRendering();
      }
      
      // Initialize enhancements
      if (this.config.enableEnhancements) {
        await this.initializeEnhancements();
      }
      
      // Initialize asset processor
      if (this.config.enableAssetProcessing) {
        await this.initializeAssetProcessor();
      }
      
      // Setup unified update loop
      this.setupUpdateLoop();
      
      // Update status
      this.status.initialized = true;
      this.updateSystemStatus();
      
      console.log('HD-2D Integration System initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Integration System:', error);
      throw error;
    }
  }
  
  private async initializeGraphicsManager(): Promise<void> {
    console.log('Initializing Graphics Manager...');
    
    try {
      await this.graphicsManager.initialize();
      this.status.systems.graphicsManager = true;
      console.log('Graphics Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Graphics Manager:', error);
      throw error;
    }
  }
  
  private async initializeCuttingEdgeHD2D(): Promise<void> {
    console.log('Initializing Cutting-Edge HD-2D System...');
    
    try {
      this.cuttingEdgeHD2D = new CuttingEdgeHD2D(this.app, this.graphicsManager, {
        dlss: { enabled: this.config.dlss, quality: 'balanced' },
        fsr: { enabled: this.config.fsr, quality: 'balanced' },
        rayTracing: { enabled: this.config.rayTracing },
        temporalUpsampling: this.config.temporalUpsampling,
        adaptiveQuality: this.config.adaptiveQuality,
        frameRateTarget: this.config.targetFrameRate,
        hdr: this.config.hdr,
        wideColorGamut: this.config.wideColorGamut
      });
      
      await this.cuttingEdgeHD2D.initialize();
      this.status.systems.cuttingEdge = true;
      console.log('Cutting-Edge HD-2D System initialized');
    } catch (error) {
      console.error('Failed to initialize Cutting-Edge HD-2D System:', error);
      // Don't throw error, continue without cutting-edge features
      this.cuttingEdgeHD2D = null;
    }
  }
  
  private async initializeModernRendering(): Promise<void> {
    console.log('Initializing Modern Rendering Pipeline...');
    
    try {
      this.modernRendering = new ModernRenderingPipeline(this.app, {
        dlss: { enabled: this.config.dlss, quality: 'balanced' },
        fsr: { enabled: this.config.fsr, quality: 'balanced' },
        rayTracing: { enabled: this.config.rayTracing },
        temporalUpsampling: this.config.temporalUpsampling,
        adaptiveQuality: this.config.adaptiveQuality,
        frameRateTarget: this.config.targetFrameRate,
        hdr: this.config.hdr,
        wideColorGamut: this.config.wideColorGamut
      });
      
      await this.modernRendering.initialize();
      this.status.systems.modernRendering = true;
      console.log('Modern Rendering Pipeline initialized');
    } catch (error) {
      console.error('Failed to initialize Modern Rendering Pipeline:', error);
      // Don't throw error, continue without modern rendering features
      this.modernRendering = null;
    }
  }
  
  private async initializeEnhancements(): Promise<void> {
    console.log('Initializing HD-2D Enhancements...');
    
    try {
      this.enhancements = new HD2DEnhancements(this.graphicsManager, {
        pixelPerfectRendering: this.config.pixelPerfect,
        pixelScale: this.config.pixelScale,
        atmosphericPerspective: true,
        rimLightingIntensity: 0.8,
        characterSeparation: true,
        dynamicShadows: true
      });
      
      await this.enhancements.initialize();
      this.status.systems.enhancements = true;
      console.log('HD-2D Enhancements initialized');
    } catch (error) {
      console.error('Failed to initialize HD-2D Enhancements:', error);
      // Don't throw error, continue without enhancements
      this.enhancements = null;
    }
  }
  
  private async initializeAssetProcessor(): Promise<void> {
    console.log('Initializing HD-2D Asset Processor...');
    
    try {
      this.assetProcessor = new HD2DAssetProcessor(this.app, {
        pixelPerfectTextures: this.config.pixelPerfect,
        textureFiltering: 'nearest',
        normalMapGeneration: true,
        specularMapGeneration: true,
        modelOptimization: true,
        lodGeneration: true
      });
      
      await this.assetProcessor.processAllAssets();
      this.status.systems.assetProcessor = true;
      console.log('HD-2D Asset Processor initialized');
    } catch (error) {
      console.error('Failed to initialize HD-2D Asset Processor:', error);
      // Don't throw error, continue without asset processing
      this.assetProcessor = null;
    }
  }
  
  private setupUpdateLoop(): void {
    this.app.on('update', (deltaTime: number) => {
      this.update(deltaTime);
    });
  }
  
  public update(deltaTime: number): void {
    if (!this.status.initialized) return;
    
    // Update all systems
    if (this.cuttingEdgeHD2D) {
      this.cuttingEdgeHD2D.update(deltaTime);
    }
    
    if (this.modernRendering) {
      this.modernRendering.update(deltaTime);
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime);
    
    // Update system status
    this.updateSystemStatus();
  }
  
  private updatePerformanceMetrics(deltaTime: number): void {
    this.status.performance.fps = 1.0 / deltaTime;
    this.status.performance.frameTime = deltaTime * 1000;
    
    // Get quality level from adaptive quality system
    if (this.cuttingEdgeHD2D) {
      const metrics = this.cuttingEdgeHD2D.getPerformanceMetrics();
      if (metrics) {
        this.status.performance.fps = metrics.fps;
        this.status.performance.frameTime = metrics.frameTime;
      }
    }
    
    if (this.modernRendering) {
      const metrics = this.modernRendering.getPerformanceMetrics();
      if (metrics) {
        this.status.performance.qualityLevel = metrics.currentQuality;
      }
    }
  }
  
  private updateSystemStatus(): void {
    // Update capabilities
    if (this.cuttingEdgeHD2D) {
      const hardwareInfo = this.cuttingEdgeHD2D.getHardwareInfo();
      this.status.capabilities.dlss = hardwareInfo.dlssSupported;
      this.status.capabilities.fsr = hardwareInfo.fsrSupported;
      this.status.capabilities.rayTracing = hardwareInfo.rayTracingSupported;
      this.status.capabilities.meshShaders = hardwareInfo.meshShadersSupported;
      this.status.capabilities.hdr = hardwareInfo.hdr;
    }
    
    if (this.modernRendering) {
      const hardwareInfo = this.modernRendering.getHardwareInfo();
      this.status.capabilities.dlss = hardwareInfo.dlssSupported;
      this.status.capabilities.fsr = hardwareInfo.fsrSupported;
      this.status.capabilities.rayTracing = hardwareInfo.rayTracingSupported;
      this.status.capabilities.meshShaders = hardwareInfo.meshShadersSupported;
    }
  }
  
  // Public API for character management
  public createCharacter(playerId: string, characterData: any): pc.Entity {
    console.log(`Creating character: ${playerId}`);
    
    // Use existing graphics manager for character creation
    const character = this.graphicsManager.createCharacter(playerId, characterData);
    
    // Apply HD-2D enhancements if available
    if (this.enhancements) {
      // Character will automatically get HD-2D enhancements
    }
    
    return character;
  }
  
  public createHitEffect(position: pc.Vec3, power: number = 1.0, type: string = 'normal'): void {
    // Use existing graphics manager for hit effects
    this.graphicsManager.createHitEffect(position, power, type);
  }
  
  public createParryEffect(position: pc.Vec3): void {
    // Use existing graphics manager for parry effects
    this.graphicsManager.createParryEffect(position);
  }
  
  public createSuperEffect(character: pc.Entity, superData: any): void {
    // Use existing graphics manager for super effects
    this.graphicsManager.createSuperEffect(character, superData);
  }
  
  // Public API for rendering control
  public setPixelScale(scale: number): void {
    this.config.pixelScale = Math.max(0.5, Math.min(4.0, scale));
    
    if (this.enhancements) {
      this.enhancements.setPixelScale(scale);
    }
  }
  
  public setRimLightingIntensity(intensity: number): void {
    if (this.enhancements) {
      this.enhancements.setRimLightingIntensity(intensity);
    }
  }
  
  public setAtmosphericPerspective(enabled: boolean): void {
    if (this.enhancements) {
      this.enhancements.setAtmosphericPerspective(enabled);
    }
  }
  
  public setDLSSQuality(quality: 'performance' | 'balanced' | 'quality' | 'ultra_quality'): void {
    if (this.cuttingEdgeHD2D) {
      this.cuttingEdgeHD2D.setDLSSQuality(quality);
    }
    
    if (this.modernRendering) {
      this.modernRendering.setDLSSQuality(quality);
    }
  }
  
  public setFSRQuality(quality: 'performance' | 'balanced' | 'quality' | 'ultra_quality'): void {
    if (this.cuttingEdgeHD2D) {
      this.cuttingEdgeHD2D.setFSRQuality(quality);
    }
    
    if (this.modernRendering) {
      this.modernRendering.setFSRQuality(quality);
    }
  }
  
  public setRayTracingEnabled(enabled: boolean): void {
    if (this.cuttingEdgeHD2D) {
      this.cuttingEdgeHD2D.setRayTracingEnabled(enabled);
    }
    
    if (this.modernRendering) {
      this.modernRendering.setRayTracingEnabled(enabled);
    }
  }
  
  public setFrameRateTarget(target: number): void {
    this.config.targetFrameRate = target;
    
    if (this.cuttingEdgeHD2D) {
      this.cuttingEdgeHD2D.setFrameRateTarget(target);
    }
    
    if (this.modernRendering) {
      this.modernRendering.setFrameRateTarget(target);
    }
  }
  
  // Public API for status and metrics
  public getSystemStatus(): HD2DSystemStatus {
    return { ...this.status };
  }
  
  public getPerformanceMetrics(): any {
    return {
      ...this.status.performance,
      systems: this.status.systems,
      capabilities: this.status.capabilities
    };
  }
  
  public getConfig(): HD2DIntegrationConfig {
    return { ...this.config };
  }
  
  public getHardwareInfo(): any {
    if (this.cuttingEdgeHD2D) {
      return this.cuttingEdgeHD2D.getHardwareInfo();
    }
    
    if (this.modernRendering) {
      return this.modernRendering.getHardwareInfo();
    }
    
    return null;
  }
  
  // Public API for asset management
  public processAsset(asset: pc.Asset): Promise<any> {
    if (this.assetProcessor) {
      return this.assetProcessor.processTexture(asset);
    }
    
    return Promise.resolve(null);
  }
  
  public getProcessedAssets(): any[] {
    if (this.assetProcessor) {
      return this.assetProcessor.getAllProcessedAssets();
    }
    
    return [];
  }
  
  public getAssetProcessingStats(): any {
    if (this.assetProcessor) {
      return this.assetProcessor.getProcessingStats();
    }
    
    return null;
  }
  
  // Public API for system control
  public enableSystem(system: 'cuttingEdge' | 'modernRendering' | 'enhancements' | 'assetProcessor'): void {
    switch (system) {
      case 'cuttingEdge':
        this.config.enableCuttingEdge = true;
        if (!this.cuttingEdgeHD2D) {
          this.initializeCuttingEdgeHD2D();
        }
        break;
      case 'modernRendering':
        this.config.enableModernRendering = true;
        if (!this.modernRendering) {
          this.initializeModernRendering();
        }
        break;
      case 'enhancements':
        this.config.enableEnhancements = true;
        if (!this.enhancements) {
          this.initializeEnhancements();
        }
        break;
      case 'assetProcessor':
        this.config.enableAssetProcessing = true;
        if (!this.assetProcessor) {
          this.initializeAssetProcessor();
        }
        break;
    }
  }
  
  public disableSystem(system: 'cuttingEdge' | 'modernRendering' | 'enhancements' | 'assetProcessor'): void {
    switch (system) {
      case 'cuttingEdge':
        this.config.enableCuttingEdge = false;
        if (this.cuttingEdgeHD2D) {
          this.cuttingEdgeHD2D.destroy();
          this.cuttingEdgeHD2D = null;
        }
        break;
      case 'modernRendering':
        this.config.enableModernRendering = false;
        if (this.modernRendering) {
          this.modernRendering.destroy();
          this.modernRendering = null;
        }
        break;
      case 'enhancements':
        this.config.enableEnhancements = false;
        if (this.enhancements) {
          this.enhancements.destroy();
          this.enhancements = null;
        }
        break;
      case 'assetProcessor':
        this.config.enableAssetProcessing = false;
        if (this.assetProcessor) {
          this.assetProcessor.destroy();
          this.assetProcessor = null;
        }
        break;
    }
  }
  
  public destroy(): void {
    console.log('Destroying HD-2D Integration System...');
    
    // Destroy all systems
    if (this.cuttingEdgeHD2D) {
      this.cuttingEdgeHD2D.destroy();
    }
    
    if (this.modernRendering) {
      this.modernRendering.destroy();
    }
    
    if (this.enhancements) {
      this.enhancements.destroy();
    }
    
    if (this.assetProcessor) {
      this.assetProcessor.destroy();
    }
    
    if (this.graphicsManager) {
      this.graphicsManager.destroy();
    }
    
    this.status.initialized = false;
    console.log('HD-2D Integration System destroyed');
  }
}