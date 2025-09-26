import * as pc from 'playcanvas';

export interface Character3DData {
  id: string;
  name: string;
  theme: string;
  fightingStyle: string;
  model: CharacterModel;
  materials: CharacterMaterials;
  animations: CharacterAnimations;
  hitboxes: HitboxData[];
  hurtboxes: HurtboxData[];
}

export interface CharacterModel {
  body: BodyGeometry;
  head: HeadGeometry;
  hair: HairGeometry;
  clothing: ClothingGeometry;
  accessories: AccessoryGeometry[];
  weapons: WeaponGeometry[];
}

export interface BodyGeometry {
  height: number;
  build: 'slim' | 'athletic' | 'muscular' | 'heavy';
  proportions: BodyProportions;
  skinTone: string;
  scars: ScarData[];
  tattoos: TattooData[];
}

export interface HeadGeometry {
  shape: 'round' | 'oval' | 'square' | 'heart' | 'diamond';
  features: FacialFeatures;
  hair: HairData;
  facialHair: FacialHairData;
  eyes: EyeData;
  mouth: MouthData;
  nose: NoseData;
}

export interface HairGeometry {
  style: string;
  length: 'short' | 'medium' | 'long';
  color: string;
  texture: 'straight' | 'wavy' | 'curly' | 'coily';
  highlights: string[];
}

export interface ClothingGeometry {
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem;
  gloves: ClothingItem;
  cape: ClothingItem;
  armor: ArmorItem[];
}

export interface AccessoryGeometry {
  type: 'jewelry' | 'mask' | 'helmet' | 'belt' | 'pouch';
  material: string;
  color: string;
  position: pc.Vec3;
  scale: pc.Vec3;
  rotation: pc.Vec3;
}

export interface WeaponGeometry {
  type: 'sword' | 'staff' | 'bow' | 'dagger' | 'gauntlet' | 'magic';
  material: string;
  color: string;
  size: pc.Vec3;
  position: pc.Vec3;
  attachments: WeaponAttachment[];
}

export interface CharacterMaterials {
  skin: MaterialData;
  hair: MaterialData;
  clothing: MaterialData;
  armor: MaterialData;
  weapons: MaterialData;
  accessories: MaterialData;
}

export interface MaterialData {
  diffuse: string;
  normal: string;
  specular: string;
  emissive: string;
  metallic: number;
  roughness: number;
  opacity: number;
  tiling: pc.Vec2;
  offset: pc.Vec2;
}

export interface CharacterAnimations {
  idle: AnimationData;
  walk: AnimationData;
  run: AnimationData;
  jump: AnimationData;
  attack: AnimationData[];
  special: AnimationData[];
  super: AnimationData[];
  hit: AnimationData[];
  block: AnimationData[];
  victory: AnimationData;
  defeat: AnimationData;
}

export interface AnimationData {
  name: string;
  duration: number;
  frames: AnimationFrame[];
  loop: boolean;
  blendMode: 'replace' | 'add' | 'multiply';
}

export interface AnimationFrame {
  frame: number;
  position: pc.Vec3;
  rotation: pc.Vec3;
  scale: pc.Vec3;
  boneTransforms: BoneTransform[];
}

export interface BoneTransform {
  boneName: string;
  position: pc.Vec3;
  rotation: pc.Vec3;
  scale: pc.Vec3;
}

export interface HitboxData {
  name: string;
  type: 'strike' | 'grab' | 'projectile';
  position: pc.Vec3;
  size: pc.Vec3;
  rotation: pc.Vec3;
  activeFrames: number[];
  damage: number;
  hitstun: number;
  blockstun: number;
  properties: string[];
}

export interface HurtboxData {
  name: string;
  position: pc.Vec3;
  size: pc.Vec3;
  rotation: pc.Vec3;
  activeFrames: number[];
  properties: string[];
}

export class Character3DGenerator {
  private app: pc.Application;
  private characterData: Map<string, Character3DData> = new Map();
  private modelCache: Map<string, pc.Entity> = new Map();
  private materialCache: Map<string, pc.Material> = new Map();
  
  // Fantasy character themes
  private themes = [
    'arcane_mage', 'divine_paladin', 'elemental_sorcerer', 'shadow_assassin',
    'nature_druid', 'crystal_guardian', 'void_walker', 'celestial_angel',
    'infernal_demon', 'primal_berserker', 'storm_warrior', 'ice_mage'
  ];
  
  // Fighting styles
  private fightingStyles = [
    'sword_mastery', 'berserker_rage', 'magic_arts', 'stealth_combat',
    'elemental_control', 'divine_power', 'shadow_manipulation', 'nature_bond',
    'crystal_magic', 'void_mastery', 'celestial_light', 'infernal_fire'
  ];

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeGenerator();
  }

  private initializeGenerator(): void {
    // Initialize material cache
    this.createBaseMaterials();
  }

  private createBaseMaterials(): void {
    // Skin material
    const skinMaterial = new pc.StandardMaterial();
    skinMaterial.diffuse = new pc.Color(0.8, 0.6, 0.4);
    skinMaterial.metallic = 0.1;
    skinMaterial.roughness = 0.8;
    skinMaterial.update();
    this.materialCache.set('skin', skinMaterial);

    // Hair material
    const hairMaterial = new pc.StandardMaterial();
    hairMaterial.diffuse = new pc.Color(0.2, 0.1, 0.05);
    hairMaterial.metallic = 0.0;
    hairMaterial.roughness = 0.9;
    hairMaterial.update();
    this.materialCache.set('hair', hairMaterial);

    // Clothing material
    const clothingMaterial = new pc.StandardMaterial();
    clothingMaterial.diffuse = new pc.Color(0.3, 0.2, 0.4);
    clothingMaterial.metallic = 0.0;
    clothingMaterial.roughness = 0.7;
    clothingMaterial.update();
    this.materialCache.set('clothing', clothingMaterial);

    // Armor material
    const armorMaterial = new pc.StandardMaterial();
    armorMaterial.diffuse = new pc.Color(0.4, 0.4, 0.5);
    armorMaterial.metallic = 0.8;
    armorMaterial.roughness = 0.3;
    armorMaterial.update();
    this.materialCache.set('armor', armorMaterial);

    // Weapon material
    const weaponMaterial = new pc.StandardMaterial();
    weaponMaterial.diffuse = new pc.Color(0.6, 0.6, 0.7);
    weaponMaterial.metallic = 0.9;
    weaponMaterial.roughness = 0.2;
    weaponMaterial.update();
    this.materialCache.set('weapon', weaponMaterial);
  }

  public generateCharacter(characterId: string, theme: string, fightingStyle: string): Character3DData {
    const characterData: Character3DData = {
      id: characterId,
      name: this.generateCharacterName(theme),
      theme,
      fightingStyle,
      model: this.generateCharacterModel(theme, fightingStyle),
      materials: this.generateCharacterMaterials(theme),
      animations: this.generateCharacterAnimations(fightingStyle),
      hitboxes: this.generateHitboxes(fightingStyle),
      hurtboxes: this.generateHurtboxes()
    };

    this.characterData.set(characterId, characterData);
    return characterData;
  }

  private generateCharacterName(theme: string): string {
    const names = {
      'arcane_mage': ['Aethon', 'Mystara', 'Arcanus', 'Spellweaver'],
      'divine_paladin': ['Valor', 'Seraphina', 'Divinus', 'Lightbringer'],
      'elemental_sorcerer': ['Storm', 'Ember', 'Frost', 'Gale'],
      'shadow_assassin': ['Shadow', 'Raven', 'Nightshade', 'Whisper'],
      'nature_druid': ['Thorn', 'Willow', 'Oak', 'Moss'],
      'crystal_guardian': ['Crystal', 'Gem', 'Prism', 'Shard'],
      'void_walker': ['Void', 'Echo', 'Rift', 'Abyss'],
      'celestial_angel': ['Celeste', 'Aurelius', 'Divine', 'Seraph'],
      'infernal_demon': ['Inferno', 'Blaze', 'Hellfire', 'Demon'],
      'primal_berserker': ['Rage', 'Fury', 'Wild', 'Savage'],
      'storm_warrior': ['Tempest', 'Thunder', 'Lightning', 'Storm'],
      'ice_mage': ['Frost', 'Glacier', 'Winter', 'Ice']
    };

    const themeNames = names[theme] || ['Warrior', 'Fighter', 'Champion', 'Hero'];
    return themeNames[Math.floor(Math.random() * themeNames.length)];
  }

  private generateCharacterModel(theme: string, fightingStyle: string): CharacterModel {
    return {
      body: this.generateBodyGeometry(theme, fightingStyle),
      head: this.generateHeadGeometry(theme),
      hair: this.generateHairGeometry(theme),
      clothing: this.generateClothingGeometry(theme, fightingStyle),
      accessories: this.generateAccessories(theme, fightingStyle),
      weapons: this.generateWeapons(theme, fightingStyle)
    };
  }

  private generateBodyGeometry(theme: string, fightingStyle: string): BodyGeometry {
    const builds = {
      'sword_mastery': 'athletic',
      'berserker_rage': 'muscular',
      'magic_arts': 'slim',
      'stealth_combat': 'slim',
      'elemental_control': 'athletic',
      'divine_power': 'muscular',
      'shadow_manipulation': 'slim',
      'nature_bond': 'athletic',
      'crystal_magic': 'athletic',
      'void_mastery': 'slim',
      'celestial_light': 'athletic',
      'infernal_fire': 'muscular'
    };

    return {
      height: this.randomFloat(1.6, 2.0),
      build: builds[fightingStyle] || 'athletic',
      proportions: this.generateBodyProportions(theme, fightingStyle),
      skinTone: this.generateSkinTone(theme),
      scars: this.generateScars(theme, fightingStyle),
      tattoos: this.generateTattoos(theme)
    };
  }

  private generateHeadGeometry(theme: string): HeadGeometry {
    return {
      shape: this.randomChoice(['round', 'oval', 'square', 'heart', 'diamond']),
      features: this.generateFacialFeatures(theme),
      hair: this.generateHairData(theme),
      facialHair: this.generateFacialHair(theme),
      eyes: this.generateEyeData(theme),
      mouth: this.generateMouthData(theme),
      nose: this.generateNoseData(theme)
    };
  }

  private generateHairGeometry(theme: string): HairGeometry {
    const hairStyles = {
      'arcane_mage': ['long', 'medium'],
      'divine_paladin': ['short', 'medium'],
      'elemental_sorcerer': ['long', 'medium'],
      'shadow_assassin': ['short', 'medium'],
      'nature_druid': ['long', 'medium'],
      'crystal_guardian': ['short', 'medium'],
      'void_walker': ['long', 'medium'],
      'celestial_angel': ['long', 'medium'],
      'infernal_demon': ['short', 'medium'],
      'primal_berserker': ['short', 'medium'],
      'storm_warrior': ['short', 'medium'],
      'ice_mage': ['long', 'medium']
    };

    const lengths = hairStyles[theme] || ['short', 'medium', 'long'];
    
    return {
      style: this.generateHairStyle(theme),
      length: this.randomChoice(lengths),
      color: this.generateHairColor(theme),
      texture: this.randomChoice(['straight', 'wavy', 'curly', 'coily']),
      highlights: this.generateHairHighlights(theme)
    };
  }

  private generateClothingGeometry(theme: string, fightingStyle: string): ClothingGeometry {
    return {
      top: this.generateClothingItem('top', theme, fightingStyle),
      bottom: this.generateClothingItem('bottom', theme, fightingStyle),
      shoes: this.generateClothingItem('shoes', theme, fightingStyle),
      gloves: this.generateClothingItem('gloves', theme, fightingStyle),
      cape: this.generateClothingItem('cape', theme, fightingStyle),
      armor: this.generateArmor(theme, fightingStyle)
    };
  }

  private generateAccessories(theme: string, fightingStyle: string): AccessoryGeometry[] {
    const accessories: AccessoryGeometry[] = [];
    
    // Theme-specific accessories
    if (theme === 'arcane_mage') {
      accessories.push({
        type: 'jewelry',
        material: 'crystal',
        color: '#8B5CF6',
        position: new pc.Vec3(0, 0.1, 0),
        scale: new pc.Vec3(0.1, 0.1, 0.1),
        rotation: new pc.Vec3(0, 0, 0)
      });
    }
    
    if (theme === 'divine_paladin') {
      accessories.push({
        type: 'helmet',
        material: 'gold',
        color: '#FFD700',
        position: new pc.Vec3(0, 0.2, 0),
        scale: new pc.Vec3(0.8, 0.8, 0.8),
        rotation: new pc.Vec3(0, 0, 0)
      });
    }
    
    return accessories;
  }

  private generateWeapons(theme: string, fightingStyle: string): WeaponGeometry[] {
    const weapons: WeaponGeometry[] = [];
    
    // Theme-specific weapons
    if (theme === 'arcane_mage' || fightingStyle === 'magic_arts') {
      weapons.push({
        type: 'staff',
        material: 'wood',
        color: '#8B5CF6',
        size: new pc.Vec3(0.1, 1.5, 0.1),
        position: new pc.Vec3(0, 0.5, 0),
        attachments: []
      });
    }
    
    if (fightingStyle === 'sword_mastery') {
      weapons.push({
        type: 'sword',
        material: 'steel',
        color: '#C0C0C0',
        size: new pc.Vec3(0.1, 1.0, 0.05),
        position: new pc.Vec3(0.3, 0.2, 0),
        attachments: []
      });
    }
    
    return weapons;
  }

  private generateCharacterMaterials(theme: string): CharacterMaterials {
    return {
      skin: this.generateMaterialData('skin', theme),
      hair: this.generateMaterialData('hair', theme),
      clothing: this.generateMaterialData('clothing', theme),
      armor: this.generateMaterialData('armor', theme),
      weapons: this.generateMaterialData('weapon', theme),
      accessories: this.generateMaterialData('accessory', theme)
    };
  }

  private generateCharacterAnimations(fightingStyle: string): CharacterAnimations {
    return {
      idle: this.generateAnimationData('idle', 60),
      walk: this.generateAnimationData('walk', 30),
      run: this.generateAnimationData('run', 20),
      jump: this.generateAnimationData('jump', 40),
      attack: this.generateAttackAnimations(fightingStyle),
      special: this.generateSpecialAnimations(fightingStyle),
      super: this.generateSuperAnimations(fightingStyle),
      hit: this.generateHitAnimations(),
      block: this.generateBlockAnimations(),
      victory: this.generateAnimationData('victory', 120),
      defeat: this.generateAnimationData('defeat', 180)
    };
  }

  private generateHitboxes(fightingStyle: string): HitboxData[] {
    const hitboxes: HitboxData[] = [];
    
    // Basic attack hitboxes
    hitboxes.push({
      name: 'light_punch',
      type: 'strike',
      position: new pc.Vec3(0.5, 0.8, 0),
      size: new pc.Vec3(0.3, 0.3, 0.3),
      rotation: new pc.Vec3(0, 0, 0),
      activeFrames: [5, 6, 7],
      damage: 10,
      hitstun: 8,
      blockstun: 4,
      properties: ['light', 'strike']
    });
    
    hitboxes.push({
      name: 'medium_punch',
      type: 'strike',
      position: new pc.Vec3(0.6, 0.8, 0),
      size: new pc.Vec3(0.4, 0.4, 0.4),
      rotation: new pc.Vec3(0, 0, 0),
      activeFrames: [8, 9, 10, 11],
      damage: 15,
      hitstun: 12,
      blockstun: 6,
      properties: ['medium', 'strike']
    });
    
    hitboxes.push({
      name: 'heavy_punch',
      type: 'strike',
      position: new pc.Vec3(0.7, 0.8, 0),
      size: new pc.Vec3(0.5, 0.5, 0.5),
      rotation: new pc.Vec3(0, 0, 0),
      activeFrames: [12, 13, 14, 15, 16],
      damage: 25,
      hitstun: 18,
      blockstun: 10,
      properties: ['heavy', 'strike', 'launcher']
    });
    
    return hitboxes;
  }

  private generateHurtboxes(): HurtboxData[] {
    return [
      {
        name: 'head',
        position: new pc.Vec3(0, 1.6, 0),
        size: new pc.Vec3(0.3, 0.3, 0.3),
        rotation: new pc.Vec3(0, 0, 0),
        activeFrames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        properties: ['head', 'vulnerable']
      },
      {
        name: 'body',
        position: new pc.Vec3(0, 1.2, 0),
        size: new pc.Vec3(0.4, 0.6, 0.3),
        rotation: new pc.Vec3(0, 0, 0),
        activeFrames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        properties: ['body', 'vulnerable']
      },
      {
        name: 'legs',
        position: new pc.Vec3(0, 0.6, 0),
        size: new pc.Vec3(0.3, 0.6, 0.3),
        rotation: new pc.Vec3(0, 0, 0),
        activeFrames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        properties: ['legs', 'vulnerable']
      }
    ];
  }

  // Helper methods
  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateBodyProportions(theme: string, fightingStyle: string): any {
    // Simplified body proportions
    return {
      chest: this.randomFloat(0.8, 1.2),
      waist: this.randomFloat(0.7, 1.1),
      hips: this.randomFloat(0.8, 1.2),
      shoulders: this.randomFloat(0.9, 1.3)
    };
  }

  private generateSkinTone(theme: string): string {
    const skinTones = {
      'arcane_mage': ['#F4C2A1', '#E6B89C', '#D4A574'],
      'divine_paladin': ['#F4C2A1', '#E6B89C', '#D4A574'],
      'elemental_sorcerer': ['#F4C2A1', '#E6B89C', '#D4A574'],
      'shadow_assassin': ['#8B4513', '#A0522D', '#CD853F'],
      'nature_druid': ['#F4C2A1', '#E6B89C', '#D4A574'],
      'crystal_guardian': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'void_walker': ['#2F2F2F', '#404040', '#696969'],
      'celestial_angel': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'infernal_demon': ['#8B0000', '#A0522D', '#CD853F'],
      'primal_berserker': ['#8B4513', '#A0522D', '#CD853F'],
      'storm_warrior': ['#F4C2A1', '#E6B89C', '#D4A574'],
      'ice_mage': ['#F0F8FF', '#E6E6FA', '#DDA0DD']
    };
    
    const tones = skinTones[theme] || ['#F4C2A1', '#E6B89C', '#D4A574'];
    return this.randomChoice(tones);
  }

  private generateScars(theme: string, fightingStyle: string): any[] {
    // Simplified scar generation
    return [];
  }

  private generateTattoos(theme: string): any[] {
    // Simplified tattoo generation
    return [];
  }

  private generateFacialFeatures(theme: string): any {
    return {
      jawline: this.randomChoice(['strong', 'soft', 'angular', 'round']),
      cheekbones: this.randomChoice(['high', 'medium', 'low']),
      chin: this.randomChoice(['pointed', 'rounded', 'square', 'cleft'])
    };
  }

  private generateHairData(theme: string): any {
    return {
      style: this.generateHairStyle(theme),
      color: this.generateHairColor(theme),
      length: this.randomChoice(['short', 'medium', 'long'])
    };
  }

  private generateHairStyle(theme: string): string {
    const styles = {
      'arcane_mage': ['long_flowing', 'braided', 'ponytail'],
      'divine_paladin': ['short_cropped', 'military', 'buzz'],
      'elemental_sorcerer': ['wild', 'untamed', 'flowing'],
      'shadow_assassin': ['short_spiky', 'mohawk', 'shaved'],
      'nature_druid': ['long_natural', 'braided', 'wild'],
      'crystal_guardian': ['elegant', 'styled', 'regal'],
      'void_walker': ['mysterious', 'shadowed', 'dark'],
      'celestial_angel': ['divine', 'radiant', 'glowing'],
      'infernal_demon': ['spiky', 'wild', 'flaming'],
      'primal_berserker': ['wild', 'untamed', 'savage'],
      'storm_warrior': ['wind_swept', 'dynamic', 'powerful'],
      'ice_mage': ['crystalline', 'frosted', 'frozen']
    };
    
    const themeStyles = styles[theme] || ['short', 'medium', 'long'];
    return this.randomChoice(themeStyles);
  }

  private generateHairColor(theme: string): string {
    const colors = {
      'arcane_mage': ['#8B5CF6', '#A855F7', '#C084FC'],
      'divine_paladin': ['#FFD700', '#FFA500', '#FF8C00'],
      'elemental_sorcerer': ['#10B981', '#059669', '#047857'],
      'shadow_assassin': ['#1F2937', '#374151', '#4B5563'],
      'nature_druid': ['#16A34A', '#15803D', '#166534'],
      'crystal_guardian': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'void_walker': ['#1F2937', '#374151', '#4B5563'],
      'celestial_angel': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'infernal_demon': ['#DC2626', '#EF4444', '#F87171'],
      'primal_berserker': ['#92400E', '#A16207', '#B45309'],
      'storm_warrior': ['#1E40AF', '#3B82F6', '#60A5FA'],
      'ice_mage': ['#0EA5E9', '#38BDF8', '#7DD3FC']
    };
    
    const themeColors = colors[theme] || ['#8B4513', '#A0522D', '#CD853F'];
    return this.randomChoice(themeColors);
  }

  private generateHairHighlights(theme: string): string[] {
    // Simplified highlight generation
    return [];
  }

  private generateFacialHair(theme: string): any {
    return {
      style: this.randomChoice(['none', 'beard', 'mustache', 'goatee']),
      color: this.generateHairColor(theme)
    };
  }

  private generateEyeData(theme: string): any {
    return {
      color: this.generateEyeColor(theme),
      shape: this.randomChoice(['almond', 'round', 'narrow', 'wide']),
      size: this.randomFloat(0.8, 1.2)
    };
  }

  private generateEyeColor(theme: string): string {
    const colors = {
      'arcane_mage': ['#8B5CF6', '#A855F7', '#C084FC'],
      'divine_paladin': ['#FFD700', '#FFA500', '#FF8C00'],
      'elemental_sorcerer': ['#10B981', '#059669', '#047857'],
      'shadow_assassin': ['#1F2937', '#374151', '#4B5563'],
      'nature_druid': ['#16A34A', '#15803D', '#166534'],
      'crystal_guardian': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'void_walker': ['#1F2937', '#374151', '#4B5563'],
      'celestial_angel': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'infernal_demon': ['#DC2626', '#EF4444', '#F87171'],
      'primal_berserker': ['#92400E', '#A16207', '#B45309'],
      'storm_warrior': ['#1E40AF', '#3B82F6', '#60A5FA'],
      'ice_mage': ['#0EA5E9', '#38BDF8', '#7DD3FC']
    };
    
    const themeColors = colors[theme] || ['#8B4513', '#A0522D', '#CD853F'];
    return this.randomChoice(themeColors);
  }

  private generateMouthData(theme: string): any {
    return {
      size: this.randomFloat(0.8, 1.2),
      shape: this.randomChoice(['full', 'thin', 'wide', 'narrow']),
      expression: this.randomChoice(['neutral', 'stern', 'fierce', 'mysterious'])
    };
  }

  private generateNoseData(theme: string): any {
    return {
      size: this.randomFloat(0.8, 1.2),
      shape: this.randomChoice(['straight', 'aquiline', 'button', 'broad']),
      width: this.randomFloat(0.8, 1.2)
    };
  }

  private generateClothingItem(type: string, theme: string, fightingStyle: string): any {
    return {
      style: this.generateClothingStyle(type, theme, fightingStyle),
      color: this.generateClothingColor(theme),
      material: this.generateClothingMaterial(theme, fightingStyle),
      fit: this.randomChoice(['loose', 'fitted', 'tight']),
      details: this.generateClothingDetails(theme)
    };
  }

  private generateClothingStyle(type: string, theme: string, fightingStyle: string): string {
    // Simplified clothing style generation
    return `${type}_${theme}_${fightingStyle}`;
  }

  private generateClothingColor(theme: string): string {
    const colors = {
      'arcane_mage': ['#8B5CF6', '#A855F7', '#C084FC'],
      'divine_paladin': ['#FFD700', '#FFA500', '#FF8C00'],
      'elemental_sorcerer': ['#10B981', '#059669', '#047857'],
      'shadow_assassin': ['#1F2937', '#374151', '#4B5563'],
      'nature_druid': ['#16A34A', '#15803D', '#166534'],
      'crystal_guardian': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'void_walker': ['#1F2937', '#374151', '#4B5563'],
      'celestial_angel': ['#F0F8FF', '#E6E6FA', '#DDA0DD'],
      'infernal_demon': ['#DC2626', '#EF4444', '#F87171'],
      'primal_berserker': ['#92400E', '#A16207', '#B45309'],
      'storm_warrior': ['#1E40AF', '#3B82F6', '#60A5FA'],
      'ice_mage': ['#0EA5E9', '#38BDF8', '#7DD3FC']
    };
    
    const themeColors = colors[theme] || ['#8B4513', '#A0522D', '#CD853F'];
    return this.randomChoice(themeColors);
  }

  private generateClothingMaterial(theme: string, fightingStyle: string): string {
    const materials = {
      'arcane_mage': ['silk', 'velvet', 'satin'],
      'divine_paladin': ['leather', 'chainmail', 'plate'],
      'elemental_sorcerer': ['cotton', 'linen', 'wool'],
      'shadow_assassin': ['leather', 'silk', 'shadow'],
      'nature_druid': ['leather', 'fur', 'bark'],
      'crystal_guardian': ['crystal', 'gem', 'prism'],
      'void_walker': ['shadow', 'void', 'dark'],
      'celestial_angel': ['silk', 'light', 'divine'],
      'infernal_demon': ['leather', 'chain', 'fire'],
      'primal_berserker': ['fur', 'leather', 'bone'],
      'storm_warrior': ['leather', 'chain', 'storm'],
      'ice_mage': ['ice', 'frost', 'crystal']
    };
    
    const themeMaterials = materials[theme] || ['cotton', 'leather', 'wool'];
    return this.randomChoice(themeMaterials);
  }

  private generateClothingDetails(theme: string): any[] {
    // Simplified clothing details
    return [];
  }

  private generateArmor(theme: string, fightingStyle: string): any[] {
    const armor: any[] = [];
    
    if (fightingStyle === 'sword_mastery' || theme === 'divine_paladin') {
      armor.push({
        type: 'chestplate',
        material: 'steel',
        color: '#C0C0C0',
        protection: 0.8
      });
    }
    
    return armor;
  }

  private generateMaterialData(type: string, theme: string): MaterialData {
    return {
      diffuse: this.generateClothingColor(theme),
      normal: '',
      specular: '',
      emissive: '',
      metallic: type === 'armor' ? 0.8 : 0.1,
      roughness: type === 'armor' ? 0.3 : 0.7,
      opacity: 1.0,
      tiling: new pc.Vec2(1, 1),
      offset: new pc.Vec2(0, 0)
    };
  }

  private generateAnimationData(name: string, duration: number): AnimationData {
    return {
      name,
      duration,
      frames: this.generateAnimationFrames(duration),
      loop: true,
      blendMode: 'replace'
    };
  }

  private generateAnimationFrames(duration: number): AnimationFrame[] {
    const frames: AnimationFrame[] = [];
    
    for (let i = 0; i < duration; i++) {
      frames.push({
        frame: i,
        position: new pc.Vec3(0, 0, 0),
        rotation: new pc.Vec3(0, 0, 0),
        scale: new pc.Vec3(1, 1, 1),
        boneTransforms: []
      });
    }
    
    return frames;
  }

  private generateAttackAnimations(fightingStyle: string): AnimationData[] {
    const attacks: AnimationData[] = [];
    
    attacks.push(this.generateAnimationData('light_attack', 20));
    attacks.push(this.generateAnimationData('medium_attack', 30));
    attacks.push(this.generateAnimationData('heavy_attack', 40));
    
    return attacks;
  }

  private generateSpecialAnimations(fightingStyle: string): AnimationData[] {
    const specials: AnimationData[] = [];
    
    specials.push(this.generateAnimationData('special_1', 60));
    specials.push(this.generateAnimationData('special_2', 80));
    specials.push(this.generateAnimationData('special_3', 100));
    
    return specials;
  }

  private generateSuperAnimations(fightingStyle: string): AnimationData[] {
    const supers: AnimationData[] = [];
    
    supers.push(this.generateAnimationData('super_1', 120));
    supers.push(this.generateAnimationData('super_2', 150));
    
    return supers;
  }

  private generateHitAnimations(): AnimationData[] {
    const hits: AnimationData[] = [];
    
    hits.push(this.generateAnimationData('hit_light', 15));
    hits.push(this.generateAnimationData('hit_medium', 20));
    hits.push(this.generateAnimationData('hit_heavy', 30));
    
    return hits;
  }

  private generateBlockAnimations(): AnimationData[] {
    const blocks: AnimationData[] = [];
    
    blocks.push(this.generateAnimationData('block_high', 10));
    blocks.push(this.generateAnimationData('block_low', 10));
    blocks.push(this.generateAnimationData('block_mid', 10));
    
    return blocks;
  }

  public createCharacterModel(characterData: Character3DData): pc.Entity {
    const character = new pc.Entity(`Character_${characterData.id}`);
    
    // Create body
    const body = this.createBodyModel(characterData.model.body);
    character.addChild(body);
    
    // Create head
    const head = this.createHeadModel(characterData.model.head);
    character.addChild(head);
    
    // Create hair
    const hair = this.createHairModel(characterData.model.hair);
    character.addChild(hair);
    
    // Create clothing
    const clothing = this.createClothingModel(characterData.model.clothing);
    character.addChild(clothing);
    
    // Create accessories
    characterData.model.accessories.forEach(accessory => {
      const accessoryEntity = this.createAccessoryModel(accessory);
      character.addChild(accessoryEntity);
    });
    
    // Create weapons
    characterData.model.weapons.forEach(weapon => {
      const weaponEntity = this.createWeaponModel(weapon);
      character.addChild(weaponEntity);
    });
    
    // Apply materials
    this.applyCharacterMaterials(character, characterData.materials);
    
    // Cache the model
    this.modelCache.set(characterData.id, character);
    
    return character;
  }

  private createBodyModel(body: BodyGeometry): pc.Entity {
    const bodyEntity = new pc.Entity('Body');
    
    // Create body mesh
    const bodyMesh = pc.createBox(this.app.graphicsDevice, {
      width: 0.8,
      height: body.height,
      depth: 0.4
    });
    
    const bodyMaterial = this.materialCache.get('skin');
    const bodyMeshInstance = new pc.MeshInstance(bodyMesh, bodyMaterial);
    bodyEntity.addComponent('model', {
      meshInstances: [bodyMeshInstance]
    });
    
    return bodyEntity;
  }

  private createHeadModel(head: HeadGeometry): pc.Entity {
    const headEntity = new pc.Entity('Head');
    
    // Create head mesh
    const headMesh = pc.createBox(this.app.graphicsDevice, {
      width: 0.3,
      height: 0.3,
      depth: 0.3
    });
    
    const headMaterial = this.materialCache.get('skin');
    const headMeshInstance = new pc.MeshInstance(headMesh, headMaterial);
    headEntity.addComponent('model', {
      meshInstances: [headMeshInstance]
    });
    
    // Position head
    headEntity.setPosition(0, 1.6, 0);
    
    return headEntity;
  }

  private createHairModel(hair: HairGeometry): pc.Entity {
    const hairEntity = new pc.Entity('Hair');
    
    // Create hair mesh
    const hairMesh = pc.createBox(this.app.graphicsDevice, {
      width: 0.4,
      height: 0.2,
      depth: 0.4
    });
    
    const hairMaterial = this.materialCache.get('hair');
    const hairMeshInstance = new pc.MeshInstance(hairMesh, hairMaterial);
    hairEntity.addComponent('model', {
      meshInstances: [hairMeshInstance]
    });
    
    // Position hair
    hairEntity.setPosition(0, 1.7, 0);
    
    return hairEntity;
  }

  private createClothingModel(clothing: ClothingGeometry): pc.Entity {
    const clothingEntity = new pc.Entity('Clothing');
    
    // Create clothing mesh
    const clothingMesh = pc.createBox(this.app.graphicsDevice, {
      width: 0.9,
      height: 1.0,
      depth: 0.5
    });
    
    const clothingMaterial = this.materialCache.get('clothing');
    const clothingMeshInstance = new pc.MeshInstance(clothingMesh, clothingMaterial);
    clothingEntity.addComponent('model', {
      meshInstances: [clothingMeshInstance]
    });
    
    // Position clothing
    clothingEntity.setPosition(0, 1.0, 0);
    
    return clothingEntity;
  }

  private createAccessoryModel(accessory: AccessoryGeometry): pc.Entity {
    const accessoryEntity = new pc.Entity(`Accessory_${accessory.type}`);
    
    // Create accessory mesh
    const accessoryMesh = pc.createBox(this.app.graphicsDevice, {
      width: accessory.scale.x,
      height: accessory.scale.y,
      depth: accessory.scale.z
    });
    
    const accessoryMaterial = this.materialCache.get('accessory');
    const accessoryMeshInstance = new pc.MeshInstance(accessoryMesh, accessoryMaterial);
    accessoryEntity.addComponent('model', {
      meshInstances: [accessoryMeshInstance]
    });
    
    // Position accessory
    accessoryEntity.setPosition(accessory.position);
    accessoryEntity.setEulerAngles(accessory.rotation);
    
    return accessoryEntity;
  }

  private createWeaponModel(weapon: WeaponGeometry): pc.Entity {
    const weaponEntity = new pc.Entity(`Weapon_${weapon.type}`);
    
    // Create weapon mesh
    const weaponMesh = pc.createBox(this.app.graphicsDevice, {
      width: weapon.size.x,
      height: weapon.size.y,
      depth: weapon.size.z
    });
    
    const weaponMaterial = this.materialCache.get('weapon');
    const weaponMeshInstance = new pc.MeshInstance(weaponMesh, weaponMaterial);
    weaponEntity.addComponent('model', {
      meshInstances: [weaponMeshInstance]
    });
    
    // Position weapon
    weaponEntity.setPosition(weapon.position);
    
    return weaponEntity;
  }

  private applyCharacterMaterials(character: pc.Entity, materials: CharacterMaterials): void {
    // Apply materials to character parts
    // This would be implemented based on the specific character structure
  }

  public getCharacterData(characterId: string): Character3DData | undefined {
    return this.characterData.get(characterId);
  }

  public getAllCharacterData(): Character3DData[] {
    return Array.from(this.characterData.values());
  }

  public destroy(): void {
    this.characterData.clear();
    this.modelCache.clear();
    this.materialCache.clear();
  }
}