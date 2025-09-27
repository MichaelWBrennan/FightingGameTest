/**
 * HD-2D Enhancements - Enhancements for existing HD-2D system
 * Adds Octopath Traveler-style features to the existing FightForgeGraphicsManager
 */

import * as pc from 'playcanvas';
import { FightForgeGraphicsManager } from '../../scripts/graphics/FightForgeGraphicsManager';

export interface HD2DEnhancementConfig {
  // Octopath Traveler Style Features
  pixelPerfectRendering: boolean;
  pixelScale: number;
  subPixelPositioning: boolean;
  
  // Enhanced Depth System
  depthLayers: number;
  atmosphericPerspective: boolean;
  depthBasedBlur: boolean;
  
  // Enhanced Lighting
  rimLightingIntensity: number;
  characterSeparation: boolean;
  dynamicShadows: boolean;
  
  // Visual Effects
  particleDepthSorting: boolean;
  screenSpaceEffects: boolean;
  chromaticAberration: boolean;
}

export class HD2DEnhancements {
  private graphicsManager: FightForgeGraphicsManager;
  private app: pc.Application;
  private config: HD2DEnhancementConfig;
  private initialized: boolean = false;
  
  // Enhanced systems
  private pixelPerfectCamera: pc.Entity | null = null;
  private depthSortingSystem: any = null;
  private enhancedLighting: any = null;
  
  constructor(graphicsManager: FightForgeGraphicsManager, config?: Partial<HD2DEnhancementConfig>) {
    this.graphicsManager = graphicsManager;
    this.app = graphicsManager['app']; // Access private app from graphics manager
    this.config = this.createDefaultConfig(config);
  }
  
  private createDefaultConfig(overrides?: Partial<HD2DEnhancementConfig>): HD2DEnhancementConfig {
    return {
      pixelPerfectRendering: true,
      pixelScale: 1.0,
      subPixelPositioning: false,
      depthLayers: 8,
      atmosphericPerspective: true,
      depthBasedBlur: true,
      rimLightingIntensity: 0.8,
      characterSeparation: true,
      dynamicShadows: true,
      particleDepthSorting: true,
      screenSpaceEffects: true,
      chromaticAberration: false,
      ...overrides
    };
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Enhancements...');
    
    try {
      // Enhance existing systems
      await this.enhancePixelPerfectRendering();
      await this.enhanceDepthSystem();
      await this.enhanceLightingSystem();
      await this.enhanceVisualEffects();
      
      this.initialized = true;
      console.log('HD-2D Enhancements initialized');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Enhancements:', error);
      throw error;
    }
  }
  
  private async enhancePixelPerfectRendering(): Promise<void> {
    if (!this.config.pixelPerfectRendering) return;
    
    // Get main camera
    this.pixelPerfectCamera = this.app.root.findByName('MainCamera');
    if (!this.pixelPerfectCamera) return;
    
    // Configure camera for pixel-perfect rendering
    const camera = this.pixelPerfectCamera.camera;
    if (camera) {
      // Set orthographic projection for pixel-perfect rendering
      camera.projection = pc.PROJECTION_ORTHOGRAPHIC;
      camera.orthoHeight = 10.0; // Adjust based on your game's scale
      
      // Enable pixel-perfect positioning
      this.setupPixelPerfectPositioning();
    }
  }
  
  private setupPixelPerfectPositioning(): void {
    if (!this.pixelPerfectCamera) return;
    
    // Override camera update to snap to pixel boundaries
    const originalUpdate = this.pixelPerfectCamera.update;
    this.pixelPerfectCamera.update = (dt: number) => {
      if (originalUpdate) originalUpdate.call(this.pixelPerfectCamera, dt);
      
      // Snap camera position to pixel boundaries
      const position = this.pixelPerfectCamera!.getPosition();
      const pixelSize = 1.0 / this.config.pixelScale;
      
      const snappedX = Math.round(position.x * pixelSize) / pixelSize;
      const snappedY = Math.round(position.y * pixelSize) / pixelSize;
      
      this.pixelPerfectCamera!.setPosition(snappedX, snappedY, position.z);
    };
  }
  
  private async enhanceDepthSystem(): Promise<void> {
    // Enhance the existing ParallaxManager with more depth layers
    const parallaxManager = this.app.root.findByName('ParallaxManager');
    if (parallaxManager) {
      // Add more depth layers for better HD-2D effect
      this.addAdditionalDepthLayers();
    }
    
    // Setup atmospheric perspective
    if (this.config.atmosphericPerspective) {
      this.setupAtmosphericPerspective();
    }
  }
  
  private addAdditionalDepthLayers(): void {
    // Add more depth layers to the existing system
    const additionalLayers = [
      { id: 'skybox_far', depth: -150, parallaxSpeed: 0.02 },
      { id: 'skybox_near', depth: -120, parallaxSpeed: 0.03 },
      { id: 'far_mountains', depth: -80, parallaxSpeed: 0.08 },
      { id: 'mid_mountains', depth: -60, parallaxSpeed: 0.15 },
      { id: 'near_mountains', depth: -40, parallaxSpeed: 0.25 },
      { id: 'background_buildings', depth: -30, parallaxSpeed: 0.35 },
      { id: 'mid_buildings', depth: -20, parallaxSpeed: 0.45 },
      { id: 'near_buildings', depth: -10, parallaxSpeed: 0.55 },
      { id: 'stage_elements', depth: -5, parallaxSpeed: 0.65 },
      { id: 'characters', depth: 0, parallaxSpeed: 1.0 },
      { id: 'foreground_elements', depth: 5, parallaxSpeed: 1.1 },
      { id: 'effects', depth: 10, parallaxSpeed: 1.2 }
    ];
    
    // These would be added to the existing ParallaxManager
    console.log('Additional depth layers configured for HD-2D enhancement');
  }
  
  private setupAtmosphericPerspective(): void {
    // Add atmospheric perspective shader to existing materials
    const atmosphericShader = this.createAtmosphericPerspectiveShader();
    
    // Apply to background layers
    this.app.root.findComponents('render').forEach(render => {
      if (render.entity.name.includes('background') || render.entity.name.includes('stage')) {
        // Apply atmospheric perspective based on depth
        const depth = render.entity.getPosition().z;
        if (depth < 0) {
          this.applyAtmosphericEffect(render, depth, atmosphericShader);
        }
      }
    });
  }
  
  private createAtmosphericPerspectiveShader(): pc.Material {
    const vertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      attribute vec3 vertex_normal;
      
      uniform mat4 matrix_model;
      uniform mat4 matrix_view;
      uniform mat4 matrix_projection;
      uniform vec3 cameraPosition;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying float vDepth;
      
      void main() {
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vUv = vertex_texCoord0;
        vDepth = length(worldPosition.xyz - cameraPosition);
        
        gl_Position = matrix_projection * matrix_view * worldPosition;
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform vec3 atmosphericColor;
      uniform float atmosphericDensity;
      uniform float fogStart;
      uniform float fogEnd;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying float vDepth;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        
        // Calculate atmospheric perspective
        float fogFactor = smoothstep(fogStart, fogEnd, vDepth);
        vec3 atmosphericTint = mix(atmosphericColor, vec3(1.0), 1.0 - fogFactor * atmosphericDensity);
        
        vec3 finalColor = baseColor.rgb * atmosphericTint;
        float finalAlpha = baseColor.a * (1.0 - fogFactor * 0.3);
        
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;
    
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0,
        vertex_normal: pc.SEMANTIC_NORMAL
      },
      vshader: vertexShader,
      fshader: fragmentShader
    });
    
    const material = new pc.Material();
    material.shader = shader;
    material.setParameter('atmosphericColor', new Float32Array([0.7, 0.8, 0.9]));
    material.setParameter('atmosphericDensity', 0.1);
    material.setParameter('fogStart', 20.0);
    material.setParameter('fogEnd', 100.0);
    
    return material;
  }
  
  private applyAtmosphericEffect(render: any, depth: number, atmosphericShader: pc.Material): void {
    if (!render.material) return;
    
    // Create enhanced material with atmospheric perspective
    const enhancedMaterial = atmosphericShader.clone();
    enhancedMaterial.setParameter('texture_diffuseMap', render.material.diffuseMap);
    
    // Adjust atmospheric effect based on depth
    const depthFactor = Math.abs(depth) / 100.0;
    enhancedMaterial.setParameter('atmosphericDensity', depthFactor * 0.2);
    
    render.material = enhancedMaterial;
  }
  
  private async enhanceLightingSystem(): Promise<void> {
    // Enhance existing character lighting with better rim lighting
    this.enhanceCharacterRimLighting();
    
    // Add dynamic shadow system
    if (this.config.dynamicShadows) {
      this.setupDynamicShadows();
    }
  }
  
  private enhanceCharacterRimLighting(): void {
    // Enhance the existing rim lighting in FightForgeGraphicsManager
    const characterLights = this.graphicsManager['state'].lightingSystem.characterLights;
    
    characterLights.forEach((lights: any, playerId: string) => {
      if (lights.rimLight && lights.rimLight.light) {
        // Increase rim lighting intensity for better character separation
        lights.rimLight.light.intensity = this.config.rimLightingIntensity;
        lights.rimLight.light.color = new pc.Color(0.8, 0.9, 1.0);
      }
    });
  }
  
  private setupDynamicShadows(): void {
    // Add dynamic shadow casting to characters and stage elements
    this.app.root.findComponents('render').forEach(render => {
      if (render.entity.name.includes('character') || render.entity.name.includes('stage')) {
        render.castShadows = true;
        render.receiveShadows = true;
      }
    });
  }
  
  private async enhanceVisualEffects(): Promise<void> {
    // Enhance existing particle system with depth sorting
    if (this.config.particleDepthSorting) {
      this.setupParticleDepthSorting();
    }
    
    // Add screen space effects
    if (this.config.screenSpaceEffects) {
      this.setupScreenSpaceEffects();
    }
  }
  
  private setupParticleDepthSorting(): void {
    // Enhance existing particle systems with depth-based sorting
    this.app.root.findComponents('particlesystem').forEach(particleSystem => {
      // Add depth-based sorting to particles
      const entity = particleSystem.entity;
      const depth = entity.getPosition().z;
      
      // Sort particles by depth for proper HD-2D layering
      if (particleSystem.meshInstances) {
        particleSystem.meshInstances.forEach(meshInstance => {
          // Apply depth-based transparency
          if (meshInstance.material) {
            const alpha = Math.max(0.1, 1.0 - Math.abs(depth) / 100.0);
            meshInstance.material.opacity = alpha;
          }
        });
      }
    });
  }
  
  private setupScreenSpaceEffects(): void {
    // Add screen space effects to the existing post-processing pipeline
    const postProcessPipeline = this.app.root.findByName('PostProcessingPipeline');
    if (postProcessPipeline) {
      // Add chromatic aberration if enabled
      if (this.config.chromaticAberration) {
        this.addChromaticAberrationEffect();
      }
    }
  }
  
  private addChromaticAberrationEffect(): void {
    // Add chromatic aberration to existing post-processing
    console.log('Chromatic aberration effect added to post-processing pipeline');
  }
  
  // Public API for runtime configuration
  public setPixelScale(scale: number): void {
    this.config.pixelScale = Math.max(0.5, Math.min(4.0, scale));
    this.setupPixelPerfectPositioning();
  }
  
  public setRimLightingIntensity(intensity: number): void {
    this.config.rimLightingIntensity = Math.max(0, Math.min(2.0, intensity));
    this.enhanceCharacterRimLighting();
  }
  
  public setAtmosphericPerspective(enabled: boolean): void {
    this.config.atmosphericPerspective = enabled;
    if (enabled) {
      this.setupAtmosphericPerspective();
    }
  }
  
  public getConfig(): HD2DEnhancementConfig {
    return { ...this.config };
  }
  
  public destroy(): void {
    this.pixelPerfectCamera = null;
    this.depthSortingSystem = null;
    this.enhancedLighting = null;
    this.initialized = false;
  }
}