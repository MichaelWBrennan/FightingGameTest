import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import { ContentManager } from './ContentManager';
import { GeneratedContent } from './ContentGenerationManager';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'generation' | 'validation' | 'optimization' | 'custom';
  config: any;
  dependencies: string[];
  parallel: boolean;
}

export interface WorkflowResult {
  success: boolean;
  content: GeneratedContent[];
  errors: string[];
  warnings: string[];
  stats: {
    totalGenerated: number;
    totalValidated: number;
    totalOptimized: number;
    averageQuality: number;
    duration: number;
  };
}

export class ContentWorkflow {
  private app: pc.Application;
  private contentManager: ContentManager;
  private steps: Map<string, WorkflowStep> = new Map();
  private workflows: Map<string, string[]> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.contentManager = new ContentManager(app);
    this.initializeWorkflows();
  }

  private initializeWorkflows(): void {
    // Character creation workflow
    this.workflows.set('character_creation', [
      'generate_character',
      'validate_character',
      'optimize_character',
      'generate_variations'
    ]);

    // Stage creation workflow
    this.workflows.set('stage_creation', [
      'generate_stage',
      'validate_stage',
      'optimize_stage',
      'generate_effects'
    ]);

    // Story creation workflow
    this.workflows.set('story_creation', [
      'generate_story',
      'validate_story',
      'generate_chapters',
      'generate_dialogue'
    ]);

    // Training creation workflow
    this.workflows.set('training_creation', [
      'generate_training',
      'validate_training',
      'optimize_training',
      'generate_exercises'
    ]);

    // Asset creation workflow
    this.workflows.set('asset_creation', [
      'generate_asset',
      'validate_asset',
      'optimize_asset',
      'generate_variants'
    ]);

    // Combo creation workflow
    this.workflows.set('combo_creation', [
      'generate_combo',
      'validate_combo',
      'optimize_combo',
      'generate_variations'
    ]);

    // Full content generation workflow
    this.workflows.set('full_content_generation', [
      'generate_characters',
      'generate_stages',
      'generate_stories',
      'generate_training',
      'generate_assets',
      'generate_combos',
      'validate_all',
      'optimize_all'
    ]);

    this.initializeSteps();
    Logger.info('Content workflows initialized');
  }

  private initializeSteps(): void {
    // Character generation steps
    this.addStep({
      id: 'generate_character',
      name: 'Generate Character',
      description: 'Generate a new character with stats, moves, and animations',
      type: 'generation',
      config: {
        type: 'character',
        options: {
          archetype: 'all_rounder',
          theme: 'fire',
          difficulty: 'intermediate',
          specialMoves: 3,
          variations: 2
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_character',
      name: 'Validate Character',
      description: 'Validate character completeness and balance',
      type: 'validation',
      config: {
        type: 'character',
        strict: true
      },
      dependencies: ['generate_character'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_character',
      name: 'Optimize Character',
      description: 'Optimize character for performance and balance',
      type: 'optimization',
      config: {
        type: 'character',
        performance: true,
        balance: true
      },
      dependencies: ['validate_character'],
      parallel: false
    });

    this.addStep({
      id: 'generate_variations',
      name: 'Generate Variations',
      description: 'Generate character variations and costumes',
      type: 'generation',
      config: {
        type: 'character_variations',
        count: 3,
        themes: ['fire', 'ice', 'electric']
      },
      dependencies: ['optimize_character'],
      parallel: true
    });

    // Stage generation steps
    this.addStep({
      id: 'generate_stage',
      name: 'Generate Stage',
      description: 'Generate a new stage with layers and effects',
      type: 'generation',
      config: {
        type: 'stage',
        options: {
          theme: 'urban',
          size: 'medium',
          hazards: true,
          interactiveElements: 3
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_stage',
      name: 'Validate Stage',
      description: 'Validate stage completeness and performance',
      type: 'validation',
      config: {
        type: 'stage',
        performance: true
      },
      dependencies: ['generate_stage'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_stage',
      name: 'Optimize Stage',
      description: 'Optimize stage for performance',
      type: 'optimization',
      config: {
        type: 'stage',
        performance: true
      },
      dependencies: ['validate_stage'],
      parallel: false
    });

    this.addStep({
      id: 'generate_effects',
      name: 'Generate Effects',
      description: 'Generate stage effects and particles',
      type: 'generation',
      config: {
        type: 'stage_effects',
        count: 5,
        types: ['particle', 'lighting', 'weather']
      },
      dependencies: ['optimize_stage'],
      parallel: true
    });

    // Story generation steps
    this.addStep({
      id: 'generate_story',
      name: 'Generate Story',
      description: 'Generate a new story with plot and characters',
      type: 'generation',
      config: {
        type: 'story',
        options: {
          theme: 'heroic',
          length: 'medium',
          difficulty: 'intermediate',
          branchingPaths: true
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_story',
      name: 'Validate Story',
      description: 'Validate story structure and character development',
      type: 'validation',
      config: {
        type: 'story',
        structure: true,
        characterDevelopment: true
      },
      dependencies: ['generate_story'],
      parallel: false
    });

    this.addStep({
      id: 'generate_chapters',
      name: 'Generate Chapters',
      description: 'Generate story chapters with stages and objectives',
      type: 'generation',
      config: {
        type: 'story_chapters',
        count: 5,
        difficulty: 'intermediate'
      },
      dependencies: ['validate_story'],
      parallel: false
    });

    this.addStep({
      id: 'generate_dialogue',
      name: 'Generate Dialogue',
      description: 'Generate character dialogue and cutscenes',
      type: 'generation',
      config: {
        type: 'story_dialogue',
        characterCount: 3,
        dialogueCount: 20
      },
      dependencies: ['generate_chapters'],
      parallel: true
    });

    // Training generation steps
    this.addStep({
      id: 'generate_training',
      name: 'Generate Training',
      description: 'Generate training exercises and progression',
      type: 'generation',
      config: {
        type: 'training',
        options: {
          character: 'blitz',
          skill: 'intermediate',
          focus: 'combos',
          duration: 'medium'
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_training',
      name: 'Validate Training',
      description: 'Validate training effectiveness and progression',
      type: 'validation',
      config: {
        type: 'training',
        effectiveness: true,
        progression: true
      },
      dependencies: ['generate_training'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_training',
      name: 'Optimize Training',
      description: 'Optimize training for effectiveness',
      type: 'optimization',
      config: {
        type: 'training',
        effectiveness: true
      },
      dependencies: ['validate_training'],
      parallel: false
    });

    this.addStep({
      id: 'generate_exercises',
      name: 'Generate Exercises',
      description: 'Generate additional training exercises',
      type: 'generation',
      config: {
        type: 'training_exercises',
        count: 5,
        difficulty: 'intermediate'
      },
      dependencies: ['optimize_training'],
      parallel: true
    });

    // Asset generation steps
    this.addStep({
      id: 'generate_asset',
      name: 'Generate Asset',
      description: 'Generate visual or audio asset',
      type: 'generation',
      config: {
        type: 'asset',
        options: {
          type: 'sprite',
          style: 'pixel',
          theme: 'fire',
          size: 'medium',
          quality: 'high'
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_asset',
      name: 'Validate Asset',
      description: 'Validate asset quality and optimization',
      type: 'validation',
      config: {
        type: 'asset',
        quality: true,
        optimization: true
      },
      dependencies: ['generate_asset'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_asset',
      name: 'Optimize Asset',
      description: 'Optimize asset for performance',
      type: 'optimization',
      config: {
        type: 'asset',
        performance: true
      },
      dependencies: ['validate_asset'],
      parallel: false
    });

    this.addStep({
      id: 'generate_variants',
      name: 'Generate Variants',
      description: 'Generate asset variants and variations',
      type: 'generation',
      config: {
        type: 'asset_variants',
        count: 3,
        themes: ['fire', 'ice', 'electric']
      },
      dependencies: ['optimize_asset'],
      parallel: true
    });

    // Combo generation steps
    this.addStep({
      id: 'generate_combo',
      name: 'Generate Combo',
      description: 'Generate a new combo sequence',
      type: 'generation',
      config: {
        type: 'combo',
        options: {
          character: 'blitz',
          difficulty: 'intermediate',
          style: 'damage',
          length: 'medium'
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_combo',
      name: 'Validate Combo',
      description: 'Validate combo executability and balance',
      type: 'validation',
      config: {
        type: 'combo',
        executability: true,
        balance: true
      },
      dependencies: ['generate_combo'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_combo',
      name: 'Optimize Combo',
      description: 'Optimize combo for balance and creativity',
      type: 'optimization',
      config: {
        type: 'combo',
        balance: true,
        creativity: true
      },
      dependencies: ['validate_combo'],
      parallel: false
    });

    this.addStep({
      id: 'generate_variations',
      name: 'Generate Variations',
      description: 'Generate combo variations and alternatives',
      type: 'generation',
      config: {
        type: 'combo_variations',
        count: 3,
        styles: ['damage', 'meter_build', 'reset']
      },
      dependencies: ['optimize_combo'],
      parallel: true
    });

    // Batch generation steps
    this.addStep({
      id: 'generate_characters',
      name: 'Generate Characters',
      description: 'Generate multiple characters',
      type: 'generation',
      config: {
        type: 'character_batch',
        count: 5,
        archetypes: ['rushdown', 'grappler', 'zoner', 'all_rounder', 'technical']
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_stages',
      name: 'Generate Stages',
      description: 'Generate multiple stages',
      type: 'generation',
      config: {
        type: 'stage_batch',
        count: 3,
        themes: ['urban', 'nature', 'cyber']
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_stories',
      name: 'Generate Stories',
      description: 'Generate multiple stories',
      type: 'generation',
      config: {
        type: 'story_batch',
        count: 2,
        themes: ['heroic', 'tragic']
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_training',
      name: 'Generate Training',
      description: 'Generate multiple training programs',
      type: 'generation',
      config: {
        type: 'training_batch',
        count: 3,
        focuses: ['combos', 'defense', 'offense']
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_assets',
      name: 'Generate Assets',
      description: 'Generate multiple assets',
      type: 'generation',
      config: {
        type: 'asset_batch',
        count: 10,
        types: ['sprite', 'animation', 'sound', 'effect']
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_combos',
      name: 'Generate Combos',
      description: 'Generate multiple combos',
      type: 'generation',
      config: {
        type: 'combo_batch',
        count: 8,
        difficulties: ['beginner', 'intermediate', 'advanced', 'expert']
      },
      dependencies: [],
      parallel: true
    });

    // Validation and optimization steps
    this.addStep({
      id: 'validate_all',
      name: 'Validate All Content',
      description: 'Validate all generated content',
      type: 'validation',
      config: {
        type: 'all',
        strict: false
      },
      dependencies: ['generate_characters', 'generate_stages', 'generate_stories', 'generate_training', 'generate_assets', 'generate_combos'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_all',
      name: 'Optimize All Content',
      description: 'Optimize all generated content',
      type: 'optimization',
      config: {
        type: 'all',
        performance: true,
        balance: true
      },
      dependencies: ['validate_all'],
      parallel: false
    });
  }

  private addStep(step: WorkflowStep): void {
    this.steps.set(step.id, step);
  }

  public async executeWorkflow(workflowId: string, config?: any): Promise<WorkflowResult> {
    const startTime = Date.now();
    const result: WorkflowResult = {
      success: true,
      content: [],
      errors: [],
      warnings: [],
      stats: {
        totalGenerated: 0,
        totalValidated: 0,
        totalOptimized: 0,
        averageQuality: 0,
        duration: 0
      }
    };

    try {
      const stepIds = this.workflows.get(workflowId);
      if (!stepIds) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      Logger.info(`Executing workflow: ${workflowId}`);

      // Execute steps in order
      for (const stepId of stepIds) {
        const step = this.steps.get(stepId);
        if (!step) {
          result.errors.push(`Step not found: ${stepId}`);
          continue;
        }

        try {
          const stepResult = await this.executeStep(step, config);
          if (stepResult.success) {
            result.content.push(...stepResult.content);
            result.stats.totalGenerated += stepResult.content.length;
          } else {
            result.errors.push(...stepResult.errors);
            result.warnings.push(...stepResult.warnings);
          }
        } catch (error) {
          result.errors.push(`Step ${stepId} failed: ${error}`);
          result.success = false;
        }
      }

      // Calculate final stats
      result.stats.duration = Date.now() - startTime;
      result.stats.averageQuality = this.calculateAverageQuality(result.content);

      Logger.info(`Workflow completed: ${workflowId} (${result.stats.duration}ms)`);

    } catch (error) {
      result.success = false;
      result.errors.push(`Workflow execution failed: ${error}`);
      Logger.error(`Workflow execution failed: ${workflowId}`, error);
    }

    return result;
  }

  private async executeStep(step: WorkflowStep, config?: any): Promise<WorkflowResult> {
    const stepResult: WorkflowResult = {
      success: true,
      content: [],
      errors: [],
      warnings: [],
      stats: {
        totalGenerated: 0,
        totalValidated: 0,
        totalOptimized: 0,
        averageQuality: 0,
        duration: 0
      }
    };

    try {
      switch (step.type) {
        case 'generation':
          await this.executeGenerationStep(step, config, stepResult);
          break;
        case 'validation':
          await this.executeValidationStep(step, config, stepResult);
          break;
        case 'optimization':
          await this.executeOptimizationStep(step, config, stepResult);
          break;
        case 'custom':
          await this.executeCustomStep(step, config, stepResult);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      stepResult.success = false;
      stepResult.errors.push(`Step execution failed: ${error}`);
    }

    return stepResult;
  }

  private async executeGenerationStep(step: WorkflowStep, config: any, result: WorkflowResult): Promise<void> {
    const stepConfig = { ...step.config, ...config };
    
    if (stepConfig.type.endsWith('_batch')) {
      // Execute batch generation
      const batchRequests = this.createBatchRequests(stepConfig);
      const content = await this.contentManager.generateBatch(batchRequests);
      result.content.push(...content);
      result.stats.totalGenerated = content.length;
    } else {
      // Execute single generation
      const content = await this.contentManager.generateContent(
        stepConfig.type,
        stepConfig.options,
        stepConfig
      );
      if (content) {
        result.content.push(content);
        result.stats.totalGenerated = 1;
      }
    }
  }

  private async executeValidationStep(step: WorkflowStep, config: any, result: WorkflowResult): Promise<void> {
    const stepConfig = { ...step.config, ...config };
    
    if (stepConfig.type === 'all') {
      // Validate all content
      const allContent = this.contentManager.getAllContent();
      for (const content of allContent) {
        const validation = await this.contentManager.validateContent(content.id);
        if (validation) {
          result.stats.totalValidated++;
          if (!validation.valid) {
            result.errors.push(`Validation failed for ${content.name}: ${validation.errors.join(', ')}`);
          }
        }
      }
    } else {
      // Validate specific content type
      const content = this.contentManager.getContentByType(stepConfig.type);
      for (const item of content) {
        const validation = await this.contentManager.validateContent(item.id);
        if (validation) {
          result.stats.totalValidated++;
          if (!validation.valid) {
            result.errors.push(`Validation failed for ${item.name}: ${validation.errors.join(', ')}`);
          }
        }
      }
    }
  }

  private async executeOptimizationStep(step: WorkflowStep, config: any, result: WorkflowResult): Promise<void> {
    const stepConfig = { ...step.config, ...config };
    
    if (stepConfig.type === 'all') {
      // Optimize all content
      const allContent = this.contentManager.getAllContent();
      for (const content of allContent) {
        const optimized = await this.contentManager.optimizeContent(content.id);
        if (optimized) {
          result.stats.totalOptimized++;
        }
      }
    } else {
      // Optimize specific content type
      const content = this.contentManager.getContentByType(stepConfig.type);
      for (const item of content) {
        const optimized = await this.contentManager.optimizeContent(item.id);
        if (optimized) {
          result.stats.totalOptimized++;
        }
      }
    }
  }

  private async executeCustomStep(step: WorkflowStep, config: any, result: WorkflowResult): Promise<void> {
    // Custom step execution logic
    Logger.info(`Executing custom step: ${step.name}`);
  }

  private createBatchRequests(config: any): Array<{ type: string; options: any; config?: any }> {
    const requests = [];
    
    switch (config.type) {
      case 'character_batch':
        for (let i = 0; i < config.count; i++) {
          requests.push({
            type: 'character',
            options: {
              archetype: config.archetypes[i % config.archetypes.length],
              theme: this.getRandomTheme(),
              difficulty: 'intermediate'
            }
          });
        }
        break;
        
      case 'stage_batch':
        for (let i = 0; i < config.count; i++) {
          requests.push({
            type: 'stage',
            options: {
              theme: config.themes[i % config.themes.length],
              size: 'medium',
              hazards: true
            }
          });
        }
        break;
        
      case 'story_batch':
        for (let i = 0; i < config.count; i++) {
          requests.push({
            type: 'story',
            options: {
              theme: config.themes[i % config.themes.length],
              length: 'medium',
              difficulty: 'intermediate'
            }
          });
        }
        break;
        
      case 'training_batch':
        for (let i = 0; i < config.count; i++) {
          requests.push({
            type: 'training',
            options: {
              character: this.getRandomCharacter(),
              skill: 'intermediate',
              focus: config.focuses[i % config.focuses.length]
            }
          });
        }
        break;
        
      case 'asset_batch':
        for (let i = 0; i < config.count; i++) {
          requests.push({
            type: 'asset',
            options: {
              type: config.types[i % config.types.length],
              style: this.getRandomStyle(),
              theme: this.getRandomTheme(),
              size: 'medium'
            }
          });
        }
        break;
        
      case 'combo_batch':
        for (let i = 0; i < config.count; i++) {
          requests.push({
            type: 'combo',
            options: {
              character: this.getRandomCharacter(),
              difficulty: config.difficulties[i % config.difficulties.length],
              style: 'damage'
            }
          });
        }
        break;
    }
    
    return requests;
  }

  private getRandomTheme(): string {
    const themes = ['fire', 'ice', 'electric', 'wind', 'earth', 'water', 'dark', 'light', 'cyber', 'nature'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private getRandomStyle(): string {
    const styles = ['pixel', 'hand_drawn', '3d', 'vector', 'realistic', 'stylized', 'anime', 'cartoon'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private getRandomCharacter(): string {
    const characters = ['blitz', 'chain', 'crusher', 'maestro', 'ranger', 'shifter', 'sky', 'titan', 'vanguard', 'volt', 'weaver', 'zephyr'];
    return characters[Math.floor(Math.random() * characters.length)];
  }

  private calculateAverageQuality(content: GeneratedContent[]): number {
    if (content.length === 0) return 0;
    
    const totalQuality = content.reduce((sum, item) => sum + item.metadata.quality, 0);
    return totalQuality / content.length;
  }

  public getAvailableWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  public getWorkflowSteps(workflowId: string): WorkflowStep[] {
    const stepIds = this.workflows.get(workflowId);
    if (!stepIds) return [];
    
    return stepIds.map(id => this.steps.get(id)).filter(step => step !== undefined) as WorkflowStep[];
  }

  public addCustomWorkflow(id: string, steps: string[]): void {
    this.workflows.set(id, steps);
    Logger.info(`Added custom workflow: ${id}`);
  }

  public addCustomStep(step: WorkflowStep): void {
    this.steps.set(step.id, step);
    Logger.info(`Added custom step: ${step.id}`);
  }

  public destroy(): void {
    this.contentManager.destroy();
    this.steps.clear();
    this.workflows.clear();
    Logger.info('Content workflow destroyed');
  }
}