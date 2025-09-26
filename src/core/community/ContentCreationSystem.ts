import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface ContentCreator {
  id: string;
  name: string;
  level: number;
  experience: number;
  reputation: number;
  content: ContentItem[];
  followers: string[];
  following: string[];
  achievements: string[];
  statistics: {
    totalContent: number;
    totalDownloads: number;
    totalLikes: number;
    totalViews: number;
    averageRating: number;
  };
}

export interface ContentItem {
  id: string;
  name: string;
  description: string;
  type: 'combo' | 'stage' | 'mod' | 'tournament' | 'guide' | 'artwork';
  creator: string;
  createdDate: number;
  updatedDate: number;
  version: string;
  downloads: number;
  likes: number;
  views: number;
  rating: number;
  tags: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'draft' | 'published' | 'featured' | 'removed';
  content: any;
  thumbnail?: string;
  preview?: string;
  requirements: {
    level?: number;
    characterUnlocked?: string;
    storyProgress?: number;
  };
}

export interface ComboCreator {
  visualEditor: VisualComboEditor;
  timing: TimingSystem;
  validation: ComboValidation;
  sharing: ComboSharing;
  discovery: ComboDiscovery;
}

export interface VisualComboEditor {
  enabled: boolean;
  dragAndDrop: boolean;
  timeline: boolean;
  preview: boolean;
  undoRedo: boolean;
  copyPaste: boolean;
  templates: boolean;
}

export interface TimingSystem {
  frameData: boolean;
  hitboxVisualization: boolean;
  cancelWindows: boolean;
  inputDisplay: boolean;
  slowMotion: boolean;
  frameStep: boolean;
}

export interface ComboValidation {
  frameDataCheck: boolean;
  hitboxVerification: boolean;
  damageCalculation: boolean;
  meterGainCalculation: boolean;
  practicalApplication: boolean;
  balanceCheck: boolean;
}

export interface ComboSharing {
  communityUpload: boolean;
  socialMedia: boolean;
  directShare: boolean;
  embedCode: boolean;
  qrCode: boolean;
}

export interface ComboDiscovery {
  search: boolean;
  filters: boolean;
  recommendations: boolean;
  trending: boolean;
  featured: boolean;
  categories: boolean;
}

export interface StageBuilder {
  visualEditor: VisualStageEditor;
  assets: AssetLibrary;
  scripting: ScriptingSystem;
  testing: TestingSystem;
  sharing: StageSharing;
}

export interface VisualStageEditor {
  enabled: boolean;
  dragAndDrop: boolean;
  layers: boolean;
  grid: boolean;
  snap: boolean;
  zoom: boolean;
  undoRedo: boolean;
  copyPaste: boolean;
}

export interface AssetLibrary {
  backgrounds: string[];
  platforms: string[];
  objects: string[];
  effects: string[];
  audio: string[];
  custom: string[];
}

export interface ScriptingSystem {
  enabled: boolean;
  language: 'javascript' | 'lua' | 'python';
  api: boolean;
  documentation: boolean;
  examples: boolean;
  debugging: boolean;
}

export interface TestingSystem {
  playtest: boolean;
  debugMode: boolean;
  performance: boolean;
  compatibility: boolean;
  validation: boolean;
}

export interface StageSharing {
  communityUpload: boolean;
  versionControl: boolean;
  collaboration: boolean;
  permissions: boolean;
  moderation: boolean;
}

export interface ModSupport {
  enabled: boolean;
  steamWorkshop: boolean;
  nexusMods: boolean;
  customLoader: boolean;
  versioning: boolean;
  dependencies: boolean;
  conflicts: boolean;
}

export interface WorkshopSystem {
  enabled: boolean;
  categories: string[];
  tags: string[];
  rating: boolean;
  comments: boolean;
  reviews: boolean;
  moderation: boolean;
  featured: boolean;
  trending: boolean;
}

export class ContentCreationSystem {
  private app: pc.Application;
  private contentCreators: Map<string, ContentCreator> = new Map();
  private contentItems: Map<string, ContentItem> = new Map();
  private comboCreator: ComboCreator;
  private stageBuilder: StageBuilder;
  private modSupport: ModSupport;
  private workshopSystem: WorkshopSystem;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeContentCreationSystem();
  }

  private initializeContentCreationSystem(): void {
    this.initializeComboCreator();
    this.initializeStageBuilder();
    this.initializeModSupport();
    this.initializeWorkshopSystem();
  }

  private initializeComboCreator(): void {
    this.comboCreator = {
      visualEditor: {
        enabled: true,
        dragAndDrop: true,
        timeline: true,
        preview: true,
        undoRedo: true,
        copyPaste: true,
        templates: true
      },
      timing: {
        frameData: true,
        hitboxVisualization: true,
        cancelWindows: true,
        inputDisplay: true,
        slowMotion: true,
        frameStep: true
      },
      validation: {
        frameDataCheck: true,
        hitboxVerification: true,
        damageCalculation: true,
        meterGainCalculation: true,
        practicalApplication: true,
        balanceCheck: true
      },
      sharing: {
        communityUpload: true,
        socialMedia: true,
        directShare: true,
        embedCode: true,
        qrCode: true
      },
      discovery: {
        search: true,
        filters: true,
        recommendations: true,
        trending: true,
        featured: true,
        categories: true
      }
    };
  }

  private initializeStageBuilder(): void {
    this.stageBuilder = {
      visualEditor: {
        enabled: true,
        dragAndDrop: true,
        layers: true,
        grid: true,
        snap: true,
        zoom: true,
        undoRedo: true,
        copyPaste: true
      },
      assets: {
        backgrounds: ['metro_city', 'china_town', 'russia', 'india', 'japan'],
        platforms: ['platform_1', 'platform_2', 'platform_3'],
        objects: ['barrel', 'crate', 'lamp', 'sign'],
        effects: ['fire', 'smoke', 'sparks', 'dust'],
        audio: ['ambient_1', 'ambient_2', 'music_1', 'music_2'],
        custom: []
      },
      scripting: {
        enabled: true,
        language: 'javascript',
        api: true,
        documentation: true,
        examples: true,
        debugging: true
      },
      testing: {
        playtest: true,
        debugMode: true,
        performance: true,
        compatibility: true,
        validation: true
      },
      sharing: {
        communityUpload: true,
        versionControl: true,
        collaboration: true,
        permissions: true,
        moderation: true
      }
    };
  }

  private initializeModSupport(): void {
    this.modSupport = {
      enabled: true,
      steamWorkshop: true,
      nexusMods: true,
      customLoader: true,
      versioning: true,
      dependencies: true,
      conflicts: true
    };
  }

  private initializeWorkshopSystem(): void {
    this.workshopSystem = {
      enabled: true,
      categories: ['combos', 'stages', 'mods', 'tournaments', 'guides', 'artwork'],
      tags: ['beginner', 'intermediate', 'advanced', 'expert', 'practical', 'showcase'],
      rating: true,
      comments: true,
      reviews: true,
      moderation: true,
      featured: true,
      trending: true
    };
  }

  public createContentCreator(playerId: string, name: string): ContentCreator {
    const creator: ContentCreator = {
      id: playerId,
      name,
      level: 1,
      experience: 0,
      reputation: 0,
      content: [],
      followers: [],
      following: [],
      achievements: [],
      statistics: {
        totalContent: 0,
        totalDownloads: 0,
        totalLikes: 0,
        totalViews: 0,
        averageRating: 0
      }
    };

    this.contentCreators.set(playerId, creator);
    this.app.fire('content:creator_created', { creator });
    Logger.info(`Created content creator: ${name}`);
    return creator;
  }

  public createContent(creatorId: string, content: Omit<ContentItem, 'id' | 'creator' | 'createdDate' | 'updatedDate' | 'downloads' | 'likes' | 'views' | 'rating'>): ContentItem {
    const contentItem: ContentItem = {
      ...content,
      id: `content_${Date.now()}`,
      creator: creatorId,
      createdDate: Date.now(),
      updatedDate: Date.now(),
      downloads: 0,
      likes: 0,
      views: 0,
      rating: 0
    };

    this.contentItems.set(contentItem.id, contentItem);

    // Update creator statistics
    const creator = this.contentCreators.get(creatorId);
    if (creator) {
      creator.content.push(contentItem);
      creator.statistics.totalContent++;
    }

    this.app.fire('content:item_created', { content: contentItem });
    Logger.info(`Created content: ${contentItem.name}`);
    return contentItem;
  }

  public updateContent(contentId: string, updates: Partial<ContentItem>): boolean {
    const content = this.contentItems.get(contentId);
    if (!content) {
      Logger.warn(`Content ${contentId} not found`);
      return false;
    }

    Object.assign(content, updates);
    content.updatedDate = Date.now();

    this.app.fire('content:item_updated', { content });
    Logger.info(`Updated content: ${content.name}`);
    return true;
  }

  public deleteContent(contentId: string, creatorId: string): boolean {
    const content = this.contentItems.get(contentId);
    if (!content) {
      Logger.warn(`Content ${contentId} not found`);
      return false;
    }

    if (content.creator !== creatorId) {
      Logger.warn(`Creator ${creatorId} does not own content ${contentId}`);
      return false;
    }

    this.contentItems.delete(contentId);

    // Update creator statistics
    const creator = this.contentCreators.get(creatorId);
    if (creator) {
      creator.content = creator.content.filter(c => c.id !== contentId);
      creator.statistics.totalContent--;
    }

    this.app.fire('content:item_deleted', { contentId });
    Logger.info(`Deleted content: ${content.name}`);
    return true;
  }

  public likeContent(contentId: string, playerId: string): boolean {
    const content = this.contentItems.get(contentId);
    if (!content) {
      Logger.warn(`Content ${contentId} not found`);
      return false;
    }

    content.likes++;
    content.views++;

    this.app.fire('content:item_liked', { contentId, playerId });
    Logger.info(`Player ${playerId} liked content ${content.name}`);
    return true;
  }

  public downloadContent(contentId: string, playerId: string): boolean {
    const content = this.contentItems.get(contentId);
    if (!content) {
      Logger.warn(`Content ${contentId} not found`);
      return false;
    }

    content.downloads++;
    content.views++;

    // Update creator statistics
    const creator = this.contentCreators.get(content.creator);
    if (creator) {
      creator.statistics.totalDownloads++;
    }

    this.app.fire('content:item_downloaded', { contentId, playerId });
    Logger.info(`Player ${playerId} downloaded content ${content.name}`);
    return true;
  }

  public rateContent(contentId: string, playerId: string, rating: number): boolean {
    const content = this.contentItems.get(contentId);
    if (!content) {
      Logger.warn(`Content ${contentId} not found`);
      return false;
    }

    if (rating < 1 || rating > 5) {
      Logger.warn(`Invalid rating ${rating} for content ${contentId}`);
      return false;
    }

    // Update rating (simple average for now)
    const totalRatings = content.views;
    const currentTotal = content.rating * totalRatings;
    content.rating = (currentTotal + rating) / (totalRatings + 1);

    this.app.fire('content:item_rated', { contentId, playerId, rating });
    Logger.info(`Player ${playerId} rated content ${content.name} with ${rating} stars`);
    return true;
  }

  public searchContent(query: string, filters?: {
    type?: string;
    category?: string;
    difficulty?: string;
    tags?: string[];
    minRating?: number;
    sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'downloads';
  }): ContentItem[] {
    let results = Array.from(this.contentItems.values());

    // Filter by query
    if (query) {
      results = results.filter(content => 
        content.name.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.type) {
        results = results.filter(content => content.type === filters.type);
      }

      if (filters.category) {
        results = results.filter(content => content.category === filters.category);
      }

      if (filters.difficulty) {
        results = results.filter(content => content.difficulty === filters.difficulty);
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(content => 
          filters.tags!.some(tag => content.tags.includes(tag))
        );
      }

      if (filters.minRating) {
        results = results.filter(content => content.rating >= filters.minRating!);
      }

      // Sort results
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            results.sort((a, b) => b.createdDate - a.createdDate);
            break;
          case 'oldest':
            results.sort((a, b) => a.createdDate - b.createdDate);
            break;
          case 'popular':
            results.sort((a, b) => b.downloads - a.downloads);
            break;
          case 'rating':
            results.sort((a, b) => b.rating - a.rating);
            break;
          case 'downloads':
            results.sort((a, b) => b.downloads - a.downloads);
            break;
        }
      }
    }

    return results;
  }

  public getTrendingContent(limit: number = 10): ContentItem[] {
    const results = Array.from(this.contentItems.values())
      .filter(content => content.status === 'published')
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);

    return results;
  }

  public getFeaturedContent(limit: number = 10): ContentItem[] {
    const results = Array.from(this.contentItems.values())
      .filter(content => content.status === 'featured')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return results;
  }

  public getContentCreator(creatorId: string): ContentCreator | undefined {
    return this.contentCreators.get(creatorId);
  }

  public getContentItem(contentId: string): ContentItem | undefined {
    return this.contentItems.get(contentId);
  }

  public getComboCreator(): ComboCreator {
    return this.comboCreator;
  }

  public getStageBuilder(): StageBuilder {
    return this.stageBuilder;
  }

  public getModSupport(): ModSupport {
    return this.modSupport;
  }

  public getWorkshopSystem(): WorkshopSystem {
    return this.workshopSystem;
  }

  public destroy(): void {
    this.contentCreators.clear();
    this.contentItems.clear();
  }
}