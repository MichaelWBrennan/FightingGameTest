import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import type { GeneratedContent } from './ContentGenerationManager';

export interface ValidationResult {
  valid: boolean;
  quality: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  validator: (content: GeneratedContent) => ValidationCheck;
}

export interface ValidationCheck {
  passed: boolean;
  score: number;
  message?: string;
  suggestion?: string;
}

export class ContentValidator {
  private app: pc.Application;
  private rules: Map<string, ValidationRule> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeRules();
  }

  private initializeRules(): void {
    // Character validation rules
    this.addRule({
      id: 'character_completeness',
      name: 'Character Completeness',
      description: 'Ensures character has all required components',
      weight: 0.2,
      validator: this.validateCharacterCompleteness.bind(this)
    });

    this.addRule({
      id: 'character_balance',
      name: 'Character Balance',
      description: 'Checks if character stats are balanced',
      weight: 0.15,
      validator: this.validateCharacterBalance.bind(this)
    });

    this.addRule({
      id: 'character_consistency',
      name: 'Character Consistency',
      description: 'Ensures character elements are consistent',
      weight: 0.1,
      validator: this.validateCharacterConsistency.bind(this)
    });

    // Stage validation rules
    this.addRule({
      id: 'stage_completeness',
      name: 'Stage Completeness',
      description: 'Ensures stage has all required layers and elements',
      weight: 0.2,
      validator: this.validateStageCompleteness.bind(this)
    });

    this.addRule({
      id: 'stage_performance',
      name: 'Stage Performance',
      description: 'Checks if stage is optimized for performance',
      weight: 0.15,
      validator: this.validateStagePerformance.bind(this)
    });

    this.addRule({
      id: 'stage_theme_consistency',
      name: 'Stage Theme Consistency',
      description: 'Ensures stage elements match the theme',
      weight: 0.1,
      validator: this.validateStageThemeConsistency.bind(this)
    });

    // Story validation rules
    this.addRule({
      id: 'story_structure',
      name: 'Story Structure',
      description: 'Validates story has proper structure and flow',
      weight: 0.2,
      validator: this.validateStoryStructure.bind(this)
    });

    this.addRule({
      id: 'story_character_development',
      name: 'Story Character Development',
      description: 'Checks if characters are well-developed',
      weight: 0.15,
      validator: this.validateStoryCharacterDevelopment.bind(this)
    });

    this.addRule({
      id: 'story_pacing',
      name: 'Story Pacing',
      description: 'Ensures story has good pacing and flow',
      weight: 0.1,
      validator: this.validateStoryPacing.bind(this)
    });

    // Training validation rules
    this.addRule({
      id: 'training_effectiveness',
      name: 'Training Effectiveness',
      description: 'Checks if training is effective and well-designed',
      weight: 0.2,
      validator: this.validateTrainingEffectiveness.bind(this)
    });

    this.addRule({
      id: 'training_progression',
      name: 'Training Progression',
      description: 'Validates training has good progression',
      weight: 0.15,
      validator: this.validateTrainingProgression.bind(this)
    });

    this.addRule({
      id: 'training_feedback',
      name: 'Training Feedback',
      description: 'Checks if training provides good feedback',
      weight: 0.1,
      validator: this.validateTrainingFeedback.bind(this)
    });

    // Asset validation rules
    this.addRule({
      id: 'asset_quality',
      name: 'Asset Quality',
      description: 'Validates asset quality and specifications',
      weight: 0.2,
      validator: this.validateAssetQuality.bind(this)
    });

    this.addRule({
      id: 'asset_optimization',
      name: 'Asset Optimization',
      description: 'Checks if asset is optimized for performance',
      weight: 0.15,
      validator: this.validateAssetOptimization.bind(this)
    });

    this.addRule({
      id: 'asset_consistency',
      name: 'Asset Consistency',
      description: 'Ensures asset is consistent with style and theme',
      weight: 0.1,
      validator: this.validateAssetConsistency.bind(this)
    });

    // Combo validation rules
    this.addRule({
      id: 'combo_executability',
      name: 'Combo Executability',
      description: 'Checks if combo is actually executable',
      weight: 0.2,
      validator: this.validateComboExecutability.bind(this)
    });

    this.addRule({
      id: 'combo_balance',
      name: 'Combo Balance',
      description: 'Validates combo damage and meter balance',
      weight: 0.15,
      validator: this.validateComboBalance.bind(this)
    });

    this.addRule({
      id: 'combo_creativity',
      name: 'Combo Creativity',
      description: 'Checks if combo is creative and interesting',
      weight: 0.1,
      validator: this.validateComboCreativity.bind(this)
    });

    Logger.info('Content validation rules initialized');
  }

  private addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  public async validate(content: GeneratedContent, type: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      quality: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 0
    };

    try {
      // Run type-specific validation
      const typeRules = this.getRulesForType(type);
      let totalWeight = 0;
      let weightedScore = 0;

      for (const rule of typeRules) {
        const check = rule.validator(content);
        const ruleScore = check.passed ? check.score : 0;
        
        weightedScore += ruleScore * rule.weight;
        totalWeight += rule.weight;

        if (!check.passed) {
          result.valid = false;
          result.errors.push(check.message || `${rule.name} validation failed`);
        }

        if (check.suggestion) {
          result.suggestions.push(check.suggestion);
        }
      }

      // Calculate overall quality and score
      result.quality = totalWeight > 0 ? weightedScore / totalWeight : 0;
      result.score = Math.round(result.quality * 100);

      // Add warnings for low quality
      if (result.quality < 0.6) {
        result.warnings.push('Content quality is below recommended threshold');
      }

      if (result.quality < 0.4) {
        result.warnings.push('Content quality is very low and may need significant improvement');
      }

      // Add suggestions for improvement
      if (result.quality < 0.8) {
        result.suggestions.push('Consider improving content completeness and consistency');
      }

      Logger.info(`Content validation completed: ${result.valid ? 'PASSED' : 'FAILED'} (Score: ${result.score})`);

    } catch (error) {
      Logger.error('Error during content validation:', error);
      result.valid = false;
      result.errors.push('Validation process failed');
    }

    return result;
  }

  private getRulesForType(type: string): ValidationRule[] {
    const typeRuleMap: Record<string, string[]> = {
      character: ['character_completeness', 'character_balance', 'character_consistency'],
      stage: ['stage_completeness', 'stage_performance', 'stage_theme_consistency'],
      story: ['story_structure', 'story_character_development', 'story_pacing'],
      training: ['training_effectiveness', 'training_progression', 'training_feedback'],
      asset: ['asset_quality', 'asset_optimization', 'asset_consistency'],
      combo: ['combo_executability', 'combo_balance', 'combo_creativity']
    };

    const ruleIds = typeRuleMap[type] || [];
    return ruleIds.map(id => this.rules.get(id)).filter(rule => rule !== undefined) as ValidationRule[];
  }

  // Character validation methods
  private validateCharacterCompleteness(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check required fields
    if (data.name && data.name.length > 0) score += 1;
    if (data.description && data.description.length > 50) score += 1;
    if (data.backstory && data.backstory.length > 100) score += 1;
    if (data.normals && Object.keys(data.normals).length >= 6) score += 2;
    if (data.specials && Object.keys(data.specials).length >= 3) score += 2;
    if (data.supers && Object.keys(data.supers).length >= 2) score += 1;
    if (data.animations && Object.keys(data.animations).length >= 5) score += 1;
    if (data.variations && data.variations.length >= 2) score += 1;

    const passed = score >= 7;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Character is missing required components',
      suggestion: passed ? undefined : 'Add missing normals, specials, or animations'
    };
  }

  private validateCharacterBalance(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check health balance
    if (data.health >= 900 && data.health <= 1100) score += 2;
    else if (data.health >= 800 && data.health <= 1200) score += 1;

    // Check defense balance
    if (data.defense >= 0.9 && data.defense <= 1.1) score += 2;
    else if (data.defense >= 0.8 && data.defense <= 1.2) score += 1;

    // Check walk speed balance
    if (data.walkSpeed >= 120 && data.walkSpeed <= 180) score += 2;
    else if (data.walkSpeed >= 100 && data.walkSpeed <= 200) score += 1;

    // Check meter gain balance
    if (data.meterGain >= 0.9 && data.meterGain <= 1.1) score += 2;
    else if (data.meterGain >= 0.8 && data.meterGain <= 1.2) score += 1;

    // Check weight balance
    if (data.weight >= 70 && data.weight <= 90) score += 2;
    else if (data.weight >= 60 && data.weight <= 100) score += 1;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Character stats are not well balanced',
      suggestion: passed ? undefined : 'Adjust health, defense, speed, or meter gain values'
    };
  }

  private validateCharacterConsistency(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check theme consistency
    if (data.theme && data.trait && data.trait.name.toLowerCase().includes(data.theme)) score += 2;
    if (data.theme && data.specials) {
      const themeConsistent = Object.values(data.specials).some((move: any) => 
        move.tags && move.tags.includes(data.theme)
      );
      if (themeConsistent) score += 2;
    }

    // Check archetype consistency
    if (data.archetype && data.fightingStyle) {
      const archetypeStyles: Record<string, string[]> = {
        rushdown: ['boxing', 'kickboxing', 'mixed'],
        grappler: ['wrestling', 'judo', 'mixed'],
        zoner: ['karate', 'kung_fu', 'taekwondo'],
        all_rounder: ['mixed', 'martial_arts']
      };
      const validStyles = archetypeStyles[data.archetype] || [];
      if (validStyles.includes(data.fightingStyle)) score += 2;
    }

    // Check personality consistency
    if (data.personality && data.backstory) {
      const personalityKeywords: Record<string, string[]> = {
        heroic: ['hero', 'brave', 'courage', 'justice'],
        tragic: ['tragedy', 'loss', 'pain', 'sorrow'],
        mysterious: ['mystery', 'secret', 'hidden', 'unknown'],
        comic: ['funny', 'humor', 'laugh', 'joke']
      };
      const keywords = personalityKeywords[data.personality] || [];
      const hasKeywords = keywords.some(keyword => 
        data.backstory.toLowerCase().includes(keyword)
      );
      if (hasKeywords) score += 2;
    }

    // Check gender consistency
    if (data.gender && data.name) {
      const genderNames: Record<string, string[]> = {
        male: ['Alex', 'Blake', 'Carter', 'Drew', 'Eli', 'Finn', 'Gage', 'Hugo', 'Ivan', 'Jax', 'Kai', 'Leo', 'Max', 'Nate', 'Owen', 'Pax', 'Quinn', 'Rex', 'Sam', 'Troy', 'Uri', 'Vic', 'Wade', 'Xander', 'Yuki', 'Zane'],
        female: ['Aria', 'Bella', 'Cora', 'Dana', 'Eva', 'Faye', 'Gia', 'Hana', 'Iris', 'Jade', 'Kira', 'Luna', 'Maya', 'Nova', 'Opal', 'Pia', 'Quinn', 'Raya', 'Sage', 'Tara', 'Uma', 'Vera', 'Wren', 'Xara', 'Yara', 'Zara']
      };
      const names = genderNames[data.gender] || [];
      const nameParts = data.name.split(' ');
      const hasConsistentName = nameParts.some(part => names.includes(part));
      if (hasConsistentName) score += 2;
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Character elements are not consistent',
      suggestion: passed ? undefined : 'Ensure theme, archetype, personality, and gender are consistent'
    };
  }

  // Stage validation methods
  private validateStageCompleteness(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check required fields
    if (data.name && data.name.length > 0) score += 1;
    if (data.description && data.description.length > 50) score += 1;
    if (data.layers && Object.keys(data.layers).length >= 4) score += 2;
    if (data.platforms && data.platforms.length >= 1) score += 1;
    if (data.music && data.music.track) score += 1;
    if (data.effects && data.effects.length >= 2) score += 1;
    if (data.camera && data.camera.position) score += 1;
    if (data.physics && data.physics.gravity) score += 1;
    if (data.interactiveElements && data.interactiveElements.length >= 1) score += 1;

    const passed = score >= 7;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Stage is missing required components',
      suggestion: passed ? undefined : 'Add missing layers, platforms, or effects'
    };
  }

  private validateStagePerformance(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check layer count (fewer layers = better performance)
    if (data.layers && Object.keys(data.layers).length <= 5) score += 2;
    else if (data.layers && Object.keys(data.layers).length <= 8) score += 1;

    // Check effect count
    if (data.effects && data.effects.length <= 5) score += 2;
    else if (data.effects && data.effects.length <= 10) score += 1;

    // Check interactive element count
    if (data.interactiveElements && data.interactiveElements.length <= 3) score += 2;
    else if (data.interactiveElements && data.interactiveElements.length <= 6) score += 1;

    // Check platform count
    if (data.platforms && data.platforms.length <= 3) score += 2;
    else if (data.platforms && data.platforms.length <= 5) score += 1;

    // Check camera settings
    if (data.camera && data.camera.fov >= 60 && data.camera.fov <= 80) score += 2;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Stage may have performance issues',
      suggestion: passed ? undefined : 'Reduce number of layers, effects, or interactive elements'
    };
  }

  private validateStageThemeConsistency(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check theme consistency in layers
    if (data.theme && data.layers) {
      const themeConsistent = Object.values(data.layers).some((layer: any) => 
        layer.elements && layer.elements.some((element: any) => 
          element.sprite && element.sprite.includes(data.theme)
        )
      );
      if (themeConsistent) score += 3;
    }

    // Check theme consistency in effects
    if (data.theme && data.effects) {
      const themeConsistent = data.effects.some((effect: any) => 
        effect.sprite && effect.sprite.includes(data.theme)
      );
      if (themeConsistent) score += 2;
    }

    // Check theme consistency in music
    if (data.theme && data.music && data.music.track) {
      const themeConsistent = data.music.track.includes(data.theme);
      if (themeConsistent) score += 2;
    }

    // Check theme consistency in interactive elements
    if (data.theme && data.interactiveElements) {
      const themeConsistent = data.interactiveElements.some((element: any) => 
        element.type && element.type.includes(data.theme)
      );
      if (themeConsistent) score += 2;
    }

    // Check atmosphere consistency
    if (data.atmosphere && data.lighting) {
      const atmosphereLightingMap: Record<string, string[]> = {
        peaceful: ['natural', 'bright'],
        tense: ['dim', 'neon'],
        mysterious: ['dim', 'mystical'],
        energetic: ['bright', 'neon'],
        epic: ['bright', 'mystical']
      };
      const validLighting = atmosphereLightingMap[data.atmosphere] || [];
      if (validLighting.includes(data.lighting)) score += 1;
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Stage elements do not match the theme',
      suggestion: passed ? undefined : 'Ensure all elements (layers, effects, music) match the theme'
    };
  }

  // Story validation methods
  private validateStoryStructure(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check required fields
    if (data.title && data.title.length > 0) score += 1;
    if (data.description && data.description.length > 100) score += 1;
    if (data.chapters && data.chapters.length >= 3) score += 2;
    if (data.characters && data.characters.length >= 3) score += 2;
    if (data.endings && data.endings.length >= 2) score += 1;
    if (data.world && data.world.setting) score += 1;
    if (data.world && data.world.lore) score += 1;
    if (data.world && data.world.factions) score += 1;

    const passed = score >= 7;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Story is missing required structural elements',
      suggestion: passed ? undefined : 'Add more chapters, characters, or world-building elements'
    };
  }

  private validateStoryCharacterDevelopment(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    if (data.characters) {
      // Check character completeness
      const developedCharacters = data.characters.filter((char: any) => 
        char.backstory && char.backstory.length > 100
      );
      score += Math.min(3, developedCharacters.length);

      // Check character variety
      const roles = new Set(data.characters.map((char: any) => char.role));
      score += Math.min(2, roles.size);

      // Check character personality consistency
      const consistentCharacters = data.characters.filter((char: any) => 
        char.personality && char.backstory && 
        char.backstory.toLowerCase().includes(char.personality.toLowerCase())
      );
      score += Math.min(2, consistentCharacters.length);

      // Check character dialogue
      const charactersWithDialogue = data.characters.filter((char: any) => 
        data.chapters.some((chapter: any) => 
          chapter.stages.some((stage: any) => 
            stage.dialogue.some((dialogue: any) => 
              dialogue.characterId === char.id
            )
          )
        )
      );
      score += Math.min(3, charactersWithDialogue.length);
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Characters are not well developed',
      suggestion: passed ? undefined : 'Add more backstory, dialogue, and character development'
    };
  }

  private validateStoryPacing(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    if (data.chapters) {
      // Check chapter progression
      const chapterCount = data.chapters.length;
      if (chapterCount >= 3 && chapterCount <= 8) score += 2;
      else if (chapterCount >= 2 && chapterCount <= 12) score += 1;

      // Check stage distribution
      const totalStages = data.chapters.reduce((sum: number, chapter: any) => 
        sum + (chapter.stages ? chapter.stages.length : 0), 0
      );
      if (totalStages >= 5 && totalStages <= 20) score += 2;
      else if (totalStages >= 3 && totalStages <= 30) score += 1;

      // Check dialogue distribution
      const totalDialogue = data.chapters.reduce((sum: number, chapter: any) => 
        sum + chapter.stages.reduce((stageSum: number, stage: any) => 
          stageSum + (stage.dialogue ? stage.dialogue.length : 0), 0
        ), 0
      );
      if (totalDialogue >= 10 && totalDialogue <= 50) score += 2;
      else if (totalDialogue >= 5 && totalDialogue <= 100) score += 1;

      // Check cutscene distribution
      const totalCutscenes = data.chapters.reduce((sum: number, chapter: any) => 
        sum + chapter.stages.reduce((stageSum: number, stage: any) => 
          stageSum + (stage.cutscenes ? stage.cutscenes.length : 0), 0
        ), 0
      );
      if (totalCutscenes >= 5 && totalCutscenes <= 25) score += 2;
      else if (totalCutscenes >= 3 && totalCutscenes <= 40) score += 1;

      // Check objective distribution
      const totalObjectives = data.chapters.reduce((sum: number, chapter: any) => 
        sum + chapter.stages.reduce((stageSum: number, stage: any) => 
          stageSum + (stage.objectives ? stage.objectives.length : 0), 0
        ), 0
      );
      if (totalObjectives >= 10 && totalObjectives <= 40) score += 2;
      else if (totalObjectives >= 5 && totalObjectives <= 60) score += 1;
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Story pacing needs improvement',
      suggestion: passed ? undefined : 'Balance chapter count, stages, dialogue, and objectives'
    };
  }

  // Training validation methods
  private validateTrainingEffectiveness(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check exercise count
    if (data.exercises && data.exercises.length >= 3) score += 2;
    else if (data.exercises && data.exercises.length >= 1) score += 1;

    // Check exercise variety
    if (data.exercises) {
      const exerciseTypes = new Set(data.exercises.map((ex: any) => ex.type));
      score += Math.min(2, exerciseTypes.size);
    }

    // Check objectives
    if (data.exercises) {
      const exercisesWithObjectives = data.exercises.filter((ex: any) => 
        ex.objectives && ex.objectives.length >= 2
      );
      score += Math.min(2, exercisesWithObjectives.length);
    }

    // Check instructions
    if (data.exercises) {
      const exercisesWithInstructions = data.exercises.filter((ex: any) => 
        ex.instructions && ex.instructions.length >= 3
      );
      score += Math.min(2, exercisesWithInstructions.length);
    }

    // Check feedback
    if (data.exercises) {
      const exercisesWithFeedback = data.exercises.filter((ex: any) => 
        ex.feedback && ex.feedback.success && ex.feedback.failure
      );
      score += Math.min(2, exercisesWithFeedback.length);
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Training is not effective',
      suggestion: passed ? undefined : 'Add more exercises, objectives, instructions, and feedback'
    };
  }

  private validateTrainingProgression(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check progression levels
    if (data.progression && data.progression.levels && data.progression.levels.length >= 3) score += 2;
    else if (data.progression && data.progression.levels && data.progression.levels.length >= 1) score += 1;

    // Check level requirements
    if (data.progression && data.progression.levels) {
      const levelsWithRequirements = data.progression.levels.filter((level: any) => 
        level.requirements && Object.keys(level.requirements).length >= 2
      );
      score += Math.min(2, levelsWithRequirements.length);
    }

    // Check rewards
    if (data.progression && data.progression.rewards && data.progression.rewards.length >= 2) score += 2;
    else if (data.progression && data.progression.rewards && data.progression.rewards.length >= 1) score += 1;

    // Check exercise difficulty progression
    if (data.exercises) {
      const difficulties = data.exercises.map((ex: any) => ex.difficulty);
      const hasProgression = difficulties.some((diff: number, index: number) => 
        index > 0 && diff > difficulties[index - 1]
      );
      if (hasProgression) score += 2;
    }

    // Check analytics
    if (data.analytics && data.analytics.tracking && data.analytics.tracking.length >= 3) score += 2;
    else if (data.analytics && data.analytics.tracking && data.analytics.tracking.length >= 1) score += 1;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Training progression needs improvement',
      suggestion: passed ? undefined : 'Add more levels, requirements, rewards, and analytics'
    };
  }

  private validateTrainingFeedback(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    if (data.exercises) {
      // Check feedback completeness
      const exercisesWithCompleteFeedback = data.exercises.filter((ex: any) => 
        ex.feedback && ex.feedback.success && ex.feedback.failure && ex.feedback.tips
      );
      score += Math.min(3, exercisesWithCompleteFeedback.length);

      // Check feedback variety
      const feedbackVariety = data.exercises.reduce((sum: number, ex: any) => {
        if (ex.feedback && ex.feedback.success && ex.feedback.failure) {
          return sum + ex.feedback.success.length + ex.feedback.failure.length;
        }
        return sum;
      }, 0);
      score += Math.min(2, Math.floor(feedbackVariety / 10));

      // Check tips quality
      const exercisesWithTips = data.exercises.filter((ex: any) => 
        ex.feedback && ex.feedback.tips && ex.feedback.tips.length >= 3
      );
      score += Math.min(2, exercisesWithTips.length);

      // Check instruction quality
      const exercisesWithInstructions = data.exercises.filter((ex: any) => 
        ex.instructions && ex.instructions.length >= 3
      );
      score += Math.min(3, exercisesWithInstructions.length);
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Training feedback needs improvement',
      suggestion: passed ? undefined : 'Add more comprehensive feedback, tips, and instructions'
    };
  }

  // Asset validation methods
  private validateAssetQuality(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check properties completeness
    if (data.properties && data.properties.width && data.properties.height) score += 2;
    if (data.properties && data.properties.format) score += 1;
    if (data.properties && data.properties.compression) score += 1;

    // Check quality settings
    if (data.quality === 'high' || data.quality === 'ultra') score += 2;
    else if (data.quality === 'medium') score += 1;

    // Check size appropriateness
    if (data.properties && data.properties.width >= 32 && data.properties.width <= 512) score += 2;
    else if (data.properties && data.properties.width >= 16 && data.properties.width <= 1024) score += 1;

    // Check optimization
    if (data.properties && data.properties.optimization && data.properties.optimization.length >= 2) score += 2;
    else if (data.properties && data.properties.optimization && data.properties.optimization.length >= 1) score += 1;

    // Check variants
    if (data.variants && data.variants.length >= 2) score += 2;
    else if (data.variants && data.variants.length >= 1) score += 1;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Asset quality needs improvement',
      suggestion: passed ? undefined : 'Improve properties, quality settings, and optimization'
    };
  }

  private validateAssetOptimization(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check compression
    if (data.properties && data.properties.compression === 'medium' || data.properties.compression === 'high') score += 2;
    else if (data.properties && data.properties.compression === 'low') score += 1;

    // Check optimization settings
    if (data.properties && data.properties.optimization) {
      const optimizationCount = data.properties.optimization.length;
      score += Math.min(3, optimizationCount);
    }

    // Check file size
    if (data.files) {
      const totalSize = data.files.reduce((sum: number, file: any) => sum + file.size, 0);
      if (totalSize <= 1024 * 1024) score += 2; // 1MB
      else if (totalSize <= 5 * 1024 * 1024) score += 1; // 5MB
    }

    // Check format efficiency
    if (data.properties && data.properties.format) {
      const efficientFormats = ['png', 'jpg', 'gif', 'wav', 'mp3'];
      if (efficientFormats.includes(data.properties.format.toLowerCase())) score += 2;
    }

    // Check animation optimization
    if (data.type === 'animation' && data.properties) {
      if (data.properties.fps <= 30) score += 1;
      if (data.properties.loop === true) score += 1;
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Asset is not well optimized',
      suggestion: passed ? undefined : 'Improve compression, file size, and optimization settings'
    };
  }

  private validateAssetConsistency(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check style consistency
    if (data.style && data.metadata && data.metadata.tags) {
      const styleConsistent = data.metadata.tags.includes(data.style);
      if (styleConsistent) score += 2;
    }

    // Check theme consistency
    if (data.theme && data.metadata && data.metadata.tags) {
      const themeConsistent = data.metadata.tags.includes(data.theme);
      if (themeConsistent) score += 2;
    }

    // Check category consistency
    if (data.type && data.metadata && data.metadata.category) {
      const categoryConsistent = data.metadata.category.toLowerCase().includes(data.type.toLowerCase());
      if (categoryConsistent) score += 2;
    }

    // Check file consistency
    if (data.files) {
      const consistentFiles = data.files.filter((file: any) => 
        file.format && file.format.toLowerCase() === data.properties.format.toLowerCase()
      );
      if (consistentFiles.length === data.files.length) score += 2;
      else if (consistentFiles.length > 0) score += 1;
    }

    // Check variant consistency
    if (data.variants) {
      const consistentVariants = data.variants.filter((variant: any) => 
        variant.properties && variant.properties.format === data.properties.format
      );
      if (consistentVariants.length === data.variants.length) score += 2;
      else if (consistentVariants.length > 0) score += 1;
    }

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Asset elements are not consistent',
      suggestion: passed ? undefined : 'Ensure style, theme, category, and file formats are consistent'
    };
  }

  // Combo validation methods
  private validateComboExecutability(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check input count
    if (data.inputs && data.inputs.length >= 3) score += 2;
    else if (data.inputs && data.inputs.length >= 1) score += 1;

    // Check timing feasibility
    if (data.inputs) {
      const feasibleTimings = data.inputs.filter((input: any) => 
        input.timing >= 50 && input.timing <= 200
      );
      score += Math.min(2, feasibleTimings.length);
    }

    // Check damage progression
    if (data.inputs) {
      const damages = data.inputs.map((input: any) => input.damage);
      const hasProgression = damages.some((damage: number, index: number) => 
        index > 0 && damage > damages[index - 1]
      );
      if (hasProgression) score += 2;
    }

    // Check meter usage
    if (data.inputs) {
      const meterUsage = data.inputs.reduce((sum: number, input: any) => sum + input.meterGain, 0);
      if (meterUsage >= 0 && meterUsage <= 100) score += 2;
      else if (meterUsage >= -50 && meterUsage <= 150) score += 1;
    }

    // Check properties completeness
    if (data.properties && data.properties.totalDamage > 0) score += 1;
    if (data.properties && data.properties.execution >= 1 && data.properties.execution <= 5) score += 1;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Combo is not executable',
      suggestion: passed ? undefined : 'Improve timing, damage progression, and meter usage'
    };
  }

  private validateComboBalance(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check damage balance
    if (data.properties && data.properties.totalDamage >= 200 && data.properties.totalDamage <= 500) score += 2;
    else if (data.properties && data.properties.totalDamage >= 100 && data.properties.totalDamage <= 800) score += 1;

    // Check meter balance
    if (data.properties && data.properties.totalMeter >= 0 && data.properties.totalMeter <= 100) score += 2;
    else if (data.properties && data.properties.totalMeter >= -50 && data.properties.totalMeter <= 150) score += 1;

    // Check difficulty balance
    if (data.properties && data.properties.difficulty >= 1 && data.properties.difficulty <= 4) score += 2;
    else if (data.properties && data.properties.difficulty >= 0.5 && data.properties.difficulty <= 5) score += 1;

    // Check execution balance
    if (data.properties && data.properties.execution >= 1 && data.properties.execution <= 5) score += 2;
    else if (data.properties && data.properties.execution >= 0.5 && data.properties.execution <= 6) score += 1;

    // Check consistency balance
    if (data.properties && data.properties.consistency >= 1 && data.properties.consistency <= 5) score += 2;
    else if (data.properties && data.properties.consistency >= 0.5 && data.properties.consistency <= 6) score += 1;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Combo is not well balanced',
      suggestion: passed ? undefined : 'Adjust damage, meter, difficulty, and execution values'
    };
  }

  private validateComboCreativity(content: GeneratedContent): ValidationCheck {
    const data = content.data;
    let score = 0;
    const maxScore = 10;

    // Check creativity score
    if (data.properties && data.properties.creativity >= 3) score += 2;
    else if (data.properties && data.properties.creativity >= 2) score += 1;

    // Check input variety
    if (data.inputs) {
      const inputTypes = new Set(data.inputs.map((input: any) => input.input));
      score += Math.min(2, inputTypes.size);
    }

    // Check variation count
    if (data.variations && data.variations.length >= 2) score += 2;
    else if (data.variations && data.variations.length >= 1) score += 1;

    // Check tips quality
    if (data.tips && data.tips.length >= 3) score += 2;
    else if (data.tips && data.tips.length >= 1) score += 1;

    // Check style appropriateness
    if (data.style && data.properties && data.properties.style >= 2) score += 2;
    else if (data.style && data.properties && data.properties.style >= 1) score += 1;

    const passed = score >= 6;
    return {
      passed,
      score: score / maxScore,
      message: passed ? undefined : 'Combo lacks creativity',
      suggestion: passed ? undefined : 'Add more input variety, variations, and creative elements'
    };
  }
}