/**
 * Graphics Engine Manager - Unified interface for NextGen Graphics Engine
 * Provides a single entry point for all graphics functionality
 */

import * as pc from 'playcanvas';
import { NextGenGraphicsEngine } from './NextGenGraphicsEngine';

export class GraphicsEngineManager {
  private app: pc.Application;
  private engine: NextGenGraphicsEngine;
  private initialized: boolean = false;
  
  constructor(app: pc.Application) {
    this.app = app;
    this.engine = new NextGenGraphicsEngine(app);
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing Graphics Engine Manager...');
    
    try {
      await this.engine.initialize();
      this.initialized = true;
      console.log('Graphics Engine Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Graphics Engine Manager:', error);
      throw error;
    }
  }
  
  // Character Management
  public createCharacter(playerId: string, characterData: any): pc.Entity {
    return this.engine.createCharacter(playerId, characterData);
  }
  
  // Visual Effects
  public createHitEffect(position: pc.Vec3, power: number = 1.0, type: string = 'normal'): void {
    this.engine.createHitEffect(position, power, type);
  }
  
  public createParryEffect(position: pc.Vec3): void {
    this.engine.createParryEffect(position);
  }
  
  public createSuperEffect(character: pc.Entity, superData: any): void {
    this.engine.createSuperEffect(character, superData);
  }
  
  // HD-2D Controls
  public setPixelScale(scale: number): void {
    this.engine.setPixelScale(scale);
  }
  
  public setRimLightingIntensity(intensity: number): void {
    this.engine.setRimLightingIntensity(intensity);
  }
  
  public setAtmosphericPerspective(enabled: boolean): void {
    this.engine.setAtmosphericPerspective(enabled);
  }
  
  // Advanced Features
  public setRayTracingEnabled(enabled: boolean): void {
    this.engine.setRayTracingEnabled(enabled);
  }
  
  public setFrameRateTarget(target: number): void {
    this.engine.setFrameRateTarget(target);
  }
  
  // Status and Metrics
  public getPerformanceMetrics(): any {
    return this.engine.getPerformanceMetrics();
  }
  
  public getConfig(): any {
    return this.engine.getConfig();
  }
  
  public getCapabilities(): any {
    return this.engine.getCapabilities();
  }
  
  public getHardwareInfo(): any {
    return this.engine.getHardwareInfo();
  }
  
  public destroy(): void {
    this.engine.destroy();
    this.initialized = false;
  }
}

// Global instance
let graphicsEngineManager: GraphicsEngineManager | null = null;

export function initializeGraphicsEngine(app: pc.Application): GraphicsEngineManager {
  if (!graphicsEngineManager) {
    graphicsEngineManager = new GraphicsEngineManager(app);
  }
  return graphicsEngineManager;
}

export function getGraphicsEngine(): GraphicsEngineManager | null {
  return graphicsEngineManager;
}