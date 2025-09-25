export interface CharacterSkin {
  id: string;
  name: string;
  description: string;
  characterId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockMethod: 'default' | 'purchase' | 'achievement' | 'event' | 'battle_pass';
  unlockRequirement?: {
    level?: number;
    currency?: number;
    achievement?: string;
    event?: string;
  };
  price?: {
    currency: number;
    realMoney?: number;
  };
  previewImage: string;
  spriteSheet: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
    hair: string;
    eyes: string;
  };
  effects?: {
    trail?: string;
    aura?: string;
    particles?: string;
  };
  voice?: {
    pitch: number;
    effects: string[];
  };
}

export interface CharacterColor {
  id: string;
  name: string;
  characterId: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
    hair: string;
    eyes: string;
  };
  unlockMethod: 'default' | 'purchase' | 'achievement';
  price?: number;
}

export interface CharacterTitle {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockMethod: 'default' | 'achievement' | 'event' | 'ranking';
  unlockRequirement?: {
    achievement?: string;
    rank?: string;
    event?: string;
    level?: number;
  };
  displayText: string;
  color: string;
  effects?: string[];
}

export interface CharacterFrame {
  id: string;
  name: string;
  description: string;
  characterId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockMethod: 'default' | 'purchase' | 'achievement' | 'event';
  unlockRequirement?: {
    achievement?: string;
    event?: string;
    level?: number;
  };
  price?: number;
  image: string;
  border: {
    color: string;
    style: 'solid' | 'gradient' | 'pattern';
    width: number;
  };
  effects?: string[];
}

export interface CharacterLoadout {
  characterId: string;
  skinId: string;
  colorId: string;
  titleId: string;
  frameId: string;
  effects: string[];
  name: string;
  isDefault: boolean;
}

export class CharacterCustomization {
  private skins: Map<string, CharacterSkin> = new Map();
  private colors: Map<string, CharacterColor> = new Map();
  private titles: Map<string, CharacterTitle> = new Map();
  private frames: Map<string, CharacterFrame> = new Map();
  private loadouts: Map<string, CharacterLoadout> = new Map();
  private unlockedSkins: Set<string> = new Set();
  private unlockedColors: Set<string> = new Set();
  private unlockedTitles: Set<string> = new Set();
  private unlockedFrames: Set<string> = new Set();
  private isInitialized = false;

  constructor() {
    this.initializeDefaultContent();
  }

  private initializeDefaultContent(): void {
    // Initialize default skins for each character
    const characters = ['ryu', 'ken', 'chun_li', 'akuma', 'cammy', 'zangief', 'sagat', 'lei_wulong'];
    
    characters.forEach(charId => {
      // Default skin
      this.addSkin({
        id: `${charId}_default`,
        name: 'Default',
        description: 'The classic look',
        characterId: charId,
        rarity: 'common',
        unlockMethod: 'default',
        previewImage: `/images/skins/${charId}_default_preview.png`,
        spriteSheet: `/sprites/skins/${charId}_default.png`,
        colors: {
          primary: '#FF0000',
          secondary: '#0000FF',
          accent: '#FFFF00',
          skin: '#FDBCB4',
          hair: '#000000',
          eyes: '#000000'
        }
      });

      // Default color
      this.addColor({
        id: `${charId}_default_color`,
        name: 'Default',
        characterId: charId,
        palette: {
          primary: '#FF0000',
          secondary: '#0000FF',
          accent: '#FFFF00',
          skin: '#FDBCB4',
          hair: '#000000',
          eyes: '#000000'
        },
        unlockMethod: 'default'
      });

      // Default title
      this.addTitle({
        id: `${charId}_default_title`,
        name: 'Fighter',
        description: 'A skilled warrior',
        rarity: 'common',
        unlockMethod: 'default',
        displayText: 'Fighter',
        color: '#FFFFFF'
      });

      // Default frame
      this.addFrame({
        id: `${charId}_default_frame`,
        name: 'Basic Frame',
        description: 'A simple portrait frame',
        characterId: charId,
        rarity: 'common',
        unlockMethod: 'default',
        image: `/images/frames/basic.png`,
        border: {
          color: '#CCCCCC',
          style: 'solid',
          width: 2
        }
      });

      // Create default loadout
      this.addLoadout({
        characterId: charId,
        skinId: `${charId}_default`,
        colorId: `${charId}_default_color`,
        titleId: `${charId}_default_title`,
        frameId: `${charId}_default_frame`,
        effects: [],
        name: 'Default Loadout',
        isDefault: true
      });
    });

    // Add some premium skins
    this.addSkin({
      id: 'ryu_shinryu',
      name: 'Shinryu',
      description: 'Ryu\'s ultimate form',
      characterId: 'ryu',
      rarity: 'legendary',
      unlockMethod: 'achievement',
      unlockRequirement: {
        achievement: 'master_ryu'
      },
      previewImage: '/images/skins/ryu_shinryu_preview.png',
      spriteSheet: '/sprites/skins/ryu_shinryu.png',
      colors: {
        primary: '#FFD700',
        secondary: '#FF6B35',
        accent: '#FF0000',
        skin: '#FDBCB4',
        hair: '#000000',
        eyes: '#FF0000'
      },
      effects: {
        trail: 'golden_aura',
        aura: 'energy_glow',
        particles: 'sparkles'
      },
      voice: {
        pitch: 1.1,
        effects: ['echo', 'reverb']
      }
    });

    this.addSkin({
      id: 'akuma_demon',
      name: 'Demon Akuma',
      description: 'The true power of the Satsui no Hado',
      characterId: 'akuma',
      rarity: 'legendary',
      unlockMethod: 'purchase',
      price: {
        currency: 5000
      },
      previewImage: '/images/skins/akuma_demon_preview.png',
      spriteSheet: '/sprites/skins/akuma_demon.png',
      colors: {
        primary: '#8B0000',
        secondary: '#FF0000',
        accent: '#FFD700',
        skin: '#2F1B14',
        hair: '#000000',
        eyes: '#FF0000'
      },
      effects: {
        trail: 'dark_energy',
        aura: 'demon_flames',
        particles: 'dark_sparks'
      }
    });

    // Add some titles
    this.addTitle({
      id: 'world_warrior',
      name: 'World Warrior',
      description: 'Defeated 100 opponents',
      rarity: 'rare',
      unlockMethod: 'achievement',
      unlockRequirement: {
        achievement: 'world_warrior'
      },
      displayText: 'World Warrior',
      color: '#FFD700',
      effects: ['glow']
    });

    this.addTitle({
      id: 'grand_master',
      name: 'Grand Master',
      description: 'Reached Grand Master rank',
      rarity: 'legendary',
      unlockMethod: 'ranking',
      unlockRequirement: {
        rank: 'grandmaster'
      },
      displayText: 'Grand Master',
      color: '#FF6B35',
      effects: ['glow', 'sparkles']
    });

    // Add some frames
    this.addFrame({
      id: 'golden_frame',
      name: 'Golden Frame',
      description: 'A luxurious golden frame',
      characterId: 'all',
      rarity: 'epic',
      unlockMethod: 'purchase',
      price: 1000,
      image: '/images/frames/golden.png',
      border: {
        color: '#FFD700',
        style: 'gradient',
        width: 4
      },
      effects: ['glow']
    });

    this.isInitialized = true;
  }

  public addSkin(skin: CharacterSkin): void {
    this.skins.set(skin.id, skin);
  }

  public addColor(color: CharacterColor): void {
    this.colors.set(color.id, color);
  }

  public addTitle(title: CharacterTitle): void {
    this.titles.set(title.id, title);
  }

  public addFrame(frame: CharacterFrame): void {
    this.frames.set(frame.id, frame);
  }

  public addLoadout(loadout: CharacterLoadout): void {
    this.loadouts.set(`${loadout.characterId}_${loadout.name}`, loadout);
  }

  public getSkin(skinId: string): CharacterSkin | null {
    return this.skins.get(skinId) || null;
  }

  public getColor(colorId: string): CharacterColor | null {
    return this.colors.get(colorId) || null;
  }

  public getTitle(titleId: string): CharacterTitle | null {
    return this.titles.get(titleId) || null;
  }

  public getFrame(frameId: string): CharacterFrame | null {
    return this.frames.get(frameId) || null;
  }

  public getLoadout(characterId: string, loadoutName: string): CharacterLoadout | null {
    return this.loadouts.get(`${characterId}_${loadoutName}`) || null;
  }

  public getSkinsForCharacter(characterId: string): CharacterSkin[] {
    return Array.from(this.skins.values())
      .filter(skin => skin.characterId === characterId);
  }

  public getColorsForCharacter(characterId: string): CharacterColor[] {
    return Array.from(this.colors.values())
      .filter(color => color.characterId === characterId || color.characterId === 'all');
  }

  public getTitlesForCharacter(characterId: string): CharacterTitle[] {
    return Array.from(this.titles.values());
  }

  public getFramesForCharacter(characterId: string): CharacterFrame[] {
    return Array.from(this.frames.values())
      .filter(frame => frame.characterId === characterId || frame.characterId === 'all');
  }

  public getLoadoutsForCharacter(characterId: string): CharacterLoadout[] {
    return Array.from(this.loadouts.values())
      .filter(loadout => loadout.characterId === characterId);
  }

  public unlockSkin(skinId: string): boolean {
    const skin = this.skins.get(skinId);
    if (!skin) return false;

    this.unlockedSkins.add(skinId);
    return true;
  }

  public unlockColor(colorId: string): boolean {
    const color = this.colors.get(colorId);
    if (!color) return false;

    this.unlockedColors.add(colorId);
    return true;
  }

  public unlockTitle(titleId: string): boolean {
    const title = this.titles.get(titleId);
    if (!title) return false;

    this.unlockedTitles.add(titleId);
    return true;
  }

  public unlockFrame(frameId: string): boolean {
    const frame = this.frames.get(frameId);
    if (!frame) return false;

    this.unlockedFrames.add(frameId);
    return true;
  }

  public isSkinUnlocked(skinId: string): boolean {
    return this.unlockedSkins.has(skinId);
  }

  public isColorUnlocked(colorId: string): boolean {
    return this.unlockedColors.has(colorId);
  }

  public isTitleUnlocked(titleId: string): boolean {
    return this.unlockedTitles.has(titleId);
  }

  public isFrameUnlocked(frameId: string): boolean {
    return this.unlockedFrames.has(frameId);
  }

  public getAvailableSkinsForCharacter(characterId: string): CharacterSkin[] {
    return this.getSkinsForCharacter(characterId)
      .filter(skin => this.isSkinUnlocked(skin.id));
  }

  public getAvailableColorsForCharacter(characterId: string): CharacterColor[] {
    return this.getColorsForCharacter(characterId)
      .filter(color => this.isColorUnlocked(color.id));
  }

  public getAvailableTitlesForCharacter(characterId: string): CharacterTitle[] {
    return this.getTitlesForCharacter(characterId)
      .filter(title => this.isTitleUnlocked(title.id));
  }

  public getAvailableFramesForCharacter(characterId: string): CharacterFrame[] {
    return this.getFramesForCharacter(characterId)
      .filter(frame => this.isFrameUnlocked(frame.id));
  }

  public createCustomLoadout(characterId: string, name: string, skinId: string, colorId: string, titleId: string, frameId: string, effects: string[] = []): boolean {
    // Validate all components exist and are unlocked
    if (!this.isSkinUnlocked(skinId) || !this.isColorUnlocked(colorId) || 
        !this.isTitleUnlocked(titleId) || !this.isFrameUnlocked(frameId)) {
      return false;
    }

    const loadout: CharacterLoadout = {
      characterId,
      skinId,
      colorId,
      titleId,
      frameId,
      effects,
      name,
      isDefault: false
    };

    this.loadouts.set(`${characterId}_${name}`, loadout);
    return true;
  }

  public deleteLoadout(characterId: string, loadoutName: string): boolean {
    const key = `${characterId}_${loadoutName}`;
    const loadout = this.loadouts.get(key);
    
    if (!loadout || loadout.isDefault) return false;

    this.loadouts.delete(key);
    return true;
  }

  public getRarityColor(rarity: string): string {
    const colors = {
      common: '#CCCCCC',
      rare: '#0099FF',
      epic: '#9966FF',
      legendary: '#FFD700'
    };
    return colors[rarity as keyof typeof colors] || '#CCCCCC';
  }

  public getRarityName(rarity: string): string {
    const names = {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary'
    };
    return names[rarity as keyof typeof names] || 'Unknown';
  }

  public exportData(): string {
    return JSON.stringify({
      unlockedSkins: Array.from(this.unlockedSkins),
      unlockedColors: Array.from(this.unlockedColors),
      unlockedTitles: Array.from(this.unlockedTitles),
      unlockedFrames: Array.from(this.unlockedFrames),
      loadouts: Array.from(this.loadouts.entries())
    });
  }

  public importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.unlockedSkins = new Set(parsed.unlockedSkins || []);
      this.unlockedColors = new Set(parsed.unlockedColors || []);
      this.unlockedTitles = new Set(parsed.unlockedTitles || []);
      this.unlockedFrames = new Set(parsed.unlockedFrames || []);
      this.loadouts = new Map(parsed.loadouts || []);
      return true;
    } catch (error) {
      console.error('Failed to import customization data:', error);
      return false;
    }
  }
}