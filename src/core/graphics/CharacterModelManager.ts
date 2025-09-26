import * as pc from 'playcanvas';
import { Character3DGenerator, Character3DData } from './Character3DGenerator';

export interface CharacterModelConfig {
  id: string;
  name: string;
  theme: string;
  fightingStyle: string;
  position: pc.Vec3;
  rotation: pc.Vec3;
  scale: pc.Vec3;
  enabled: boolean;
}

export class CharacterModelManager {
  private app: pc.Application;
  private generator: Character3DGenerator;
  private characterModels: Map<string, pc.Entity> = new Map();
  private characterConfigs: Map<string, CharacterModelConfig> = new Map();
  private activeCharacters: Set<string> = new Set();
  
  // Character themes and fighting styles
  private themes = [
    'arcane_mage', 'divine_paladin', 'elemental_sorcerer', 'shadow_assassin',
    'nature_druid', 'crystal_guardian', 'void_walker', 'celestial_angel',
    'infernal_demon', 'primal_berserker', 'storm_warrior', 'ice_mage'
  ];
  
  private fightingStyles = [
    'sword_mastery', 'berserker_rage', 'magic_arts', 'stealth_combat',
    'elemental_control', 'divine_power', 'shadow_manipulation', 'nature_bond',
    'crystal_magic', 'void_mastery', 'celestial_light', 'infernal_fire'
  ];

  constructor(app: pc.Application) {
    this.app = app;
    this.generator = new Character3DGenerator(app);
    this.initializeCharacterModels();
  }

  private initializeCharacterModels(): void {
    // Generate all 12 fantasy warriors
    for (let i = 0; i < 12; i++) {
      const theme = this.themes[i];
      const fightingStyle = this.fightingStyles[i];
      const characterId = `fighter_${i + 1}`;
      
      this.createCharacter(characterId, theme, fightingStyle);
    }
  }

  public createCharacter(characterId: string, theme: string, fightingStyle: string): Character3DData {
    // Generate character data
    const characterData = this.generator.generateCharacter(characterId, theme, fightingStyle);
    
    // Create character model
    const characterModel = this.generator.createCharacterModel(characterData);
    
    // Store character model
    this.characterModels.set(characterId, characterModel);
    
    // Create character config
    const config: CharacterModelConfig = {
      id: characterId,
      name: characterData.name,
      theme,
      fightingStyle,
      position: new pc.Vec3(0, 0, 0),
      rotation: new pc.Vec3(0, 0, 0),
      scale: new pc.Vec3(1, 1, 1),
      enabled: true
    };
    
    this.characterConfigs.set(characterId, config);
    
    // Add to scene
    this.app.root.addChild(characterModel);
    
    return characterData;
  }

  public getCharacter(characterId: string): pc.Entity | undefined {
    return this.characterModels.get(characterId);
  }

  public getCharacterData(characterId: string): Character3DData | undefined {
    return this.generator.getCharacterData(characterId);
  }

  public getAllCharacters(): pc.Entity[] {
    return Array.from(this.characterModels.values());
  }

  public getAllCharacterData(): Character3DData[] {
    return this.generator.getAllCharacterData();
  }

  public setCharacterPosition(characterId: string, position: pc.Vec3): void {
    const character = this.characterModels.get(characterId);
    if (character) {
      character.setPosition(position);
      
      const config = this.characterConfigs.get(characterId);
      if (config) {
        config.position = position;
      }
    }
  }

  public setCharacterRotation(characterId: string, rotation: pc.Vec3): void {
    const character = this.characterModels.get(characterId);
    if (character) {
      character.setEulerAngles(rotation);
      
      const config = this.characterConfigs.get(characterId);
      if (config) {
        config.rotation = rotation;
      }
    }
  }

  public setCharacterScale(characterId: string, scale: pc.Vec3): void {
    const character = this.characterModels.get(characterId);
    if (character) {
      character.setLocalScale(scale);
      
      const config = this.characterConfigs.get(characterId);
      if (config) {
        config.scale = scale;
      }
    }
  }

  public enableCharacter(characterId: string): void {
    const character = this.characterModels.get(characterId);
    if (character) {
      character.enabled = true;
      this.activeCharacters.add(characterId);
      
      const config = this.characterConfigs.get(characterId);
      if (config) {
        config.enabled = true;
      }
    }
  }

  public disableCharacter(characterId: string): void {
    const character = this.characterModels.get(characterId);
    if (character) {
      character.enabled = false;
      this.activeCharacters.delete(characterId);
      
      const config = this.characterConfigs.get(characterId);
      if (config) {
        config.enabled = false;
      }
    }
  }

  public getActiveCharacters(): string[] {
    return Array.from(this.activeCharacters);
  }

  public getCharacterConfig(characterId: string): CharacterModelConfig | undefined {
    return this.characterConfigs.get(characterId);
  }

  public getAllCharacterConfigs(): CharacterModelConfig[] {
    return Array.from(this.characterConfigs.values());
  }

  public updateCharacter(characterId: string, updates: Partial<CharacterModelConfig>): void {
    const config = this.characterConfigs.get(characterId);
    if (config) {
      Object.assign(config, updates);
      
      // Apply updates to character model
      const character = this.characterModels.get(characterId);
      if (character) {
        if (updates.position) {
          character.setPosition(updates.position);
        }
        if (updates.rotation) {
          character.setEulerAngles(updates.rotation);
        }
        if (updates.scale) {
          character.setLocalScale(updates.scale);
        }
        if (updates.enabled !== undefined) {
          character.enabled = updates.enabled;
          if (updates.enabled) {
            this.activeCharacters.add(characterId);
          } else {
            this.activeCharacters.delete(characterId);
          }
        }
      }
    }
  }

  public removeCharacter(characterId: string): void {
    const character = this.characterModels.get(characterId);
    if (character) {
      character.destroy();
      this.characterModels.delete(characterId);
    }
    
    this.characterConfigs.delete(characterId);
    this.activeCharacters.delete(characterId);
  }

  public getCharacterCount(): number {
    return this.characterModels.size;
  }

  public getActiveCharacterCount(): number {
    return this.activeCharacters.size;
  }

  public getCharacterThemes(): string[] {
    return [...this.themes];
  }

  public getFightingStyles(): string[] {
    return [...this.fightingStyles];
  }

  public getCharactersByTheme(theme: string): string[] {
    const characters: string[] = [];
    
    for (const [id, config] of this.characterConfigs) {
      if (config.theme === theme) {
        characters.push(id);
      }
    }
    
    return characters;
  }

  public getCharactersByFightingStyle(fightingStyle: string): string[] {
    const characters: string[] = [];
    
    for (const [id, config] of this.characterConfigs) {
      if (config.fightingStyle === fightingStyle) {
        characters.push(id);
      }
    }
    
    return characters;
  }

  public getCharacterStats(): {
    total: number;
    active: number;
    byTheme: Record<string, number>;
    byFightingStyle: Record<string, number>;
  } {
    const stats = {
      total: this.characterModels.size,
      active: this.activeCharacters.size,
      byTheme: {} as Record<string, number>,
      byFightingStyle: {} as Record<string, number>
    };
    
    // Count by theme
    for (const config of this.characterConfigs.values()) {
      stats.byTheme[config.theme] = (stats.byTheme[config.theme] || 0) + 1;
    }
    
    // Count by fighting style
    for (const config of this.characterConfigs.values()) {
      stats.byFightingStyle[config.fightingStyle] = (stats.byFightingStyle[config.fightingStyle] || 0) + 1;
    }
    
    return stats;
  }

  public destroy(): void {
    // Destroy all character models
    for (const character of this.characterModels.values()) {
      character.destroy();
    }
    
    this.characterModels.clear();
    this.characterConfigs.clear();
    this.activeCharacters.clear();
    
    // Destroy generator
    this.generator.destroy();
  }
}