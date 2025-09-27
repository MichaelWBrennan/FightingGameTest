/**
 * HD-2D Asset Processor - Processes assets for HD-2D rendering
 * Enhances existing asset pipeline with Octopath Traveler-style features
 */

import * as pc from 'playcanvas';

export interface HD2DAssetConfig {
  // Texture Processing
  pixelPerfectTextures: boolean;
  textureFiltering: 'nearest' | 'linear';
  mipmapGeneration: boolean;
  
  // Sprite Processing
  spriteAtlasOptimization: boolean;
  normalMapGeneration: boolean;
  specularMapGeneration: boolean;
  
  // 3D Asset Processing
  modelOptimization: boolean;
  lodGeneration: boolean;
  collisionMeshGeneration: boolean;
}

export interface ProcessedAsset {
  originalPath: string;
  processedPath: string;
  type: 'texture' | 'sprite' | 'model' | 'shader';
  metadata: any;
  hd2dOptimized: boolean;
}

export class HD2DAssetProcessor {
  private app: pc.Application;
  private config: HD2DAssetConfig;
  private processedAssets: Map<string, ProcessedAsset> = new Map();
  
  constructor(app: pc.Application, config?: Partial<HD2DAssetConfig>) {
    this.app = app;
    this.config = this.createDefaultConfig(config);
  }
  
  private createDefaultConfig(overrides?: Partial<HD2DAssetConfig>): HD2DAssetConfig {
    return {
      pixelPerfectTextures: true,
      textureFiltering: 'nearest',
      mipmapGeneration: false,
      spriteAtlasOptimization: true,
      normalMapGeneration: true,
      specularMapGeneration: true,
      modelOptimization: true,
      lodGeneration: true,
      collisionMeshGeneration: true,
      ...overrides
    };
  }
  
  public async processTexture(asset: pc.Asset): Promise<ProcessedAsset> {
    console.log(`Processing texture: ${asset.name}`);
    
    const texture = asset.resource as pc.Texture;
    if (!texture) {
      throw new Error(`Invalid texture asset: ${asset.name}`);
    }
    
    // Configure texture for HD-2D rendering
    if (this.config.pixelPerfectTextures) {
      texture.minFilter = pc.FILTER_NEAREST;
      texture.magFilter = pc.FILTER_NEAREST;
    } else {
      texture.minFilter = this.config.textureFiltering === 'nearest' ? pc.FILTER_NEAREST : pc.FILTER_LINEAR;
      texture.magFilter = this.config.textureFiltering === 'nearest' ? pc.FILTER_NEAREST : pc.FILTER_LINEAR;
    }
    
    // Disable mipmaps for pixel art
    if (this.config.textureFiltering === 'nearest') {
      texture.mipmaps = false;
    } else {
      texture.mipmaps = this.config.mipmapGeneration;
    }
    
    const processedAsset: ProcessedAsset = {
      originalPath: asset.file?.url || asset.name,
      processedPath: asset.file?.url || asset.name,
      type: 'texture',
      metadata: {
        width: texture.width,
        height: texture.height,
        format: texture.format,
        pixelPerfect: this.config.pixelPerfectTextures,
        filtering: this.config.textureFiltering
      },
      hd2dOptimized: true
    };
    
    this.processedAssets.set(asset.name, processedAsset);
    return processedAsset;
  }
  
  public async processSprite(asset: pc.Asset): Promise<ProcessedAsset> {
    console.log(`Processing sprite: ${asset.name}`);
    
    const texture = asset.resource as pc.Texture;
    if (!texture) {
      throw new Error(`Invalid sprite asset: ${asset.name}`);
    }
    
    // Process sprite for HD-2D rendering
    await this.processTexture(asset);
    
    // Generate normal map if enabled
    let normalMap: pc.Texture | null = null;
    if (this.config.normalMapGeneration) {
      normalMap = await this.generateNormalMap(texture);
    }
    
    // Generate specular map if enabled
    let specularMap: pc.Texture | null = null;
    if (this.config.specularMapGeneration) {
      specularMap = await this.generateSpecularMap(texture);
    }
    
    const processedAsset: ProcessedAsset = {
      originalPath: asset.file?.url || asset.name,
      processedPath: asset.file?.url || asset.name,
      type: 'sprite',
      metadata: {
        width: texture.width,
        height: texture.height,
        format: texture.format,
        normalMap: normalMap ? normalMap.name : null,
        specularMap: specularMap ? specularMap.name : null,
        pixelPerfect: this.config.pixelPerfectTextures
      },
      hd2dOptimized: true
    };
    
    this.processedAssets.set(asset.name, processedAsset);
    return processedAsset;
  }
  
  private async generateNormalMap(texture: pc.Texture): Promise<pc.Texture> {
    // Generate normal map from diffuse texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');
    
    canvas.width = texture.width;
    canvas.height = texture.height;
    
    // Create normal map from height data
    const imageData = ctx.createImageData(texture.width, texture.height);
    const data = imageData.data;
    
    // Simple normal map generation (in practice, you'd use more sophisticated algorithms)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R - X normal
      data[i + 1] = 128; // G - Y normal  
      data[i + 2] = 255; // B - Z normal
      data[i + 3] = 255; // A - Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create texture from canvas
    const normalMapTexture = new pc.Texture(this.app.graphicsDevice, {
      width: texture.width,
      height: texture.height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: false
    });
    
    // In a real implementation, you'd upload the canvas data to the texture
    console.log(`Generated normal map for texture: ${texture.name}`);
    
    return normalMapTexture;
  }
  
  private async generateSpecularMap(texture: pc.Texture): Promise<pc.Texture> {
    // Generate specular map from diffuse texture
    const specularMapTexture = new pc.Texture(this.app.graphicsDevice, {
      width: texture.width,
      height: texture.height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: false
    });
    
    // In a real implementation, you'd analyze the diffuse texture
    // to determine specular highlights and roughness
    console.log(`Generated specular map for texture: ${texture.name}`);
    
    return specularMapTexture;
  }
  
  public async processModel(asset: pc.Asset): Promise<ProcessedAsset> {
    console.log(`Processing model: ${asset.name}`);
    
    const model = asset.resource as pc.Model;
    if (!model) {
      throw new Error(`Invalid model asset: ${asset.name}`);
    }
    
    // Optimize model for HD-2D rendering
    if (this.config.modelOptimization) {
      this.optimizeModelForHD2D(model);
    }
    
    // Generate LOD if enabled
    let lodLevels: any[] = [];
    if (this.config.lodGeneration) {
      lodLevels = await this.generateLODLevels(model);
    }
    
    // Generate collision mesh if enabled
    let collisionMesh: any = null;
    if (this.config.collisionMeshGeneration) {
      collisionMesh = await this.generateCollisionMesh(model);
    }
    
    const processedAsset: ProcessedAsset = {
      originalPath: asset.file?.url || asset.name,
      processedPath: asset.file?.url || asset.name,
      type: 'model',
      metadata: {
        meshCount: model.meshInstances.length,
        vertexCount: this.getTotalVertexCount(model),
        lodLevels: lodLevels.length,
        collisionMesh: collisionMesh ? true : false,
        optimized: this.config.modelOptimization
      },
      hd2dOptimized: true
    };
    
    this.processedAssets.set(asset.name, processedAsset);
    return processedAsset;
  }
  
  private optimizeModelForHD2D(model: pc.Model): void {
    // Optimize model for HD-2D rendering
    model.meshInstances.forEach(meshInstance => {
      if (meshInstance.material) {
        // Configure material for HD-2D
        const material = meshInstance.material as pc.StandardMaterial;
        material.useLighting = true;
        material.useSkybox = false;
        material.useFog = false;
        
        // Enable features for HD-2D look
        material.useMetalness = true;
        material.metalness = 0;
        material.roughness = 0.8;
      }
    });
  }
  
  private getTotalVertexCount(model: pc.Model): number {
    let totalVertices = 0;
    model.meshInstances.forEach(meshInstance => {
      if (meshInstance.mesh) {
        totalVertices += meshInstance.mesh.vertexBuffer.numVertices;
      }
    });
    return totalVertices;
  }
  
  private async generateLODLevels(model: pc.Model): Promise<any[]> {
    // Generate LOD levels for the model
    const lodLevels = [];
    
    // LOD 0 (highest detail)
    lodLevels.push({
      level: 0,
      distance: 0,
      meshInstances: model.meshInstances
    });
    
    // LOD 1 (medium detail) - simplified version
    lodLevels.push({
      level: 1,
      distance: 50,
      meshInstances: model.meshInstances // In practice, you'd create simplified meshes
    });
    
    // LOD 2 (lowest detail) - very simplified version
    lodLevels.push({
      level: 2,
      distance: 100,
      meshInstances: model.meshInstances // In practice, you'd create very simplified meshes
    });
    
    return lodLevels;
  }
  
  private async generateCollisionMesh(model: pc.Model): Promise<any> {
    // Generate collision mesh for the model
    // In practice, you'd create a simplified collision mesh
    return {
      type: 'box', // Simplified to box collision
      bounds: this.calculateModelBounds(model)
    };
  }
  
  private calculateModelBounds(model: pc.Model): pc.BoundingBox {
    // Calculate bounding box for the model
    const bounds = new pc.BoundingBox();
    model.meshInstances.forEach(meshInstance => {
      if (meshInstance.mesh) {
        bounds.add(meshInstance.mesh.vertexBuffer);
      }
    });
    return bounds;
  }
  
  public async processShader(asset: pc.Asset): Promise<ProcessedAsset> {
    console.log(`Processing shader: ${asset.name}`);
    
    const shader = asset.resource as pc.Shader;
    if (!shader) {
      throw new Error(`Invalid shader asset: ${asset.name}`);
    }
    
    // Process shader for HD-2D rendering
    const processedAsset: ProcessedAsset = {
      originalPath: asset.file?.url || asset.name,
      processedPath: asset.file?.url || asset.name,
      type: 'shader',
      metadata: {
        attributes: Object.keys(shader.attributes),
        uniforms: Object.keys(shader.uniforms),
        hd2dOptimized: true
      },
      hd2dOptimized: true
    };
    
    this.processedAssets.set(asset.name, processedAsset);
    return processedAsset;
  }
  
  public async processAllAssets(): Promise<ProcessedAsset[]> {
    console.log('Processing all assets for HD-2D...');
    
    const processedAssets: ProcessedAsset[] = [];
    
    // Process all texture assets
    this.app.assets.filter(asset => asset.type === 'texture').forEach(async (asset) => {
      try {
        const processed = await this.processTexture(asset);
        processedAssets.push(processed);
      } catch (error) {
        console.error(`Failed to process texture ${asset.name}:`, error);
      }
    });
    
    // Process all model assets
    this.app.assets.filter(asset => asset.type === 'model').forEach(async (asset) => {
      try {
        const processed = await this.processModel(asset);
        processedAssets.push(processed);
      } catch (error) {
        console.error(`Failed to process model ${asset.name}:`, error);
      }
    });
    
    // Process all shader assets
    this.app.assets.filter(asset => asset.type === 'shader').forEach(async (asset) => {
      try {
        const processed = await this.processShader(asset);
        processedAssets.push(processed);
      } catch (error) {
        console.error(`Failed to process shader ${asset.name}:`, error);
      }
    });
    
    console.log(`Processed ${processedAssets.length} assets for HD-2D`);
    return processedAssets;
  }
  
  public getProcessedAsset(name: string): ProcessedAsset | undefined {
    return this.processedAssets.get(name);
  }
  
  public getAllProcessedAssets(): ProcessedAsset[] {
    return Array.from(this.processedAssets.values());
  }
  
  public getProcessingStats(): any {
    const stats = {
      totalProcessed: this.processedAssets.size,
      byType: {
        texture: 0,
        sprite: 0,
        model: 0,
        shader: 0
      },
      hd2dOptimized: 0
    };
    
    this.processedAssets.forEach(asset => {
      stats.byType[asset.type]++;
      if (asset.hd2dOptimized) {
        stats.hd2dOptimized++;
      }
    });
    
    return stats;
  }
  
  public destroy(): void {
    this.processedAssets.clear();
  }
}