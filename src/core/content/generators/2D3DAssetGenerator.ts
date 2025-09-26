import { pc } from 'playcanvas';
import { Logger } from '../../utils/Logger';
import { ContentGenerationConfig, GeneratedContent } from '../ContentGenerationManager';

export interface Asset2D3DOptions {
  dimensions: '2d' | '3d' | '2.5d';
  type: 'sprite' | 'model' | 'texture' | 'material' | 'shader' | 'animation' | 'effect';
  style: 'pixel' | 'hand_drawn' | 'low_poly' | 'high_poly' | 'realistic' | 'stylized' | 'procedural';
  theme: 'arcane' | 'divine' | 'elemental' | 'shadow' | 'nature' | 'crystal' | 'void' | 'celestial' | 'infernal' | 'primal';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  platform: 'web' | 'mobile' | 'desktop' | 'console';
  format: 'png' | 'jpg' | 'gif' | 'svg' | 'webp' | 'obj' | 'fbx' | 'gltf' | 'glb' | 'dae' | 'blend';
  animated?: boolean;
  interactive?: boolean;
  optimized?: boolean;
}

export interface GeneratedAsset2D3D {
  id: string;
  name: string;
  description: string;
  dimensions: '2d' | '3d' | '2.5d';
  type: string;
  style: string;
  theme: string;
  quality: string;
  platform: string;
  format: string;
  properties: {
    width: number;
    height: number;
    depth?: number;
    vertices?: number;
    triangles?: number;
    textures?: number;
    materials?: number;
    animations?: number;
    fileSize: number;
    compression: string;
    optimization: string[];
  };
  files: Array<{
    type: string;
    path: string;
    size: number;
    format: string;
    platform: string;
    optimized: boolean;
  }>;
  metadata: {
    created: number;
    modified: number;
    version: string;
    tags: string[];
    category: string;
    subcategory: string;
    technical: {
      renderPipeline: string;
      shaderModel: string;
      textureFormat: string;
      compressionRatio: number;
      memoryUsage: number;
    };
  };
}

export class Asset2D3DGenerator {
  private app: pc.Application;
  private spriteGenerator: Sprite2DGenerator;
  private modelGenerator: Model3DGenerator;
  private textureGenerator: TextureGenerator;
  private materialGenerator: MaterialGenerator;
  private shaderGenerator: ShaderGenerator;
  private animationGenerator: AnimationGenerator;
  private effectGenerator: EffectGenerator;

  constructor(app: pc.Application) {
    this.app = app;
    this.spriteGenerator = new Sprite2DGenerator();
    this.modelGenerator = new Model3DGenerator();
    this.textureGenerator = new TextureGenerator();
    this.materialGenerator = new MaterialGenerator();
    this.shaderGenerator = new ShaderGenerator();
    this.animationGenerator = new AnimationGenerator();
    this.effectGenerator = new EffectGenerator();
  }

  public async generateAsset(
    options: Asset2D3DOptions,
    config: ContentGenerationConfig
  ): Promise<GeneratedContent | null> {
    try {
      let assetData: GeneratedAsset2D3D;

      switch (options.dimensions) {
        case '2d':
          assetData = await this.generate2DAsset(options, config);
          break;
        case '3d':
          assetData = await this.generate3DAsset(options, config);
          break;
        case '2.5d':
          assetData = await this.generate2_5DAsset(options, config);
          break;
        default:
          throw new Error(`Unsupported dimensions: ${options.dimensions}`);
      }

      const content: GeneratedContent = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'asset',
        name: assetData.name,
        description: assetData.description,
        data: assetData,
        metadata: {
          generatedAt: Date.now(),
          generator: 'Asset2D3DGenerator',
          config,
          quality: this.calculateQuality(assetData),
          tags: this.generateTags(assetData)
        },
        assets: {
          sprites: this.extractSpriteAssets(assetData),
          sounds: this.extractSoundAssets(assetData),
          animations: this.extractAnimationAssets(assetData),
          effects: this.extractEffectAssets(assetData)
        }
      };

      return content;
    } catch (error) {
      Logger.error('Error generating 2D/3D asset:', error);
      return null;
    }
  }

  private async generate2DAsset(options: Asset2D3DOptions, config: ContentGenerationConfig): Promise<GeneratedAsset2D3D> {
    const name = this.generateAssetName(options);
    const description = this.generateAssetDescription(options);
    
    const properties = this.generate2DProperties(options);
    const files = this.generate2DFiles(options);
    const metadata = this.generateMetadata(options);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      dimensions: '2d',
      type: options.type,
      style: options.style,
      theme: options.theme,
      quality: options.quality,
      platform: options.platform,
      format: options.format,
      properties,
      files,
      metadata
    };
  }

  private async generate3DAsset(options: Asset2D3DOptions, config: ContentGenerationConfig): Promise<GeneratedAsset2D3D> {
    const name = this.generateAssetName(options);
    const description = this.generateAssetDescription(options);
    
    const properties = this.generate3DProperties(options);
    const files = this.generate3DFiles(options);
    const metadata = this.generateMetadata(options);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      dimensions: '3d',
      type: options.type,
      style: options.style,
      theme: options.theme,
      quality: options.quality,
      platform: options.platform,
      format: options.format,
      properties,
      files,
      metadata
    };
  }

  private async generate2_5DAsset(options: Asset2D3DOptions, config: ContentGenerationConfig): Promise<GeneratedAsset2D3D> {
    const name = this.generateAssetName(options);
    const description = this.generateAssetDescription(options);
    
    const properties = this.generate2_5DProperties(options);
    const files = this.generate2_5DFiles(options);
    const metadata = this.generateMetadata(options);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      dimensions: '2.5d',
      type: options.type,
      style: options.style,
      theme: options.theme,
      quality: options.quality,
      platform: options.platform,
      format: options.format,
      properties,
      files,
      metadata
    };
  }

  private generateAssetName(options: Asset2D3DOptions): string {
    const typeNames: Record<string, string[]> = {
      sprite: ['Sprite', 'Image', 'Graphic', 'Icon'],
      model: ['Model', 'Mesh', 'Object', 'Asset'],
      texture: ['Texture', 'Map', 'Surface', 'Material'],
      material: ['Material', 'Shader', 'Surface', 'Finish'],
      shader: ['Shader', 'Effect', 'Program', 'Code'],
      animation: ['Animation', 'Motion', 'Sequence', 'Clip'],
      effect: ['Effect', 'Particle', 'Visual', 'FX']
    };

    const styleNames: Record<string, string[]> = {
      pixel: ['Pixel', '8-bit', 'Retro', 'Classic'],
      hand_drawn: ['Hand-drawn', 'Sketch', 'Artistic', 'Drawn'],
      low_poly: ['Low-poly', 'Minimal', 'Simple', 'Clean'],
      high_poly: ['High-poly', 'Detailed', 'Complex', 'Realistic'],
      realistic: ['Realistic', 'Photorealistic', 'Lifelike', 'Natural'],
      stylized: ['Stylized', 'Artistic', 'Unique', 'Custom'],
      procedural: ['Procedural', 'Generated', 'Algorithmic', 'Dynamic']
    };

    const themeNames: Record<string, string[]> = {
      arcane: ['Arcane', 'Mystic', 'Eldritch', 'Magical'],
      divine: ['Divine', 'Holy', 'Sacred', 'Celestial'],
      elemental: ['Elemental', 'Primal', 'Natural', 'Elemental'],
      shadow: ['Shadow', 'Dark', 'Void', 'Shadowy'],
      nature: ['Nature', 'Wild', 'Organic', 'Natural'],
      crystal: ['Crystal', 'Gem', 'Crystalline', 'Diamond'],
      void: ['Void', 'Abyssal', 'Null', 'Empty'],
      celestial: ['Celestial', 'Heavenly', 'Stellar', 'Cosmic'],
      infernal: ['Infernal', 'Hellish', 'Demonic', 'Fiery'],
      primal: ['Primal', 'Savage', 'Wild', 'Beastly']
    };

    const dimensionNames: Record<string, string[]> = {
      '2d': ['2D', 'Flat', 'Planar', 'Two-dimensional'],
      '3d': ['3D', 'Volumetric', 'Spatial', 'Three-dimensional'],
      '2.5d': ['2.5D', 'Isometric', 'Pseudo-3D', 'Perspective']
    };

    const typeOptions = typeNames[options.type] || ['Asset'];
    const styleOptions = styleNames[options.style] || ['Custom'];
    const themeOptions = themeNames[options.theme] || ['Elemental'];
    const dimensionOptions = dimensionNames[options.dimensions] || ['Asset'];

    const typeName = typeOptions[Math.floor(Math.random() * typeOptions.length)];
    const styleName = styleOptions[Math.floor(Math.random() * styleOptions.length)];
    const themeName = themeOptions[Math.floor(Math.random() * themeOptions.length)];
    const dimensionName = dimensionOptions[Math.floor(Math.random() * dimensionOptions.length)];

    return `${dimensionName} ${styleName} ${themeName} ${typeName}`;
  }

  private generateAssetDescription(options: Asset2D3DOptions): string {
    const dimensionDescriptions: Record<string, string> = {
      '2d': 'A two-dimensional asset',
      '3d': 'A three-dimensional asset',
      '2.5d': 'A 2.5-dimensional asset with depth and perspective'
    };

    const typeDescriptions: Record<string, string> = {
      sprite: 'A visual graphic element',
      model: 'A 3D mesh or object',
      texture: 'A surface texture or material map',
      material: 'A material definition with properties',
      shader: 'A shader program for rendering',
      animation: 'An animated sequence',
      effect: 'A visual or particle effect'
    };

    const styleDescriptions: Record<string, string> = {
      pixel: 'with a retro pixel art style',
      hand_drawn: 'with a hand-drawn artistic style',
      low_poly: 'with a low-polygon minimalist style',
      high_poly: 'with a high-polygon detailed style',
      realistic: 'with a realistic and lifelike style',
      stylized: 'with a unique stylized appearance',
      procedural: 'with a procedurally generated style'
    };

    const themeDescriptions: Record<string, string> = {
      arcane: 'featuring arcane and mystical elements',
      divine: 'featuring divine and holy elements',
      elemental: 'featuring elemental and natural forces',
      shadow: 'featuring shadow and dark elements',
      nature: 'featuring nature and organic elements',
      crystal: 'featuring crystal and gem elements',
      void: 'featuring void and abyssal elements',
      celestial: 'featuring celestial and heavenly elements',
      infernal: 'featuring infernal and hellish elements',
      primal: 'featuring primal and savage elements'
    };

    const dimensionDesc = dimensionDescriptions[options.dimensions] || 'An asset';
    const typeDesc = typeDescriptions[options.type] || 'A visual asset';
    const styleDesc = styleDescriptions[options.style] || 'with a custom style';
    const themeDesc = themeDescriptions[options.theme] || 'with elemental themes';

    return `${dimensionDesc} ${typeDesc} ${styleDesc} ${themeDesc}.`;
  }

  private generate2DProperties(options: Asset2D3DOptions): any {
    const sizeMultipliers: Record<string, number> = {
      small: 0.5,
      medium: 1.0,
      large: 2.0,
      huge: 4.0
    };

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const baseSize = 64;
    const multiplier = sizeMultipliers[options.size] || 1.0;
    const qualityMultiplier = qualityMultipliers[options.quality] || 1.0;

    const width = Math.round(baseSize * multiplier * qualityMultiplier);
    const height = Math.round(baseSize * multiplier * qualityMultiplier);

    return {
      width,
      height,
      fileSize: this.calculate2DFileSize(width, height, options),
      compression: this.getCompression(options.quality),
      optimization: this.get2DOptimization(options)
    };
  }

  private generate3DProperties(options: Asset2D3DOptions): any {
    const sizeMultipliers: Record<string, number> = {
      small: 0.5,
      medium: 1.0,
      large: 2.0,
      huge: 4.0
    };

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const baseSize = 64;
    const multiplier = sizeMultipliers[options.size] || 1.0;
    const qualityMultiplier = qualityMultipliers[options.quality] || 1.0;

    const width = Math.round(baseSize * multiplier * qualityMultiplier);
    const height = Math.round(baseSize * multiplier * qualityMultiplier);
    const depth = Math.round(baseSize * multiplier * qualityMultiplier);

    const vertices = this.calculateVertexCount(options);
    const triangles = Math.floor(vertices / 3);

    return {
      width,
      height,
      depth,
      vertices,
      triangles,
      textures: this.calculateTextureCount(options),
      materials: this.calculateMaterialCount(options),
      animations: options.animated ? this.calculateAnimationCount(options) : 0,
      fileSize: this.calculate3DFileSize(vertices, options),
      compression: this.getCompression(options.quality),
      optimization: this.get3DOptimization(options)
    };
  }

  private generate2_5DProperties(options: Asset2D3DOptions): any {
    const sizeMultipliers: Record<string, number> = {
      small: 0.5,
      medium: 1.0,
      large: 2.0,
      huge: 4.0
    };

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const baseSize = 64;
    const multiplier = sizeMultipliers[options.size] || 1.0;
    const qualityMultiplier = qualityMultipliers[options.quality] || 1.0;

    const width = Math.round(baseSize * multiplier * qualityMultiplier);
    const height = Math.round(baseSize * multiplier * qualityMultiplier);
    const depth = Math.round(baseSize * multiplier * qualityMultiplier * 0.5); // Reduced depth for 2.5D

    const vertices = Math.floor(this.calculateVertexCount(options) * 0.7); // Reduced vertices for 2.5D
    const triangles = Math.floor(vertices / 3);

    return {
      width,
      height,
      depth,
      vertices,
      triangles,
      textures: this.calculateTextureCount(options),
      materials: this.calculateMaterialCount(options),
      animations: options.animated ? this.calculateAnimationCount(options) : 0,
      fileSize: this.calculate2_5DFileSize(vertices, options),
      compression: this.getCompression(options.quality),
      optimization: this.get2_5DOptimization(options)
    };
  }

  private calculateVertexCount(options: Asset2D3DOptions): number {
    const baseVertices: Record<string, number> = {
      low_poly: 100,
      high_poly: 10000,
      realistic: 50000,
      stylized: 5000,
      procedural: 2000
    };

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const baseVertexCount = baseVertices[options.style] || 1000;
    const qualityMultiplier = qualityMultipliers[options.quality] || 1.0;

    return Math.round(baseVertexCount * qualityMultiplier);
  }

  private calculateTextureCount(options: Asset2D3DOptions): number {
    const baseTextures: Record<string, number> = {
      low_poly: 1,
      high_poly: 4,
      realistic: 8,
      stylized: 3,
      procedural: 2
    };

    return baseTextures[options.style] || 2;
  }

  private calculateMaterialCount(options: Asset2D3DOptions): number {
    const baseMaterials: Record<string, number> = {
      low_poly: 1,
      high_poly: 3,
      realistic: 5,
      stylized: 2,
      procedural: 1
    };

    return baseMaterials[options.style] || 2;
  }

  private calculateAnimationCount(options: Asset2D3DOptions): number {
    const baseAnimations: Record<string, number> = {
      low_poly: 2,
      high_poly: 5,
      realistic: 8,
      stylized: 3,
      procedural: 1
    };

    return baseAnimations[options.style] || 3;
  }

  private calculate2DFileSize(width: number, height: number, options: Asset2D3DOptions): number {
    const baseSize = width * height * 4; // RGBA
    const compressionRatio = this.getCompressionRatio(options.quality);
    return Math.round(baseSize * compressionRatio);
  }

  private calculate3DFileSize(vertices: number, options: Asset2D3DOptions): number {
    const baseSize = vertices * 32; // 32 bytes per vertex
    const compressionRatio = this.getCompressionRatio(options.quality);
    return Math.round(baseSize * compressionRatio);
  }

  private calculate2_5DFileSize(vertices: number, options: Asset2D3DOptions): number {
    const baseSize = vertices * 24; // 24 bytes per vertex for 2.5D
    const compressionRatio = this.getCompressionRatio(options.quality);
    return Math.round(baseSize * compressionRatio);
  }

  private getCompressionRatio(quality: string): number {
    const ratios: Record<string, number> = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      ultra: 0.8
    };
    return ratios[quality] || 0.5;
  }

  private getCompression(quality: string): string {
    const compression: Record<string, string> = {
      low: 'high',
      medium: 'medium',
      high: 'low',
      ultra: 'none'
    };
    return compression[quality] || 'medium';
  }

  private get2DOptimization(options: Asset2D3DOptions): string[] {
    const optimizations = ['alpha_channel', 'color_palette'];
    
    if (options.platform === 'mobile') {
      optimizations.push('mobile_optimization');
    }
    
    if (options.format === 'webp') {
      optimizations.push('webp_compression');
    }
    
    return optimizations;
  }

  private get3DOptimization(options: Asset2D3DOptions): string[] {
    const optimizations = ['mesh_optimization', 'texture_atlas'];
    
    if (options.style === 'low_poly') {
      optimizations.push('low_poly_optimization');
    }
    
    if (options.platform === 'web') {
      optimizations.push('webgl_optimization');
    }
    
    return optimizations;
  }

  private get2_5DOptimization(options: Asset2D3DOptions): string[] {
    const optimizations = ['isometric_optimization', 'depth_culling'];
    
    if (options.platform === 'mobile') {
      optimizations.push('mobile_2_5d_optimization');
    }
    
    return optimizations;
  }

  private generate2DFiles(options: Asset2D3DOptions): Array<any> {
    const files = [];
    
    // Main texture file
    files.push({
      type: 'texture',
      path: this.generateFilePath(options, 'texture'),
      size: this.calculate2DFileSize(options.properties?.width || 64, options.properties?.height || 64, options),
      format: options.format,
      platform: options.platform,
      optimized: options.optimized || false
    });
    
    // Normal map for 2D sprites
    if (options.style === 'realistic' || options.style === 'stylized') {
      files.push({
        type: 'normal_map',
        path: this.generateFilePath(options, 'normal'),
        size: this.calculate2DFileSize(options.properties?.width || 64, options.properties?.height || 64, options),
        format: options.format,
        platform: options.platform,
        optimized: options.optimized || false
      });
    }
    
    // Alpha channel
    if (options.type === 'sprite' || options.type === 'ui') {
      files.push({
        type: 'alpha_channel',
        path: this.generateFilePath(options, 'alpha'),
        size: this.calculate2DFileSize(options.properties?.width || 64, options.properties?.height || 64, options),
        format: options.format,
        platform: options.platform,
        optimized: options.optimized || false
      });
    }
    
    return files;
  }

  private generate3DFiles(options: Asset2D3DOptions): Array<any> {
    const files = [];
    
    // Main model file
    files.push({
      type: 'model',
      path: this.generateFilePath(options, 'model'),
      size: this.calculate3DFileSize(options.properties?.vertices || 1000, options),
      format: options.format,
      platform: options.platform,
      optimized: options.optimized || false
    });
    
    // Texture files
    const textureCount = this.calculateTextureCount(options);
    for (let i = 0; i < textureCount; i++) {
      files.push({
        type: 'texture',
        path: this.generateFilePath(options, `texture_${i}`),
        size: this.calculate2DFileSize(512, 512, options),
        format: 'png',
        platform: options.platform,
        optimized: options.optimized || false
      });
    }
    
    // Material file
    files.push({
      type: 'material',
      path: this.generateFilePath(options, 'material'),
      size: 1024,
      format: 'json',
      platform: options.platform,
      optimized: options.optimized || false
    });
    
    // Animation files
    if (options.animated) {
      const animationCount = this.calculateAnimationCount(options);
      for (let i = 0; i < animationCount; i++) {
        files.push({
          type: 'animation',
          path: this.generateFilePath(options, `animation_${i}`),
          size: 2048,
          format: 'json',
          platform: options.platform,
          optimized: options.optimized || false
        });
      }
    }
    
    return files;
  }

  private generate2_5DFiles(options: Asset2D3DOptions): Array<any> {
    const files = [];
    
    // Main model file (2.5D optimized)
    files.push({
      type: 'model',
      path: this.generateFilePath(options, 'model'),
      size: this.calculate2_5DFileSize(options.properties?.vertices || 1000, options),
      format: options.format,
      platform: options.platform,
      optimized: options.optimized || false
    });
    
    // Isometric texture
    files.push({
      type: 'texture',
      path: this.generateFilePath(options, 'isometric'),
      size: this.calculate2DFileSize(512, 512, options),
      format: 'png',
      platform: options.platform,
      optimized: options.optimized || false
    });
    
    // Depth map
    files.push({
      type: 'depth_map',
      path: this.generateFilePath(options, 'depth'),
      size: this.calculate2DFileSize(512, 512, options),
      format: 'png',
      platform: options.platform,
      optimized: options.optimized || false
    });
    
    return files;
  }

  private generateFilePath(options: Asset2D3DOptions, suffix: string): string {
    const basePath = `assets/${options.dimensions}/${options.type}/${options.style}/${options.theme}`;
    const fileName = `${options.type}_${options.style}_${options.theme}_${suffix}`;
    const extension = this.getFileExtension(options.format);
    return `${basePath}/${fileName}.${extension}`;
  }

  private getFileExtension(format: string): string {
    return format.toLowerCase();
  }

  private generateMetadata(options: Asset2D3DOptions): any {
    return {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      tags: [options.dimensions, options.type, options.style, options.theme, options.quality],
      category: this.getCategory(options.type),
      subcategory: this.getSubcategory(options.type, options.style),
      technical: {
        renderPipeline: this.getRenderPipeline(options),
        shaderModel: this.getShaderModel(options),
        textureFormat: this.getTextureFormat(options),
        compressionRatio: this.getCompressionRatio(options.quality),
        memoryUsage: this.calculateMemoryUsage(options)
      }
    };
  }

  private getCategory(type: string): string {
    const categories: Record<string, string> = {
      sprite: 'Visual',
      model: '3D',
      texture: 'Material',
      material: 'Material',
      shader: 'Rendering',
      animation: 'Animation',
      effect: 'Visual'
    };
    return categories[type] || 'General';
  }

  private getSubcategory(type: string, style: string): string {
    const subcategories: Record<string, string> = {
      sprite: 'Graphic',
      model: 'Mesh',
      texture: 'Surface',
      material: 'Shader',
      shader: 'Program',
      animation: 'Motion',
      effect: 'Particle'
    };
    return subcategories[type] || 'Asset';
  }

  private getRenderPipeline(options: Asset2D3DOptions): string {
    if (options.dimensions === '2d') {
      return '2D_Render_Pipeline';
    } else if (options.dimensions === '3d') {
      return '3D_Render_Pipeline';
    } else {
      return '2.5D_Render_Pipeline';
    }
  }

  private getShaderModel(options: Asset2D3DOptions): string {
    const shaderModels: Record<string, string> = {
      low: 'SM_3_0',
      medium: 'SM_4_0',
      high: 'SM_5_0',
      ultra: 'SM_6_0'
    };
    return shaderModels[options.quality] || 'SM_4_0';
  }

  private getTextureFormat(options: Asset2D3DOptions): string {
    const formats: Record<string, string> = {
      png: 'RGBA8',
      jpg: 'RGB8',
      webp: 'RGBA8',
      gif: 'RGBA8'
    };
    return formats[options.format] || 'RGBA8';
  }

  private calculateMemoryUsage(options: Asset2D3DOptions): number {
    const baseMemory = 1024; // 1KB base
    const dimensionMultiplier = options.dimensions === '3d' ? 3 : options.dimensions === '2.5d' ? 2.5 : 1;
    const qualityMultiplier = options.quality === 'ultra' ? 4 : options.quality === 'high' ? 2 : 1;
    
    return Math.round(baseMemory * dimensionMultiplier * qualityMultiplier);
  }

  private calculateQuality(assetData: GeneratedAsset2D3D): number {
    let quality = 0.5; // Base quality

    // Quality based on completeness
    if (assetData.properties && Object.keys(assetData.properties).length >= 5) quality += 0.1;
    if (assetData.files && assetData.files.length >= 1) quality += 0.1;
    if (assetData.metadata && assetData.metadata.technical) quality += 0.1;

    // Quality based on optimization
    if (assetData.properties.optimization && assetData.properties.optimization.length >= 2) quality += 0.1;

    // Quality based on file size efficiency
    const totalSize = assetData.files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 0 && totalSize < 1024 * 1024) quality += 0.1; // Under 1MB

    return Math.min(1.0, quality);
  }

  private generateTags(assetData: GeneratedAsset2D3D): string[] {
    return [
      assetData.dimensions,
      assetData.type,
      assetData.style,
      assetData.theme,
      assetData.quality,
      assetData.platform
    ].filter(tag => tag && tag.length > 0);
  }

  private extractSpriteAssets(assetData: GeneratedAsset2D3D): string[] {
    const assets: string[] = [];
    
    for (const file of assetData.files) {
      if (file.type === 'texture' || file.type === 'alpha_channel' || file.type === 'normal_map') {
        assets.push(file.path);
      }
    }
    
    return assets;
  }

  private extractSoundAssets(assetData: GeneratedAsset2D3D): string[] {
    const assets: string[] = [];
    
    for (const file of assetData.files) {
      if (file.type === 'audio' || file.type === 'sound') {
        assets.push(file.path);
      }
    }
    
    return assets;
  }

  private extractAnimationAssets(assetData: GeneratedAsset2D3D): string[] {
    const assets: string[] = [];
    
    for (const file of assetData.files) {
      if (file.type === 'animation') {
        assets.push(file.path);
      }
    }
    
    return assets;
  }

  private extractEffectAssets(assetData: GeneratedAsset2D3D): string[] {
    const assets: string[] = [];
    
    for (const file of assetData.files) {
      if (file.type === 'effect' || file.type === 'particle') {
        assets.push(file.path);
      }
    }
    
    return assets;
  }
}

// Helper classes
class Sprite2DGenerator {
  // Implementation for 2D sprite generation
}

class Model3DGenerator {
  // Implementation for 3D model generation
}

class TextureGenerator {
  // Implementation for texture generation
}

class MaterialGenerator {
  // Implementation for material generation
}

class ShaderGenerator {
  // Implementation for shader generation
}

class AnimationGenerator {
  // Implementation for animation generation
}

class EffectGenerator {
  // Implementation for effect generation
}