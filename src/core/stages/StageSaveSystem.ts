import * as pc from 'playcanvas';
import { ProceduralStageGenerator } from '../procgen/ProceduralStageGenerator';

export interface SavedStage {
  id: string;
  name: string;
  description: string;
  stageData: any;
  generationParams: {
    seed: number;
    theme: string;
    size: string;
    atmosphere: string;
    hazards: boolean;
    interactiveElements: number;
    weather: string;
    timeOfDay: string;
  };
  createdAt: Date;
  matchId?: string;
  playerId?: string;
  tags: string[];
  isFavorite: boolean;
  playCount: number;
  lastPlayed?: Date;
}

export interface StageSaveOptions {
  name?: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  matchId?: string;
  playerId?: string;
}

export class StageSaveSystem {
  private app: pc.Application;
  private savedStages: Map<string, SavedStage> = new Map();
  private storageKey = 'fightforge_saved_stages';
  private maxSavedStages = 100;

  constructor(app: pc.Application) {
    this.app = app;
    this.loadSavedStages();
  }

  private loadSavedStages(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.savedStages = new Map(data.savedStages || []);
        
        // Convert date strings back to Date objects
        for (const [id, stage] of this.savedStages.entries()) {
          stage.createdAt = new Date(stage.createdAt);
          if (stage.lastPlayed) {
            stage.lastPlayed = new Date(stage.lastPlayed);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved stages:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        savedStages: Array.from(this.savedStages.entries()),
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save stages to storage:', error);
    }
  }

  public saveStage(
    stageData: any, 
    generationParams: any, 
    options: StageSaveOptions = {}
  ): string {
    const id = this.generateStageId();
    const now = new Date();
    
    const savedStage: SavedStage = {
      id,
      name: options.name || this.generateStageName(stageData, generationParams),
      description: options.description || this.generateStageDescription(stageData, generationParams),
      stageData: JSON.parse(JSON.stringify(stageData)), // Deep clone
      generationParams: { ...generationParams },
      createdAt: now,
      matchId: options.matchId,
      playerId: options.playerId,
      tags: options.tags || this.generateTags(stageData, generationParams),
      isFavorite: options.isFavorite || false,
      playCount: 0
    };

    // Remove oldest stage if we're at the limit
    if (this.savedStages.size >= this.maxSavedStages) {
      const oldestStage = Array.from(this.savedStages.values())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      this.savedStages.delete(oldestStage.id);
    }

    this.savedStages.set(id, savedStage);
    this.saveToStorage();

    this.app.fire('stage:saved', { stage: savedStage });
    return id;
  }

  public getSavedStage(id: string): SavedStage | undefined {
    return this.savedStages.get(id);
  }

  public getAllSavedStages(): SavedStage[] {
    return Array.from(this.savedStages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getFavoriteStages(): SavedStage[] {
    return this.getAllSavedStages().filter(stage => stage.isFavorite);
  }

  public getStagesByTag(tag: string): SavedStage[] {
    return this.getAllSavedStages().filter(stage => 
      stage.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  public searchStages(query: string): SavedStage[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSavedStages().filter(stage =>
      stage.name.toLowerCase().includes(lowerQuery) ||
      stage.description.toLowerCase().includes(lowerQuery) ||
      stage.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public updateStage(id: string, updates: Partial<SavedStage>): boolean {
    const stage = this.savedStages.get(id);
    if (!stage) return false;

    Object.assign(stage, updates);
    this.saveToStorage();
    this.app.fire('stage:updated', { stage });
    return true;
  }

  public deleteStage(id: string): boolean {
    const deleted = this.savedStages.delete(id);
    if (deleted) {
      this.saveToStorage();
      this.app.fire('stage:deleted', { stageId: id });
    }
    return deleted;
  }

  public playStage(id: string): boolean {
    const stage = this.savedStages.get(id);
    if (!stage) return false;

    stage.playCount++;
    stage.lastPlayed = new Date();
    this.saveToStorage();
    this.app.fire('stage:played', { stage });
    return true;
  }

  public toggleFavorite(id: string): boolean {
    const stage = this.savedStages.get(id);
    if (!stage) return false;

    stage.isFavorite = !stage.isFavorite;
    this.saveToStorage();
    this.app.fire('stage:favorite_toggled', { stage });
    return true;
  }

  public addTag(id: string, tag: string): boolean {
    const stage = this.savedStages.get(id);
    if (!stage) return false;

    if (!stage.tags.includes(tag)) {
      stage.tags.push(tag);
      this.saveToStorage();
      this.app.fire('stage:tag_added', { stage, tag });
    }
    return true;
  }

  public removeTag(id: string, tag: string): boolean {
    const stage = this.savedStages.get(id);
    if (!stage) return false;

    const index = stage.tags.indexOf(tag);
    if (index > -1) {
      stage.tags.splice(index, 1);
      this.saveToStorage();
      this.app.fire('stage:tag_removed', { stage, tag });
    }
    return true;
  }

  public getStageStats(): {
    totalStages: number;
    favoriteStages: number;
    totalPlays: number;
    mostPlayedStage: SavedStage | null;
    recentStages: SavedStage[];
  } {
    const stages = this.getAllSavedStages();
    const totalPlays = stages.reduce((sum, stage) => sum + stage.playCount, 0);
    const mostPlayedStage = stages.reduce((max, stage) => 
      stage.playCount > max.playCount ? stage : max, stages[0] || null
    );
    const recentStages = stages
      .filter(stage => stage.lastPlayed)
      .sort((a, b) => b.lastPlayed!.getTime() - a.lastPlayed!.getTime())
      .slice(0, 5);

    return {
      totalStages: stages.length,
      favoriteStages: stages.filter(s => s.isFavorite).length,
      totalPlays,
      mostPlayedStage,
      recentStages
    };
  }

  public exportStages(): string {
    const data = {
      savedStages: Array.from(this.savedStages.entries()),
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  public importStages(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      const importedStages = new Map(data.savedStages || []);
      
      // Merge with existing stages (imported stages take precedence)
      for (const [id, stage] of importedStages.entries()) {
        stage.createdAt = new Date(stage.createdAt);
        if (stage.lastPlayed) {
          stage.lastPlayed = new Date(stage.lastPlayed);
        }
        this.savedStages.set(id, stage);
      }
      
      this.saveToStorage();
      this.app.fire('stages:imported', { count: importedStages.size });
      return true;
    } catch (error) {
      console.error('Failed to import stages:', error);
      return false;
    }
  }

  private generateStageId(): string {
    return `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStageName(stageData: any, generationParams: any): string {
    const theme = generationParams.theme || 'unknown';
    const size = generationParams.size || 'medium';
    const timeOfDay = generationParams.timeOfDay || 'day';
    
    const themeNames: Record<string, string> = {
      'training': 'Dark Training Grounds',
      'urban': 'Shadow City Ruins',
      'arcane_tower': 'Mystic Spire',
      'divine_cathedral': 'Sacred Sanctuary',
      'elemental_realm': 'Elemental Nexus',
      'shadow_keep': 'Shadow Citadel',
      'nature_sanctuary': 'Wild Grove',
      'crystal_cavern': 'Crystal Depths',
      'void_dimension': 'Void Realm',
      'celestial_plane': 'Heavenly Realm',
      'infernal_abyss': 'Hellish Depths',
      'primal_forest': 'Ancient Wilds',
      'gothic_cathedral': 'Dark Cathedral',
      'gothic_graveyard': 'Shadow Cemetery',
      'gothic_castle': 'Dark Fortress',
      'gothic_ruins': 'Ancient Ruins',
      'gothic_forest': 'Shadow Woods',
      'gothic_laboratory': 'Dark Laboratory',
      'gothic_clocktower': 'Shadow Tower'
    };

    const baseName = themeNames[theme] || 'Mysterious Stage';
    const sizePrefix = size === 'huge' ? 'Massive ' : size === 'large' ? 'Grand ' : size === 'small' ? 'Intimate ' : '';
    const timeSuffix = timeOfDay === 'night' ? ' (Night)' : timeOfDay === 'dawn' ? ' (Dawn)' : timeOfDay === 'dusk' ? ' (Dusk)' : '';
    
    return `${sizePrefix}${baseName}${timeSuffix}`;
  }

  private generateStageDescription(stageData: any, generationParams: any): string {
    const theme = generationParams.theme || 'unknown';
    const atmosphere = generationParams.atmosphere || 'mysterious';
    const weather = generationParams.weather || 'none';
    const hazards = generationParams.hazards || false;
    
    const descriptions: Record<string, string> = {
      'training': 'A dark training ground where warriors hone their skills in the shadows.',
      'urban': 'Ruins of a once-great city, now shrouded in mystery and darkness.',
      'arcane_tower': 'A mystical spire where ancient magic flows through the very air.',
      'divine_cathedral': 'A sacred sanctuary where divine power radiates from every stone.',
      'elemental_realm': 'A nexus where the raw forces of nature converge in harmony.',
      'shadow_keep': 'A dark citadel where shadows dance and secrets hide.',
      'nature_sanctuary': 'A wild grove where nature\'s power runs untamed and free.',
      'crystal_cavern': 'Deep crystal depths where gems sparkle with inner light.',
      'void_dimension': 'A realm beyond reality where the impossible becomes possible.',
      'celestial_plane': 'A heavenly realm where divine beings walk among mortals.',
      'infernal_abyss': 'Hellish depths where fire and brimstone reign supreme.',
      'primal_forest': 'Ancient wilds where the first spirits still roam free.'
    };

    let description = descriptions[theme] || 'A mysterious stage shrouded in darkness.';
    
    if (atmosphere !== 'mysterious') {
      description += ` The atmosphere is ${atmosphere}.`;
    }
    
    if (weather !== 'none') {
      description += ` ${weather.charAt(0).toUpperCase() + weather.slice(1)} weather adds to the mood.`;
    }
    
    if (hazards) {
      description += ' Dangerous hazards lurk throughout the area.';
    }

    return description;
  }

  private generateTags(stageData: any, generationParams: any): string[] {
    const tags: string[] = [];
    
    // Theme tags
    const theme = generationParams.theme || 'unknown';
    if (theme.includes('gothic')) tags.push('gothic');
    if (theme.includes('arcane')) tags.push('arcane');
    if (theme.includes('divine')) tags.push('divine');
    if (theme.includes('elemental')) tags.push('elemental');
    if (theme.includes('shadow')) tags.push('shadow');
    if (theme.includes('nature')) tags.push('nature');
    if (theme.includes('crystal')) tags.push('crystal');
    if (theme.includes('void')) tags.push('void');
    if (theme.includes('celestial')) tags.push('celestial');
    if (theme.includes('infernal')) tags.push('infernal');
    if (theme.includes('primal')) tags.push('primal');
    
    // Size tags
    const size = generationParams.size || 'medium';
    tags.push(size);
    
    // Atmosphere tags
    const atmosphere = generationParams.atmosphere || 'mysterious';
    tags.push(atmosphere);
    
    // Weather tags
    const weather = generationParams.weather || 'none';
    if (weather !== 'none') tags.push(weather);
    
    // Feature tags
    if (generationParams.hazards) tags.push('hazards');
    if (generationParams.interactiveElements > 0) tags.push('interactive');
    
    // Time tags
    const timeOfDay = generationParams.timeOfDay || 'day';
    if (timeOfDay !== 'day') tags.push(timeOfDay);
    
    return tags;
  }

  public destroy(): void {
    this.savedStages.clear();
  }
}