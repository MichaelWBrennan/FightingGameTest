import type { pc } from 'playcanvas';
import type { Character } from '../../../types/character';
import { Logger } from '../utils/Logger';

export interface CustomizationItem {
  id: string;
  name: string;
  description: string;
  type: 'outfit' | 'color' | 'accessory' | 'effect' | 'voice' | 'move';
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  price: number;
  requirements: {
    level?: number;
    characterUnlocked?: string;
    storyProgress?: number;
    achievement?: string;
  };
  unlockMethod: 'purchase' | 'earn' | 'unlock' | 'event';
  stats: {
    damage?: number;
    defense?: number;
    speed?: number;
    meterGain?: number;
  };
  visual: {
    model?: string;
    texture?: string;
    color?: string;
    effect?: string;
    animation?: string;
  };
  audio: {
    voice?: string;
    sound?: string;
    music?: string;
  };
}

export interface CharacterCustomization {
  characterId: string;
  outfit: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    metallic: string;
  };
  effects: {
    aura: string;
    particles: string;
    glow: string;
    trail: string;
  };
  stats: {
    damage: number;
    defense: number;
    speed: number;
    meterGain: number;
  };
}

export class CharacterCustomizationSystem {
  private app: pc.Application;
  private customizationItems: Map<string, CustomizationItem> = new Map();
  private playerCustomizations: Map<string, CharacterCustomization> = new Map();
  private playerInventory: Map<string, number> = new Map();
  private playerMoney: number = 10000;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeCustomizationSystem();
  }

  private initializeCustomizationSystem(): void {
    this.initializeCustomizationItems();
  }

  private initializeCustomizationItems(): void {
    // Ryu Customization Items
    this.customizationItems.set('ryu_classic_outfit', {
      id: 'ryu_classic_outfit',
      name: 'Classic Gi',
      description: 'Ryu\'s traditional white gi',
      type: 'outfit',
      category: 'outfit',
      rarity: 'common',
      price: 0,
      requirements: {},
      unlockMethod: 'unlock',
      stats: {},
      visual: {
        model: 'ryu_classic_gi',
        texture: 'ryu_classic_texture',
        color: '#FFFFFF'
      },
      audio: {}
    });

    this.customizationItems.set('ryu_denjin_outfit', {
      id: 'ryu_denjin_outfit',
      name: 'Denjin Gi',
      description: 'Ryu\'s electrified gi with lightning effects',
      type: 'outfit',
      category: 'outfit',
      rarity: 'epic',
      price: 5000,
      requirements: { level: 20, characterUnlocked: 'ryu' },
      unlockMethod: 'purchase',
      stats: {
        damage: 1.1,
        meterGain: 1.2
      },
      visual: {
        model: 'ryu_denjin_gi',
        texture: 'ryu_denjin_texture',
        color: '#FFD700',
        effect: 'lightning_aura'
      },
      audio: {
        sound: 'denjin_sound'
      }
    });

    // Add more customization items as needed
  }

  public async customizeCharacter(characterId: string, customization: Partial<CharacterCustomization>): Promise<boolean> {
    try {
      let currentCustomization = this.playerCustomizations.get(characterId);
      if (!currentCustomization) {
        currentCustomization = this.createDefaultCustomization(characterId);
      }

      // Apply customization changes
      if (customization.outfit) {
        currentCustomization.outfit = customization.outfit;
      }

      if (customization.colors) {
        currentCustomization.colors = { ...currentCustomization.colors, ...customization.colors };
      }

      if (customization.effects) {
        currentCustomization.effects = { ...currentCustomization.effects, ...customization.effects };
      }

      if (customization.stats) {
        currentCustomization.stats = { ...currentCustomization.stats, ...customization.stats };
      }

      this.playerCustomizations.set(characterId, currentCustomization);
      await this.applyCustomizationToCharacter(characterId, currentCustomization);

      this.app.fire('customization:changed', {
        characterId,
        customization: currentCustomization
      });

      Logger.info(`Customized character ${characterId}`);
      return true;
    } catch (error) {
      Logger.error(`Error customizing character ${characterId}:`, error);
      return false;
    }
  }

  private createDefaultCustomization(characterId: string): CharacterCustomization {
    return {
      characterId,
      outfit: 'classic',
      colors: {
        primary: '#FFFFFF',
        secondary: '#000000',
        accent: '#FF0000',
        metallic: '#C0C0C0'
      },
      effects: {
        aura: 'none',
        particles: 'none',
        glow: 'none',
        trail: 'none'
      },
      stats: {
        damage: 1.0,
        defense: 1.0,
        speed: 1.0,
        meterGain: 1.0
      }
    };
  }

  private async applyCustomizationToCharacter(characterId: string, customization: CharacterCustomization): Promise<void> {
    // Apply visual changes
    await this.applyVisualCustomization(characterId, customization);
    
    // Apply audio changes
    await this.applyAudioCustomization(characterId, customization);
    
    // Apply stat changes
    await this.applyStatCustomization(characterId, customization);
  }

  private async applyVisualCustomization(characterId: string, customization: CharacterCustomization): Promise<void> {
    // Apply outfit changes
    const character = this.getCharacterById(characterId);
    if (character) {
      await this.updateCharacterModel(character, customization.outfit);
      await this.updateCharacterColors(character, customization.colors);
      await this.updateCharacterEffects(character, customization.effects);
    }
  }

  private async applyAudioCustomization(characterId: string, customization: CharacterCustomization): Promise<void> {
    // Apply voice line changes
  }

  private async applyStatCustomization(characterId: string, customization: CharacterCustomization): Promise<void> {
    const character = this.getCharacterById(characterId);
    if (character) {
      character.damageMultiplier = customization.stats.damage;
      character.defenseMultiplier = customization.stats.defense;
      character.speedMultiplier = customization.stats.speed;
      character.meterGainMultiplier = customization.stats.meterGain;
    }
  }

  private async updateCharacterModel(character: Character, outfit: string): Promise<void> {
    // Update character model based on outfit
  }

  private async updateCharacterColors(character: Character, colors: any): Promise<void> {
    // Update character colors
  }

  private async updateCharacterEffects(character: Character, effects: any): Promise<void> {
    // Update character effects
  }

  private getCharacterById(characterId: string): Character | undefined {
    return undefined; // Placeholder
  }

  public async purchaseItem(itemId: string): Promise<boolean> {
    const item = this.customizationItems.get(itemId);
    if (!item) {
      Logger.warn(`Item ${itemId} not found`);
      return false;
    }

    if (!this.checkItemRequirements(item)) {
      Logger.warn(`Requirements not met for item ${itemId}`);
      return false;
    }

    if (this.playerInventory.has(itemId)) {
      Logger.warn(`Item ${itemId} already owned`);
      return false;
    }

    if (this.playerMoney < item.price) {
      Logger.warn(`Not enough money for item ${itemId}`);
      return false;
    }

    this.playerMoney -= item.price;
    this.playerInventory.set(itemId, 1);

    this.app.fire('customization:item_purchased', {
      itemId,
      item,
      playerMoney: this.playerMoney
    });

    Logger.info(`Purchased item ${item.name} for ${item.price} money`);
    return true;
  }

  private checkItemRequirements(item: CustomizationItem): boolean {
    if (item.requirements.level && this.getPlayerLevel() < item.requirements.level) {
      return false;
    }

    if (item.requirements.characterUnlocked && !this.isCharacterUnlocked(item.requirements.characterUnlocked)) {
      return false;
    }

    if (item.requirements.storyProgress && this.getStoryProgress() < item.requirements.storyProgress) {
      return false;
    }

    if (item.requirements.achievement && !this.hasAchievement(item.requirements.achievement)) {
      return false;
    }

    return true;
  }

  private getPlayerLevel(): number {
    return 1; // Placeholder
  }

  private isCharacterUnlocked(characterId: string): boolean {
    return true; // Placeholder
  }

  private getStoryProgress(): number {
    return 0; // Placeholder
  }

  private hasAchievement(achievementId: string): boolean {
    return false; // Placeholder
  }

  public getAvailableItems(characterId?: string): CustomizationItem[] {
    let items = Array.from(this.customizationItems.values());
    
    if (characterId) {
      items = items.filter(item => 
        item.type === 'outfit' || 
        item.type === 'color' || 
        item.type === 'accessory' ||
        item.type === 'effect' ||
        item.type === 'voice' ||
        item.type === 'move'
      );
    }

    return items.filter(item => 
      this.checkItemRequirements(item) && 
      !this.playerInventory.has(item.id)
    );
  }

  public getOwnedItems(): CustomizationItem[] {
    const ownedItems: CustomizationItem[] = [];
    
    for (const [itemId, quantity] of this.playerInventory.entries()) {
      const item = this.customizationItems.get(itemId);
      if (item) {
        ownedItems.push(item);
      }
    }
    
    return ownedItems;
  }

  public getCharacterCustomization(characterId: string): CharacterCustomization | undefined {
    return this.playerCustomizations.get(characterId);
  }

  public getPlayerMoney(): number {
    return this.playerMoney;
  }

  public addMoney(amount: number): void {
    this.playerMoney += amount;
    
    this.app.fire('customization:money_added', {
      amount,
      totalMoney: this.playerMoney
    });
  }

  public spendMoney(amount: number): boolean {
    if (this.playerMoney < amount) {
      return false;
    }
    
    this.playerMoney -= amount;
    
    this.app.fire('customization:money_spent', {
      amount,
      totalMoney: this.playerMoney
    });
    
    return true;
  }

  public destroy(): void {
    this.customizationItems.clear();
    this.playerCustomizations.clear();
    this.playerInventory.clear();
  }
}