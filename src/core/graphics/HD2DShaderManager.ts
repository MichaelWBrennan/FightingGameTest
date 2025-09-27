/**
 * HD-2D Shader Manager - Manages HD-2D specific shaders and materials
 * Provides pixel-perfect rendering, depth-based effects, and HD-2D visual features
 */

import * as pc from 'playcanvas';

export interface HD2DMaterial {
  id: string;
  shader: pc.Shader;
  material: pc.Material;
  parameters: Map<string, any>;
  layerType: string;
  entityType: string;
}

export interface PixelPerfectSettings {
  enabled: boolean;
  pixelScale: number;
  snapToPixels: boolean;
  subPixelPositioning: boolean;
}

export class HD2DShaderManager {
  private app: pc.Application;
  private config: any;
  private initialized: boolean = false;
  
  // Shader cache
  private shaders: Map<string, pc.Shader> = new Map();
  private materials: Map<string, HD2DMaterial> = new Map();
  
  // Pixel perfect settings
  private pixelPerfectSettings: PixelPerfectSettings;
  
  // Common shader templates
  private baseVertexShader: string;
  private baseFragmentShader: string;
  
  constructor(app: pc.Application, config: any) {
    this.app = app;
    this.config = config;
    this.pixelPerfectSettings = {
      enabled: true,
      pixelScale: 1.0,
      snapToPixels: true,
      subPixelPositioning: false
    };
    this.initializeShaderTemplates();
  }
  
  private initializeShaderTemplates(): void {
    // Base vertex shader for HD-2D
    this.baseVertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      attribute vec3 vertex_normal;
      attribute vec4 vertex_color;
      
      uniform mat4 matrix_model;
      uniform mat4 matrix_view;
      uniform mat4 matrix_projection;
      uniform vec3 cameraPosition;
      uniform float pixelScale;
      uniform vec2 screenSize;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec4 vColor;
      varying vec3 vViewDirection;
      varying float vDepth;
      
      void main() {
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize((matrix_model * vec4(vertex_normal, 0.0)).xyz);
        vUv = vertex_texCoord0;
        vColor = vertex_color;
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        
        // Calculate depth for HD-2D effects
        vDepth = length(worldPosition.xyz - cameraPosition);
        
        // Pixel perfect positioning
        vec4 clipPosition = matrix_projection * matrix_view * worldPosition;
        if (pixelScale > 0.0) {
          clipPosition.xy = floor(clipPosition.xy * pixelScale + 0.5) / pixelScale;
        }
        
        gl_Position = clipPosition;
      }
    `;
    
    // Base fragment shader for HD-2D
    this.baseFragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform sampler2D texture_normalMap;
      uniform sampler2D texture_emissiveMap;
      uniform vec3 lightDirection;
      uniform vec3 lightColor;
      uniform float lightIntensity;
      uniform vec3 ambientColor;
      uniform float ambientIntensity;
      uniform float pixelScale;
      uniform vec2 screenSize;
      uniform float time;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec4 vColor;
      varying vec3 vViewDirection;
      varying float vDepth;
      
      // HD-2D specific functions
      vec3 applyPixelPerfectLighting(vec3 color, vec3 normal, vec3 lightDir) {
        // Simplified lighting for pixel art style
        float NdotL = max(0.0, dot(normal, lightDir));
        return color * (ambientColor * ambientIntensity + lightColor * lightIntensity * NdotL);
      }
      
      vec3 applyRimLighting(vec3 color, vec3 normal, vec3 viewDir) {
        float rim = 1.0 - max(0.0, dot(viewDir, normal));
        rim = pow(rim, 2.0);
        return color + vec3(0.8, 0.9, 1.0) * rim * 0.3;
      }
      
      vec3 applyAtmosphericPerspective(vec3 color, float depth) {
        float fogFactor = smoothstep(20.0, 100.0, depth);
        vec3 fogColor = vec3(0.7, 0.8, 0.9);
        return mix(color, fogColor, fogFactor * 0.3);
      }
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        vec3 finalColor = baseColor.rgb * vColor.rgb;
        
        // Apply HD-2D lighting
        finalColor = applyPixelPerfectLighting(finalColor, vNormal, lightDirection);
        
        // Apply rim lighting
        finalColor = applyRimLighting(finalColor, vNormal, vViewDirection);
        
        // Apply atmospheric perspective
        finalColor = applyAtmosphericPerspective(finalColor, vDepth);
        
        // Pixel perfect dithering
        if (pixelScale > 0.0) {
          vec2 pixelPos = gl_FragCoord.xy * pixelScale;
          float dither = (fract(sin(dot(pixelPos, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.1;
          finalColor += dither;
        }
        
        gl_FragColor = vec4(finalColor, baseColor.a * vColor.a);
      }
    `;
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Shader Manager...');
    
    try {
      // Create common HD-2D shaders
      await this.createCommonShaders();
      
      // Create material presets
      await this.createMaterialPresets();
      
      this.initialized = true;
      console.log('HD-2D Shader Manager initialized');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Shader Manager:', error);
      throw error;
    }
  }
  
  private async createCommonShaders(): Promise<void> {
    // Character shader
    const characterShader = this.createShader('character', {
      vertex: this.baseVertexShader,
      fragment: this.createCharacterFragmentShader()
    });
    
    // Stage background shader
    const stageShader = this.createShader('stage', {
      vertex: this.baseVertexShader,
      fragment: this.createStageFragmentShader()
    });
    
    // Effect shader
    const effectShader = this.createShader('effect', {
      vertex: this.baseVertexShader,
      fragment: this.createEffectFragmentShader()
    });
    
    // UI shader (for non-UI elements that need UI-like rendering)
    const uiShader = this.createShader('ui', {
      vertex: this.createUIVertexShader(),
      fragment: this.createUIFragmentShader()
    });
  }
  
  private createShader(name: string, shaders: { vertex: string; fragment: string }): pc.Shader {
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0,
        vertex_normal: pc.SEMANTIC_NORMAL,
        vertex_color: pc.SEMANTIC_COLOR
      },
      vshader: shaders.vertex,
      fshader: shaders.fragment
    });
    
    this.shaders.set(name, shader);
    return shader;
  }
  
  private createCharacterFragmentShader(): string {
    return `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform sampler2D texture_normalMap;
      uniform vec3 lightDirection;
      uniform vec3 lightColor;
      uniform float lightIntensity;
      uniform vec3 ambientColor;
      uniform float ambientIntensity;
      uniform float time;
      uniform float pixelScale;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec4 vColor;
      varying vec3 vViewDirection;
      varying float vDepth;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        vec3 normal = normalize(vNormal);
        
        // Character-specific lighting
        float NdotL = max(0.0, dot(normal, lightDirection));
        vec3 lighting = ambientColor * ambientIntensity + lightColor * lightIntensity * NdotL;
        
        // Character rim lighting
        float rim = 1.0 - max(0.0, dot(vViewDirection, normal));
        rim = pow(rim, 2.0);
        vec3 rimColor = vec3(0.8, 0.9, 1.0) * rim * 0.4;
        
        // Character highlight effect
        float highlight = step(0.8, NdotL);
        vec3 highlightColor = vec3(1.0, 1.0, 0.9) * highlight * 0.3;
        
        vec3 finalColor = baseColor.rgb * lighting + rimColor + highlightColor;
        
        // Pixel perfect dithering for character
        if (pixelScale > 0.0) {
          vec2 pixelPos = gl_FragCoord.xy * pixelScale;
          float dither = (fract(sin(dot(pixelPos, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.05;
          finalColor += dither;
        }
        
        gl_FragColor = vec4(finalColor, baseColor.a * vColor.a);
      }
    `;
  }
  
  private createStageFragmentShader(): string {
    return `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform vec3 lightDirection;
      uniform vec3 lightColor;
      uniform float lightIntensity;
      uniform vec3 ambientColor;
      uniform float ambientIntensity;
      uniform float time;
      uniform float pixelScale;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec4 vColor;
      varying vec3 vViewDirection;
      varying float vDepth;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        vec3 normal = normalize(vNormal);
        
        // Stage-specific lighting (more subtle)
        float NdotL = max(0.0, dot(normal, lightDirection));
        vec3 lighting = ambientColor * ambientIntensity + lightColor * lightIntensity * NdotL * 0.7;
        
        // Atmospheric perspective for stage elements
        float fogFactor = smoothstep(20.0, 100.0, vDepth);
        vec3 fogColor = vec3(0.6, 0.7, 0.8);
        vec3 atmosphericColor = mix(baseColor.rgb, fogColor, fogFactor * 0.4);
        
        vec3 finalColor = atmosphericColor * lighting;
        
        // Stage-specific dithering
        if (pixelScale > 0.0) {
          vec2 pixelPos = gl_FragCoord.xy * pixelScale;
          float dither = (fract(sin(dot(pixelPos, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.08;
          finalColor += dither;
        }
        
        gl_FragColor = vec4(finalColor, baseColor.a * vColor.a);
      }
    `;
  }
  
  private createEffectFragmentShader(): string {
    return `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform vec3 lightDirection;
      uniform vec3 lightColor;
      uniform float lightIntensity;
      uniform float time;
      uniform float pixelScale;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec4 vColor;
      varying vec3 vViewDirection;
      varying float vDepth;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        
        // Effect-specific rendering (additive blending)
        vec3 finalColor = baseColor.rgb * vColor.rgb;
        
        // Animated effects
        float animation = sin(time * 2.0 + vWorldPosition.x * 0.1) * 0.5 + 0.5;
        finalColor *= (0.8 + 0.4 * animation);
        
        // Glow effect
        float glow = 1.0 + sin(time * 3.0) * 0.2;
        finalColor *= glow;
        
        gl_FragColor = vec4(finalColor, baseColor.a * vColor.a);
      }
    `;
  }
  
  private createUIVertexShader(): string {
    return `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      attribute vec4 vertex_color;
      
      uniform mat4 matrix_model;
      uniform mat4 matrix_view;
      uniform mat4 matrix_projection;
      uniform float pixelScale;
      
      varying vec2 vUv;
      varying vec4 vColor;
      
      void main() {
        vUv = vertex_texCoord0;
        vColor = vertex_color;
        
        vec4 clipPosition = matrix_projection * matrix_view * matrix_model * vec4(vertex_position, 1.0);
        
        // Pixel perfect positioning for UI elements
        if (pixelScale > 0.0) {
          clipPosition.xy = floor(clipPosition.xy * pixelScale + 0.5) / pixelScale;
        }
        
        gl_Position = clipPosition;
      }
    `;
  }
  
  private createUIFragmentShader(): string {
    return `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform float pixelScale;
      
      varying vec2 vUv;
      varying vec4 vColor;
      
      void main() {
        vec4 baseColor = texture2D(texture_diffuseMap, vUv);
        vec3 finalColor = baseColor.rgb * vColor.rgb;
        
        // Sharp pixel art rendering for UI elements
        if (pixelScale > 0.0) {
          vec2 pixelPos = gl_FragCoord.xy * pixelScale;
          float dither = (fract(sin(dot(pixelPos, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;
          finalColor += dither;
        }
        
        gl_FragColor = vec4(finalColor, baseColor.a * vColor.a);
      }
    `;
  }
  
  private async createMaterialPresets(): Promise<void> {
    // Character material
    this.createMaterial('character', 'character', {
      layerType: 'characters',
      entityType: 'character'
    });
    
    // Stage background material
    this.createMaterial('stage_background', 'stage', {
      layerType: 'far_background',
      entityType: 'stage'
    });
    
    // Stage midground material
    this.createMaterial('stage_midground', 'stage', {
      layerType: 'mid_background',
      entityType: 'stage'
    });
    
    // Stage foreground material
    this.createMaterial('stage_foreground', 'stage', {
      layerType: 'near_background',
      entityType: 'stage'
    });
    
    // Effect material
    this.createMaterial('effect', 'effect', {
      layerType: 'effects',
      entityType: 'effect'
    });
    
    // UI material
    this.createMaterial('ui', 'ui', {
      layerType: 'ui',
      entityType: 'ui'
    });
  }
  
  private createMaterial(id: string, shaderName: string, settings: {
    layerType: string;
    entityType: string;
  }): HD2DMaterial {
    const shader = this.shaders.get(shaderName);
    if (!shader) {
      throw new Error(`Shader ${shaderName} not found`);
    }
    
    const material = new pc.Material();
    material.shader = shader;
    
    // Set default parameters
    material.setParameter('pixelScale', this.pixelPerfectSettings.pixelScale);
    material.setParameter('screenSize', new Float32Array([this.app.graphicsDevice.width, this.app.graphicsDevice.height]));
    material.setParameter('lightDirection', new Float32Array([0.3, -0.8, 0.5]));
    material.setParameter('lightColor', new Float32Array([1.0, 0.95, 0.9]));
    material.setParameter('lightIntensity', 1.2);
    material.setParameter('ambientColor', new Float32Array([0.3, 0.4, 0.5]));
    material.setParameter('ambientIntensity', 0.4);
    material.setParameter('time', 0.0);
    
    const hd2dMaterial: HD2DMaterial = {
      id,
      shader,
      material,
      parameters: new Map(),
      layerType: settings.layerType,
      entityType: settings.entityType
    };
    
    this.materials.set(id, hd2dMaterial);
    return hd2dMaterial;
  }
  
  public getHD2DMaterial(entity: pc.Entity, layer: any): pc.Material | null {
    // Determine material type based on entity and layer
    let materialType = 'stage';
    
    if (entity.name.includes('character') || entity.name.includes('fighter')) {
      materialType = 'character';
    } else if (entity.name.includes('effect') || entity.name.includes('particle')) {
      materialType = 'effect';
    } else if (layer.id.includes('far')) {
      materialType = 'stage_background';
    } else if (layer.id.includes('mid')) {
      materialType = 'stage_midground';
    } else if (layer.id.includes('near')) {
      materialType = 'stage_foreground';
    }
    
    const hd2dMaterial = this.materials.get(materialType);
    return hd2dMaterial ? hd2dMaterial.material : null;
  }
  
  public update(deltaTime: number): void {
    if (!this.initialized) return;
    
    // Update time parameter for animated effects
    const time = this.app.getTime() * 0.001;
    this.materials.forEach(material => {
      material.material.setParameter('time', time);
    });
  }
  
  public setPixelPerfectSettings(settings: Partial<PixelPerfectSettings>): void {
    this.pixelPerfectSettings = { ...this.pixelPerfectSettings, ...settings };
    
    // Update all materials with new pixel scale
    this.materials.forEach(material => {
      material.material.setParameter('pixelScale', this.pixelPerfectSettings.pixelScale);
    });
  }
  
  public setLightingParameters(lightDirection: pc.Vec3, lightColor: pc.Color, lightIntensity: number): void {
    this.materials.forEach(material => {
      material.material.setParameter('lightDirection', lightDirection.data);
      material.material.setParameter('lightColor', lightColor.data);
      material.material.setParameter('lightIntensity', lightIntensity);
    });
  }
  
  public setAmbientParameters(ambientColor: pc.Color, ambientIntensity: number): void {
    this.materials.forEach(material => {
      material.material.setParameter('ambientColor', ambientColor.data);
      material.material.setParameter('ambientIntensity', ambientIntensity);
    });
  }
  
  public getMaterial(id: string): HD2DMaterial | undefined {
    return this.materials.get(id);
  }
  
  public getAllMaterials(): HD2DMaterial[] {
    return Array.from(this.materials.values());
  }
  
  public getShaderStats(): any {
    return {
      shaderCount: this.shaders.size,
      materialCount: this.materials.size,
      pixelPerfectEnabled: this.pixelPerfectSettings.enabled,
      pixelScale: this.pixelPerfectSettings.pixelScale
    };
  }
  
  public destroy(): void {
    this.shaders.clear();
    this.materials.clear();
    this.initialized = false;
  }
}