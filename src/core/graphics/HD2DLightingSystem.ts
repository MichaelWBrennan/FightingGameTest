/**
 * HD-2D Lighting System - Dynamic lighting for HD-2D rendering
 * Features: Directional lighting, shadows, rim lighting, character highlights
 */

import * as pc from 'playcanvas';

export interface HD2DLight {
  id: string;
  type: 'directional' | 'point' | 'spot' | 'ambient';
  position: pc.Vec3;
  direction: pc.Vec3;
  color: pc.Color;
  intensity: number;
  range?: number;
  angle?: number;
  castShadows: boolean;
  shadowResolution: number;
  entity: pc.Entity;
}

export interface ShadowSettings {
  enabled: boolean;
  resolution: number;
  bias: number;
  normalOffset: number;
  cascadeCount: number;
  softShadows: boolean;
  contactShadows: boolean;
}

export interface RimLightingSettings {
  enabled: boolean;
  color: pc.Color;
  intensity: number;
  power: number;
  threshold: number;
}

export class HD2DLightingSystem {
  private app: pc.Application;
  private config: any;
  private initialized: boolean = false;
  
  // Lighting state
  private lights: Map<string, HD2DLight> = new Map();
  private mainLight: HD2DLight | null = null;
  private ambientLight: HD2DLight | null = null;
  
  // Shadow settings
  private shadowSettings: ShadowSettings;
  private shadowMap: pc.Texture | null = null;
  
  // Rim lighting
  private rimLightingSettings: RimLightingSettings;
  private rimLightingShader: pc.Material | null = null;
  
  // Character highlights
  private characterHighlights: Map<string, any> = new Map();
  
  constructor(app: pc.Application, config: any) {
    this.app = app;
    this.config = config;
    this.shadowSettings = this.createDefaultShadowSettings();
    this.rimLightingSettings = this.createDefaultRimLightingSettings();
  }
  
  private createDefaultShadowSettings(): ShadowSettings {
    return {
      enabled: true,
      resolution: 2048,
      bias: 0.1,
      normalOffset: 0.1,
      cascadeCount: 4,
      softShadows: true,
      contactShadows: true
    };
  }
  
  private createDefaultRimLightingSettings(): RimLightingSettings {
    return {
      enabled: true,
      color: new pc.Color(0.8, 0.9, 1.0),
      intensity: 0.5,
      power: 2.0,
      threshold: 0.1
    };
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Lighting System...');
    
    try {
      // Create shadow map
      await this.createShadowMap();
      
      // Create rim lighting shader
      await this.createRimLightingShader();
      
      // Setup default lighting
      this.setupDefaultLighting();
      
      this.initialized = true;
      console.log('HD-2D Lighting System initialized');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Lighting System:', error);
      throw error;
    }
  }
  
  private async createShadowMap(): Promise<void> {
    if (!this.shadowSettings.enabled) return;
    
    // Create shadow map texture
    this.shadowMap = new pc.Texture(this.app.graphicsDevice, {
      width: this.shadowSettings.resolution,
      height: this.shadowSettings.resolution,
      format: pc.PIXELFORMAT_DEPTH,
      mipmaps: false
    });
  }
  
  private async createRimLightingShader(): Promise<void> {
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
      varying vec3 vViewDirection;
      
      void main() {
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize((matrix_model * vec4(vertex_normal, 0.0)).xyz);
        vUv = vertex_texCoord0;
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        
        gl_Position = matrix_projection * matrix_view * worldPosition;
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform vec3 rimColor;
      uniform float rimIntensity;
      uniform float rimPower;
      uniform float rimThreshold;
      uniform vec3 lightDirection;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        
        // Calculate rim lighting
        float rim = 1.0 - max(0.0, dot(vViewDirection, vNormal));
        rim = pow(rim, rimPower);
        rim = smoothstep(rimThreshold, 1.0, rim);
        
        // Apply rim lighting
        vec3 rimContribution = rimColor * rim * rimIntensity;
        vec3 finalColor = baseColor.rgb + rimContribution;
        
        gl_FragColor = vec4(finalColor, baseColor.a);
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
    
    this.rimLightingShader = new pc.Material();
    this.rimLightingShader.shader = shader;
    this.rimLightingShader.setParameter('rimColor', this.rimLightingSettings.color.data);
    this.rimLightingShader.setParameter('rimIntensity', this.rimLightingSettings.intensity);
    this.rimLightingShader.setParameter('rimPower', this.rimLightingSettings.power);
    this.rimLightingShader.setParameter('rimThreshold', this.rimLightingSettings.threshold);
  }
  
  private setupDefaultLighting(): void {
    // Create main directional light
    this.createDirectionalLight('main', {
      position: new pc.Vec3(0, 10, 5),
      direction: new pc.Vec3(0.3, -0.8, 0.5),
      color: new pc.Color(1.0, 0.95, 0.9),
      intensity: 1.2,
      castShadows: true
    });
    
    // Create ambient light
    this.createAmbientLight('ambient', {
      color: new pc.Color(0.3, 0.4, 0.5),
      intensity: 0.4
    });
  }
  
  public createDirectionalLight(id: string, settings: {
    position: pc.Vec3;
    direction: pc.Vec3;
    color: pc.Color;
    intensity: number;
    castShadows?: boolean;
  }): HD2DLight {
    const entity = new pc.Entity(`HD2DLight_${id}`);
    entity.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: settings.color,
      intensity: settings.intensity,
      castShadows: settings.castShadows || false,
      shadowBias: this.shadowSettings.bias,
      shadowNormalOffset: this.shadowSettings.normalOffset
    });
    
    entity.setPosition(settings.position);
    entity.lookAt(settings.position.clone().add(settings.direction));
    
    this.app.root.addChild(entity);
    
    const light: HD2DLight = {
      id,
      type: 'directional',
      position: settings.position,
      direction: settings.direction,
      color: settings.color,
      intensity: settings.intensity,
      castShadows: settings.castShadows || false,
      shadowResolution: this.shadowSettings.resolution,
      entity
    };
    
    this.lights.set(id, light);
    
    if (id === 'main') {
      this.mainLight = light;
    }
    
    return light;
  }
  
  public createPointLight(id: string, settings: {
    position: pc.Vec3;
    color: pc.Color;
    intensity: number;
    range: number;
    castShadows?: boolean;
  }): HD2DLight {
    const entity = new pc.Entity(`HD2DLight_${id}`);
    entity.addComponent('light', {
      type: pc.LIGHTTYPE_OMNI,
      color: settings.color,
      intensity: settings.intensity,
      range: settings.range,
      castShadows: settings.castShadows || false,
      shadowBias: this.shadowSettings.bias,
      shadowNormalOffset: this.shadowSettings.normalOffset
    });
    
    entity.setPosition(settings.position);
    this.app.root.addChild(entity);
    
    const light: HD2DLight = {
      id,
      type: 'point',
      position: settings.position,
      direction: new pc.Vec3(0, 0, 0),
      color: settings.color,
      intensity: settings.intensity,
      range: settings.range,
      castShadows: settings.castShadows || false,
      shadowResolution: this.shadowSettings.resolution,
      entity
    };
    
    this.lights.set(id, light);
    return light;
  }
  
  public createSpotLight(id: string, settings: {
    position: pc.Vec3;
    direction: pc.Vec3;
    color: pc.Color;
    intensity: number;
    range: number;
    angle: number;
    castShadows?: boolean;
  }): HD2DLight {
    const entity = new pc.Entity(`HD2DLight_${id}`);
    entity.addComponent('light', {
      type: pc.LIGHTTYPE_SPOT,
      color: settings.color,
      intensity: settings.intensity,
      range: settings.range,
      innerConeAngle: settings.angle * 0.8,
      outerConeAngle: settings.angle,
      castShadows: settings.castShadows || false,
      shadowBias: this.shadowSettings.bias,
      shadowNormalOffset: this.shadowSettings.normalOffset
    });
    
    entity.setPosition(settings.position);
    entity.lookAt(settings.position.clone().add(settings.direction));
    this.app.root.addChild(entity);
    
    const light: HD2DLight = {
      id,
      type: 'spot',
      position: settings.position,
      direction: settings.direction,
      color: settings.color,
      intensity: settings.intensity,
      range: settings.range,
      angle: settings.angle,
      castShadows: settings.castShadows || false,
      shadowResolution: this.shadowSettings.resolution,
      entity
    };
    
    this.lights.set(id, light);
    return light;
  }
  
  public createAmbientLight(id: string, settings: {
    color: pc.Color;
    intensity: number;
  }): HD2DLight {
    const entity = new pc.Entity(`HD2DLight_${id}`);
    entity.addComponent('light', {
      type: pc.LIGHTTYPE_AMBIENT,
      color: settings.color,
      intensity: settings.intensity
    });
    
    this.app.root.addChild(entity);
    
    const light: HD2DLight = {
      id,
      type: 'ambient',
      position: new pc.Vec3(0, 0, 0),
      direction: new pc.Vec3(0, 0, 0),
      color: settings.color,
      intensity: settings.intensity,
      castShadows: false,
      shadowResolution: 0,
      entity
    };
    
    this.lights.set(id, light);
    
    if (id === 'ambient') {
      this.ambientLight = light;
    }
    
    return light;
  }
  
  public update(deltaTime: number): void {
    if (!this.initialized) return;
    
    // Update dynamic lighting
    this.updateDynamicLighting(deltaTime);
    
    // Update character highlights
    this.updateCharacterHighlights(deltaTime);
  }
  
  private updateDynamicLighting(deltaTime: number): void {
    // Update any animated lights
    this.lights.forEach(light => {
      if (light.type === 'point' || light.type === 'spot') {
        // Add subtle animation to point and spot lights
        const time = this.app.getTime() * 0.001;
        const flicker = 1.0 + Math.sin(time * 2.0) * 0.1;
        light.entity.light!.intensity = light.intensity * flicker;
      }
    });
  }
  
  private updateCharacterHighlights(deltaTime: number): void {
    // Update character highlight effects
    this.characterHighlights.forEach((highlight, characterId) => {
      if (highlight.enabled) {
        // Update highlight intensity based on character state
        const time = this.app.getTime() * 0.001;
        const pulse = 1.0 + Math.sin(time * highlight.pulseSpeed) * highlight.pulseIntensity;
        highlight.intensity = highlight.baseIntensity * pulse;
        
        // Apply highlight to character
        this.applyCharacterHighlight(characterId, highlight);
      }
    });
  }
  
  public addCharacterHighlight(characterId: string, settings: {
    color: pc.Color;
    intensity: number;
    pulseSpeed: number;
    pulseIntensity: number;
    enabled: boolean;
  }): void {
    this.characterHighlights.set(characterId, {
      ...settings,
      baseIntensity: settings.intensity
    });
  }
  
  private applyCharacterHighlight(characterId: string, highlight: any): void {
    // Find character entity and apply highlight material
    const character = this.app.root.findByName(characterId);
    if (character && character.render) {
      // Apply rim lighting shader with highlight settings
      if (this.rimLightingShader) {
        const material = this.rimLightingShader.clone();
        material.setParameter('rimColor', highlight.color.data);
        material.setParameter('rimIntensity', highlight.intensity);
        character.render.material = material;
      }
    }
  }
  
  public setShadowQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    const resolutions = {
      low: 512,
      medium: 1024,
      high: 2048,
      ultra: 4096
    };
    
    this.shadowSettings.resolution = resolutions[quality];
    this.shadowSettings.softShadows = quality !== 'low';
    this.shadowSettings.contactShadows = quality === 'ultra';
    
    // Update all shadow-casting lights
    this.lights.forEach(light => {
      if (light.castShadows) {
        light.shadowResolution = this.shadowSettings.resolution;
        // Recreate shadow map with new resolution
        this.createShadowMap();
      }
    });
  }
  
  public setRimLightingSettings(settings: Partial<RimLightingSettings>): void {
    this.rimLightingSettings = { ...this.rimLightingSettings, ...settings };
    
    if (this.rimLightingShader) {
      this.rimLightingShader.setParameter('rimColor', this.rimLightingSettings.color.data);
      this.rimLightingShader.setParameter('rimIntensity', this.rimLightingSettings.intensity);
      this.rimLightingShader.setParameter('rimPower', this.rimLightingSettings.power);
      this.rimLightingShader.setParameter('rimThreshold', this.rimLightingSettings.threshold);
    }
  }
  
  public setLightIntensity(lightId: string, intensity: number): void {
    const light = this.lights.get(lightId);
    if (light) {
      light.intensity = intensity;
      light.entity.light!.intensity = intensity;
    }
  }
  
  public setLightColor(lightId: string, color: pc.Color): void {
    const light = this.lights.get(lightId);
    if (light) {
      light.color = color;
      light.entity.light!.color = color;
    }
  }
  
  public getLight(lightId: string): HD2DLight | undefined {
    return this.lights.get(lightId);
  }
  
  public getAllLights(): HD2DLight[] {
    return Array.from(this.lights.values());
  }
  
  public getLightingStats(): any {
    return {
      lightCount: this.lights.size,
      shadowEnabled: this.shadowSettings.enabled,
      shadowResolution: this.shadowSettings.resolution,
      rimLightingEnabled: this.rimLightingSettings.enabled,
      characterHighlights: this.characterHighlights.size
    };
  }
  
  public destroy(): void {
    // Remove all light entities
    this.lights.forEach(light => {
      if (light.entity.parent) {
        light.entity.parent.removeChild(light.entity);
        light.entity.destroy();
      }
    });
    
    this.lights.clear();
    this.characterHighlights.clear();
    this.shadowMap = null;
    this.rimLightingShader = null;
    this.mainLight = null;
    this.ambientLight = null;
    this.initialized = false;
  }
}