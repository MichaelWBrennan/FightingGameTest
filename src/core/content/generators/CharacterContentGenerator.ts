import type { pc } from 'playcanvas';
import { Logger } from '../../utils/Logger';
import type { ContentGenerationConfig, GeneratedContent } from '../ContentGenerationManager';

export interface CharacterGenerationOptions {
  archetype?: 'rushdown' | 'grappler' | 'zoner' | 'all_rounder' | 'technical' | 'power' | 'speed' | 'defensive';
  theme?: 'fire' | 'ice' | 'electric' | 'wind' | 'earth' | 'water' | 'dark' | 'light' | 'cyber' | 'nature';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specialMoves?: number;
  variations?: number;
  gender?: 'male' | 'female' | 'neutral' | 'other';
  age?: 'young' | 'adult' | 'elder';
  fightingStyle?: 'martial_arts' | 'wrestling' | 'boxing' | 'kickboxing' | 'karate' | 'kung_fu' | 'taekwondo' | 'judo' | 'mixed' | 'unique';
  personality?: 'heroic' | 'villainous' | 'neutral' | 'mysterious' | 'comic' | 'serious' | 'aggressive' | 'defensive' | 'tactical';
}

export interface CharacterData {
  id: string;
  name: string;
  displayName: string;
  archetype: string;
  theme: string;
  difficulty: string;
  gender: string;
  age: string;
  fightingStyle: string;
  personality: string;
  description: string;
  backstory: string;
  spritePath: string;
  portraitPath: string;
  health: number;
  defense: number;
  meterGain: number;
  weight: number;
  stun: number;
  walkSpeed: number;
  dashSpeed: number;
  jumpHeight: number;
  airDash: boolean;
  doubleJump: boolean;
  trait: {
    id: string;
    name: string;
    description: string;
    params: Record<string, any>;
  };
  normals: Record<string, any>;
  specials: Record<string, any>;
  supers: Record<string, any>;
  movements: Record<string, any>;
  stats: Record<string, number>;
  animations: Record<string, any>;
  variations: Array<{
    id: string;
    name: string;
    description: string;
    mods: Record<string, any>;
  }>;
}

export class CharacterContentGenerator {
  private app: pc.Application;
  private nameGenerator: NameGenerator;
  private traitGenerator: TraitGenerator;
  private moveGenerator: MoveGenerator;
  private storyGenerator: CharacterStoryGenerator;

  constructor(app: pc.Application) {
    this.app = app;
    this.nameGenerator = new NameGenerator();
    this.traitGenerator = new TraitGenerator();
    this.moveGenerator = new MoveGenerator();
    this.storyGenerator = new CharacterStoryGenerator();
  }

  public async generate(
    options: CharacterGenerationOptions = {},
    config: ContentGenerationConfig
  ): Promise<GeneratedContent | null> {
    try {
      const characterData = await this.createCharacter(options, config);
      const content: GeneratedContent = {
        id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'character',
        name: characterData.displayName,
        description: characterData.description,
        data: characterData,
        metadata: {
          generatedAt: Date.now(),
          generator: 'CharacterContentGenerator',
          config,
          quality: this.calculateQuality(characterData),
          tags: this.generateTags(characterData)
        },
        assets: {
          sprites: [characterData.spritePath],
          animations: Object.keys(characterData.animations)
        }
      };

      return content;
    } catch (error) {
      Logger.error('Error generating character:', error);
      return null;
    }
  }

  private async createCharacter(
    options: CharacterGenerationOptions,
    config: ContentGenerationConfig
  ): Promise<CharacterData> {
    // Generate basic character info
    const name = this.nameGenerator.generate(options);
    const archetype = options.archetype || this.selectRandomArchetype();
    const theme = options.theme || this.selectRandomTheme();
    const difficulty = options.difficulty || this.selectRandomDifficulty();
    
    // Generate character stats based on archetype
    const stats = this.generateCharacterStats(archetype, difficulty);
    
    // Generate trait
    const trait = this.traitGenerator.generate(archetype, theme);
    
    // Generate moves
    const normals = this.moveGenerator.generateNormals(archetype, stats);
    const specials = this.moveGenerator.generateSpecials(archetype, theme, options.specialMoves || 3);
    const supers = this.moveGenerator.generateSupers(archetype, theme, 3);
    
    // Generate animations
    const animations = this.generateAnimations(normals, specials, supers);
    
    // Generate variations
    const variations = this.generateVariations(options.variations || 2, archetype, theme);
    
    // Generate story elements
    const backstory = this.storyGenerator.generateBackstory(name, archetype, theme, options.personality);
    const description = this.storyGenerator.generateDescription(name, archetype, theme);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name: name.toLowerCase().replace(/\s+/g, '_'),
      displayName: name,
      archetype,
      theme,
      difficulty,
      gender: options.gender || this.selectRandomGender(),
      age: options.age || this.selectRandomAge(),
      fightingStyle: options.fightingStyle || this.selectRandomFightingStyle(archetype),
      personality: options.personality || this.selectRandomPersonality(),
      description,
      backstory,
      spritePath: `characters/sprites/${name.toLowerCase().replace(/\s+/g, '_')}/idle.png`,
      portraitPath: `characters/portraits/${name.toLowerCase().replace(/\s+/g, '_')}.png`,
      health: stats.health,
      defense: stats.defense,
      meterGain: stats.meterGain,
      weight: stats.weight,
      stun: stats.stun,
      walkSpeed: stats.walkSpeed,
      dashSpeed: stats.dashSpeed,
      jumpHeight: stats.jumpHeight,
      airDash: stats.airDash,
      doubleJump: stats.doubleJump,
      trait,
      normals,
      specials,
      supers,
      movements: this.generateMovements(archetype),
      stats,
      animations,
      variations
    };
  }

  private selectRandomArchetype(): string {
    const archetypes = ['rushdown', 'grappler', 'zoner', 'all_rounder', 'technical', 'power', 'speed', 'defensive'];
    return archetypes[Math.floor(Math.random() * archetypes.length)];
  }

  private selectRandomTheme(): string {
    const themes = ['arcane', 'divine', 'elemental', 'shadow', 'nature', 'crystal', 'void', 'celestial', 'infernal', 'primal'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private selectRandomDifficulty(): string {
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  private selectRandomGender(): string {
    const genders = ['male', 'female', 'neutral', 'other'];
    return genders[Math.floor(Math.random() * genders.length)];
  }

  private selectRandomAge(): string {
    const ages = ['young', 'adult', 'elder'];
    return ages[Math.floor(Math.random() * ages.length)];
  }

  private selectRandomFightingStyle(archetype: string): string {
    const styleMap: Record<string, string[]> = {
      'rushdown': ['sword_mastery', 'berserker_rage', 'blade_dance'],
      'grappler': ['wrestling', 'grappling', 'martial_arts'],
      'zoner': ['archery', 'magic_arts', 'ranged_combat'],
      'all_rounder': ['versatile_combat', 'adaptive_fighting'],
      'technical': ['precision_strikes', 'martial_arts', 'technique_mastery'],
      'power': ['heavy_weapons', 'brute_force', 'overwhelming_strength'],
      'speed': ['agility_fighting', 'quick_strikes', 'evasive_combat'],
      'defensive': ['shield_combat', 'defensive_arts', 'guardian_style']
    };
    
    const styles = styleMap[archetype] || ['versatile_combat'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private selectRandomPersonality(): string {
    const personalities = ['heroic', 'villainous', 'neutral', 'mysterious', 'comic', 'serious', 'aggressive', 'defensive', 'tactical'];
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  private generateCharacterStats(archetype: string, difficulty: string): Record<string, any> {
    const baseStats = {
      health: 1000,
      defense: 1.0,
      meterGain: 1.0,
      weight: 80,
      stun: 1000,
      walkSpeed: 150,
      dashSpeed: 300,
      jumpHeight: 380,
      airDash: false,
      doubleJump: false
    };

    // Modify stats based on archetype
    const archetypeModifiers: Record<string, Record<string, number>> = {
      'rushdown': { walkSpeed: 1.2, dashSpeed: 1.3, meterGain: 1.1, health: 0.9 },
      'grappler': { health: 1.1, defense: 1.1, weight: 1.2, walkSpeed: 0.8 },
      'zoner': { walkSpeed: 0.9, dashSpeed: 0.9, meterGain: 1.2, health: 0.95 },
      'all_rounder': { health: 1.0, defense: 1.0, meterGain: 1.0 },
      'technical': { meterGain: 1.15, walkSpeed: 1.05, health: 0.95 },
      'power': { health: 1.15, defense: 1.1, weight: 1.3, walkSpeed: 0.85 },
      'speed': { walkSpeed: 1.3, dashSpeed: 1.4, airDash: true, health: 0.85 },
      'defensive': { defense: 1.2, health: 1.1, walkSpeed: 0.9, meterGain: 0.9 }
    };

    const modifiers = archetypeModifiers[archetype] || {};
    const stats = { ...baseStats };

    for (const [key, value] of Object.entries(modifiers)) {
      if (typeof stats[key] === 'number') {
        stats[key] = Math.round(stats[key] * value);
      } else if (typeof stats[key] === 'boolean') {
        stats[key] = value > 1;
      }
    }

    // Modify stats based on difficulty
    const difficultyModifiers: Record<string, Record<string, number>> = {
      'beginner': { health: 1.1, defense: 1.1, meterGain: 1.2 },
      'intermediate': { health: 1.0, defense: 1.0, meterGain: 1.0 },
      'advanced': { health: 0.95, defense: 0.95, meterGain: 0.9 },
      'expert': { health: 0.9, defense: 0.9, meterGain: 0.8 }
    };

    const diffModifiers = difficultyModifiers[difficulty] || {};
    for (const [key, value] of Object.entries(diffModifiers)) {
      if (typeof stats[key] === 'number') {
        stats[key] = Math.round(stats[key] * value);
      }
    }

    return stats;
  }

  private generateMovements(archetype: string): Record<string, any> {
    const baseMovements = {
      walkF: 1.0,
      walkB: 0.8,
      dashF: 20,
      dashB: 18,
      jumpArc: 'standard',
      airDash: false,
      doubleJump: false
    };

    const archetypeMovements: Record<string, Record<string, any>> = {
      'rushdown': { dashF: 25, dashB: 22, airDash: true },
      'grappler': { walkF: 0.8, walkB: 0.6, dashF: 15, dashB: 12 },
      'zoner': { walkF: 1.1, walkB: 0.9, dashF: 18, dashB: 16 },
      'speed': { walkF: 1.3, walkB: 1.1, dashF: 30, dashB: 25, airDash: true, doubleJump: true },
      'defensive': { walkF: 0.9, walkB: 0.7, dashF: 16, dashB: 14 }
    };

    return { ...baseMovements, ...(archetypeMovements[archetype] || {}) };
  }

  private generateAnimations(normals: Record<string, any>, specials: Record<string, any>, supers: Record<string, any>): Record<string, any> {
    const animations: Record<string, any> = {};

    // Generate idle animation
    animations.idle = {
      frameCount: 8,
      duration: 1000,
      loop: true
    };

    // Generate walk animation
    animations.walk = {
      frameCount: 12,
      duration: 800,
      loop: true
    };

    // Generate jump animation
    animations.jump = {
      frameCount: 16,
      duration: 1200,
      loop: false
    };

    // Generate animations for normals
    for (const [name, move] of Object.entries(normals)) {
      animations[`move_${name}`] = {
        frameCount: Math.max(1, (move.startup || 4) + (move.active || 2) + (move.recovery || 8)),
        duration: Math.max(83, ((move.startup || 4) + (move.active || 2) + (move.recovery || 8)) * 16.6),
        loop: false
      };
    }

    // Generate animations for specials
    for (const [name, move] of Object.entries(specials)) {
      animations[`special_${name}`] = {
        frameCount: Math.max(1, (move.startup || 6) + (move.active || 3) + (move.recovery || 15)),
        duration: Math.max(83, ((move.startup || 6) + (move.active || 3) + (move.recovery || 15)) * 16.6),
        loop: false
      };
    }

    // Generate animations for supers
    for (const [name, move] of Object.entries(supers)) {
      animations[`super_${name}`] = {
        frameCount: Math.max(1, (move.startup || 8) + (move.active || 5) + (move.recovery || 30)),
        duration: Math.max(83, ((move.startup || 8) + (move.active || 5) + (move.recovery || 30)) * 16.6),
        loop: false
      };
    }

    return animations;
  }

  private generateVariations(count: number, archetype: string, theme: string): Array<any> {
    const variations = [];
    const variationThemes = ['enhanced', 'elemental', 'defensive', 'offensive', 'balanced'];

    for (let i = 0; i < count; i++) {
      const variationTheme = variationThemes[i % variationThemes.length];
      variations.push({
        id: `${variationTheme}_${i + 1}`,
        name: `${variationTheme.charAt(0).toUpperCase() + variationTheme.slice(1)} ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
        description: `A ${variationTheme} variation focusing on ${this.getVariationFocus(variationTheme)}`,
        mods: this.generateVariationMods(variationTheme, archetype)
      });
    }

    return variations;
  }

  private getVariationFocus(theme: string): string {
    const focusMap: Record<string, string> = {
      'enhanced': 'overall power and effectiveness',
      'elemental': 'elemental damage and effects',
      'defensive': 'defensive capabilities and survivability',
      'offensive': 'offensive power and damage output',
      'balanced': 'balanced approach to all aspects'
    };
    return focusMap[theme] || 'unique characteristics';
  }

  private generateVariationMods(theme: string, archetype: string): Record<string, any> {
    const mods: Record<string, any> = {};

    switch (theme) {
      case 'enhanced':
        mods.health = 1.1;
        mods.defense = 1.05;
        mods.meterGain = 1.1;
        break;
      case 'elemental':
        mods.meterGain = 1.2;
        mods.specialMoveDamage = 1.15;
        break;
      case 'defensive':
        mods.health = 1.15;
        mods.defense = 1.1;
        mods.walkSpeed = 0.9;
        break;
      case 'offensive':
        mods.health = 0.9;
        mods.walkSpeed = 1.1;
        mods.dashSpeed = 1.1;
        break;
      case 'balanced':
        mods.health = 1.05;
        mods.defense = 1.05;
        mods.meterGain = 1.05;
        break;
    }

    return mods;
  }

  private calculateQuality(characterData: CharacterData): number {
    let quality = 0.5; // Base quality

    // Quality based on completeness
    if (characterData.normals && Object.keys(characterData.normals).length >= 6) quality += 0.1;
    if (characterData.specials && Object.keys(characterData.specials).length >= 3) quality += 0.1;
    if (characterData.supers && Object.keys(characterData.supers).length >= 2) quality += 0.1;
    if (characterData.variations && characterData.variations.length >= 2) quality += 0.1;
    if (characterData.backstory && characterData.backstory.length > 100) quality += 0.1;

    // Quality based on balance
    const health = characterData.health;
    const defense = characterData.defense;
    const walkSpeed = characterData.walkSpeed;
    
    if (health >= 900 && health <= 1100) quality += 0.05;
    if (defense >= 0.9 && defense <= 1.1) quality += 0.05;
    if (walkSpeed >= 120 && walkSpeed <= 180) quality += 0.05;

    return Math.min(1.0, quality);
  }

  private generateTags(characterData: CharacterData): string[] {
    const tags = [
      characterData.archetype,
      characterData.theme,
      characterData.difficulty,
      characterData.gender,
      characterData.fightingStyle,
      characterData.personality
    ];

    // Add additional tags based on characteristics
    if (characterData.airDash) tags.push('air_dash');
    if (characterData.doubleJump) tags.push('double_jump');
    if (characterData.health > 1000) tags.push('high_health');
    if (characterData.walkSpeed > 160) tags.push('fast');
    if (characterData.defense > 1.05) tags.push('defensive');

    return tags.filter(tag => tag && tag.length > 0);
  }
}

// Helper classes
class NameGenerator {
  private firstNames: Record<string, string[]> = {
    male: ['Aethon', 'Baelor', 'Caelum', 'Draven', 'Eldric', 'Fenris', 'Gareth', 'Haldor', 'Ithil', 'Jareth', 'Kael', 'Lucian', 'Magnus', 'Nyx', 'Orion', 'Percival', 'Quinn', 'Ragnar', 'Soren', 'Thorin', 'Ulrich', 'Valdris', 'Wulfric', 'Xander', 'Yorick', 'Zephyr'],
    female: ['Aria', 'Brielle', 'Celeste', 'Diana', 'Elena', 'Fiona', 'Gwen', 'Helena', 'Iris', 'Jade', 'Kira', 'Luna', 'Mira', 'Nyx', 'Ophelia', 'Pandora', 'Quinn', 'Raven', 'Seraphina', 'Thalia', 'Ursula', 'Vera', 'Wren', 'Xara', 'Yara', 'Zara'],
    neutral: ['Aether', 'Blaze', 'Crystal', 'Dragon', 'Echo', 'Flame', 'Gale', 'Haze', 'Iris', 'Jazz', 'Koda', 'Lux', 'Maze', 'Nyx', 'Onyx', 'Pax', 'Quill', 'Raven', 'Sky', 'Tide', 'Unity', 'Vale', 'Wren', 'Xen', 'Yale', 'Zion']
  };

  private lastNames: string[] = ['Stormweaver', 'Bladeheart', 'Fist of Thunder', 'Flameborn', 'Icewind', 'Windrider', 'Earthshaker', 'Shadowbane', 'Lightbringer', 'Thunderstrike', 'Frostweaver', 'Firebrand', 'Stoneheart', 'Steelguard', 'Goldleaf', 'Silvermoon', 'Crystalborn', 'Diamondforge', 'Phoenixwing', 'Dragonslayer', 'Wolfbane', 'Tigerclaw', 'Lionheart', 'Eagleeye', 'Hawkwing', 'Falconflight'];

  generate(options: CharacterGenerationOptions): string {
    const gender = options.gender || 'neutral';
    const names = this.firstNames[gender] || this.firstNames.neutral;
    const firstName = names[Math.floor(Math.random() * names.length)];
    const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    return `${firstName} ${lastName}`;
  }
}

class TraitGenerator {
  private traits: Record<string, Record<string, any>> = {
    'rushdown': {
      'berserker_rage': { name: 'Berserker Rage', description: 'Enhanced aggression and damage when low on health', params: { damageBonus: 1.3, speedMultiplier: 1.2, healthThreshold: 0.3 } },
      'blade_dance': { name: 'Blade Dance', description: 'Improved combo potential and frame advantage', params: { comboDamage: 1.2, frameAdvantage: 2, cancelWindow: 8 } }
    },
    'grappler': {
      'titan_grip': { name: 'Titan Grip', description: 'Enhanced grappling power and throw range', params: { throwRange: 1.4, throwDamage: 1.3, grabPriority: 2 } },
      'earth_shaker': { name: 'Earth Shaker', description: 'Devastating ground-based attacks and throws', params: { groundDamage: 1.25, throwDamage: 1.2, areaEffect: 1.1 } }
    },
    'zoner': {
      'arcane_marksman': { name: 'Arcane Marksman', description: 'Enhanced magical projectiles and ranged attacks', params: { projectileSpeed: 1.3, projectileDamage: 1.2, magicRange: 1.4 } },
      'elemental_mastery': { name: 'Elemental Mastery', description: 'Control over multiple elements for versatile zoning', params: { elementVariety: 3, elementDamage: 1.15, elementRange: 1.2 } }
    }
  };

  generate(archetype: string, theme: string): any {
    const archetypeTraits = this.traits[archetype] || this.traits['all_rounder'];
    const traitKeys = Object.keys(archetypeTraits);
    const selectedTrait = traitKeys[Math.floor(Math.random() * traitKeys.length)];
    return { id: selectedTrait, ...archetypeTraits[selectedTrait] };
  }
}

class MoveGenerator {
  generateNormals(archetype: string, stats: Record<string, any>): Record<string, any> {
    const normals: Record<string, any> = {};
    const normalNames = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'];
    
    for (const name of normalNames) {
      normals[name] = this.generateNormalMove(name, archetype, stats);
    }
    
    return normals;
  }

  generateSpecials(archetype: string, theme: string, count: number): Record<string, any> {
    const specials: Record<string, any> = {};
    const specialNames = ['qcf_p', 'dp_p', 'qcb_k', 'hcb_p', 'qcf_k', 'dp_k'];
    
    for (let i = 0; i < count && i < specialNames.length; i++) {
      specials[specialNames[i]] = this.generateSpecialMove(specialNames[i], archetype, theme);
    }
    
    return specials;
  }

  generateSupers(archetype: string, theme: string, count: number): Record<string, any> {
    const supers: Record<string, any> = {};
    const superNames = ['lvl1', 'lvl2', 'lvl3'];
    
    for (let i = 0; i < count && i < superNames.length; i++) {
      supers[superNames[i]] = this.generateSuperMove(superNames[i], archetype, theme);
    }
    
    return supers;
  }

  private generateNormalMove(name: string, archetype: string, stats: Record<string, any>): any {
    const isPunch = name.includes('p');
    const isHeavy = name.includes('h');
    
    const baseDamage = isHeavy ? 120 : (name.includes('m') ? 80 : 50);
    const baseStartup = isHeavy ? 8 : (name.includes('m') ? 5 : 3);
    const baseActive = isHeavy ? 4 : 2;
    const baseRecovery = isHeavy ? 12 : (name.includes('m') ? 7 : 5);
    
    return {
      name: this.getNormalMoveName(name, archetype),
      damage: Math.round(baseDamage * (stats.health / 1000)),
      startup: baseStartup,
      active: baseActive,
      recovery: baseRecovery,
      onBlock: isHeavy ? -3 : (name.includes('m') ? 0 : 2),
      onHit: isHeavy ? 1 : (name.includes('m') ? 3 : 5),
      tags: this.getNormalMoveTags(name, archetype),
      hitbox: this.generateHitbox(name, archetype)
    };
  }

  private generateSpecialMove(name: string, archetype: string, theme: string): any {
    const isProjectile = name.includes('qcf') && name.includes('p');
    const isAntiAir = name.includes('dp');
    const isRekka = name.includes('qcb');
    
    return {
      name: this.getSpecialMoveName(name, archetype, theme),
      input: this.getInputNotation(name),
      damage: this.getSpecialDamage(name, archetype),
      startup: this.getSpecialStartup(name, archetype),
      recovery: this.getSpecialRecovery(name, archetype),
      onBlock: this.getSpecialBlockAdvantage(name, archetype),
      tags: this.getSpecialMoveTags(name, archetype, theme),
      hitbox: this.generateSpecialHitbox(name, archetype),
      meterCost: this.getSpecialMeterCost(name)
    };
  }

  private generateSuperMove(name: string, archetype: string, theme: string): any {
    const level = parseInt(name.replace('lvl', ''));
    
    return {
      name: this.getSuperMoveName(name, archetype, theme),
      input: this.getSuperInputNotation(level),
      damage: this.getSuperDamage(level, archetype),
      startup: this.getSuperStartup(level, archetype),
      recovery: this.getSuperRecovery(level, archetype),
      meterCost: level * 25,
      tags: this.getSuperMoveTags(level, archetype, theme),
      hitbox: this.generateSuperHitbox(level, archetype)
    };
  }

  // Helper methods for move generation
  private getNormalMoveName(name: string, archetype: string): string {
    const moveNames: Record<string, Record<string, string>> = {
      'lp': { rushdown: 'Quick Jab', grappler: 'Light Strike', zoner: 'Precise Punch', all_rounder: 'Light Punch' },
      'mp': { rushdown: 'Fast Strike', grappler: 'Medium Blow', zoner: 'Accurate Hit', all_rounder: 'Medium Punch' },
      'hp': { rushdown: 'Power Strike', grappler: 'Heavy Blow', zoner: 'Precise Strike', all_rounder: 'Heavy Punch' },
      'lk': { rushdown: 'Swift Kick', grappler: 'Light Kick', zoner: 'Quick Kick', all_rounder: 'Light Kick' },
      'mk': { rushdown: 'Fast Kick', grappler: 'Medium Kick', zoner: 'Accurate Kick', all_rounder: 'Medium Kick' },
      'hk': { rushdown: 'Power Kick', grappler: 'Heavy Kick', zoner: 'Precise Kick', all_rounder: 'Heavy Kick' }
    };
    
    return moveNames[name]?.[archetype] || moveNames[name]?.['all_rounder'] || 'Attack';
  }

  private getSpecialMoveName(name: string, archetype: string, theme: string): string {
    const themeNames: Record<string, string[]> = {
      arcane: ['Arcane Blast', 'Mystic Strike', 'Eldritch Bolt', 'Spellweaver'],
      divine: ['Divine Smite', 'Holy Strike', 'Radiant Blast', 'Celestial Wrath'],
      elemental: ['Elemental Burst', 'Primal Strike', 'Nature\'s Wrath', 'Elemental Storm'],
      shadow: ['Shadow Strike', 'Void Blast', 'Dark Tendrils', 'Shadow Dance'],
      nature: ['Thorn Whip', 'Nature\'s Call', 'Vine Strike', 'Wild Growth'],
      crystal: ['Crystal Shard', 'Gem Strike', 'Crystalline Blast', 'Diamond Edge'],
      void: ['Void Rift', 'Abyssal Strike', 'Null Blast', 'Void Walker'],
      celestial: ['Stellar Strike', 'Cosmic Blast', 'Heavenly Wrath', 'Starfall'],
      infernal: ['Hellfire', 'Infernal Strike', 'Demonic Blast', 'Soul Burn'],
      primal: ['Primal Roar', 'Beast Strike', 'Wild Fury', 'Savage Blow']
    };
    
    const names = themeNames[theme] || ['Mystic Blast', 'Arcane Strike', 'Magical Technique', 'Spell'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getSuperMoveName(name: string, archetype: string, theme: string): string {
    const level = parseInt(name.replace('lvl', ''));
    const levelNames = ['Ultimate', 'Super', 'Mega', 'Ultra'];
    const themeNames = {
      arcane: 'Eldritch Devastation',
      divine: 'Divine Judgment',
      elemental: 'Elemental Apocalypse',
      shadow: 'Shadow of Death',
      nature: 'Nature\'s Wrath',
      crystal: 'Crystalline Cataclysm',
      void: 'Void Annihilation',
      celestial: 'Celestial Wrath',
      infernal: 'Infernal Destruction',
      primal: 'Primal Awakening'
    };
    
    return `${levelNames[level - 1]} ${themeNames[theme] || 'Mystic Technique'}`;
  }

  private getInputNotation(name: string): string {
    const notations: Record<string, string> = {
      'qcf_p': '236P',
      'dp_p': '623P',
      'qcb_k': '214K',
      'hcb_p': '63214P',
      'qcf_k': '236K',
      'dp_k': '623K'
    };
    return notations[name] || '???';
  }

  private getSuperInputNotation(level: number): string {
    return level === 1 ? '236236P' : level === 2 ? '214214K' : '623623P';
  }

  private getSpecialDamage(name: string, archetype: string): number {
    const baseDamage = name.includes('dp') ? 140 : name.includes('qcf') ? 90 : 100;
    const archetypeModifier = archetype === 'power' ? 1.2 : archetype === 'speed' ? 0.8 : 1.0;
    return Math.round(baseDamage * archetypeModifier);
  }

  private getSuperDamage(level: number, archetype: string): number {
    const baseDamage = level * 100 + 200;
    const archetypeModifier = archetype === 'power' ? 1.3 : archetype === 'speed' ? 0.9 : 1.0;
    return Math.round(baseDamage * archetypeModifier);
  }

  private getSpecialStartup(name: string, archetype: string): number {
    const baseStartup = name.includes('dp') ? 4 : name.includes('qcf') ? 6 : 8;
    const archetypeModifier = archetype === 'speed' ? 0.8 : archetype === 'power' ? 1.2 : 1.0;
    return Math.round(baseStartup * archetypeModifier);
  }

  private getSuperStartup(level: number, archetype: string): number {
    const baseStartup = level * 2 + 4;
    const archetypeModifier = archetype === 'speed' ? 0.9 : archetype === 'power' ? 1.1 : 1.0;
    return Math.round(baseStartup * archetypeModifier);
  }

  private getSpecialRecovery(name: string, archetype: string): number {
    const baseRecovery = name.includes('dp') ? 25 : name.includes('qcf') ? 15 : 18;
    const archetypeModifier = archetype === 'speed' ? 0.9 : archetype === 'power' ? 1.1 : 1.0;
    return Math.round(baseRecovery * archetypeModifier);
  }

  private getSuperRecovery(level: number, archetype: string): number {
    const baseRecovery = level * 10 + 30;
    const archetypeModifier = archetype === 'speed' ? 0.9 : archetype === 'power' ? 1.1 : 1.0;
    return Math.round(baseRecovery * archetypeModifier);
  }

  private getSpecialBlockAdvantage(name: string, archetype: string): number {
    if (name.includes('dp')) return -12;
    if (name.includes('qcf')) return 0;
    return -3;
  }

  private getSpecialMeterCost(name: string): number {
    return name.includes('dp') ? 0 : 25;
  }

  private getNormalMoveTags(name: string, archetype: string): string[] {
    const tags = ['cancelable'];
    if (name.includes('h')) tags.push('launcher');
    if (name.includes('k')) tags.push('low');
    if (archetype === 'rushdown') tags.push('pressure');
    return tags;
  }

  private getSpecialMoveTags(name: string, archetype: string, theme: string): string[] {
    const tags = [];
    if (name.includes('qcf')) tags.push('projectile');
    if (name.includes('dp')) tags.push('reversal', 'anti_air');
    if (name.includes('qcb')) tags.push('rekka');
    if (theme) tags.push(theme);
    return tags;
  }

  private getSuperMoveTags(level: number, archetype: string, theme: string): string[] {
    const tags = ['super', 'cinematic'];
    if (level === 3) tags.push('ultimate');
    if (theme) tags.push(theme);
    return tags;
  }

  private generateHitbox(name: string, archetype: string): any {
    const isHeavy = name.includes('h');
    const isKick = name.includes('k');
    
    return {
      x: isKick ? 60 : 55,
      y: isKick ? 30 : 0,
      width: isHeavy ? 55 : (name.includes('m') ? 45 : 35),
      height: isHeavy ? 35 : (name.includes('m') ? 30 : 25)
    };
  }

  private generateSpecialHitbox(name: string, archetype: string): any {
    if (name.includes('qcf')) {
      return { x: 70, y: 0, width: 50, height: 30 };
    } else if (name.includes('dp')) {
      return { x: 35, y: -40, width: 50, height: 80 };
    } else {
      return { x: 75, y: 15, width: 70, height: 35 };
    }
  }

  private generateSuperHitbox(level: number, archetype: string): any {
    const size = level * 20 + 60;
    return { x: 50, y: -30, width: size, height: size };
  }
}

class CharacterStoryGenerator {
  generateBackstory(name: string, archetype: string, theme: string, personality?: string): string {
    const themes: Record<string, string[]> = {
      fire: ['passionate', 'intense', 'burning desire', 'fiery spirit'],
      ice: ['calm', 'focused', 'cool determination', 'frozen resolve'],
      electric: ['energetic', 'dynamic', 'electrifying presence', 'sparking ambition'],
      wind: ['free-spirited', 'agile', 'flowing movement', 'breezy nature'],
      earth: ['grounded', 'stable', 'solid foundation', 'unshakeable resolve'],
      water: ['adaptable', 'fluid', 'flowing grace', 'deep wisdom'],
      dark: ['mysterious', 'shadowy', 'hidden depths', 'dark power'],
      light: ['radiant', 'pure', 'illuminating presence', 'divine purpose'],
      cyber: ['technological', 'digital', 'systematic approach', 'coded precision'],
      nature: ['natural', 'organic', 'earthly connection', 'wild spirit']
    };

    const archetypes: Record<string, string[]> = {
      rushdown: ['aggressive fighter', 'pressure specialist', 'close-combat expert'],
      grappler: ['wrestling master', 'throw specialist', 'grappling expert'],
      zoner: ['range controller', 'spacing master', 'projectile specialist'],
      all_rounder: ['versatile fighter', 'balanced warrior', 'adaptable combatant'],
      technical: ['precision fighter', 'frame-perfect specialist', 'execution master'],
      power: ['heavy hitter', 'damage dealer', 'brute force fighter'],
      speed: ['lightning fighter', 'agility master', 'speed demon'],
      defensive: ['defensive specialist', 'counter fighter', 'turtle master']
    };

    const personalities: Record<string, string[]> = {
      heroic: ['champion of justice', 'protector of the innocent', 'heroic warrior'],
      villainous: ['dark warrior', 'villainous fighter', 'evil combatant'],
      neutral: ['neutral fighter', 'balanced warrior', 'unbiased combatant'],
      mysterious: ['mysterious fighter', 'enigmatic warrior', 'shadowy combatant'],
      comic: ['comedic fighter', 'funny warrior', 'humorous combatant'],
      serious: ['serious fighter', 'focused warrior', 'determined combatant'],
      aggressive: ['aggressive fighter', 'fierce warrior', 'intense combatant'],
      defensive: ['defensive fighter', 'protective warrior', 'guardian combatant'],
      tactical: ['tactical fighter', 'strategic warrior', 'calculated combatant']
    };

    const themeWords = themes[theme] || ['unique', 'special', 'distinctive'];
    const archetypeWords = archetypes[archetype] || ['fighter', 'warrior', 'combatant'];
    const personalityWords = personalities[personality || 'neutral'] || ['fighter', 'warrior', 'combatant'];

    const backstory = `${name} is a ${themeWords[0]} ${archetypeWords[0]} who has dedicated their life to mastering the art of combat. ` +
      `Born with a ${themeWords[1]} nature, they have become known as a ${archetypeWords[1]} in the fighting world. ` +
      `Their ${themeWords[2]} has led them to develop unique techniques that combine ${theme} energy with ${archetype} fighting style. ` +
      `As a ${personalityWords[0]}, they approach every battle with ${themeWords[3]} and determination.`;

    return backstory;
  }

  generateDescription(name: string, archetype: string, theme: string): string {
    const descriptions: Record<string, string> = {
      fire: `A ${archetype} fighter who wields the power of flames, using intense heat and burning passion to overwhelm opponents.`,
      ice: `A ${archetype} fighter who commands the power of ice, using freezing techniques and cool precision to control the battlefield.`,
      electric: `A ${archetype} fighter who harnesses electrical energy, using lightning-fast attacks and electrifying power to shock opponents.`,
      wind: `A ${archetype} fighter who controls the power of wind, using swift movements and air-based techniques to outmaneuver enemies.`,
      earth: `A ${archetype} fighter who draws strength from the earth, using solid techniques and unshakeable resolve to overpower opponents.`,
      water: `A ${archetype} fighter who flows like water, using adaptive techniques and fluid movements to overcome any challenge.`,
      dark: `A ${archetype} fighter who wields dark power, using shadowy techniques and mysterious abilities to dominate opponents.`,
      light: `A ${archetype} fighter who radiates divine energy, using pure power and righteous techniques to vanquish evil.`,
      cyber: `A ${archetype} fighter who integrates technology, using advanced systems and digital precision to outclass opponents.`,
      nature: `A ${archetype} fighter who connects with nature, using organic techniques and natural power to harmonize with the environment.`
    };

    return descriptions[theme] || `A ${archetype} fighter with unique abilities and fighting style.`;
  }
}