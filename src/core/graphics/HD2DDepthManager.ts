/**
 * HD-2D Depth Manager - Manages multi-layer depth rendering
 * Handles depth sorting, parallax scrolling, and atmospheric perspective
 */

import * as pc from 'playcanvas';

export interface DepthLayer {
  id: string;
  depth: number;
  parallaxSpeed: number;
  opacity: number;
  entities: pc.Entity[];
  cullingDistance: number;
  lodLevel: number;
}

export interface AtmosphericSettings {
  enabled: boolean;
  density: number;
  color: pc.Color;
  startDistance: number;
  endDistance: number;
  scattering: number;
}

export class HD2DDepthManager {
  private app: pc.Application;
  private config: any;
  private initialized: boolean = false;
  
  // Depth layers
  private layers: Map<string, DepthLayer> = new Map();
  private layerOrder: string[] = [];
  
  // Atmospheric perspective
  private atmosphericSettings: AtmosphericSettings;
  private atmosphericShader: pc.Material | null = null;
  
  // Culling and LOD
  private cullingEnabled: boolean = true;
  private lodEnabled: boolean = true;
  private camera: pc.Entity | null = null;
  
  // Performance
  private updateFrequency: number = 60; // FPS
  private lastUpdate: number = 0;
  
  constructor(app: pc.Application, config: any) {
    this.app = app;
    this.config = config;
    this.atmosphericSettings = this.createDefaultAtmosphericSettings();
  }
  
  private createDefaultAtmosphericSettings(): AtmosphericSettings {
    return {
      enabled: true,
      density: 0.1,
      color: new pc.Color(0.7, 0.8, 0.9),
      startDistance: 20.0,
      endDistance: 100.0,
      scattering: 0.3
    };
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Depth Manager...');
    
    try {
      // Get camera reference
      this.camera = this.app.root.findByName('MainCamera');
      if (!this.camera) {
        throw new Error('Main camera not found');
      }
      
      // Create atmospheric perspective shader
      await this.createAtmosphericShader();
      
      // Setup depth sorting
      this.setupDepthSorting();
      
      this.initialized = true;
      console.log('HD-2D Depth Manager initialized');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Depth Manager:', error);
      throw error;
    }
  }
  
  private async createAtmosphericShader(): Promise<void> {
    // Create atmospheric perspective shader for depth-based fog
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
      varying vec3 vNormal;
      varying float vDepth;
      varying float vAtmosphericFactor;
      
      void main() {
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize((matrix_model * vec4(vertex_normal, 0.0)).xyz);
        vUv = vertex_texCoord0;
        
        // Calculate depth for atmospheric perspective
        float distance = length(worldPosition.xyz - cameraPosition);
        vDepth = distance;
        
        // Atmospheric perspective factor
        float atmosphericRange = ${this.atmosphericSettings.endDistance} - ${this.atmosphericSettings.startDistance};
        float atmosphericFactor = clamp((distance - ${this.atmosphericSettings.startDistance}) / atmosphericRange, 0.0, 1.0);
        vAtmosphericFactor = atmosphericFactor * ${this.atmosphericSettings.density};
        
        gl_Position = matrix_projection * matrix_view * worldPosition;
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform vec3 atmosphericColor;
      uniform float atmosphericScattering;
      uniform float atmosphericDensity;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vDepth;
      varying float vAtmosphericFactor;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        
        // Apply atmospheric perspective
        vec3 atmosphericTint = mix(vec3(1.0), atmosphericColor, vAtmosphericFactor);
        vec3 finalColor = baseColor.rgb * atmosphericTint;
        
        // Add atmospheric scattering
        float scattering = vAtmosphericFactor * atmosphericScattering;
        finalColor = mix(finalColor, atmosphericColor, scattering);
        
        // Reduce opacity with distance
        float opacity = baseColor.a * (1.0 - vAtmosphericFactor * 0.5);
        
        gl_FragColor = vec4(finalColor, opacity);
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
    
    this.atmosphericShader = new pc.Material();
    this.atmosphericShader.shader = shader;
    this.atmosphericShader.setParameter('atmosphericColor', this.atmosphericSettings.color.data);
    this.atmosphericShader.setParameter('atmosphericScattering', this.atmosphericSettings.scattering);
    this.atmosphericShader.setParameter('atmosphericDensity', this.atmosphericSettings.density);
  }
  
  private setupDepthSorting(): void {
    // Enable depth sorting for proper HD-2D layering
    this.app.scene.layers = [
      new pc.Layer({ id: 'world', name: 'World' }),
      new pc.Layer({ id: 'ui', name: 'UI' })
    ];
  }
  
  public createDepthLayer(id: string, depth: number, parallaxSpeed: number = 1.0): DepthLayer {
    const layer: DepthLayer = {
      id,
      depth,
      parallaxSpeed,
      opacity: 1.0,
      entities: [],
      cullingDistance: this.config.cullingDistance || 200.0,
      lodLevel: 0
    };
    
    this.layers.set(id, layer);
    this.layerOrder.push(id);
    this.sortLayersByDepth();
    
    return layer;
  }
  
  private sortLayersByDepth(): void {
    this.layerOrder.sort((a, b) => {
      const layerA = this.layers.get(a);
      const layerB = this.layers.get(b);
      return (layerA?.depth || 0) - (layerB?.depth || 0);
    });
  }
  
  public addEntityToLayer(layerId: string, entity: pc.Entity): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.warn(`Depth layer ${layerId} not found`);
      return false;
    }
    
    // Set entity depth
    const position = entity.getPosition();
    entity.setPosition(position.x, position.y, layer.depth);
    
    // Apply atmospheric perspective if enabled
    if (this.atmosphericSettings.enabled && this.atmosphericShader) {
      this.applyAtmosphericMaterial(entity, layer);
    }
    
    layer.entities.push(entity);
    return true;
  }
  
  private applyAtmosphericMaterial(entity: pc.Entity, layer: DepthLayer): void {
    if (!entity.render || !this.atmosphericShader) return;
    
    // Only apply atmospheric perspective to background layers
    if (layer.depth < 0) {
      entity.render.material = this.atmosphericShader;
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.initialized) return;
    
    // Throttle updates for performance
    this.lastUpdate += deltaTime;
    if (this.lastUpdate < (1.0 / this.updateFrequency)) return;
    this.lastUpdate = 0;
    
    // Update parallax scrolling
    this.updateParallaxScrolling(deltaTime);
    
    // Update culling
    if (this.cullingEnabled) {
      this.updateCulling();
    }
    
    // Update LOD
    if (this.lodEnabled) {
      this.updateLOD();
    }
  }
  
  private updateParallaxScrolling(deltaTime: number): void {
    if (!this.camera) return;
    
    const cameraPos = this.camera.getPosition();
    
    this.layers.forEach(layer => {
      // Calculate parallax offset
      const parallaxOffset = cameraPos.x * (layer.parallaxSpeed - 1.0);
      
      // Update layer entities
      layer.entities.forEach(entity => {
        const position = entity.getPosition();
        entity.setPosition(position.x + parallaxOffset, position.y, layer.depth);
      });
    });
  }
  
  private updateCulling(): void {
    if (!this.camera) return;
    
    const cameraPos = this.camera.getPosition();
    
    this.layers.forEach(layer => {
      layer.entities.forEach(entity => {
        const position = entity.getPosition();
        const distance = Math.sqrt(
          Math.pow(position.x - cameraPos.x, 2) + 
          Math.pow(position.y - cameraPos.y, 2)
        );
        
        // Cull entities beyond culling distance
        entity.enabled = distance <= layer.cullingDistance;
      });
    });
  }
  
  private updateLOD(): void {
    if (!this.camera) return;
    
    const cameraPos = this.camera.getPosition();
    
    this.layers.forEach(layer => {
      layer.entities.forEach(entity => {
        const position = entity.getPosition();
        const distance = Math.sqrt(
          Math.pow(position.x - cameraPos.x, 2) + 
          Math.pow(position.y - cameraPos.y, 2)
        );
        
        // Calculate LOD level based on distance
        let lodLevel = 0;
        if (distance > 50) lodLevel = 1;
        if (distance > 100) lodLevel = 2;
        if (distance > 150) lodLevel = 3;
        
        // Apply LOD to entity
        this.applyLODToEntity(entity, lodLevel);
      });
    });
  }
  
  private applyLODToEntity(entity: pc.Entity, lodLevel: number): void {
    // Reduce entity complexity based on LOD level
    if (entity.render) {
      // Adjust material quality based on LOD
      const material = entity.render.material as pc.StandardMaterial;
      if (material) {
        // Reduce texture resolution for distant objects
        if (lodLevel > 1) {
          material.diffuseMap = this.getLODTexture(material.diffuseMap, lodLevel);
        }
      }
    }
    
    // Disable expensive effects for distant objects
    if (lodLevel > 2) {
      // Disable shadows, reflections, etc.
      if (entity.render) {
        entity.render.castShadows = false;
        entity.render.receiveShadows = false;
      }
    }
  }
  
  private getLODTexture(originalTexture: pc.Texture | null, lodLevel: number): pc.Texture | null {
    // Return lower resolution texture based on LOD level
    // This would typically involve texture streaming or mipmap selection
    return originalTexture;
  }
  
  public setDepthRange(range: number): void {
    this.config.depthRange = range;
    
    // Update layer depths to fit within new range
    this.layers.forEach((layer, id) => {
      const normalizedDepth = (layer.depth / this.config.depthRange) * range;
      layer.depth = normalizedDepth;
    });
  }
  
  public setAtmosphericSettings(settings: Partial<AtmosphericSettings>): void {
    this.atmosphericSettings = { ...this.atmosphericSettings, ...settings };
    
    // Update atmospheric shader parameters
    if (this.atmosphericShader) {
      this.atmosphericShader.setParameter('atmosphericColor', this.atmosphericSettings.color.data);
      this.atmosphericShader.setParameter('atmosphericScattering', this.atmosphericSettings.scattering);
      this.atmosphericShader.setParameter('atmosphericDensity', this.atmosphericSettings.density);
    }
  }
  
  public setCullingEnabled(enabled: boolean): void {
    this.cullingEnabled = enabled;
  }
  
  public setLODEnabled(enabled: boolean): void {
    this.lodEnabled = enabled;
  }
  
  public getLayer(id: string): DepthLayer | undefined {
    return this.layers.get(id);
  }
  
  public getAllLayers(): DepthLayer[] {
    return Array.from(this.layers.values());
  }
  
  public getLayerOrder(): string[] {
    return [...this.layerOrder];
  }
  
  public getDepthStats(): any {
    return {
      layerCount: this.layers.size,
      totalEntities: Array.from(this.layers.values()).reduce((sum, layer) => sum + layer.entities.length, 0),
      atmosphericEnabled: this.atmosphericSettings.enabled,
      cullingEnabled: this.cullingEnabled,
      lodEnabled: this.lodEnabled
    };
  }
  
  public destroy(): void {
    this.layers.clear();
    this.layerOrder = [];
    this.atmosphericShader = null;
    this.camera = null;
    this.initialized = false;
  }
}