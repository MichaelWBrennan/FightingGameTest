import type { pc } from 'playcanvas';
import { Logger } from '../../utils/Logger';
import type { ContentGenerationConfig, GeneratedContent } from '../ContentGenerationManager';

export interface ComboGenerationOptions {
  character?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  style?: 'damage' | 'meter_build' | 'reset' | 'pressure' | 'mix_up' | 'all_around';
  length?: 'short' | 'medium' | 'long' | 'extended';
  meter?: 'no_meter' | 'light_meter' | 'heavy_meter' | 'super_meter';
  situation?: 'neutral' | 'corner' | 'anti_air' | 'punish' | 'reset' | 'any';
  creativity?: 'basic' | 'standard' | 'creative' | 'experimental';
}

export interface ComboData {
  id: string;
  name: string;
  description: string;
  character: string;
  difficulty: string;
  style: string;
  length: string;
  meter: string;
  situation: string;
  creativity: string;
  inputs: Array<{
    input: string;
    timing: number;
    description: string;
    damage: number;
    meterGain: number;
    properties: any;
  }>;
  properties: {
    totalDamage: number;
    totalMeter: number;
    difficulty: number;
    execution: number;
    creativity: number;
    consistency: number;
    style: number;
  };
  requirements: {
    character: string;
    level: number;
    skills: string[];
    unlocks: string[];
  };
  variations: Array<{
    id: string;
    name: string;
    description: string;
    inputs: Array<any>;
    properties: any;
  }>;
  tips: Array<{
    category: string;
    tip: string;
    importance: number;
  }>;
  metadata: {
    created: number;
    modified: number;
    version: string;
    tags: string[];
    category: string;
    subcategory: string;
  };
}

export class ComboContentGenerator {
  private app: pc.Application;
  private inputGenerator: InputGenerator;
  private damageCalculator: DamageCalculator;
  private timingCalculator: TimingCalculator;
  private variationGenerator: VariationGenerator;

  constructor(app: pc.Application) {
    this.app = app;
    this.inputGenerator = new InputGenerator();
    this.damageCalculator = new DamageCalculator();
    this.timingCalculator = new TimingCalculator();
    this.variationGenerator = new VariationGenerator();
  }

  public async generate(
    options: ComboGenerationOptions = {},
    config: ContentGenerationConfig
  ): Promise<GeneratedContent | null> {
    try {
      const comboData = await this.createCombo(options, config);
      const content: GeneratedContent = {
        id: `combo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'combo',
        name: comboData.name,
        description: comboData.description,
        data: comboData,
        metadata: {
          generatedAt: Date.now(),
          generator: 'ComboContentGenerator',
          config,
          quality: this.calculateQuality(comboData),
          tags: this.generateTags(comboData)
        },
        assets: {
          sounds: this.extractAudioAssets(comboData)
        }
      };

      return content;
    } catch (error) {
      Logger.error('Error generating combo:', error);
      return null;
    }
  }

  private async createCombo(
    options: ComboGenerationOptions,
    config: ContentGenerationConfig
  ): Promise<ComboData> {
    const character = options.character || this.selectRandomCharacter();
    const difficulty = options.difficulty || this.selectRandomDifficulty();
    const style = options.style || this.selectRandomStyle();
    const length = options.length || this.selectRandomLength();
    const meter = options.meter || this.selectRandomMeter();
    const situation = options.situation || this.selectRandomSituation();
    const creativity = options.creativity || this.selectRandomCreativity();

    const name = this.generateComboName(character, style, difficulty);
    const description = this.generateComboDescription(character, style, difficulty, length);

    const inputs = this.inputGenerator.generateInputs(character, style, difficulty, length, meter, situation);
    const properties = this.calculateProperties(inputs, style, difficulty, creativity);
    const requirements = this.generateRequirements(character, difficulty, style);
    const variations = this.variationGenerator.generateVariations(inputs, style, creativity);
    const tips = this.generateTips(character, style, difficulty, situation);
    const metadata = this.generateMetadata(character, style, difficulty);

    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      character,
      difficulty,
      style,
      length,
      meter,
      situation,
      creativity,
      inputs,
      properties,
      requirements,
      variations,
      tips,
      metadata
    };
  }

  private selectRandomCharacter(): string {
    const characters = ['blitz', 'chain', 'crusher', 'maestro', 'ranger', 'shifter', 'sky', 'titan', 'vanguard', 'volt', 'weaver', 'zephyr'];
    return characters[Math.floor(Math.random() * characters.length)];
  }

  private selectRandomDifficulty(): string {
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  private selectRandomStyle(): string {
    const styles = ['damage', 'meter_build', 'reset', 'pressure', 'mix_up', 'all_around'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private selectRandomLength(): string {
    const lengths = ['short', 'medium', 'long', 'extended'];
    return lengths[Math.floor(Math.random() * lengths.length)];
  }

  private selectRandomMeter(): string {
    const meters = ['no_meter', 'light_meter', 'heavy_meter', 'super_meter'];
    return meters[Math.floor(Math.random() * meters.length)];
  }

  private selectRandomSituation(): string {
    const situations = ['neutral', 'corner', 'anti_air', 'punish', 'reset', 'any'];
    return situations[Math.floor(Math.random() * situations.length)];
  }

  private selectRandomCreativity(): string {
    const creativities = ['basic', 'standard', 'creative', 'experimental'];
    return creativities[Math.floor(Math.random() * creativities.length)];
  }

  private generateComboName(character: string, style: string, difficulty: string): string {
    const characterNames: Record<string, string> = {
      blitz: 'Blitz',
      chain: 'Chain',
      crusher: 'Crusher',
      maestro: 'Maestro',
      ranger: 'Ranger',
      shifter: 'Shifter',
      sky: 'Sky',
      titan: 'Titan',
      vanguard: 'Vanguard',
      volt: 'Volt',
      weaver: 'Weaver',
      zephyr: 'Zephyr'
    };

    const styleNames: Record<string, string[]> = {
      damage: ['Devastator', 'Destroyer', 'Annihilator', 'Crusher'],
      meter_build: ['Meter Builder', 'Energy Accumulator', 'Power Charger', 'Meter Master'],
      reset: ['Reset Master', 'Mix-up King', 'Confusion Creator', 'Reset Artist'],
      pressure: ['Pressure Cooker', 'Relentless', 'Unstoppable', 'Pressure Master'],
      mix_up: ['Mix-up Master', 'Confusion Creator', 'Unpredictable', 'Mix-up Artist'],
      all_around: ['Versatile', 'Balanced', 'Complete', 'Universal']
    };

    const difficultyNames: Record<string, string[]> = {
      beginner: ['Basic', 'Simple', 'Easy', 'Starter'],
      intermediate: ['Intermediate', 'Advanced', 'Skilled', 'Pro'],
      advanced: ['Expert', 'Master', 'Elite', 'Professional'],
      expert: ['Legendary', 'Ultimate', 'Perfect', 'Flawless']
    };

    const characterName = characterNames[character] || character;
    const styleOptions = styleNames[style] || ['Combo'];
    const difficultyOptions = difficultyNames[difficulty] || ['Combo'];
    
    const styleName = styleOptions[Math.floor(Math.random() * styleOptions.length)];
    const difficultyName = difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)];

    return `${characterName} ${difficultyName} ${styleName}`;
  }

  private generateComboDescription(character: string, style: string, difficulty: string, length: string): string {
    const characterNames: Record<string, string> = {
      blitz: 'Blitz',
      chain: 'Chain',
      crusher: 'Crusher',
      maestro: 'Maestro',
      ranger: 'Ranger',
      shifter: 'Shifter',
      sky: 'Sky',
      titan: 'Titan',
      vanguard: 'Vanguard',
      volt: 'Volt',
      weaver: 'Weaver',
      zephyr: 'Zephyr'
    };

    const styleDescriptions: Record<string, string> = {
      damage: 'A high-damage combo that maximizes damage output',
      meter_build: 'A combo designed to build meter quickly and efficiently',
      reset: 'A combo that resets the opponent for continued pressure',
      pressure: 'A combo that maintains constant pressure on the opponent',
      mix_up: 'A combo that confuses the opponent with unpredictable patterns',
      all_around: 'A versatile combo that works in many situations'
    };

    const difficultyDescriptions: Record<string, string> = {
      beginner: 'Perfect for beginners learning the basics',
      intermediate: 'Suitable for intermediate players looking to improve',
      advanced: 'Challenging combo for advanced players',
      expert: 'Expert-level combo requiring perfect execution'
    };

    const lengthDescriptions: Record<string, string> = {
      short: 'A quick and efficient combo',
      medium: 'A moderate-length combo',
      long: 'An extended combo sequence',
      extended: 'A very long and complex combo'
    };

    const characterName = characterNames[character] || character;
    const styleDesc = styleDescriptions[style] || 'A combo';
    const difficultyDesc = difficultyDescriptions[difficulty] || 'A combo';
    const lengthDesc = lengthDescriptions[length] || 'A combo';

    return `${styleDesc} for ${characterName}. ${difficultyDesc}. ${lengthDesc}.`;
  }

  private calculateProperties(inputs: Array<any>, style: string, difficulty: string, creativity: string): any {
    const totalDamage = inputs.reduce((sum, input) => sum + input.damage, 0);
    const totalMeter = inputs.reduce((sum, input) => sum + input.meterGain, 0);
    
    const difficultyScores: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4
    };
    
    const creativityScores: Record<string, number> = {
      basic: 1,
      standard: 2,
      creative: 3,
      experimental: 4
    };
    
    const styleScores: Record<string, number> = {
      damage: 4,
      meter_build: 3,
      reset: 2,
      pressure: 3,
      mix_up: 2,
      all_around: 3
    };

    return {
      totalDamage,
      totalMeter,
      difficulty: difficultyScores[difficulty] || 2,
      execution: this.calculateExecutionDifficulty(inputs, difficulty),
      creativity: creativityScores[creativity] || 2,
      consistency: this.calculateConsistency(inputs, difficulty),
      style: styleScores[style] || 3
    };
  }

  private calculateExecutionDifficulty(inputs: Array<any>, difficulty: string): number {
    const baseDifficulty = inputs.length * 0.1;
    const difficultyMultipliers: Record<string, number> = {
      beginner: 0.5,
      intermediate: 1.0,
      advanced: 1.5,
      expert: 2.0
    };
    
    const multiplier = difficultyMultipliers[difficulty] || 1.0;
    return Math.min(5.0, baseDifficulty * multiplier);
  }

  private calculateConsistency(inputs: Array<any>, difficulty: string): number {
    const baseConsistency = 3.0;
    const difficultyModifiers: Record<string, number> = {
      beginner: 1.0,
      intermediate: 0.8,
      advanced: 0.6,
      expert: 0.4
    };
    
    const modifier = difficultyModifiers[difficulty] || 0.8;
    return Math.max(1.0, baseConsistency * modifier);
  }

  private generateRequirements(character: string, difficulty: string, style: string): any {
    const levelRequirements: Record<string, number> = {
      beginner: 1,
      intermediate: 3,
      advanced: 5,
      expert: 8
    };

    const skillRequirements: Record<string, string[]> = {
      damage: ['damage_optimization', 'combo_execution'],
      meter_build: ['meter_management', 'efficiency'],
      reset: ['mix_up_techniques', 'pressure_maintenance'],
      pressure: ['pressure_techniques', 'frame_advantage'],
      mix_up: ['mix_up_techniques', 'unpredictability'],
      all_around: ['versatility', 'adaptability']
    };

    return {
      character,
      level: levelRequirements[difficulty] || 1,
      skills: skillRequirements[style] || ['basic_combos'],
      unlocks: [`${character}_${style}_combo`, `${difficulty}_level`]
    };
  }

  private generateTips(character: string, style: string, difficulty: string, situation: string): Array<any> {
    const tips = [];

    // General tips
    tips.push({
      category: 'general',
      tip: 'Practice the combo slowly at first, then gradually increase speed',
      importance: 5
    });

    tips.push({
      category: 'general',
      tip: 'Focus on timing and rhythm rather than speed',
      importance: 4
    });

    // Style-specific tips
    if (style === 'damage') {
      tips.push({
        category: 'damage',
        tip: 'Maximize damage by using your strongest moves at the end',
        importance: 4
      });
    } else if (style === 'meter_build') {
      tips.push({
        category: 'meter',
        tip: 'Use moves that give the most meter gain per damage',
        importance: 4
      });
    } else if (style === 'reset') {
      tips.push({
        category: 'reset',
        tip: 'End the combo early to catch the opponent off guard',
        importance: 4
      });
    }

    // Difficulty-specific tips
    if (difficulty === 'expert') {
      tips.push({
        category: 'execution',
        tip: 'This combo requires frame-perfect execution',
        importance: 5
      });
    }

    // Situation-specific tips
    if (situation === 'corner') {
      tips.push({
        category: 'situation',
        tip: 'Use the corner to extend your combo with wall bounces',
        importance: 3
      });
    } else if (situation === 'anti_air') {
      tips.push({
        category: 'situation',
        tip: 'Start with an anti-air move to catch jumping opponents',
        importance: 3
      });
    }

    return tips;
  }

  private generateMetadata(character: string, style: string, difficulty: string): any {
    return {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      tags: [character, style, difficulty, 'combo'],
      category: 'Combo',
      subcategory: style
    };
  }

  private calculateQuality(comboData: ComboData): number {
    let quality = 0.5; // Base quality

    // Quality based on completeness
    if (comboData.inputs && comboData.inputs.length >= 3) quality += 0.1;
    if (comboData.variations && comboData.variations.length >= 2) quality += 0.1;
    if (comboData.tips && comboData.tips.length >= 3) quality += 0.1;
    if (comboData.description && comboData.description.length > 100) quality += 0.1;

    // Quality based on combo properties
    if (comboData.properties.totalDamage >= 200) quality += 0.1;
    if (comboData.properties.execution >= 3) quality += 0.1;
    if (comboData.properties.creativity >= 3) quality += 0.1;

    return Math.min(1.0, quality);
  }

  private generateTags(comboData: ComboData): string[] {
    return [
      comboData.character,
      comboData.style,
      comboData.difficulty,
      comboData.length,
      comboData.meter,
      comboData.situation,
      comboData.creativity
    ].filter(tag => tag && tag.length > 0);
  }

  private extractAudioAssets(comboData: ComboData): string[] {
    const assets: string[] = [];
    
    // Extract audio from inputs
    for (const input of comboData.inputs) {
      if (input.audio) {
        assets.push(input.audio);
      }
    }
    
    return [...new Set(assets)]; // Remove duplicates
  }
}

// Helper classes
class InputGenerator {
  generateInputs(character: string, style: string, difficulty: string, length: string, meter: string, situation: string): Array<any> {
    const inputs = [];
    const inputCount = this.getInputCount(length, difficulty);
    
    for (let i = 0; i < inputCount; i++) {
      inputs.push(this.generateInput(character, style, difficulty, i, inputCount));
    }
    
    return inputs;
  }

  private getInputCount(length: string, difficulty: string): number {
    const lengthCounts: Record<string, number> = {
      short: 3,
      medium: 5,
      long: 8,
      extended: 12
    };
    
    const difficultyMultipliers: Record<string, number> = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.2,
      expert: 1.5
    };
    
    const baseCount = lengthCounts[length] || 5;
    const multiplier = difficultyMultipliers[difficulty] || 1.0;
    
    return Math.round(baseCount * multiplier);
  }

  private generateInput(character: string, style: string, difficulty: string, index: number, total: number): any {
    const input = this.selectRandomInput(character, style, difficulty);
    const timing = this.calculateTiming(index, total, difficulty);
    const damage = this.calculateDamage(input, style, difficulty);
    const meterGain = this.calculateMeterGain(input, style, difficulty);
    
    return {
      input,
      timing,
      description: this.generateInputDescription(input, character, style),
      damage,
      meterGain,
      properties: this.generateInputProperties(input, style, difficulty)
    };
  }

  private selectRandomInput(character: string, style: string, difficulty: string): string {
    const inputs: Record<string, string[]> = {
      blitz: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      chain: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      crusher: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      maestro: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      ranger: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      shifter: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      sky: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      titan: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      vanguard: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      volt: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      weaver: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k'],
      zephyr: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'qcf_p', 'dp_p', 'qcb_k']
    };
    
    const characterInputs = inputs[character] || ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'];
    return characterInputs[Math.floor(Math.random() * characterInputs.length)];
  }

  private calculateTiming(index: number, total: number, difficulty: string): number {
    const baseTiming = 100; // 100ms base timing
    const difficultyMultipliers: Record<string, number> = {
      beginner: 1.5,
      intermediate: 1.0,
      advanced: 0.8,
      expert: 0.6
    };
    
    const multiplier = difficultyMultipliers[difficulty] || 1.0;
    return Math.round(baseTiming * multiplier);
  }

  private calculateDamage(input: string, style: string, difficulty: string): number {
    const baseDamage: Record<string, number> = {
      lp: 50,
      mp: 80,
      hp: 120,
      lk: 60,
      mk: 90,
      hk: 140,
      qcf_p: 100,
      dp_p: 150,
      qcb_k: 110
    };
    
    const styleMultipliers: Record<string, number> = {
      damage: 1.2,
      meter_build: 0.8,
      reset: 0.9,
      pressure: 1.0,
      mix_up: 0.9,
      all_around: 1.0
    };
    
    const base = baseDamage[input] || 80;
    const styleMultiplier = styleMultipliers[style] || 1.0;
    
    return Math.round(base * styleMultiplier);
  }

  private calculateMeterGain(input: string, style: string, difficulty: string): number {
    const baseMeter: Record<string, number> = {
      lp: 10,
      mp: 15,
      hp: 20,
      lk: 12,
      mk: 18,
      hk: 25,
      qcf_p: 30,
      dp_p: 40,
      qcb_k: 35
    };
    
    const styleMultipliers: Record<string, number> = {
      damage: 0.8,
      meter_build: 1.5,
      reset: 1.0,
      pressure: 1.1,
      mix_up: 1.0,
      all_around: 1.0
    };
    
    const base = baseMeter[input] || 15;
    const styleMultiplier = styleMultipliers[style] || 1.0;
    
    return Math.round(base * styleMultiplier);
  }

  private generateInputDescription(input: string, character: string, style: string): string {
    const descriptions: Record<string, string> = {
      lp: 'Light Punch',
      mp: 'Medium Punch',
      hp: 'Heavy Punch',
      lk: 'Light Kick',
      mk: 'Medium Kick',
      hk: 'Heavy Kick',
      qcf_p: 'Quarter Circle Forward + Punch',
      dp_p: 'Dragon Punch + Punch',
      qcb_k: 'Quarter Circle Back + Kick'
    };
    
    return descriptions[input] || 'Special Move';
  }

  private generateInputProperties(input: string, style: string, difficulty: string): any {
    return {
      cancelable: true,
      special: input.includes('qcf') || input.includes('dp') || input.includes('qcb'),
      meter: input.includes('qcf') || input.includes('dp') || input.includes('qcb'),
      priority: this.getInputPriority(input),
      range: this.getInputRange(input),
      startup: this.getInputStartup(input),
      recovery: this.getInputRecovery(input)
    };
  }

  private getInputPriority(input: string): number {
    const priorities: Record<string, number> = {
      lp: 1,
      mp: 2,
      hp: 3,
      lk: 1,
      mk: 2,
      hk: 3,
      qcf_p: 4,
      dp_p: 5,
      qcb_k: 4
    };
    return priorities[input] || 1;
  }

  private getInputRange(input: string): number {
    const ranges: Record<string, number> = {
      lp: 1,
      mp: 2,
      hp: 3,
      lk: 1,
      mk: 2,
      hk: 3,
      qcf_p: 4,
      dp_p: 3,
      qcb_k: 2
    };
    return ranges[input] || 2;
  }

  private getInputStartup(input: string): number {
    const startups: Record<string, number> = {
      lp: 3,
      mp: 5,
      hp: 8,
      lk: 4,
      mk: 6,
      hk: 9,
      qcf_p: 6,
      dp_p: 4,
      qcb_k: 7
    };
    return startups[input] || 5;
  }

  private getInputRecovery(input: string): number {
    const recoveries: Record<string, number> = {
      lp: 5,
      mp: 7,
      hp: 12,
      lk: 6,
      mk: 8,
      hk: 13,
      qcf_p: 15,
      dp_p: 25,
      qcb_k: 18
    };
    return recoveries[input] || 8;
  }
}

class DamageCalculator {
  // Implementation for damage calculation
}

class TimingCalculator {
  // Implementation for timing calculation
}

class VariationGenerator {
  generateVariations(inputs: Array<any>, style: string, creativity: string): Array<any> {
    const variations = [];
    const variationCount = this.getVariationCount(creativity);
    
    for (let i = 0; i < variationCount; i++) {
      variations.push({
        id: `variation_${i + 1}`,
        name: this.generateVariationName(style, i + 1),
        description: this.generateVariationDescription(style, i + 1),
        inputs: this.generateVariationInputs(inputs, style, i + 1),
        properties: this.generateVariationProperties(style, i + 1)
      });
    }
    
    return variations;
  }

  private getVariationCount(creativity: string): number {
    const counts: Record<string, number> = {
      basic: 1,
      standard: 2,
      creative: 3,
      experimental: 4
    };
    return counts[creativity] || 2;
  }

  private generateVariationName(style: string, index: number): string {
    const names: Record<string, string[]> = {
      damage: ['Damage Variant', 'Power Variant', 'Destruction Variant'],
      meter_build: ['Meter Variant', 'Energy Variant', 'Power Variant'],
      reset: ['Reset Variant', 'Mix-up Variant', 'Confusion Variant'],
      pressure: ['Pressure Variant', 'Relentless Variant', 'Unstoppable Variant'],
      mix_up: ['Mix-up Variant', 'Confusion Variant', 'Unpredictable Variant'],
      all_around: ['Balanced Variant', 'Versatile Variant', 'Complete Variant']
    };
    
    const styleNames = names[style] || ['Variant'];
    return styleNames[Math.min(index - 1, styleNames.length - 1)];
  }

  private generateVariationDescription(style: string, index: number): string {
    return `A ${style} variation with unique characteristics and timing.`;
  }

  private generateVariationInputs(inputs: Array<any>, style: string, index: number): Array<any> {
    // Create a variation by modifying the original inputs
    return inputs.map((input, i) => ({
      ...input,
      timing: input.timing + (index * 10),
      damage: Math.round(input.damage * (0.9 + (index * 0.1))),
      meterGain: Math.round(input.meterGain * (0.9 + (index * 0.1)))
    }));
  }

  private generateVariationProperties(style: string, index: number): any {
    return {
      difficulty: 2 + index,
      creativity: 1 + index,
      consistency: 3 - (index * 0.5),
      style: 2 + index
    };
  }
}