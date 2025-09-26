import type { pc } from 'playcanvas';
import { Logger } from '../../utils/Logger';
import type { ContentGenerationConfig, GeneratedContent } from '../ContentGenerationManager';

export interface StageGenerationOptions {
  theme?: 'urban' | 'nature' | 'cyber' | 'fantasy' | 'space' | 'underwater' | 'volcanic' | 'arctic' | 'desert' | 'jungle';
  size?: 'small' | 'medium' | 'large' | 'huge';
  hazards?: boolean;
  interactiveElements?: number;
  lighting?: 'bright' | 'dim' | 'dark' | 'neon' | 'natural' | 'mystical';
  weather?: 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'sandstorm';
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night' | 'midnight';
  atmosphere?: 'peaceful' | 'tense' | 'mysterious' | 'energetic' | 'melancholic' | 'epic';
}

export interface StageData {
  id: string;
  name: string;
  description: string;
  theme: string;
  size: string;
  lighting: string;
  weather: string;
  timeOfDay: string;
  atmosphere: string;
  layers: Record<string, any>;
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    material: string;
  }>;
  hazards: Array<{
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    damage: number;
    active: boolean;
  }>;
  interactiveElements: Array<{
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    action: string;
    cooldown: number;
  }>;
  music: {
    track: string;
    volume: number;
    loop: boolean;
  };
  effects: Array<{
    type: string;
    x: number;
    y: number;
    intensity: number;
    duration: number;
  }>;
  camera: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    fov: number;
    followSpeed: number;
  };
  physics: {
    gravity: number;
    friction: number;
    bounce: number;
  };
}

export class StageContentGenerator {
  private app: pc.Application;
  private layerGenerator: StageLayerGenerator;
  private hazardGenerator: StageHazardGenerator;
  private effectGenerator: StageEffectGenerator;

  constructor(app: pc.Application) {
    this.app = app;
    this.layerGenerator = new StageLayerGenerator();
    this.hazardGenerator = new StageHazardGenerator();
    this.effectGenerator = new StageEffectGenerator();
  }

  public async generate(
    options: StageGenerationOptions = {},
    config: ContentGenerationConfig
  ): Promise<GeneratedContent | null> {
    try {
      const stageData = await this.createStage(options, config);
      const content: GeneratedContent = {
        id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'stage',
        name: stageData.name,
        description: stageData.description,
        data: stageData,
        metadata: {
          generatedAt: Date.now(),
          generator: 'StageContentGenerator',
          config,
          quality: this.calculateQuality(stageData),
          tags: this.generateTags(stageData)
        },
        assets: {
          sprites: this.extractSpriteAssets(stageData),
          sounds: [stageData.music.track]
        }
      };

      return content;
    } catch (error) {
      Logger.error('Error generating stage:', error);
      return null;
    }
  }

  private async createStage(
    options: StageGenerationOptions,
    config: ContentGenerationConfig
  ): Promise<StageData> {
    const theme = options.theme || this.selectRandomTheme();
    const size = options.size || this.selectRandomSize();
    const lighting = options.lighting || this.selectRandomLighting(theme);
    const weather = options.weather || this.selectRandomWeather(theme);
    const timeOfDay = options.timeOfDay || this.selectRandomTimeOfDay();
    const atmosphere = options.atmosphere || this.selectRandomAtmosphere(theme);

    const name = this.generateStageName(theme, size);
    const description = this.generateStageDescription(theme, size, atmosphere);

    const layers = this.layerGenerator.generateLayers(theme, size, lighting, weather, timeOfDay);
    const platforms = this.generatePlatforms(size, theme);
    const hazards = options.hazards ? this.hazardGenerator.generateHazards(theme, size) : [];
    const interactiveElements = this.generateInteractiveElements(options.interactiveElements || 0, theme);
    const music = this.generateMusic(theme, atmosphere);
    const effects = this.effectGenerator.generateEffects(theme, weather, atmosphere);
    const camera = this.generateCameraSettings(size);
    const physics = this.generatePhysicsSettings(theme);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      theme,
      size,
      lighting,
      weather,
      timeOfDay,
      atmosphere,
      layers,
      platforms,
      hazards,
      interactiveElements,
      music,
      effects,
      camera,
      physics
    };
  }

  private selectRandomTheme(): string {
    const themes = ['arcane_tower', 'divine_cathedral', 'elemental_realm', 'shadow_keep', 'nature_sanctuary', 'crystal_cavern', 'void_dimension', 'celestial_plane', 'infernal_abyss', 'primal_forest'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private selectRandomSize(): string {
    const sizes = ['small', 'medium', 'large', 'huge'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private selectRandomLighting(theme: string): string {
    const lightingMap: Record<string, string[]> = {
      urban: ['neon', 'dim', 'bright'],
      nature: ['natural', 'bright', 'dim'],
      cyber: ['neon', 'bright', 'mystical'],
      fantasy: ['mystical', 'dim', 'natural'],
      space: ['mystical', 'dim', 'bright'],
      underwater: ['dim', 'mystical', 'natural'],
      volcanic: ['bright', 'mystical', 'dim'],
      arctic: ['bright', 'natural', 'dim'],
      desert: ['bright', 'natural', 'dim'],
      jungle: ['dim', 'natural', 'mystical']
    };
    
    const options = lightingMap[theme] || ['bright', 'dim', 'natural'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private selectRandomWeather(theme: string): string {
    const weatherMap: Record<string, string[]> = {
      urban: ['clear', 'rain', 'fog'],
      nature: ['clear', 'rain', 'fog'],
      cyber: ['clear', 'fog', 'storm'],
      fantasy: ['clear', 'fog', 'storm'],
      space: ['clear'],
      underwater: ['clear', 'fog'],
      volcanic: ['clear', 'fog', 'storm'],
      arctic: ['clear', 'snow', 'fog'],
      desert: ['clear', 'sandstorm'],
      jungle: ['clear', 'rain', 'fog']
    };
    
    const options = weatherMap[theme] || ['clear', 'rain'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private selectRandomTimeOfDay(): string {
    const times = ['dawn', 'day', 'dusk', 'night', 'midnight'];
    return times[Math.floor(Math.random() * times.length)];
  }

  private selectRandomAtmosphere(theme: string): string {
    const atmosphereMap: Record<string, string[]> = {
      urban: ['tense', 'energetic', 'mysterious'],
      nature: ['peaceful', 'mysterious', 'energetic'],
      cyber: ['tense', 'energetic', 'mysterious'],
      fantasy: ['mysterious', 'epic', 'peaceful'],
      space: ['mysterious', 'epic', 'tense'],
      underwater: ['mysterious', 'peaceful', 'tense'],
      volcanic: ['tense', 'energetic', 'epic'],
      arctic: ['peaceful', 'mysterious', 'tense'],
      desert: ['tense', 'mysterious', 'melancholic'],
      jungle: ['mysterious', 'tense', 'peaceful']
    };
    
    const options = atmosphereMap[theme] || ['peaceful', 'tense'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateStageName(theme: string, size: string): string {
    const themeNames: Record<string, string[]> = {
      arcane_tower: ['Tower of Mysteries', 'Arcane Spire', 'Mage\'s Sanctum', 'Eldritch Tower', 'Mystic Observatory'],
      divine_cathedral: ['Cathedral of Light', 'Divine Sanctuary', 'Holy Basilica', 'Sacred Hall', 'Celestial Temple'],
      elemental_realm: ['Elemental Nexus', 'Primal Sanctum', 'Elemental Convergence', 'Nature\'s Heart', 'Elemental Arena'],
      shadow_keep: ['Shadow Fortress', 'Dark Keep', 'Void Citadel', 'Shadow Bastion', 'Darkness Stronghold'],
      nature_sanctuary: ['Grove of Eternity', 'Nature\'s Sanctuary', 'Ancient Grove', 'Wild Sanctuary', 'Primal Grove'],
      crystal_cavern: ['Crystal Depths', 'Gem Cavern', 'Crystalline Hall', 'Crystal Sanctum', 'Diamond Cavern'],
      void_dimension: ['Void Nexus', 'Abyssal Plane', 'Null Dimension', 'Void Chamber', 'Empty Realm'],
      celestial_plane: ['Heavenly Realm', 'Celestial Court', 'Stellar Palace', 'Divine Plane', 'Cosmic Arena'],
      infernal_abyss: ['Hell\'s Gate', 'Infernal Pit', 'Demon\'s Lair', 'Abyssal Depths', 'Infernal Arena'],
      primal_forest: ['Ancient Forest', 'Primal Woods', 'Wild Grove', 'Beast\'s Domain', 'Savage Forest']
    };

    const sizeModifiers: Record<string, string[]> = {
      small: ['Compact', 'Intimate', 'Cozy'],
      medium: ['Standard', 'Balanced', 'Moderate'],
      large: ['Expansive', 'Grand', 'Spacious'],
      huge: ['Massive', 'Colossal', 'Gigantic']
    };

    const themeOptions = themeNames[theme] || ['Arena', 'Stage', 'Battleground'];
    const sizeOptions = sizeModifiers[size] || ['Standard'];
    
    const themeName = themeOptions[Math.floor(Math.random() * themeOptions.length)];
    const sizeModifier = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
    
    return `${sizeModifier} ${themeName}`;
  }

  private generateStageDescription(theme: string, size: string, atmosphere: string): string {
    const descriptions: Record<string, string> = {
      arcane_tower: `A ${size} mystical tower filled with ancient magic and arcane energies, where wizards and sorcerers test their mystical prowess.`,
      divine_cathedral: `A ${size} sacred cathedral bathed in divine light, where holy warriors and paladins engage in righteous combat.`,
      elemental_realm: `A ${size} realm where the four elements converge in perfect harmony, creating a dynamic battlefield of natural forces.`,
      shadow_keep: `A ${size} dark fortress shrouded in shadows and mystery, where assassins and dark mages practice their deadly arts.`,
      nature_sanctuary: `A ${size} sacred grove where druids and nature guardians protect the ancient balance of the natural world.`,
      crystal_cavern: `A ${size} underground cavern filled with glowing crystals and precious gems, where treasure hunters and miners clash.`,
      void_dimension: `A ${size} otherworldly dimension where reality bends and twists, creating an unpredictable and surreal battleground.`,
      celestial_plane: `A ${size} heavenly realm where angels and celestial beings engage in divine combat and spiritual warfare.`,
      infernal_abyss: `A ${size} hellish pit where demons and devils battle for supremacy in the depths of the underworld.`,
      primal_forest: `A ${size} ancient forest where primal forces and wild magic create a savage and untamed battleground.`
    };

    const baseDescription = descriptions[theme] || `A ${size} fighting arena with unique characteristics.`;
    const atmosphereModifier = atmosphere === 'tense' ? ' The atmosphere is tense and foreboding.' :
                              atmosphere === 'peaceful' ? ' The atmosphere is calm and serene.' :
                              atmosphere === 'mysterious' ? ' The atmosphere is mysterious and enigmatic.' :
                              atmosphere === 'energetic' ? ' The atmosphere is energetic and exciting.' :
                              atmosphere === 'epic' ? ' The atmosphere is epic and grand.' : '';

    return baseDescription + atmosphereModifier;
  }

  private generatePlatforms(size: string, theme: string): Array<any> {
    const platforms = [];
    const sizeMultipliers = { small: 0.8, medium: 1.0, large: 1.2, huge: 1.5 };
    const multiplier = sizeMultipliers[size] || 1.0;

    // Main platform
    platforms.push({
      x: 0,
      y: -5,
      width: 40 * multiplier,
      height: 2,
      type: 'main',
      material: this.getPlatformMaterial(theme)
    });

    // Side platforms
    if (size === 'large' || size === 'huge') {
      platforms.push({
        x: -25 * multiplier,
        y: 0,
        width: 15 * multiplier,
        height: 1,
        type: 'side',
        material: this.getPlatformMaterial(theme)
      });
      platforms.push({
        x: 25 * multiplier,
        y: 0,
        width: 15 * multiplier,
        height: 1,
        type: 'side',
        material: this.getPlatformMaterial(theme)
      });
    }

    return platforms;
  }

  private getPlatformMaterial(theme: string): string {
    const materials: Record<string, string> = {
      urban: 'concrete',
      nature: 'wood',
      cyber: 'metal',
      fantasy: 'stone',
      space: 'metal',
      underwater: 'coral',
      volcanic: 'lava_rock',
      arctic: 'ice',
      desert: 'sandstone',
      jungle: 'wood'
    };
    return materials[theme] || 'concrete';
  }

  private generateInteractiveElements(count: number, theme: string): Array<any> {
    const elements = [];
    const elementTypes = this.getElementTypes(theme);

    for (let i = 0; i < count; i++) {
      const type = elementTypes[Math.floor(Math.random() * elementTypes.length)];
      elements.push({
        type,
        x: (Math.random() - 0.5) * 60,
        y: Math.random() * 20 - 10,
        width: 2 + Math.random() * 3,
        height: 2 + Math.random() * 3,
        action: this.getElementAction(type),
        cooldown: 5 + Math.random() * 10
      });
    }

    return elements;
  }

  private getElementTypes(theme: string): string[] {
    const elementMap: Record<string, string[]> = {
      urban: ['barrel', 'crate', 'lamp', 'sign', 'trash_can'],
      nature: ['rock', 'tree', 'flower', 'mushroom', 'vine'],
      cyber: ['terminal', 'hologram', 'data_core', 'energy_cell', 'circuit'],
      fantasy: ['crystal', 'rune', 'magic_orb', 'ancient_stone', 'enchanted_flower'],
      space: ['console', 'energy_core', 'crystal', 'data_pad', 'gravity_well'],
      underwater: ['coral', 'seaweed', 'bubble', 'treasure_chest', 'ancient_artifact'],
      volcanic: ['lava_pool', 'magma_rock', 'fire_crystal', 'ash_pile', 'volcanic_vent'],
      arctic: ['ice_crystal', 'snow_pile', 'frozen_pond', 'ice_spear', 'aurora_light'],
      desert: ['sand_pile', 'cactus', 'ancient_pottery', 'sand_dune', 'oasis_water'],
      jungle: ['vine', 'tropical_flower', 'ancient_idol', 'jungle_fruit', 'wild_animal']
    };
    return elementMap[theme] || ['interactive_element'];
  }

  private getElementAction(type: string): string {
    const actions: Record<string, string> = {
      barrel: 'explode',
      crate: 'break',
      lamp: 'illuminate',
      sign: 'display_info',
      terminal: 'activate',
      crystal: 'glow',
      coral: 'heal',
      lava_pool: 'damage',
      ice_crystal: 'freeze',
      sand_pile: 'blind'
    };
    return actions[type] || 'interact';
  }

  private generateMusic(theme: string, atmosphere: string): any {
    const musicTracks: Record<string, string[]> = {
      urban: ['urban_battle', 'city_fight', 'metro_combat'],
      nature: ['nature_battle', 'forest_fight', 'wild_combat'],
      cyber: ['cyber_battle', 'digital_fight', 'tech_combat'],
      fantasy: ['fantasy_battle', 'magic_fight', 'epic_combat'],
      space: ['space_battle', 'cosmic_fight', 'stellar_combat'],
      underwater: ['underwater_battle', 'aquatic_fight', 'ocean_combat'],
      volcanic: ['volcanic_battle', 'fire_fight', 'lava_combat'],
      arctic: ['arctic_battle', 'ice_fight', 'frozen_combat'],
      desert: ['desert_battle', 'sand_fight', 'arid_combat'],
      jungle: ['jungle_battle', 'wild_fight', 'tropical_combat']
    };

    const tracks = musicTracks[theme] || ['battle_theme'];
    const track = tracks[Math.floor(Math.random() * tracks.length)];

    const volume = atmosphere === 'peaceful' ? 0.6 : atmosphere === 'tense' ? 0.9 : 0.8;

    return {
      track,
      volume,
      loop: true
    };
  }

  private generateCameraSettings(size: string): any {
    const sizeSettings: Record<string, any> = {
      small: { position: { x: 0, y: 5, z: 15 }, fov: 60, followSpeed: 0.1 },
      medium: { position: { x: 0, y: 8, z: 20 }, fov: 65, followSpeed: 0.08 },
      large: { position: { x: 0, y: 12, z: 25 }, fov: 70, followSpeed: 0.06 },
      huge: { position: { x: 0, y: 16, z: 30 }, fov: 75, followSpeed: 0.05 }
    };

    const settings = sizeSettings[size] || sizeSettings.medium;
    return {
      position: settings.position,
      rotation: { x: 0, y: 0, z: 0 },
      fov: settings.fov,
      followSpeed: settings.followSpeed
    };
  }

  private generatePhysicsSettings(theme: string): any {
    const physicsMap: Record<string, any> = {
      urban: { gravity: -980, friction: 0.8, bounce: 0.2 },
      nature: { gravity: -980, friction: 0.7, bounce: 0.3 },
      cyber: { gravity: -980, friction: 0.9, bounce: 0.1 },
      fantasy: { gravity: -980, friction: 0.6, bounce: 0.4 },
      space: { gravity: -490, friction: 0.5, bounce: 0.6 },
      underwater: { gravity: -490, friction: 0.3, bounce: 0.1 },
      volcanic: { gravity: -980, friction: 0.8, bounce: 0.2 },
      arctic: { gravity: -980, friction: 0.9, bounce: 0.1 },
      desert: { gravity: -980, friction: 0.6, bounce: 0.3 },
      jungle: { gravity: -980, friction: 0.7, bounce: 0.3 }
    };

    return physicsMap[theme] || { gravity: -980, friction: 0.8, bounce: 0.2 };
  }

  private calculateQuality(stageData: StageData): number {
    let quality = 0.5; // Base quality

    // Quality based on completeness
    if (stageData.layers && Object.keys(stageData.layers).length >= 4) quality += 0.1;
    if (stageData.platforms && stageData.platforms.length >= 1) quality += 0.1;
    if (stageData.effects && stageData.effects.length >= 2) quality += 0.1;
    if (stageData.interactiveElements && stageData.interactiveElements.length >= 1) quality += 0.1;
    if (stageData.description && stageData.description.length > 100) quality += 0.1;

    // Quality based on theme consistency
    if (this.isThemeConsistent(stageData)) quality += 0.1;

    return Math.min(1.0, quality);
  }

  private isThemeConsistent(stageData: StageData): boolean {
    // Check if all elements match the theme
    const theme = stageData.theme;
    const material = this.getPlatformMaterial(theme);
    
    // Check if platform materials match theme
    const platformMaterials = stageData.platforms.map(p => p.material);
    const consistentMaterials = platformMaterials.every(mat => mat === material);
    
    return consistentMaterials;
  }

  private generateTags(stageData: StageData): string[] {
    return [
      stageData.theme,
      stageData.size,
      stageData.lighting,
      stageData.weather,
      stageData.timeOfDay,
      stageData.atmosphere
    ].filter(tag => tag && tag.length > 0);
  }

  private extractSpriteAssets(stageData: StageData): string[] {
    const assets: string[] = [];
    
    // Extract layer assets
    if (stageData.layers) {
      for (const layer of Object.values(stageData.layers)) {
        if (layer.elements) {
          for (const element of layer.elements) {
            if (element.sprite) {
              assets.push(element.sprite);
            }
          }
        }
      }
    }
    
    // Extract effect assets
    if (stageData.effects) {
      for (const effect of stageData.effects) {
        if (effect.sprite) {
          assets.push(effect.sprite);
        }
      }
    }
    
    return [...new Set(assets)]; // Remove duplicates
  }
}

// Helper classes
class StageLayerGenerator {
  generateLayers(theme: string, size: string, lighting: string, weather: string, timeOfDay: string): Record<string, any> {
    const layers: Record<string, any> = {};
    
    // Skybox layer
    layers.skybox = this.generateSkyboxLayer(theme, lighting, weather, timeOfDay);
    
    // Background layers
    layers.farBackground = this.generateFarBackgroundLayer(theme, size);
    layers.midBackground = this.generateMidBackgroundLayer(theme, size);
    layers.nearBackground = this.generateNearBackgroundLayer(theme, size);
    
    // Foreground layer
    layers.foreground = this.generateForegroundLayer(theme, size);
    
    return layers;
  }

  private generateSkyboxLayer(theme: string, lighting: string, weather: string, timeOfDay: string): any {
    return {
      type: 'skybox',
      elements: [{
        type: 'plane',
        name: `${theme}_skybox_${timeOfDay}_${weather}`,
        sprite: `stages/skyboxes/${theme}_${timeOfDay}_${weather}.png`,
        parallaxSpeed: 0.1,
        depth: -100
      }]
    };
  }

  private generateFarBackgroundLayer(theme: string, size: string): any {
    const elementCount = size === 'huge' ? 5 : size === 'large' ? 4 : size === 'medium' ? 3 : 2;
    const elements = [];
    
    for (let i = 0; i < elementCount; i++) {
      elements.push({
        type: 'background_element',
        name: `${theme}_far_bg_${i}`,
        sprite: `stages/backgrounds/${theme}_far_${i}.png`,
        x: (i - elementCount/2) * 120,
        y: -30 + Math.random() * 20,
        width: 60 + Math.random() * 40,
        height: 40 + Math.random() * 30,
        parallaxSpeed: 0.2,
        depth: -80
      });
    }
    
    return {
      type: 'far_background',
      elements
    };
  }

  private generateMidBackgroundLayer(theme: string, size: string): any {
    const elementCount = size === 'huge' ? 4 : size === 'large' ? 3 : size === 'medium' ? 2 : 1;
    const elements = [];
    
    for (let i = 0; i < elementCount; i++) {
      elements.push({
        type: 'background_element',
        name: `${theme}_mid_bg_${i}`,
        sprite: `stages/backgrounds/${theme}_mid_${i}.png`,
        x: (i - elementCount/2) * 100,
        y: -20 + Math.random() * 15,
        width: 50 + Math.random() * 30,
        height: 30 + Math.random() * 20,
        parallaxSpeed: 0.4,
        depth: -60
      });
    }
    
    return {
      type: 'mid_background',
      elements
    };
  }

  private generateNearBackgroundLayer(theme: string, size: string): any {
    const elementCount = size === 'huge' ? 3 : size === 'large' ? 2 : 1;
    const elements = [];
    
    for (let i = 0; i < elementCount; i++) {
      elements.push({
        type: 'background_element',
        name: `${theme}_near_bg_${i}`,
        sprite: `stages/backgrounds/${theme}_near_${i}.png`,
        x: (i - elementCount/2) * 80,
        y: -10 + Math.random() * 10,
        width: 40 + Math.random() * 20,
        height: 20 + Math.random() * 15,
        parallaxSpeed: 0.6,
        depth: -40
      });
    }
    
    return {
      type: 'near_background',
      elements
    };
  }

  private generateForegroundLayer(theme: string, size: string): any {
    const elementCount = size === 'huge' ? 2 : 1;
    const elements = [];
    
    for (let i = 0; i < elementCount; i++) {
      elements.push({
        type: 'foreground_element',
        name: `${theme}_fg_${i}`,
        sprite: `stages/foregrounds/${theme}_fg_${i}.png`,
        x: (i - elementCount/2) * 60,
        y: 0 + Math.random() * 5,
        width: 30 + Math.random() * 15,
        height: 15 + Math.random() * 10,
        parallaxSpeed: 0.8,
        depth: -20
      });
    }
    
    return {
      type: 'foreground',
      elements
    };
  }
}

class StageHazardGenerator {
  generateHazards(theme: string, size: string): Array<any> {
    const hazards = [];
    const hazardCount = size === 'huge' ? 3 : size === 'large' ? 2 : 1;
    
    for (let i = 0; i < hazardCount; i++) {
      const hazard = this.generateHazard(theme, i);
      if (hazard) {
        hazards.push(hazard);
      }
    }
    
    return hazards;
  }

  private generateHazard(theme: string, index: number): any {
    const hazardTypes: Record<string, string[]> = {
      urban: ['electric_fence', 'steam_vent', 'falling_debris'],
      nature: ['falling_rocks', 'swinging_vine', 'wild_animal'],
      cyber: ['energy_field', 'laser_grid', 'data_storm'],
      fantasy: ['magic_trap', 'cursed_ground', 'summoned_creature'],
      space: ['gravity_well', 'energy_beam', 'asteroid_field'],
      underwater: ['current', 'bubble_trap', 'sea_creature'],
      volcanic: ['lava_geyser', 'falling_rock', 'heat_wave'],
      arctic: ['ice_slide', 'avalanche', 'freezing_wind'],
      desert: ['sand_trap', 'dust_devil', 'scorpion_nest'],
      jungle: ['poison_cloud', 'falling_log', 'wild_animal']
    };
    
    const types = hazardTypes[theme] || ['hazard'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      type,
      x: (Math.random() - 0.5) * 40,
      y: Math.random() * 10 - 5,
      width: 3 + Math.random() * 4,
      height: 2 + Math.random() * 3,
      damage: 20 + Math.random() * 30,
      active: Math.random() > 0.5
    };
  }
}

class StageEffectGenerator {
  generateEffects(theme: string, weather: string, atmosphere: string): Array<any> {
    const effects = [];
    
    // Weather effects
    if (weather !== 'clear') {
      effects.push(this.generateWeatherEffect(weather));
    }
    
    // Theme effects
    effects.push(this.generateThemeEffect(theme));
    
    // Atmosphere effects
    if (atmosphere === 'mysterious' || atmosphere === 'epic') {
      effects.push(this.generateAtmosphereEffect(atmosphere));
    }
    
    return effects;
  }

  private generateWeatherEffect(weather: string): any {
    const weatherEffects: Record<string, any> = {
      rain: { type: 'rain', intensity: 0.7, duration: -1 },
      snow: { type: 'snow', intensity: 0.6, duration: -1 },
      fog: { type: 'fog', intensity: 0.5, duration: -1 },
      storm: { type: 'lightning', intensity: 0.8, duration: -1 },
      sandstorm: { type: 'sand', intensity: 0.9, duration: -1 }
    };
    
    const effect = weatherEffects[weather] || { type: 'particle', intensity: 0.5, duration: -1 };
    return {
      ...effect,
      x: 0,
      y: 0,
      sprite: `effects/weather/${weather}.png`
    };
  }

  private generateThemeEffect(theme: string): any {
    const themeEffects: Record<string, any> = {
      urban: { type: 'neon_glow', intensity: 0.6, duration: -1 },
      nature: { type: 'leaf_particles', intensity: 0.4, duration: -1 },
      cyber: { type: 'data_streams', intensity: 0.7, duration: -1 },
      fantasy: { type: 'magic_sparkles', intensity: 0.5, duration: -1 },
      space: { type: 'star_field', intensity: 0.8, duration: -1 },
      underwater: { type: 'bubbles', intensity: 0.6, duration: -1 },
      volcanic: { type: 'ember_particles', intensity: 0.7, duration: -1 },
      arctic: { type: 'snow_flakes', intensity: 0.5, duration: -1 },
      desert: { type: 'sand_particles', intensity: 0.6, duration: -1 },
      jungle: { type: 'pollen', intensity: 0.4, duration: -1 }
    };
    
    const effect = themeEffects[theme] || { type: 'ambient', intensity: 0.5, duration: -1 };
    return {
      ...effect,
      x: 0,
      y: 0,
      sprite: `effects/theme/${theme}.png`
    };
  }

  private generateAtmosphereEffect(atmosphere: string): any {
    const atmosphereEffects: Record<string, any> = {
      mysterious: { type: 'mystical_aura', intensity: 0.6, duration: -1 },
      epic: { type: 'heroic_glow', intensity: 0.8, duration: -1 }
    };
    
    const effect = atmosphereEffects[atmosphere] || { type: 'ambient', intensity: 0.5, duration: -1 };
    return {
      ...effect,
      x: 0,
      y: 0,
      sprite: `effects/atmosphere/${atmosphere}.png`
    };
  }
}