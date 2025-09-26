import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import type { GeneratedContent } from './ContentGenerationManager';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'gif' | 'svg' | 'webp' | 'obj' | 'fbx' | 'gltf' | 'glb' | 'dae' | 'blend';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  platform: 'web' | 'mobile' | 'desktop' | 'console';
  optimization: boolean;
  compression: 'none' | 'low' | 'medium' | 'high';
  includeMetadata: boolean;
}

export interface ExportResult {
  success: boolean;
  files: Array<{
    path: string;
    size: number;
    format: string;
    url?: string;
  }>;
  errors: string[];
  warnings: string[];
}

export class AssetExportSystem {
  private app: pc.Application;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async exportAsset(
    content: GeneratedContent,
    options: ExportOptions
  ): Promise<ExportResult> {
    const result: ExportResult = {
      success: false,
      files: [],
      errors: [],
      warnings: []
    };

    try {
      const assetData = content.data;
      
      if (assetData.dimensions === '2d') {
        await this.export2DAsset(assetData, options, result);
      } else if (assetData.dimensions === '3d') {
        await this.export3DAsset(assetData, options, result);
      } else if (assetData.dimensions === '2.5d') {
        await this.export2_5DAsset(assetData, options, result);
      } else {
        result.errors.push('Unsupported asset dimensions');
        return result;
      }

      result.success = result.errors.length === 0;
      Logger.info(`Asset exported: ${content.name} (${result.files.length} files)`);

    } catch (error) {
      result.errors.push(`Export failed: ${error}`);
      Logger.error('Asset export error:', error);
    }

    return result;
  }

  private async export2DAsset(assetData: any, options: ExportOptions, result: ExportResult): Promise<void> {
    // Export 2D sprites, textures, and UI elements
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      result.errors.push('Failed to create 2D canvas context');
      return;
    }

    canvas.width = assetData.properties.width;
    canvas.height = assetData.properties.height;

    // Generate 2D content based on theme and style
    await this.generate2DContent(ctx, assetData, options);

    // Export to different formats
    const formats = this.get2DFormats(options.format);
    
    for (const format of formats) {
      const blob = await this.canvasToBlob(canvas, format, options.quality);
      const filePath = this.generateFilePath(assetData, format);
      
      result.files.push({
        path: filePath,
        size: blob.size,
        format: format,
        url: URL.createObjectURL(blob)
      });
    }
  }

  private async export3DAsset(assetData: any, options: ExportOptions, result: ExportResult): Promise<void> {
    // Export 3D models, textures, and materials
    const formats = this.get3DFormats(options.format);
    
    for (const format of formats) {
      const modelData = await this.generate3DModel(assetData, format, options);
      const filePath = this.generateFilePath(assetData, format);
      
      result.files.push({
        path: filePath,
        size: modelData.length,
        format: format,
        url: URL.createObjectURL(new Blob([modelData]))
      });
    }

    // Export textures
    const textureFormats = ['png', 'jpg', 'webp'];
    for (const format of textureFormats) {
      const textureData = await this.generateTexture(assetData, format, options);
      const filePath = this.generateTexturePath(assetData, format);
      
      result.files.push({
        path: filePath,
        size: textureData.length,
        format: format,
        url: URL.createObjectURL(new Blob([textureData]))
      });
    }
  }

  private async export2_5DAsset(assetData: any, options: ExportOptions, result: ExportResult): Promise<void> {
    // Export 2.5D isometric assets
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      result.errors.push('Failed to create 2.5D canvas context');
      return;
    }

    canvas.width = assetData.properties.width;
    canvas.height = assetData.properties.height;

    // Generate 2.5D isometric content
    await this.generate2_5DContent(ctx, assetData, options);

    // Export to different formats
    const formats = this.get2_5DFormats(options.format);
    
    for (const format of formats) {
      const blob = await this.canvasToBlob(canvas, format, options.quality);
      const filePath = this.generateFilePath(assetData, format);
      
      result.files.push({
        path: filePath,
        size: blob.size,
        format: format,
        url: URL.createObjectURL(blob)
      });
    }
  }

  private async generate2DContent(ctx: CanvasRenderingContext2D, assetData: any, options: ExportOptions): Promise<void> {
    const { width, height } = assetData.properties;
    const { theme, style, type } = assetData;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Generate content based on type and theme
    switch (type) {
      case 'sprite':
        await this.generateSprite(ctx, width, height, theme, style, options);
        break;
      case 'texture':
        await this.generateTexture2D(ctx, width, height, theme, style, options);
        break;
      case 'ui':
        await this.generateUIElement(ctx, width, height, theme, style, options);
        break;
      case 'background':
        await this.generateBackground(ctx, width, height, theme, style, options);
        break;
      case 'effect':
        await this.generateEffect(ctx, width, height, theme, style, options);
        break;
      default:
        await this.generateGeneric2D(ctx, width, height, theme, style, options);
    }
  }

  private async generateSprite(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    // Generate fantasy-themed sprite
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Set theme colors
    const colors = this.getThemeColors(theme);
    
    // Draw sprite based on style
    if (style === 'pixel') {
      this.drawPixelSprite(ctx, centerX, centerY, radius, colors);
    } else if (style === 'hand_drawn') {
      this.drawHandDrawnSprite(ctx, centerX, centerY, radius, colors);
    } else if (style === 'stylized') {
      this.drawStylizedSprite(ctx, centerX, centerY, radius, colors);
    } else {
      this.drawGenericSprite(ctx, centerX, centerY, radius, colors);
    }
  }

  private async generateTexture2D(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    // Generate texture based on theme
    const colors = this.getThemeColors(theme);
    
    if (theme === 'arcane') {
      this.drawArcaneTexture(ctx, width, height, colors);
    } else if (theme === 'divine') {
      this.drawDivineTexture(ctx, width, height, colors);
    } else if (theme === 'elemental') {
      this.drawElementalTexture(ctx, width, height, colors);
    } else if (theme === 'shadow') {
      this.drawShadowTexture(ctx, width, height, colors);
    } else {
      this.drawGenericTexture(ctx, width, height, colors);
    }
  }

  private async generateUIElement(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    // Generate UI element
    const colors = this.getThemeColors(theme);
    
    // Draw UI background
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Add theme-specific decorations
    this.addThemeDecorations(ctx, width, height, theme, colors);
  }

  private async generateBackground(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    // Generate background
    const colors = this.getThemeColors(theme);
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, colors.secondary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add theme-specific elements
    this.addThemeElements(ctx, width, height, theme, colors);
  }

  private async generateEffect(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    // Generate particle effect
    const colors = this.getThemeColors(theme);
    
    // Draw particles
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;
      
      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillRect(x, y, size, size);
    }
    
    ctx.globalAlpha = 1;
  }

  private async generateGeneric2D(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    // Generate generic 2D content
    const colors = this.getThemeColors(theme);
    
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
  }

  private async generate2_5DContent(ctx: CanvasRenderingContext2D, assetData: any, options: ExportOptions): Promise<void> {
    const { width, height } = assetData.properties;
    const { theme, style, type } = assetData;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Generate isometric content
    await this.generateIsometricContent(ctx, width, height, theme, style, options);
  }

  private async generateIsometricContent(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, style: string, options: ExportOptions): Promise<void> {
    const colors = this.getThemeColors(theme);
    
    // Draw isometric grid
    this.drawIsometricGrid(ctx, width, height, colors);
    
    // Draw isometric object
    this.drawIsometricObject(ctx, width, height, theme, colors);
  }

  private drawIsometricGrid(ctx: CanvasRenderingContext2D, width: number, height: number, colors: any): void {
    const gridSize = 20;
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1;
    
    // Draw isometric grid lines
    for (let i = -10; i <= 10; i++) {
      const x1 = centerX + i * gridSize;
      const y1 = centerY - 10 * gridSize;
      const x2 = centerX + i * gridSize;
      const y2 = centerY + 10 * gridSize;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  private drawIsometricObject(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, colors: any): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = 40;
    
    // Draw isometric cube
    ctx.fillStyle = colors.primary;
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2;
    
    // Top face
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX + size, centerY);
    ctx.lineTo(centerX, centerY + size);
    ctx.lineTo(centerX - size, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Left face
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX, centerY + size);
    ctx.lineTo(centerX, centerY + size * 2);
    ctx.lineTo(centerX - size, centerY + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Right face
    ctx.beginPath();
    ctx.moveTo(centerX + size, centerY);
    ctx.lineTo(centerX, centerY + size);
    ctx.lineTo(centerX, centerY + size * 2);
    ctx.lineTo(centerX + size, centerY + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private async generate3DModel(assetData: any, format: string, options: ExportOptions): Promise<ArrayBuffer> {
    // Generate 3D model data
    const vertices = assetData.properties.vertices;
    const triangles = assetData.properties.triangles;
    
    // Create simple 3D model data
    const modelData = this.create3DModelData(vertices, triangles, assetData.theme);
    
    // Convert to requested format
    return this.convertTo3DFormat(modelData, format, options);
  }

  private create3DModelData(vertices: number, triangles: number, theme: string): any {
    // Create basic 3D model data
    const positions = new Float32Array(vertices * 3);
    const normals = new Float32Array(vertices * 3);
    const uvs = new Float32Array(vertices * 2);
    const indices = new Uint16Array(triangles * 3);
    
    // Generate procedural geometry
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const radius = 1 + Math.random() * 0.5;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = Math.random() * 2 - 1;
      
      normals[i * 3] = Math.cos(angle);
      normals[i * 3 + 1] = Math.sin(angle);
      normals[i * 3 + 2] = 0;
      
      uvs[i * 2] = Math.cos(angle) * 0.5 + 0.5;
      uvs[i * 2 + 1] = Math.sin(angle) * 0.5 + 0.5;
    }
    
    // Generate indices
    for (let i = 0; i < triangles; i++) {
      indices[i * 3] = i;
      indices[i * 3 + 1] = (i + 1) % vertices;
      indices[i * 3 + 2] = (i + 2) % vertices;
    }
    
    return {
      positions,
      normals,
      uvs,
      indices,
      theme
    };
  }

  private async convertTo3DFormat(modelData: any, format: string, options: ExportOptions): Promise<ArrayBuffer> {
    // Convert model data to requested format
    switch (format) {
      case 'obj':
        return this.convertToOBJ(modelData);
      case 'gltf':
        return this.convertToGLTF(modelData);
      case 'glb':
        return this.convertToGLB(modelData);
      case 'fbx':
        return this.convertToFBX(modelData);
      default:
        return this.convertToGeneric(modelData);
    }
  }

  private convertToOBJ(modelData: any): ArrayBuffer {
    let objContent = '';
    
    // Add vertices
    for (let i = 0; i < modelData.positions.length; i += 3) {
      objContent += `v ${modelData.positions[i]} ${modelData.positions[i + 1]} ${modelData.positions[i + 2]}\n`;
    }
    
    // Add texture coordinates
    for (let i = 0; i < modelData.uvs.length; i += 2) {
      objContent += `vt ${modelData.uvs[i]} ${modelData.uvs[i + 1]}\n`;
    }
    
    // Add normals
    for (let i = 0; i < modelData.normals.length; i += 3) {
      objContent += `vn ${modelData.normals[i]} ${modelData.normals[i + 1]} ${modelData.normals[i + 2]}\n`;
    }
    
    // Add faces
    for (let i = 0; i < modelData.indices.length; i += 3) {
      const v1 = modelData.indices[i] + 1;
      const v2 = modelData.indices[i + 1] + 1;
      const v3 = modelData.indices[i + 2] + 1;
      objContent += `f ${v1}/${v1}/${v1} ${v2}/${v2}/${v2} ${v3}/${v3}/${v3}\n`;
    }
    
    return new TextEncoder().encode(objContent);
  }

  private convertToGLTF(modelData: any): ArrayBuffer {
    // Create GLTF JSON structure
    const gltf = {
      asset: {
        version: "2.0",
        generator: "FightForge Asset Generator"
      },
      scene: 0,
      scenes: [{
        nodes: [0]
      }],
      nodes: [{
        mesh: 0
      }],
      meshes: [{
        primitives: [{
          attributes: {
            POSITION: 0,
            NORMAL: 1,
            TEXCOORD_0: 2
          },
          indices: 3
        }]
      }],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: modelData.positions.length / 3,
          type: "VEC3"
        },
        {
          bufferView: 1,
          componentType: 5126,
          count: modelData.normals.length / 3,
          type: "VEC3"
        },
        {
          bufferView: 2,
          componentType: 5126,
          count: modelData.uvs.length / 2,
          type: "VEC2"
        },
        {
          bufferView: 3,
          componentType: 5123,
          count: modelData.indices.length,
          type: "SCALAR"
        }
      ],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: modelData.positions.byteLength
        },
        {
          buffer: 0,
          byteOffset: modelData.positions.byteLength,
          byteLength: modelData.normals.byteLength
        },
        {
          buffer: 0,
          byteOffset: modelData.positions.byteLength + modelData.normals.byteLength,
          byteLength: modelData.uvs.byteLength
        },
        {
          buffer: 0,
          byteOffset: modelData.positions.byteLength + modelData.normals.byteLength + modelData.uvs.byteLength,
          byteLength: modelData.indices.byteLength
        }
      ],
      buffers: [{
        byteLength: modelData.positions.byteLength + modelData.normals.byteLength + modelData.uvs.byteLength + modelData.indices.byteLength
      }]
    };
    
    return new TextEncoder().encode(JSON.stringify(gltf, null, 2));
  }

  private convertToGLB(modelData: any): ArrayBuffer {
    // GLB is binary format, simplified implementation
    const gltf = this.convertToGLTF(modelData);
    const gltfText = new TextDecoder().decode(gltf);
    const gltfJson = JSON.parse(gltfText);
    
    // Create GLB header and data
    const header = new ArrayBuffer(12);
    const headerView = new DataView(header);
    headerView.setUint32(0, 0x46546C67, false); // "glTF"
    headerView.setUint32(4, 2, false); // Version
    headerView.setUint32(8, 0, false); // Length (placeholder)
    
    return header;
  }

  private convertToFBX(modelData: any): ArrayBuffer {
    // FBX is complex binary format, simplified implementation
    return new ArrayBuffer(0);
  }

  private convertToGeneric(modelData: any): ArrayBuffer {
    // Generic binary format
    const data = new ArrayBuffer(
      modelData.positions.byteLength +
      modelData.normals.byteLength +
      modelData.uvs.byteLength +
      modelData.indices.byteLength
    );
    
    const view = new Uint8Array(data);
    let offset = 0;
    
    view.set(new Uint8Array(modelData.positions.buffer), offset);
    offset += modelData.positions.byteLength;
    
    view.set(new Uint8Array(modelData.normals.buffer), offset);
    offset += modelData.normals.byteLength;
    
    view.set(new Uint8Array(modelData.uvs.buffer), offset);
    offset += modelData.uvs.byteLength;
    
    view.set(new Uint8Array(modelData.indices.buffer), offset);
    
    return data;
  }

  private async generateTexture(assetData: any, format: string, options: ExportOptions): Promise<ArrayBuffer> {
    // Generate texture data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create texture canvas');
    }
    
    canvas.width = 512;
    canvas.height = 512;
    
    // Generate texture content
    await this.generateTexture2D(ctx, 512, 512, assetData.theme, assetData.style, options);
    
    // Convert to requested format
    const blob = await this.canvasToBlob(canvas, format, options.quality);
    return await blob.arrayBuffer();
  }

  private async canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: string): Promise<Blob> {
    const qualityValue = this.getQualityValue(quality);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, `image/${format}`, qualityValue);
    });
  }

  private getQualityValue(quality: string): number {
    const qualities: Record<string, number> = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      ultra: 0.95
    };
    return qualities[quality] || 0.8;
  }

  private getThemeColors(theme: string): any {
    const colorSchemes: Record<string, any> = {
      arcane: {
        primary: '#4A148C',
        secondary: '#7B1FA2',
        accent: '#E1BEE7',
        background: '#1A0033'
      },
      divine: {
        primary: '#FFD700',
        secondary: '#FFA500',
        accent: '#FFF8DC',
        background: '#F5F5DC'
      },
      elemental: {
        primary: '#00BCD4',
        secondary: '#4DD0E1',
        accent: '#B2EBF2',
        background: '#E0F2F1'
      },
      shadow: {
        primary: '#212121',
        secondary: '#424242',
        accent: '#757575',
        background: '#000000'
      },
      nature: {
        primary: '#4CAF50',
        secondary: '#8BC34A',
        accent: '#C8E6C9',
        background: '#E8F5E8'
      },
      crystal: {
        primary: '#E91E63',
        secondary: '#F06292',
        accent: '#F8BBD9',
        background: '#FCE4EC'
      },
      void: {
        primary: '#000000',
        secondary: '#1A1A1A',
        accent: '#333333',
        background: '#000000'
      },
      celestial: {
        primary: '#2196F3',
        secondary: '#64B5F6',
        accent: '#BBDEFB',
        background: '#E3F2FD'
      },
      infernal: {
        primary: '#F44336',
        secondary: '#EF5350',
        accent: '#FFCDD2',
        background: '#FFEBEE'
      },
      primal: {
        primary: '#795548',
        secondary: '#A1887F',
        accent: '#D7CCC8',
        background: '#EFEBE9'
      }
    };
    
    return colorSchemes[theme] || colorSchemes.arcane;
  }

  private get2DFormats(requestedFormat: string): string[] {
    const formats: Record<string, string[]> = {
      png: ['png'],
      jpg: ['jpg'],
      gif: ['gif'],
      svg: ['svg'],
      webp: ['webp'],
      all: ['png', 'jpg', 'webp']
    };
    
    return formats[requestedFormat] || [requestedFormat];
  }

  private get3DFormats(requestedFormat: string): string[] {
    const formats: Record<string, string[]> = {
      obj: ['obj'],
      fbx: ['fbx'],
      gltf: ['gltf'],
      glb: ['glb'],
      dae: ['dae'],
      blend: ['blend'],
      all: ['obj', 'gltf', 'glb']
    };
    
    return formats[requestedFormat] || [requestedFormat];
  }

  private get2_5DFormats(requestedFormat: string): string[] {
    const formats: Record<string, string[]> = {
      png: ['png'],
      jpg: ['jpg'],
      webp: ['webp'],
      all: ['png', 'webp']
    };
    
    return formats[requestedFormat] || [requestedFormat];
  }

  private generateFilePath(assetData: any, format: string): string {
    const basePath = `exports/${assetData.dimensions}/${assetData.type}/${assetData.theme}`;
    const fileName = `${assetData.name}_${format}`;
    return `${basePath}/${fileName}.${format}`;
  }

  private generateTexturePath(assetData: any, format: string): string {
    const basePath = `exports/${assetData.dimensions}/textures/${assetData.theme}`;
    const fileName = `${assetData.name}_texture_${format}`;
    return `${basePath}/${fileName}.${format}`;
  }

  // Drawing helper methods
  private drawPixelSprite(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, colors: any): void {
    // Draw pixel art sprite
    const pixelSize = 4;
    const gridSize = Math.floor(radius / pixelSize);
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let y = -gridSize; y <= gridSize; y++) {
        if (x * x + y * y <= gridSize * gridSize) {
          ctx.fillStyle = colors.primary;
          ctx.fillRect(
            centerX + x * pixelSize,
            centerY + y * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }

  private drawHandDrawnSprite(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, colors: any): void {
    // Draw hand-drawn style sprite
    ctx.strokeStyle = colors.secondary;
    ctx.fillStyle = colors.primary;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawStylizedSprite(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, colors: any): void {
    // Draw stylized sprite
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, colors.accent);
    gradient.addColorStop(1, colors.primary);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGenericSprite(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, colors: any): void {
    // Draw generic sprite
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawArcaneTexture(ctx: CanvasRenderingContext2D, width: number, height: number, colors: any): void {
    // Draw arcane texture
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.primary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add arcane symbols
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 20 + 10;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawDivineTexture(ctx: CanvasRenderingContext2D, width: number, height: number, colors: any): void {
    // Draw divine texture
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, colors.accent);
    gradient.addColorStop(0.7, colors.primary);
    gradient.addColorStop(1, colors.secondary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawElementalTexture(ctx: CanvasRenderingContext2D, width: number, height: number, colors: any): void {
    // Draw elemental texture
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.accent);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawShadowTexture(ctx: CanvasRenderingContext2D, width: number, height: number, colors: any): void {
    // Draw shadow texture
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Add shadow effects
    ctx.fillStyle = colors.primary;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 10 + 5;
      
      ctx.globalAlpha = Math.random() * 0.5 + 0.1;
      ctx.fillRect(x, y, size, size);
    }
    
    ctx.globalAlpha = 1;
  }

  private drawGenericTexture(ctx: CanvasRenderingContext2D, width: number, height: number, colors: any): void {
    // Draw generic texture
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, width, height);
  }

  private addThemeDecorations(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, colors: any): void {
    // Add theme-specific decorations
    if (theme === 'arcane') {
      // Add arcane symbols
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 10 + 5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private addThemeElements(ctx: CanvasRenderingContext2D, width: number, height: number, theme: string, colors: any): void {
    // Add theme-specific elements
    if (theme === 'nature') {
      // Add nature elements
      ctx.fillStyle = colors.accent;
      
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 8 + 4;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}