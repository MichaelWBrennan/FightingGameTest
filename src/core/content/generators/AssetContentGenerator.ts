import { pc } from 'playcanvas';
import { Logger } from '../../utils/Logger';
import { ContentGenerationConfig, GeneratedContent } from '../ContentGenerationManager';

export interface AssetGenerationOptions {
  type?: 'sprite' | 'animation' | 'sound' | 'effect' | 'ui' | 'background' | 'character' | 'stage' | 'model' | 'texture' | 'material' | 'shader' | 'all';
  style?: 'pixel' | 'hand_drawn' | '3d' | 'vector' | 'realistic' | 'stylized' | 'anime' | 'cartoon' | 'low_poly' | 'high_poly' | 'procedural';
  theme?: 'arcane' | 'divine' | 'elemental' | 'shadow' | 'nature' | 'crystal' | 'void' | 'celestial' | 'infernal' | 'primal';
  size?: 'small' | 'medium' | 'large' | 'huge';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  animated?: boolean;
  interactive?: boolean;
  audio?: boolean;
  dimensions?: '2d' | '3d' | '2.5d';
  platform?: 'web' | 'mobile' | 'desktop' | 'console';
  format?: 'png' | 'jpg' | 'gif' | 'svg' | 'webp' | 'obj' | 'fbx' | 'gltf' | 'glb' | 'dae' | 'blend';
}

export interface AssetData {
  id: string;
  name: string;
  description: string;
  type: string;
  style: string;
  theme: string;
  size: string;
  quality: string;
  animated: boolean;
  interactive: boolean;
  audio: boolean;
  properties: {
    width: number;
    height: number;
    frames?: number;
    duration?: number;
    fps?: number;
    loop?: boolean;
    volume?: number;
    format: string;
    compression: string;
    optimization: string[];
  };
  variants: Array<{
    id: string;
    name: string;
    description: string;
    properties: any;
  }>;
  metadata: {
    created: number;
    modified: number;
    version: string;
    tags: string[];
    category: string;
    subcategory: string;
  };
  files: Array<{
    type: string;
    path: string;
    size: number;
    format: string;
  }>;
}

export class AssetContentGenerator {
  private app: pc.Application;
  private spriteGenerator: SpriteGenerator;
  private animationGenerator: AnimationGenerator;
  private soundGenerator: SoundGenerator;
  private effectGenerator: EffectGenerator;

  constructor(app: pc.Application) {
    this.app = app;
    this.spriteGenerator = new SpriteGenerator();
    this.animationGenerator = new AnimationGenerator();
    this.soundGenerator = new SoundGenerator();
    this.effectGenerator = new EffectGenerator();
  }

  public async generate(
    options: AssetGenerationOptions = {},
    config: ContentGenerationConfig
  ): Promise<GeneratedContent | null> {
    try {
      const assetData = await this.createAsset(options, config);
      const content: GeneratedContent = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'asset',
        name: assetData.name,
        description: assetData.description,
        data: assetData,
        metadata: {
          generatedAt: Date.now(),
          generator: 'AssetContentGenerator',
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
      Logger.error('Error generating asset:', error);
      return null;
    }
  }

  private async createAsset(
    options: AssetGenerationOptions,
    config: ContentGenerationConfig
  ): Promise<AssetData> {
    const type = options.type || this.selectRandomType();
    const style = options.style || this.selectRandomStyle();
    const theme = options.theme || this.selectRandomTheme();
    const size = options.size || this.selectRandomSize();
    const quality = options.quality || this.selectRandomQuality();

    const name = this.generateAssetName(type, style, theme);
    const description = this.generateAssetDescription(type, style, theme, size);

    const properties = this.generateProperties(type, style, theme, size, quality);
    const variants = this.generateVariants(type, style, theme, size);
    const metadata = this.generateMetadata(type, style, theme);
    const files = this.generateFiles(type, style, theme, size, quality);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      type,
      style,
      theme,
      size,
      quality,
      animated: options.animated || false,
      interactive: options.interactive || false,
      audio: options.audio || false,
      properties,
      variants,
      metadata,
      files
    };
  }

  private selectRandomType(): string {
    const types = ['sprite', 'animation', 'sound', 'effect', 'ui', 'background', 'character', 'stage'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectRandomStyle(): string {
    const styles = ['pixel', 'hand_drawn', '3d', 'vector', 'realistic', 'stylized', 'anime', 'cartoon'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private selectRandomTheme(): string {
    const themes = ['arcane', 'divine', 'elemental', 'shadow', 'nature', 'crystal', 'void', 'celestial', 'infernal', 'primal'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private selectRandomSize(): string {
    const sizes = ['small', 'medium', 'large', 'huge'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private selectRandomQuality(): string {
    const qualities = ['low', 'medium', 'high', 'ultra'];
    return qualities[Math.floor(Math.random() * qualities.length)];
  }

  private generateAssetName(type: string, style: string, theme: string): string {
    const typeNames: Record<string, string[]> = {
      sprite: ['Sprite', 'Image', 'Graphic', 'Icon'],
      animation: ['Animation', 'Motion', 'Sequence', 'Clip'],
      sound: ['Sound', 'Audio', 'Effect', 'Clip'],
      effect: ['Effect', 'Particle', 'Visual', 'FX'],
      ui: ['UI Element', 'Interface', 'Widget', 'Component'],
      background: ['Background', 'Scene', 'Environment', 'Setting'],
      character: ['Character', 'Fighter', 'Hero', 'Avatar'],
      stage: ['Stage', 'Arena', 'Battleground', 'Field']
    };

    const styleNames: Record<string, string[]> = {
      pixel: ['Pixel', '8-bit', 'Retro', 'Classic'],
      hand_drawn: ['Hand-drawn', 'Sketch', 'Artistic', 'Drawn'],
      '3d': ['3D', 'Three-dimensional', 'Modeled', 'Rendered'],
      vector: ['Vector', 'Scalable', 'Clean', 'Sharp'],
      realistic: ['Realistic', 'Photorealistic', 'Lifelike', 'Natural'],
      stylized: ['Stylized', 'Artistic', 'Unique', 'Custom'],
      anime: ['Anime', 'Manga', 'Japanese', 'Animated'],
      cartoon: ['Cartoon', 'Funny', 'Playful', 'Colorful']
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

    const typeOptions = typeNames[type] || ['Asset'];
    const styleOptions = styleNames[style] || ['Custom'];
    const themeOptions = themeNames[theme] || ['Elemental'];

    const typeName = typeOptions[Math.floor(Math.random() * typeOptions.length)];
    const styleName = styleOptions[Math.floor(Math.random() * styleOptions.length)];
    const themeName = themeOptions[Math.floor(Math.random() * themeOptions.length)];

    return `${styleName} ${themeName} ${typeName}`;
  }

  private generateAssetDescription(type: string, style: string, theme: string, size: string): string {
    const typeDescriptions: Record<string, string> = {
      sprite: 'A visual graphic element',
      animation: 'An animated sequence',
      sound: 'An audio element',
      effect: 'A visual effect',
      ui: 'A user interface element',
      background: 'A background environment',
      character: 'A character asset',
      stage: 'A stage or arena asset'
    };

    const styleDescriptions: Record<string, string> = {
      pixel: 'with a retro pixel art style',
      hand_drawn: 'with a hand-drawn artistic style',
      '3d': 'with a three-dimensional rendered style',
      vector: 'with a clean vector art style',
      realistic: 'with a realistic and lifelike style',
      stylized: 'with a unique stylized appearance',
      anime: 'with an anime-inspired style',
      cartoon: 'with a cartoon-like style'
    };

    const themeDescriptions: Record<string, string> = {
      fire: 'featuring fire and flame elements',
      ice: 'featuring ice and frost elements',
      electric: 'featuring electric and lightning elements',
      wind: 'featuring wind and air elements',
      earth: 'featuring earth and stone elements',
      water: 'featuring water and liquid elements',
      dark: 'featuring dark and shadow elements',
      light: 'featuring light and radiant elements',
      cyber: 'featuring cyber and digital elements',
      nature: 'featuring nature and organic elements'
    };

    const sizeDescriptions: Record<string, string> = {
      small: 'in a compact size',
      medium: 'in a standard size',
      large: 'in a large size',
      huge: 'in an extra large size'
    };

    const typeDesc = typeDescriptions[type] || 'A visual asset';
    const styleDesc = styleDescriptions[style] || 'with a custom style';
    const themeDesc = themeDescriptions[theme] || 'with elemental themes';
    const sizeDesc = sizeDescriptions[size] || 'in a standard size';

    return `${typeDesc} ${styleDesc} ${themeDesc} ${sizeDesc}.`;
  }

  private generateProperties(type: string, style: string, theme: string, size: string, quality: string): any {
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
    const multiplier = sizeMultipliers[size] || 1.0;
    const qualityMultiplier = qualityMultipliers[quality] || 1.0;

    const width = Math.round(baseSize * multiplier * qualityMultiplier);
    const height = Math.round(baseSize * multiplier * qualityMultiplier);

    const properties: any = {
      width,
      height,
      format: this.getFormat(type, style),
      compression: this.getCompression(quality),
      optimization: this.getOptimization(type, style, quality)
    };

    // Add type-specific properties
    if (type === 'animation') {
      properties.frames = this.getFrameCount(style, quality);
      properties.duration = this.getDuration(style, quality);
      properties.fps = this.getFPS(style, quality);
      properties.loop = true;
    }

    if (type === 'sound') {
      properties.duration = this.getSoundDuration(style, quality);
      properties.volume = this.getVolume(theme, quality);
      properties.format = 'wav';
    }

    return properties;
  }

  private getFormat(type: string, style: string): string {
    const formats: Record<string, string> = {
      sprite: 'png',
      animation: 'gif',
      sound: 'wav',
      effect: 'png',
      ui: 'png',
      background: 'jpg',
      character: 'png',
      stage: 'jpg'
    };
    return formats[type] || 'png';
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

  private getOptimization(type: string, style: string, quality: string): string[] {
    const optimizations = [];

    if (quality === 'high' || quality === 'ultra') {
      optimizations.push('lossless');
    }

    if (type === 'sprite' || type === 'ui') {
      optimizations.push('alpha_channel');
    }

    if (type === 'animation') {
      optimizations.push('frame_optimization');
    }

    if (type === 'sound') {
      optimizations.push('audio_compression');
    }

    return optimizations;
  }

  private getFrameCount(style: string, quality: string): number {
    const baseFrames: Record<string, number> = {
      pixel: 8,
      hand_drawn: 12,
      '3d': 24,
      vector: 16,
      realistic: 30,
      stylized: 20,
      anime: 24,
      cartoon: 16
    };

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const baseFrameCount = baseFrames[style] || 16;
    const qualityMultiplier = qualityMultipliers[quality] || 1.0;

    return Math.round(baseFrameCount * qualityMultiplier);
  }

  private getDuration(style: string, quality: string): number {
    const baseDuration = 1000; // 1 second
    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const qualityMultiplier = qualityMultipliers[quality] || 1.0;
    return Math.round(baseDuration * qualityMultiplier);
  }

  private getFPS(style: string, quality: string): number {
    const baseFPS: Record<string, number> = {
      pixel: 8,
      hand_drawn: 12,
      '3d': 24,
      vector: 16,
      realistic: 30,
      stylized: 20,
      anime: 24,
      cartoon: 16
    };

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const baseFPSValue = baseFPS[style] || 16;
    const qualityMultiplier = qualityMultipliers[quality] || 1.0;

    return Math.round(baseFPSValue * qualityMultiplier);
  }

  private getSoundDuration(style: string, quality: string): number {
    const baseDuration = 2000; // 2 seconds
    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      ultra: 2.0
    };

    const qualityMultiplier = qualityMultipliers[quality] || 1.0;
    return Math.round(baseDuration * qualityMultiplier);
  }

  private getVolume(theme: string, quality: string): number {
    const baseVolume = 0.7;
    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 0.7,
      high: 0.8,
      ultra: 0.9
    };

    const qualityMultiplier = qualityMultipliers[quality] || 0.7;
    return Math.round(baseVolume * qualityMultiplier * 100) / 100;
  }

  private generateVariants(type: string, style: string, theme: string, size: string): Array<any> {
    const variants = [];
    const variantCount = this.getVariantCount(type, style);

    for (let i = 0; i < variantCount; i++) {
      variants.push({
        id: `variant_${i + 1}`,
        name: this.generateVariantName(type, style, theme, i + 1),
        description: this.generateVariantDescription(type, style, theme, i + 1),
        properties: this.generateVariantProperties(type, style, theme, size, i + 1)
      });
    }

    return variants;
  }

  private getVariantCount(type: string, style: string): number {
    const counts: Record<string, number> = {
      sprite: 3,
      animation: 2,
      sound: 2,
      effect: 4,
      ui: 3,
      background: 2,
      character: 5,
      stage: 3
    };
    return counts[type] || 2;
  }

  private generateVariantName(type: string, style: string, theme: string, index: number): string {
    const variantNames: Record<string, string[]> = {
      sprite: ['Variant A', 'Variant B', 'Variant C'],
      animation: ['Slow', 'Fast'],
      sound: ['Quiet', 'Loud'],
      effect: ['Small', 'Medium', 'Large', 'Huge'],
      ui: ['Light', 'Dark', 'Colorful'],
      background: ['Day', 'Night'],
      character: ['Costume 1', 'Costume 2', 'Costume 3', 'Costume 4', 'Costume 5'],
      stage: ['Variant 1', 'Variant 2', 'Variant 3']
    };

    const names = variantNames[type] || ['Variant'];
    return names[Math.min(index - 1, names.length - 1)];
  }

  private generateVariantDescription(type: string, style: string, theme: string, index: number): string {
    return `A ${style} ${theme} ${type} variant with unique characteristics.`;
  }

  private generateVariantProperties(type: string, style: string, theme: string, size: string, index: number): any {
    const baseProperties = this.generateProperties(type, style, theme, size, 'medium');
    
    // Modify properties based on variant
    if (type === 'animation') {
      baseProperties.frames = Math.round(baseProperties.frames * (0.8 + (index * 0.2)));
      baseProperties.duration = Math.round(baseProperties.duration * (0.8 + (index * 0.2)));
    } else if (type === 'sound') {
      baseProperties.volume = Math.round(baseProperties.volume * (0.8 + (index * 0.2)) * 100) / 100;
    } else {
      baseProperties.width = Math.round(baseProperties.width * (0.8 + (index * 0.2)));
      baseProperties.height = Math.round(baseProperties.height * (0.8 + (index * 0.2)));
    }

    return baseProperties;
  }

  private generateMetadata(type: string, style: string, theme: string): any {
    return {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      tags: [type, style, theme],
      category: this.getCategory(type),
      subcategory: this.getSubcategory(type, style)
    };
  }

  private getCategory(type: string): string {
    const categories: Record<string, string> = {
      sprite: 'Visual',
      animation: 'Visual',
      sound: 'Audio',
      effect: 'Visual',
      ui: 'Interface',
      background: 'Environment',
      character: 'Character',
      stage: 'Environment'
    };
    return categories[type] || 'General';
  }

  private getSubcategory(type: string, style: string): string {
    const subcategories: Record<string, string> = {
      sprite: 'Graphic',
      animation: 'Motion',
      sound: 'Effect',
      effect: 'Particle',
      ui: 'Element',
      background: 'Scene',
      character: 'Fighter',
      stage: 'Arena'
    };
    return subcategories[type] || 'Asset';
  }

  private generateFiles(type: string, style: string, theme: string, size: string, quality: string): Array<any> {
    const files = [];
    const fileCount = this.getFileCount(type, style);

    for (let i = 0; i < fileCount; i++) {
      files.push({
        type: this.getFileType(type, i),
        path: this.generateFilePath(type, style, theme, i),
        size: this.generateFileSize(type, style, size, quality),
        format: this.getFileFormat(type, i)
      });
    }

    return files;
  }

  private getFileCount(type: string, style: string): number {
    const counts: Record<string, number> = {
      sprite: 1,
      animation: 1,
      sound: 1,
      effect: 2,
      ui: 1,
      background: 1,
      character: 3,
      stage: 2
    };
    return counts[type] || 1;
  }

  private getFileType(type: string, index: number): string {
    const types: Record<string, string[]> = {
      sprite: ['image'],
      animation: ['animation'],
      sound: ['audio'],
      effect: ['image', 'data'],
      ui: ['image'],
      background: ['image'],
      character: ['image', 'data', 'metadata'],
      stage: ['image', 'data']
    };

    const typeOptions = types[type] || ['file'];
    return typeOptions[Math.min(index, typeOptions.length - 1)];
  }

  private generateFilePath(type: string, style: string, theme: string, index: number): string {
    const basePath = `assets/${type}s/${style}/${theme}`;
    const fileName = `${type}_${style}_${theme}_${index + 1}`;
    const extension = this.getFileExtension(type, index);
    return `${basePath}/${fileName}.${extension}`;
  }

  private getFileExtension(type: string, index: number): string {
    const extensions: Record<string, string[]> = {
      sprite: ['png'],
      animation: ['gif'],
      sound: ['wav'],
      effect: ['png', 'json'],
      ui: ['png'],
      background: ['jpg'],
      character: ['png', 'json', 'txt'],
      stage: ['jpg', 'json']
    };

    const extOptions = extensions[type] || ['png'];
    return extOptions[Math.min(index, extOptions.length - 1)];
  }

  private generateFileSize(type: string, style: string, size: string, quality: string): number {
    const baseSizes: Record<string, number> = {
      sprite: 1024,
      animation: 2048,
      sound: 4096,
      effect: 512,
      ui: 512,
      background: 8192,
      character: 3072,
      stage: 6144
    };

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

    const baseSize = baseSizes[type] || 1024;
    const sizeMultiplier = sizeMultipliers[size] || 1.0;
    const qualityMultiplier = qualityMultipliers[quality] || 1.0;

    return Math.round(baseSize * sizeMultiplier * qualityMultiplier);
  }

  private getFileFormat(type: string, index: number): string {
    const formats: Record<string, string[]> = {
      sprite: ['PNG'],
      animation: ['GIF'],
      sound: ['WAV'],
      effect: ['PNG', 'JSON'],
      ui: ['PNG'],
      background: ['JPEG'],
      character: ['PNG', 'JSON', 'TXT'],
      stage: ['JPEG', 'JSON']
    };

    const formatOptions = formats[type] || ['PNG'];
    return formatOptions[Math.min(index, formatOptions.length - 1)];
  }

  private calculateQuality(assetData: AssetData): number {
    let quality = 0.5; // Base quality

    // Quality based on completeness
    if (assetData.properties && Object.keys(assetData.properties).length >= 5) quality += 0.1;
    if (assetData.variants && assetData.variants.length >= 2) quality += 0.1;
    if (assetData.files && assetData.files.length >= 1) quality += 0.1;
    if (assetData.description && assetData.description.length > 50) quality += 0.1;

    // Quality based on asset type
    if (assetData.type === 'animation' && assetData.properties.frames >= 16) quality += 0.1;
    if (assetData.type === 'sound' && assetData.properties.duration >= 1000) quality += 0.1;
    if (assetData.type === 'sprite' && assetData.properties.width >= 64) quality += 0.1;

    // Quality based on optimization
    if (assetData.properties.optimization && assetData.properties.optimization.length >= 2) quality += 0.1;

    return Math.min(1.0, quality);
  }

  private generateTags(assetData: AssetData): string[] {
    return [
      assetData.type,
      assetData.style,
      assetData.theme,
      assetData.size,
      assetData.quality
    ].filter(tag => tag && tag.length > 0);
  }

  private extractSpriteAssets(assetData: AssetData): string[] {
    const assets: string[] = [];
    
    if (assetData.type === 'sprite' || assetData.type === 'ui' || assetData.type === 'character') {
      for (const file of assetData.files) {
        if (file.type === 'image') {
          assets.push(file.path);
        }
      }
    }
    
    return assets;
  }

  private extractSoundAssets(assetData: AssetData): string[] {
    const assets: string[] = [];
    
    if (assetData.type === 'sound') {
      for (const file of assetData.files) {
        if (file.type === 'audio') {
          assets.push(file.path);
        }
      }
    }
    
    return assets;
  }

  private extractAnimationAssets(assetData: AssetData): string[] {
    const assets: string[] = [];
    
    if (assetData.type === 'animation') {
      for (const file of assetData.files) {
        if (file.type === 'animation') {
          assets.push(file.path);
        }
      }
    }
    
    return assets;
  }

  private extractEffectAssets(assetData: AssetData): string[] {
    const assets: string[] = [];
    
    if (assetData.type === 'effect') {
      for (const file of assetData.files) {
        if (file.type === 'image' || file.type === 'data') {
          assets.push(file.path);
        }
      }
    }
    
    return assets;
  }
}

// Helper classes
class SpriteGenerator {
  // Implementation for sprite generation
}

class AnimationGenerator {
  // Implementation for animation generation
}

class SoundGenerator {
  // Implementation for sound generation
}

class EffectGenerator {
  // Implementation for effect generation
}