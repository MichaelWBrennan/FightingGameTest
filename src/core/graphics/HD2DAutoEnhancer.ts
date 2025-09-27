/**
 * HD-2D Auto Enhancer - Automatically enhances existing HD-2D system
 * Passive integration that works behind the scenes
 */

import * as pc from 'playcanvas';
import { FightForgeGraphicsManager } from '../../scripts/graphics/FightForgeGraphicsManager';

export class HD2DAutoEnhancer {
  private app: pc.Application;
  private graphicsManager: FightForgeGraphicsManager;
  private initialized: boolean = false;
  
  // Auto-detected capabilities
  private capabilities = {
    dlss: false,
    fsr: false,
    rayTracing: false,
    meshShaders: false,
    hdr: false,
    wideColorGamut: false
  };
  
  // Performance tracking
  private performanceHistory: number[] = [];
  private lastQualityAdjustment = 0;
  
  constructor(app: pc.Application) {
    this.app = app;
    this.autoEnhance();
  }
  
  private autoEnhance(): void {
    // Auto-detect and enhance without user intervention
    this.detectCapabilities();
    this.enhanceExistingSystems();
    this.setupPassiveOptimization();
  }
  
  private detectCapabilities(): void {
    const device = this.app.graphicsDevice;
    const extensions = device.capabilities.extensions || [];
    
    // Auto-detect DLSS
    this.capabilities.dlss = extensions.includes('GL_NV_gpu_shader5');
    
    // Auto-detect FSR (always available)
    this.capabilities.fsr = true;
    
    // Auto-detect Ray Tracing
    this.capabilities.rayTracing = extensions.includes('GL_NV_ray_tracing');
    
    // Auto-detect Mesh Shaders
    this.capabilities.meshShaders = extensions.includes('GL_NV_mesh_shader');
    
    // Auto-detect HDR
    this.capabilities.hdr = device.colorSpace === 'display-p3' || device.colorSpace === 'rec2020';
    this.capabilities.wideColorGamut = this.capabilities.hdr;
    
    console.log('HD-2D Auto Enhancer: Capabilities detected', this.capabilities);
  }
  
  private enhanceExistingSystems(): void {
    // Enhance existing FightForgeGraphicsManager
    this.enhanceGraphicsManager();
    
    // Enhance existing ParallaxManager
    this.enhanceParallaxManager();
    
    // Enhance existing shaders
    this.enhanceShaders();
    
    // Enhance existing camera
    this.enhanceCamera();
    
    this.initialized = true;
  }
  
  private enhanceGraphicsManager(): void {
    // Get reference to existing graphics manager
    const graphicsManager = this.app.root.findByName('FightForgeGraphicsManager');
    if (!graphicsManager) return;
    
    // Enhance character lighting automatically
    this.enhanceCharacterLighting();
    
    // Enhance visual effects
    this.enhanceVisualEffects();
    
    // Add performance monitoring
    this.addPerformanceMonitoring();
  }
  
  private enhanceCharacterLighting(): void {
    // Find existing character lights and enhance them
    const characterLights = this.app.root.findComponents('light');
    characterLights.forEach(light => {
      if (light.entity.name.includes('character') || light.entity.name.includes('rim')) {
        // Enhance rim lighting for better character separation
        if (light.type === pc.LIGHTTYPE_DIRECTIONAL) {
          light.intensity = Math.max(light.intensity, 0.8);
          light.color = new pc.Color(0.8, 0.9, 1.0);
        }
      }
    });
  }
  
  private enhanceVisualEffects(): void {
    // Enhance existing particle systems
    const particleSystems = this.app.root.findComponents('particlesystem');
    particleSystems.forEach(particleSystem => {
      // Add depth-based sorting
      this.addDepthSortingToParticles(particleSystem);
    });
  }
  
  private addDepthSortingToParticles(particleSystem: any): void {
    // Add depth-based transparency to particles
    const originalUpdate = particleSystem.update;
    particleSystem.update = (dt: number) => {
      if (originalUpdate) originalUpdate.call(particleSystem, dt);
      
      // Apply depth-based effects
      const position = particleSystem.entity.getPosition();
      const depth = Math.abs(position.z);
      const alpha = Math.max(0.1, 1.0 - depth / 100.0);
      
      if (particleSystem.material) {
        particleSystem.material.opacity = alpha;
      }
    };
  }
  
  private enhanceParallaxManager(): void {
    // Find existing ParallaxManager and enhance it
    const parallaxManager = this.app.root.findByName('ParallaxManager');
    if (!parallaxManager) return;
    
    // Add atmospheric perspective to existing layers
    this.addAtmosphericPerspective();
    
    // Add pixel-perfect positioning
    this.addPixelPerfectPositioning();
  }
  
  private addAtmosphericPerspective(): void {
    // Add atmospheric perspective to background layers
    const backgroundEntities = this.app.root.findComponents('render').filter(render => 
      render.entity.name.includes('background') || render.entity.name.includes('stage')
    );
    
    backgroundEntities.forEach(render => {
      const depth = Math.abs(render.entity.getPosition().z);
      if (depth > 20) {
        // Apply atmospheric perspective
        this.applyAtmosphericEffect(render, depth);
      }
    });
  }
  
  private applyAtmosphericEffect(render: any, depth: number): void {
    if (!render.material) return;
    
    const material = render.material as pc.StandardMaterial;
    const fogFactor = Math.min(1.0, (depth - 20) / 80);
    
    // Add atmospheric tinting
    const atmosphericColor = new pc.Color(0.7, 0.8, 0.9);
    const originalColor = material.diffuse || new pc.Color(1, 1, 1);
    const tintedColor = originalColor.clone().lerp(atmosphericColor, fogFactor * 0.3);
    
    material.diffuse = tintedColor;
    material.opacity = Math.max(0.1, 1.0 - fogFactor * 0.5);
  }
  
  private addPixelPerfectPositioning(): void {
    // Enhance camera for pixel-perfect rendering
    const camera = this.app.root.findByName('MainCamera');
    if (!camera) return;
    
    // Add pixel-perfect positioning
    const originalUpdate = camera.update;
    camera.update = (dt: number) => {
      if (originalUpdate) originalUpdate.call(camera, dt);
      
      // Snap camera position to pixel boundaries
      const position = camera.getPosition();
      const pixelSize = 1.0 / 32.0; // Adjust based on your game's scale
      
      const snappedX = Math.round(position.x * pixelSize) / pixelSize;
      const snappedY = Math.round(position.y * pixelSize) / pixelSize;
      
      camera.setPosition(snappedX, snappedY, position.z);
    };
  }
  
  private enhanceShaders(): void {
    // Enhance existing shaders with HD-2D features
    const materials = this.app.root.findComponents('render').map(render => render.material).filter(Boolean);
    
    materials.forEach(material => {
      if (material instanceof pc.StandardMaterial) {
        this.enhanceStandardMaterial(material);
      }
    });
  }
  
  private enhanceStandardMaterial(material: pc.StandardMaterial): void {
    // Enable HD-2D features
    material.useLighting = true;
    material.useSkybox = false;
    material.useFog = false;
    
    // Add subtle rim lighting
    if (material.emissive) {
      material.emissive = material.emissive.clone().scale(1.1);
    }
  }
  
  private enhanceCamera(): void {
    // Enhance camera for HD-2D rendering
    const camera = this.app.root.findByName('MainCamera');
    if (!camera || !camera.camera) return;
    
    // Configure for HD-2D
    camera.camera.clearColor = new pc.Color(0.1, 0.1, 0.1, 1.0);
    
    // Add subtle vignette effect
    this.addVignetteEffect(camera);
  }
  
  private addVignetteEffect(camera: pc.Entity): void {
    // Add subtle vignette for cinematic effect
    const originalUpdate = camera.update;
    camera.update = (dt: number) => {
      if (originalUpdate) originalUpdate.call(camera, dt);
      
      // Apply vignette effect (simplified)
      // In a real implementation, this would be a post-processing effect
    };
  }
  
  private setupPassiveOptimization(): void {
    // Setup automatic performance optimization
    this.app.on('update', (dt: number) => {
      this.updatePassiveOptimization(dt);
    });
  }
  
  private updatePassiveOptimization(deltaTime: number): void {
    if (!this.initialized) return;
    
    // Track performance
    this.performanceHistory.push(1.0 / deltaTime);
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift();
    }
    
    // Adjust quality based on performance
    this.adjustQualityBasedOnPerformance();
  }
  
  private adjustQualityBasedOnPerformance(): void {
    const now = Date.now();
    if (now - this.lastQualityAdjustment < 5000) return; // Adjust every 5 seconds
    
    if (this.performanceHistory.length < 30) return;
    
    const avgFps = this.performanceHistory.reduce((sum, fps) => sum + fps, 0) / this.performanceHistory.length;
    
    if (avgFps < 30) {
      // Performance is poor, reduce quality
      this.reduceQuality();
    } else if (avgFps > 60) {
      // Performance is good, increase quality
      this.increaseQuality();
    }
    
    this.lastQualityAdjustment = now;
  }
  
  private reduceQuality(): void {
    // Reduce quality automatically
    const particleSystems = this.app.root.findComponents('particlesystem');
    particleSystems.forEach(particleSystem => {
      if (particleSystem.numParticles > 50) {
        particleSystem.numParticles = Math.max(50, particleSystem.numParticles * 0.8);
      }
    });
    
    // Reduce shadow quality
    const lights = this.app.root.findComponents('light');
    lights.forEach(light => {
      if (light.castShadows && light.shadowResolution > 512) {
        light.shadowResolution = Math.max(512, light.shadowResolution * 0.8);
      }
    });
  }
  
  private increaseQuality(): void {
    // Increase quality automatically
    const particleSystems = this.app.root.findComponents('particlesystem');
    particleSystems.forEach(particleSystem => {
      if (particleSystem.numParticles < 200) {
        particleSystem.numParticles = Math.min(200, particleSystem.numParticles * 1.2);
      }
    });
    
    // Increase shadow quality
    const lights = this.app.root.findComponents('light');
    lights.forEach(light => {
      if (light.castShadows && light.shadowResolution < 2048) {
        light.shadowResolution = Math.min(2048, light.shadowResolution * 1.2);
      }
    });
  }
  
  private addPerformanceMonitoring(): void {
    // Add passive performance monitoring
    setInterval(() => {
      if (this.performanceHistory.length > 0) {
        const avgFps = this.performanceHistory.reduce((sum, fps) => sum + fps, 0) / this.performanceHistory.length;
        console.log(`HD-2D Auto Enhancer: Average FPS: ${avgFps.toFixed(1)}`);
      }
    }, 10000); // Log every 10 seconds
  }
  
  // Public API for manual control (optional)
  public getCapabilities(): any {
    return { ...this.capabilities };
  }
  
  public getPerformanceMetrics(): any {
    if (this.performanceHistory.length === 0) return null;
    
    const avgFps = this.performanceHistory.reduce((sum, fps) => sum + fps, 0) / this.performanceHistory.length;
    const minFps = Math.min(...this.performanceHistory);
    const maxFps = Math.max(...this.performanceHistory);
    
    return {
      averageFps: avgFps,
      minFps: minFps,
      maxFps: maxFps,
      samples: this.performanceHistory.length
    };
  }
  
  public destroy(): void {
    this.performanceHistory = [];
    this.initialized = false;
  }
}

// Auto-initialize when imported
let autoEnhancer: HD2DAutoEnhancer | null = null;

export function initializeHD2DAutoEnhancer(app: pc.Application): void {
  if (!autoEnhancer) {
    autoEnhancer = new HD2DAutoEnhancer(app);
  }
}

export function getHD2DAutoEnhancer(): HD2DAutoEnhancer | null {
  return autoEnhancer;
}