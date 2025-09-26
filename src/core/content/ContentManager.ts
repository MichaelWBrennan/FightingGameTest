import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import type { GeneratedContent} from './ContentGenerationManager';
import { ContentGenerationManager } from './ContentGenerationManager';
import type { ValidationResult } from './ContentValidator';
import { ContentValidator } from './ContentValidator';

export interface ContentFilter {
  type?: string;
  quality?: number;
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  search?: string;
}

export interface ContentStats {
  total: number;
  byType: Record<string, number>;
  byQuality: Record<string, number>;
  averageQuality: number;
  totalSize: number;
  lastUpdated: number;
}

export interface ContentExport {
  content: GeneratedContent[];
  metadata: {
    exportedAt: number;
    version: string;
    count: number;
  };
}

export class ContentManager {
  private app: pc.Application;
  private generationManager: ContentGenerationManager;
  private validator: ContentValidator;
  private content: Map<string, GeneratedContent> = new Map();
  private stats: ContentStats;

  constructor(app: pc.Application) {
    this.app = app;
    this.generationManager = new ContentGenerationManager(app);
    this.validator = new ContentValidator(app);
    this.stats = this.initializeStats();
  }

  private initializeStats(): ContentStats {
    return {
      total: 0,
      byType: {},
      byQuality: {},
      averageQuality: 0,
      totalSize: 0,
      lastUpdated: Date.now()
    };
  }

  public async generateContent(
    type: string,
    options: any = {},
    config?: any
  ): Promise<GeneratedContent | null> {
    try {
      const content = await this.generationManager.generateContent(type, options, config);
      if (content) {
        await this.addContent(content);
        Logger.info(`Generated ${type} content: ${content.name}`);
      }
      return content;
    } catch (error) {
      Logger.error(`Error generating ${type} content:`, error);
      return null;
    }
  }

  public async generateBatch(
    requests: Array<{ type: string; options: any; config?: any }>
  ): Promise<GeneratedContent[]> {
    try {
      const results = await this.generationManager.generateBatch(requests);
      for (const content of results) {
        await this.addContent(content);
      }
      Logger.info(`Generated batch of ${results.length} content items`);
      return results;
    } catch (error) {
      Logger.error('Error generating batch content:', error);
      return [];
    }
  }

  public async addContent(content: GeneratedContent): Promise<boolean> {
    try {
      // Validate content before adding
      const validation = await this.validator.validate(content, content.type);
      if (!validation.valid) {
        Logger.warn(`Content validation failed: ${validation.errors.join(', ')}`);
        return false;
      }

      // Update content quality based on validation
      content.metadata.quality = validation.quality;

      // Add content
      this.content.set(content.id, content);
      this.updateStats(content);
      
      Logger.info(`Added content: ${content.name} (Quality: ${validation.quality.toFixed(2)})`);
      return true;
    } catch (error) {
      Logger.error('Error adding content:', error);
      return false;
    }
  }

  public getContent(id: string): GeneratedContent | undefined {
    return this.content.get(id);
  }

  public getAllContent(): GeneratedContent[] {
    return Array.from(this.content.values());
  }

  public getContentByType(type: string): GeneratedContent[] {
    return this.getAllContent().filter(content => content.type === type);
  }

  public getContentByQuality(minQuality: number): GeneratedContent[] {
    return this.getAllContent().filter(content => content.metadata.quality >= minQuality);
  }

  public searchContent(query: string, filters?: ContentFilter): GeneratedContent[] {
    let results = this.getAllContent();

    // Apply search query
    if (query) {
      results = results.filter(content => 
        content.name.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.type) {
        results = results.filter(content => content.type === filters.type);
      }
      
      if (filters.quality !== undefined) {
        results = results.filter(content => content.metadata.quality >= filters.quality!);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(content => 
          filters.tags!.some(tag => content.metadata.tags.includes(tag))
        );
      }
      
      if (filters.dateRange) {
        results = results.filter(content => 
          content.metadata.generatedAt >= filters.dateRange!.start &&
          content.metadata.generatedAt <= filters.dateRange!.end
        );
      }
    }

    return results;
  }

  public async validateContent(id: string): Promise<ValidationResult | null> {
    const content = this.content.get(id);
    if (!content) {
      Logger.warn(`Content not found: ${id}`);
      return null;
    }

    try {
      const validation = await this.validator.validate(content, content.type);
      
      // Update content quality if validation passed
      if (validation.valid) {
        content.metadata.quality = validation.quality;
        this.updateStats(content);
      }
      
      return validation;
    } catch (error) {
      Logger.error('Error validating content:', error);
      return null;
    }
  }

  public async validateAllContent(): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    for (const [id, content] of this.content) {
      try {
        const validation = await this.validator.validate(content, content.type);
        results.set(id, validation);
        
        // Update content quality if validation passed
        if (validation.valid) {
          content.metadata.quality = validation.quality;
        }
      } catch (error) {
        Logger.error(`Error validating content ${id}:`, error);
        results.set(id, {
          valid: false,
          quality: 0,
          errors: ['Validation failed'],
          warnings: [],
          suggestions: [],
          score: 0
        });
      }
    }
    
    this.updateAllStats();
    Logger.info(`Validated ${results.size} content items`);
    return results;
  }

  public updateContent(id: string, updates: Partial<GeneratedContent>): boolean {
    const content = this.content.get(id);
    if (!content) {
      Logger.warn(`Content not found: ${id}`);
      return false;
    }

    try {
      // Merge updates
      const updatedContent = { ...content, ...updates };
      
      // Validate updated content
      this.validator.validate(updatedContent, updatedContent.type).then(validation => {
        if (validation.valid) {
          updatedContent.metadata.quality = validation.quality;
        }
      });
      
      // Update content
      this.content.set(id, updatedContent);
      this.updateStats(updatedContent);
      
      Logger.info(`Updated content: ${updatedContent.name}`);
      return true;
    } catch (error) {
      Logger.error('Error updating content:', error);
      return false;
    }
  }

  public removeContent(id: string): boolean {
    const content = this.content.get(id);
    if (!content) {
      Logger.warn(`Content not found: ${id}`);
      return false;
    }

    try {
      this.content.delete(id);
      this.updateStats();
      Logger.info(`Removed content: ${content.name}`);
      return true;
    } catch (error) {
      Logger.error('Error removing content:', error);
      return false;
    }
  }

  public getStats(): ContentStats {
    return { ...this.stats };
  }

  public getContentCount(): number {
    return this.content.size;
  }

  public getContentByTags(tags: string[]): GeneratedContent[] {
    return this.getAllContent().filter(content => 
      tags.some(tag => content.metadata.tags.includes(tag))
    );
  }

  public getRecentContent(limit: number = 10): GeneratedContent[] {
    return this.getAllContent()
      .sort((a, b) => b.metadata.generatedAt - a.metadata.generatedAt)
      .slice(0, limit);
  }

  public getTopQualityContent(limit: number = 10): GeneratedContent[] {
    return this.getAllContent()
      .sort((a, b) => b.metadata.quality - a.metadata.quality)
      .slice(0, limit);
  }

  public async exportContent(ids?: string[]): Promise<ContentExport> {
    try {
      const contentToExport = ids ? 
        ids.map(id => this.content.get(id)).filter(content => content !== undefined) as GeneratedContent[] :
        this.getAllContent();

      const exportData: ContentExport = {
        content: contentToExport,
        metadata: {
          exportedAt: Date.now(),
          version: '1.0.0',
          count: contentToExport.length
        }
      };

      Logger.info(`Exported ${contentToExport.length} content items`);
      return exportData;
    } catch (error) {
      Logger.error('Error exporting content:', error);
      throw error;
    }
  }

  public async importContent(exportData: ContentExport): Promise<boolean> {
    try {
      let importedCount = 0;
      
      for (const content of exportData.content) {
        const success = await this.addContent(content);
        if (success) {
          importedCount++;
        }
      }
      
      Logger.info(`Imported ${importedCount}/${exportData.content.length} content items`);
      return importedCount > 0;
    } catch (error) {
      Logger.error('Error importing content:', error);
      return false;
    }
  }

  public clearContent(): void {
    this.content.clear();
    this.stats = this.initializeStats();
    Logger.info('All content cleared');
  }

  public async optimizeContent(id: string): Promise<boolean> {
    const content = this.content.get(id);
    if (!content) {
      Logger.warn(`Content not found: ${id}`);
      return false;
    }

    try {
      // Optimize based on content type
      let optimized = false;
      
      switch (content.type) {
        case 'character':
          optimized = await this.optimizeCharacterContent(content);
          break;
        case 'stage':
          optimized = await this.optimizeStageContent(content);
          break;
        case 'asset':
          optimized = await this.optimizeAssetContent(content);
          break;
        case 'combo':
          optimized = await this.optimizeComboContent(content);
          break;
        default:
          Logger.warn(`No optimization available for content type: ${content.type}`);
          return false;
      }

      if (optimized) {
        this.updateStats(content);
        Logger.info(`Optimized content: ${content.name}`);
      }
      
      return optimized;
    } catch (error) {
      Logger.error('Error optimizing content:', error);
      return false;
    }
  }

  private async optimizeCharacterContent(content: GeneratedContent): Promise<boolean> {
    const data = content.data;
    let optimized = false;

    // Optimize animations
    if (data.animations) {
      for (const [name, anim] of Object.entries(data.animations)) {
        if (anim.frameCount > 60) {
          anim.frameCount = 60;
          optimized = true;
        }
      }
    }

    // Optimize stats
    if (data.health > 1200) {
      data.health = 1200;
      optimized = true;
    }
    if (data.walkSpeed > 200) {
      data.walkSpeed = 200;
      optimized = true;
    }

    return optimized;
  }

  private async optimizeStageContent(content: GeneratedContent): Promise<boolean> {
    const data = content.data;
    let optimized = false;

    // Optimize layers
    if (data.layers && Object.keys(data.layers).length > 5) {
      const layerKeys = Object.keys(data.layers);
      const importantLayers = ['skybox', 'farBackground', 'midBackground', 'playground', 'foreground'];
      
      for (const key of layerKeys) {
        if (!importantLayers.includes(key) && Object.keys(data.layers).length > 5) {
          delete data.layers[key];
          optimized = true;
        }
      }
    }

    // Optimize effects
    if (data.effects && data.effects.length > 10) {
      data.effects = data.effects.slice(0, 10);
      optimized = true;
    }

    return optimized;
  }

  private async optimizeAssetContent(content: GeneratedContent): Promise<boolean> {
    const data = content.data;
    let optimized = false;

    // Optimize properties
    if (data.properties) {
      if (data.properties.width > 512) {
        data.properties.width = 512;
        optimized = true;
      }
      if (data.properties.height > 512) {
        data.properties.height = 512;
        optimized = true;
      }
    }

    // Optimize files
    if (data.files) {
      const totalSize = data.files.reduce((sum: number, file: any) => sum + file.size, 0);
      if (totalSize > 5 * 1024 * 1024) { // 5MB
        data.files = data.files.slice(0, 3);
        optimized = true;
      }
    }

    return optimized;
  }

  private async optimizeComboContent(content: GeneratedContent): Promise<boolean> {
    const data = content.data;
    let optimized = false;

    // Optimize inputs
    if (data.inputs && data.inputs.length > 15) {
      data.inputs = data.inputs.slice(0, 15);
      optimized = true;
    }

    // Optimize damage
    if (data.properties && data.properties.totalDamage > 800) {
      data.properties.totalDamage = 800;
      optimized = true;
    }

    return optimized;
  }

  private updateStats(content?: GeneratedContent): void {
    if (content) {
      // Update stats for specific content
      this.stats.total = this.content.size;
      this.stats.byType[content.type] = (this.stats.byType[content.type] || 0) + 1;
      this.stats.byQuality[content.metadata.quality.toString()] = (this.stats.byQuality[content.metadata.quality.toString()] || 0) + 1;
    } else {
      // Recalculate all stats
      this.stats.total = this.content.size;
      this.stats.byType = {};
      this.stats.byQuality = {};
      this.stats.totalSize = 0;
      
      let totalQuality = 0;
      
      for (const content of this.content.values()) {
        this.stats.byType[content.type] = (this.stats.byType[content.type] || 0) + 1;
        this.stats.byQuality[content.metadata.quality.toString()] = (this.stats.byQuality[content.metadata.quality.toString()] || 0) + 1;
        totalQuality += content.metadata.quality;
        this.stats.totalSize += this.calculateContentSize(content);
      }
      
      this.stats.averageQuality = this.stats.total > 0 ? totalQuality / this.stats.total : 0;
    }
    
    this.stats.lastUpdated = Date.now();
  }

  private updateAllStats(): void {
    this.updateStats();
  }

  private calculateContentSize(content: GeneratedContent): number {
    let size = 0;
    
    // Calculate size based on content type
    switch (content.type) {
      case 'character':
        size = this.calculateCharacterSize(content);
        break;
      case 'stage':
        size = this.calculateStageSize(content);
        break;
      case 'asset':
        size = this.calculateAssetSize(content);
        break;
      case 'combo':
        size = this.calculateComboSize(content);
        break;
      default:
        size = JSON.stringify(content).length;
    }
    
    return size;
  }

  private calculateCharacterSize(content: GeneratedContent): number {
    const data = content.data;
    let size = 0;
    
    // Base size
    size += JSON.stringify(data).length;
    
    // Add animation size
    if (data.animations) {
      size += Object.keys(data.animations).length * 1000; // Estimate
    }
    
    // Add move size
    if (data.normals) size += Object.keys(data.normals).length * 500;
    if (data.specials) size += Object.keys(data.specials).length * 800;
    if (data.supers) size += Object.keys(data.supers).length * 1000;
    
    return size;
  }

  private calculateStageSize(content: GeneratedContent): number {
    const data = content.data;
    let size = 0;
    
    // Base size
    size += JSON.stringify(data).length;
    
    // Add layer size
    if (data.layers) {
      size += Object.keys(data.layers).length * 2000; // Estimate
    }
    
    // Add effect size
    if (data.effects) {
      size += data.effects.length * 500;
    }
    
    return size;
  }

  private calculateAssetSize(content: GeneratedContent): number {
    const data = content.data;
    let size = 0;
    
    // Base size
    size += JSON.stringify(data).length;
    
    // Add file size
    if (data.files) {
      size += data.files.reduce((sum: number, file: any) => sum + file.size, 0);
    }
    
    return size;
  }

  private calculateComboSize(content: GeneratedContent): number {
    const data = content.data;
    let size = 0;
    
    // Base size
    size += JSON.stringify(data).length;
    
    // Add input size
    if (data.inputs) {
      size += data.inputs.length * 200;
    }
    
    // Add variation size
    if (data.variations) {
      size += data.variations.length * 500;
    }
    
    return size;
  }

  public destroy(): void {
    this.content.clear();
    this.generationManager.destroy();
    Logger.info('Content manager destroyed');
  }
}