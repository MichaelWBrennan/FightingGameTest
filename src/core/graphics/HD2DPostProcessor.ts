/**
 * HD-2D Post Processor - Post-processing effects for HD-2D rendering
 * Features: Depth of field, bloom, color grading, pixel perfect effects
 */

import * as pc from 'playcanvas';

export interface PostProcessSettings {
  // Depth of Field
  depthOfField: {
    enabled: boolean;
    focusDistance: number;
    aperture: number;
    focalLength: number;
    bokehRadius: number;
  };
  
  // Bloom
  bloom: {
    enabled: boolean;
    threshold: number;
    intensity: number;
    radius: number;
    quality: 'low' | 'medium' | 'high';
  };
  
  // Color Grading
  colorGrading: {
    enabled: boolean;
    exposure: number;
    contrast: number;
    saturation: number;
    temperature: number;
    tint: number;
    gamma: number;
  };
  
  // Pixel Perfect Effects
  pixelPerfect: {
    enabled: boolean;
    pixelScale: number;
    dithering: boolean;
    scanlines: boolean;
    crtEffect: boolean;
  };
  
  // Atmospheric Effects
  atmospheric: {
    enabled: boolean;
    fogDensity: number;
    fogColor: pc.Color;
    fogStart: number;
    fogEnd: number;
  };
}

export class HD2DPostProcessor {
  private app: pc.Application;
  private config: any;
  private initialized: boolean = false;
  
  // Post-processing settings
  private settings: PostProcessSettings;
  
  // Render targets
  private mainRenderTarget: pc.RenderTarget | null = null;
  private bloomRenderTarget: pc.RenderTarget | null = null;
  private dofRenderTarget: pc.RenderTarget | null = null;
  
  // Post-processing materials
  private bloomMaterial: pc.Material | null = null;
  private dofMaterial: pc.Material | null = null;
  private colorGradingMaterial: pc.Material | null = null;
  private pixelPerfectMaterial: pc.Material | null = null;
  private atmosphericMaterial: pc.Material | null = null;
  
  // Quad for post-processing
  private postProcessQuad: pc.Entity | null = null;
  
  constructor(app: pc.Application, config: any) {
    this.app = app;
    this.config = config;
    this.settings = this.createDefaultSettings();
  }
  
  private createDefaultSettings(): PostProcessSettings {
    return {
      depthOfField: {
        enabled: true,
        focusDistance: 15.0,
        aperture: 0.1,
        focalLength: 50.0,
        bokehRadius: 1.5
      },
      bloom: {
        enabled: true,
        threshold: 0.8,
        intensity: 0.5,
        radius: 0.3,
        quality: 'high'
      },
      colorGrading: {
        enabled: true,
        exposure: 0.0,
        contrast: 1.0,
        saturation: 1.0,
        temperature: 0.0,
        tint: 0.0,
        gamma: 2.2
      },
      pixelPerfect: {
        enabled: true,
        pixelScale: 1.0,
        dithering: true,
        scanlines: false,
        crtEffect: false
      },
      atmospheric: {
        enabled: true,
        fogDensity: 0.1,
        fogColor: new pc.Color(0.7, 0.8, 0.9),
        fogStart: 20.0,
        fogEnd: 100.0
      }
    };
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Post Processor...');
    
    try {
      // Create render targets
      await this.createRenderTargets();
      
      // Create post-processing materials
      await this.createPostProcessMaterials();
      
      // Create post-processing quad
      this.createPostProcessQuad();
      
      this.initialized = true;
      console.log('HD-2D Post Processor initialized');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Post Processor:', error);
      throw error;
    }
  }
  
  private async createRenderTargets(): Promise<void> {
    const device = this.app.graphicsDevice;
    const width = device.width;
    const height = device.height;
    
    // Main render target
    this.mainRenderTarget = new pc.RenderTarget(device, {
      colorBuffer: new pc.Texture(device, {
        width: width,
        height: height,
        format: pc.PIXELFORMAT_RGBA8,
        mipmaps: false
      }),
      depthBuffer: new pc.Texture(device, {
        width: width,
        height: height,
        format: pc.PIXELFORMAT_DEPTH,
        mipmaps: false
      })
    });
    
    // Bloom render target
    this.bloomRenderTarget = new pc.RenderTarget(device, {
      colorBuffer: new pc.Texture(device, {
        width: width,
        height: height,
        format: pc.PIXELFORMAT_RGBA8,
        mipmaps: false
      })
    });
    
    // Depth of field render target
    this.dofRenderTarget = new pc.RenderTarget(device, {
      colorBuffer: new pc.Texture(device, {
        width: width,
        height: height,
        format: pc.PIXELFORMAT_RGBA8,
        mipmaps: false
      })
    });
  }
  
  private async createPostProcessMaterials(): Promise<void> {
    // Bloom material
    this.bloomMaterial = this.createBloomMaterial();
    
    // Depth of field material
    this.dofMaterial = this.createDepthOfFieldMaterial();
    
    // Color grading material
    this.colorGradingMaterial = this.createColorGradingMaterial();
    
    // Pixel perfect material
    this.pixelPerfectMaterial = this.createPixelPerfectMaterial();
    
    // Atmospheric material
    this.atmosphericMaterial = this.createAtmosphericMaterial();
  }
  
  private createBloomMaterial(): pc.Material {
    const vertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      
      varying vec2 vUv;
      
      void main() {
        vUv = vertex_texCoord0;
        gl_Position = vec4(vertex_position, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform float bloomThreshold;
      uniform float bloomIntensity;
      uniform float bloomRadius;
      uniform vec2 screenSize;
      
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(texture_diffuseMap, vUv);
        
        // Extract bright areas
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float bloom = smoothstep(bloomThreshold, bloomThreshold + 0.1, brightness);
        
        // Apply bloom
        vec3 bloomColor = color.rgb * bloom * bloomIntensity;
        
        gl_FragColor = vec4(bloomColor, color.a);
      }
    `;
    
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0
      },
      vshader: vertexShader,
      fshader: fragmentShader
    });
    
    const material = new pc.Material();
    material.shader = shader;
    material.setParameter('bloomThreshold', this.settings.bloom.threshold);
    material.setParameter('bloomIntensity', this.settings.bloom.intensity);
    material.setParameter('bloomRadius', this.settings.bloom.radius);
    material.setParameter('screenSize', new Float32Array([this.app.graphicsDevice.width, this.app.graphicsDevice.height]));
    
    return material;
  }
  
  private createDepthOfFieldMaterial(): pc.Material {
    const vertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      
      varying vec2 vUv;
      
      void main() {
        vUv = vertex_texCoord0;
        gl_Position = vec4(vertex_position, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform sampler2D texture_depthMap;
      uniform float focusDistance;
      uniform float aperture;
      uniform float focalLength;
      uniform float bokehRadius;
      uniform vec2 screenSize;
      
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(texture_diffuseMap, vUv);
        float depth = texture2D(texture_depthMap, vUv).r;
        
        // Calculate depth of field
        float focusRange = focalLength * aperture;
        float blur = abs(depth - focusDistance) / focusRange;
        blur = clamp(blur, 0.0, 1.0);
        
        // Apply blur (simplified)
        vec3 blurredColor = color.rgb;
        if (blur > 0.1) {
          // Simple box blur
          vec2 texelSize = 1.0 / screenSize;
          vec3 blurSum = vec3(0.0);
          float blurSamples = 0.0;
          
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * bokehRadius * blur;
              blurSum += texture2D(texture_diffuseMap, vUv + offset).rgb;
              blurSamples += 1.0;
            }
          }
          
          blurredColor = blurSum / blurSamples;
        }
        
        gl_FragColor = vec4(blurredColor, color.a);
      }
    `;
    
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0
      },
      vshader: vertexShader,
      fshader: fragmentShader
    });
    
    const material = new pc.Material();
    material.shader = shader;
    material.setParameter('focusDistance', this.settings.depthOfField.focusDistance);
    material.setParameter('aperture', this.settings.depthOfField.aperture);
    material.setParameter('focalLength', this.settings.depthOfField.focalLength);
    material.setParameter('bokehRadius', this.settings.depthOfField.bokehRadius);
    material.setParameter('screenSize', new Float32Array([this.app.graphicsDevice.width, this.app.graphicsDevice.height]));
    
    return material;
  }
  
  private createColorGradingMaterial(): pc.Material {
    const vertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      
      varying vec2 vUv;
      
      void main() {
        vUv = vertex_texCoord0;
        gl_Position = vec4(vertex_position, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform float exposure;
      uniform float contrast;
      uniform float saturation;
      uniform float temperature;
      uniform float tint;
      uniform float gamma;
      
      varying vec2 vUv;
      
      vec3 adjustTemperature(vec3 color, float temp) {
        vec3 tempColor = vec3(1.0);
        if (temp > 0.0) {
          tempColor = vec3(1.0, 1.0 - temp * 0.3, 1.0 - temp * 0.6);
        } else {
          tempColor = vec3(1.0 + temp * 0.3, 1.0 + temp * 0.6, 1.0);
        }
        return color * tempColor;
      }
      
      vec3 adjustTint(vec3 color, float tint) {
        vec3 tintColor = vec3(1.0);
        if (tint > 0.0) {
          tintColor = vec3(1.0 - tint * 0.3, 1.0, 1.0 - tint * 0.3);
        } else {
          tintColor = vec3(1.0, 1.0 + tint * 0.3, 1.0 + tint * 0.3);
        }
        return color * tintColor;
      }
      
      void main() {
        vec4 color = texture2D(texture_diffuseMap, vUv);
        
        // Apply exposure
        vec3 finalColor = color.rgb * pow(2.0, exposure);
        
        // Apply contrast
        finalColor = (finalColor - 0.5) * contrast + 0.5;
        
        // Apply saturation
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        finalColor = mix(vec3(luminance), finalColor, saturation);
        
        // Apply temperature
        finalColor = adjustTemperature(finalColor, temperature);
        
        // Apply tint
        finalColor = adjustTint(finalColor, tint);
        
        // Apply gamma correction
        finalColor = pow(finalColor, vec3(1.0 / gamma));
        
        gl_FragColor = vec4(finalColor, color.a);
      }
    `;
    
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0
      },
      vshader: vertexShader,
      fshader: fragmentShader
    });
    
    const material = new pc.Material();
    material.shader = shader;
    material.setParameter('exposure', this.settings.colorGrading.exposure);
    material.setParameter('contrast', this.settings.colorGrading.contrast);
    material.setParameter('saturation', this.settings.colorGrading.saturation);
    material.setParameter('temperature', this.settings.colorGrading.temperature);
    material.setParameter('tint', this.settings.colorGrading.tint);
    material.setParameter('gamma', this.settings.colorGrading.gamma);
    
    return material;
  }
  
  private createPixelPerfectMaterial(): pc.Material {
    const vertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      
      varying vec2 vUv;
      
      void main() {
        vUv = vertex_texCoord0;
        gl_Position = vec4(vertex_position, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform float pixelScale;
      uniform bool dithering;
      uniform bool scanlines;
      uniform bool crtEffect;
      uniform vec2 screenSize;
      
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(texture_diffuseMap, vUv);
        
        // Pixel perfect dithering
        if (dithering) {
          vec2 pixelPos = gl_FragCoord.xy * pixelScale;
          float dither = (fract(sin(dot(pixelPos, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.1;
          color.rgb += dither;
        }
        
        // Scanlines effect
        if (scanlines) {
          float scanline = sin(gl_FragCoord.y * 0.1) * 0.1 + 0.9;
          color.rgb *= scanline;
        }
        
        // CRT effect
        if (crtEffect) {
          vec2 crtUV = vUv * 2.0 - 1.0;
          float crtDistortion = length(crtUV) * 0.1;
          vec2 crtOffset = crtUV * (1.0 + crtDistortion);
          color = texture2D(texture_diffuseMap, crtOffset * 0.5 + 0.5);
        }
        
        gl_FragColor = color;
      }
    `;
    
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0
      },
      vshader: vertexShader,
      fshader: fragmentShader
    });
    
    const material = new pc.Material();
    material.shader = shader;
    material.setParameter('pixelScale', this.settings.pixelPerfect.pixelScale);
    material.setParameter('dithering', this.settings.pixelPerfect.dithering);
    material.setParameter('scanlines', this.settings.pixelPerfect.scanlines);
    material.setParameter('crtEffect', this.settings.pixelPerfect.crtEffect);
    material.setParameter('screenSize', new Float32Array([this.app.graphicsDevice.width, this.app.graphicsDevice.height]));
    
    return material;
  }
  
  private createAtmosphericMaterial(): pc.Material {
    const vertexShader = `
      attribute vec3 vertex_position;
      attribute vec2 vertex_texCoord0;
      
      varying vec2 vUv;
      
      void main() {
        vUv = vertex_texCoord0;
        gl_Position = vec4(vertex_position, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D texture_diffuseMap;
      uniform sampler2D texture_depthMap;
      uniform float fogDensity;
      uniform vec3 fogColor;
      uniform float fogStart;
      uniform float fogEnd;
      
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(texture_diffuseMap, vUv);
        float depth = texture2D(texture_depthMap, vUv).r;
        
        // Calculate fog factor
        float fogFactor = smoothstep(fogStart, fogEnd, depth);
        fogFactor = 1.0 - exp(-fogDensity * fogFactor);
        
        // Apply fog
        vec3 finalColor = mix(fogColor, color.rgb, fogFactor);
        
        gl_FragColor = vec4(finalColor, color.a);
      }
    `;
    
    const shader = new pc.Shader(this.app.graphicsDevice, {
      attributes: {
        vertex_position: pc.SEMANTIC_POSITION,
        vertex_texCoord0: pc.SEMANTIC_TEXCOORD0
      },
      vshader: vertexShader,
      fshader: fragmentShader
    });
    
    const material = new pc.Material();
    material.shader = shader;
    material.setParameter('fogDensity', this.settings.atmospheric.fogDensity);
    material.setParameter('fogColor', this.settings.atmospheric.fogColor.data);
    material.setParameter('fogStart', this.settings.atmospheric.fogStart);
    material.setParameter('fogEnd', this.settings.atmospheric.fogEnd);
    
    return material;
  }
  
  private createPostProcessQuad(): void {
    // Create a full-screen quad for post-processing
    this.postProcessQuad = new pc.Entity('PostProcessQuad');
    
    // Create quad mesh
    const quadMesh = pc.createPlane(this.app.graphicsDevice, {
      width: 2,
      height: 2
    });
    
    this.postProcessQuad.addComponent('model', {
      meshInstances: [new pc.MeshInstance(quadMesh, this.pixelPerfectMaterial!)]
    });
    
    this.app.root.addChild(this.postProcessQuad);
  }
  
  public update(deltaTime: number): void {
    if (!this.initialized) return;
    
    // Update post-processing parameters
    this.updatePostProcessParameters();
  }
  
  private updatePostProcessParameters(): void {
    // Update screen size parameters
    const screenSize = new Float32Array([this.app.graphicsDevice.width, this.app.graphicsDevice.height]);
    
    if (this.bloomMaterial) {
      this.bloomMaterial.setParameter('screenSize', screenSize);
    }
    
    if (this.dofMaterial) {
      this.dofMaterial.setParameter('screenSize', screenSize);
    }
    
    if (this.pixelPerfectMaterial) {
      this.pixelPerfectMaterial.setParameter('screenSize', screenSize);
    }
  }
  
  public setDepthOfField(enabled: boolean): void {
    this.settings.depthOfField.enabled = enabled;
  }
  
  public setBloom(enabled: boolean): void {
    this.settings.bloom.enabled = enabled;
  }
  
  public setColorGrading(enabled: boolean): void {
    this.settings.colorGrading.enabled = enabled;
  }
  
  public setPixelPerfectSettings(settings: Partial<PostProcessSettings['pixelPerfect']>): void {
    this.settings.pixelPerfect = { ...this.settings.pixelPerfect, ...settings };
    
    if (this.pixelPerfectMaterial) {
      this.pixelPerfectMaterial.setParameter('pixelScale', this.settings.pixelPerfect.pixelScale);
      this.pixelPerfectMaterial.setParameter('dithering', this.settings.pixelPerfect.dithering);
      this.pixelPerfectMaterial.setParameter('scanlines', this.settings.pixelPerfect.scanlines);
      this.pixelPerfectMaterial.setParameter('crtEffect', this.settings.pixelPerfect.crtEffect);
    }
  }
  
  public setAtmosphericSettings(settings: Partial<PostProcessSettings['atmospheric']>): void {
    this.settings.atmospheric = { ...this.settings.atmospheric, ...settings };
    
    if (this.atmosphericMaterial) {
      this.atmosphericMaterial.setParameter('fogDensity', this.settings.atmospheric.fogDensity);
      this.atmosphericMaterial.setParameter('fogColor', this.settings.atmospheric.fogColor.data);
      this.atmosphericMaterial.setParameter('fogStart', this.settings.atmospheric.fogStart);
      this.atmosphericMaterial.setParameter('fogEnd', this.settings.atmospheric.fogEnd);
    }
  }
  
  public getSettings(): PostProcessSettings {
    return this.settings;
  }
  
  public destroy(): void {
    // Clean up render targets
    if (this.mainRenderTarget) {
      this.mainRenderTarget.destroy();
    }
    if (this.bloomRenderTarget) {
      this.bloomRenderTarget.destroy();
    }
    if (this.dofRenderTarget) {
      this.dofRenderTarget.destroy();
    }
    
    // Clean up materials
    this.bloomMaterial = null;
    this.dofMaterial = null;
    this.colorGradingMaterial = null;
    this.pixelPerfectMaterial = null;
    this.atmosphericMaterial = null;
    
    // Clean up quad
    if (this.postProcessQuad) {
      this.postProcessQuad.destroy();
    }
    
    this.initialized = false;
  }
}