import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import { ContentWorkflow } from './ContentWorkflow';
import { GeneratedContent } from './ContentGenerationManager';

export interface FantasyContentConfig {
  theme: 'high_fantasy' | 'dark_fantasy' | 'epic_fantasy' | 'urban_fantasy' | 'steampunk_fantasy';
  realism: 'low' | 'medium' | 'high' | 'ultra';
  magic_system: 'hard' | 'soft' | 'hybrid';
  technology_level: 'medieval' | 'renaissance' | 'industrial' | 'magitech';
  atmosphere: 'heroic' | 'dark' | 'mysterious' | 'epic' | 'intimate';
}

export class FantasyContentWorkflow extends ContentWorkflow {
  private fantasyConfig: FantasyContentConfig;

  constructor(app: pc.Application, config: FantasyContentConfig) {
    super(app);
    this.fantasyConfig = config;
    this.initializeFantasyWorkflows();
  }

  private initializeFantasyWorkflows(): void {
    // High Fantasy Character Creation
    this.workflows.set('high_fantasy_character', [
      'generate_fantasy_character',
      'validate_fantasy_character',
      'optimize_fantasy_character',
      'generate_fantasy_variations'
    ]);

    // Dark Fantasy Character Creation
    this.workflows.set('dark_fantasy_character', [
      'generate_dark_character',
      'validate_dark_character',
      'optimize_dark_character',
      'generate_dark_variations'
    ]);

    // Epic Fantasy Story Creation
    this.workflows.set('epic_fantasy_story', [
      'generate_epic_story',
      'validate_epic_story',
      'generate_epic_chapters',
      'generate_epic_dialogue'
    ]);

    // Fantasy Stage Creation
    this.workflows.set('fantasy_stage', [
      'generate_fantasy_stage',
      'validate_fantasy_stage',
      'optimize_fantasy_stage',
      'generate_fantasy_effects'
    ]);

    // Complete Fantasy World Generation
    this.workflows.set('fantasy_world_generation', [
      'generate_fantasy_characters',
      'generate_fantasy_stages',
      'generate_fantasy_stories',
      'generate_fantasy_assets',
      'generate_fantasy_combos',
      'validate_fantasy_content',
      'optimize_fantasy_content'
    ]);

    this.initializeFantasySteps();
    Logger.info('Fantasy content workflows initialized');
  }

  private initializeFantasySteps(): void {
    // High Fantasy Character Steps
    this.addStep({
      id: 'generate_fantasy_character',
      name: 'Generate Fantasy Character',
      description: 'Generate a high fantasy character with magical abilities and heroic traits',
      type: 'generation',
      config: {
        type: 'character',
        options: {
          archetype: 'all_rounder',
          theme: 'divine',
          difficulty: 'intermediate',
          specialMoves: 4,
          variations: 3,
          fantasy_elements: {
            magic_type: 'divine',
            weapon_type: 'sword',
            armor_type: 'plate',
            class: 'paladin'
          }
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_fantasy_character',
      name: 'Validate Fantasy Character',
      description: 'Validate fantasy character for thematic consistency and balance',
      type: 'validation',
      config: {
        type: 'character',
        fantasy_validation: true,
        theme_consistency: true,
        magic_balance: true
      },
      dependencies: ['generate_fantasy_character'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_fantasy_character',
      name: 'Optimize Fantasy Character',
      description: 'Optimize fantasy character for performance and thematic consistency',
      type: 'optimization',
      config: {
        type: 'character',
        fantasy_optimization: true,
        magic_optimization: true
      },
      dependencies: ['validate_fantasy_character'],
      parallel: false
    });

    this.addStep({
      id: 'generate_fantasy_variations',
      name: 'Generate Fantasy Variations',
      description: 'Generate fantasy character variations with different magical affinities',
      type: 'generation',
      config: {
        type: 'character_variations',
        count: 3,
        themes: ['arcane', 'divine', 'elemental'],
        fantasy_elements: {
          magic_variations: true,
          weapon_variations: true,
          armor_variations: true
        }
      },
      dependencies: ['optimize_fantasy_character'],
      parallel: true
    });

    // Dark Fantasy Character Steps
    this.addStep({
      id: 'generate_dark_character',
      name: 'Generate Dark Fantasy Character',
      description: 'Generate a dark fantasy character with shadowy powers and tragic backstory',
      type: 'generation',
      config: {
        type: 'character',
        options: {
          archetype: 'rushdown',
          theme: 'shadow',
          difficulty: 'advanced',
          specialMoves: 4,
          variations: 2,
          fantasy_elements: {
            magic_type: 'shadow',
            weapon_type: 'dagger',
            armor_type: 'leather',
            class: 'assassin'
          }
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_dark_character',
      name: 'Validate Dark Fantasy Character',
      description: 'Validate dark fantasy character for thematic consistency and balance',
      type: 'validation',
      config: {
        type: 'character',
        dark_fantasy_validation: true,
        shadow_consistency: true,
        tragedy_balance: true
      },
      dependencies: ['generate_dark_character'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_dark_character',
      name: 'Optimize Dark Fantasy Character',
      description: 'Optimize dark fantasy character for performance and thematic consistency',
      type: 'optimization',
      config: {
        type: 'character',
        dark_optimization: true,
        shadow_optimization: true
      },
      dependencies: ['validate_dark_character'],
      parallel: false
    });

    this.addStep({
      id: 'generate_dark_variations',
      name: 'Generate Dark Fantasy Variations',
      description: 'Generate dark fantasy character variations with different shadow affinities',
      type: 'generation',
      config: {
        type: 'character_variations',
        count: 2,
        themes: ['shadow', 'void'],
        fantasy_elements: {
          shadow_variations: true,
          weapon_variations: true,
          armor_variations: true
        }
      },
      dependencies: ['optimize_dark_character'],
      parallel: true
    });

    // Epic Fantasy Story Steps
    this.addStep({
      id: 'generate_epic_story',
      name: 'Generate Epic Fantasy Story',
      description: 'Generate an epic fantasy story with grand scope and heroic themes',
      type: 'generation',
      config: {
        type: 'story',
        options: {
          theme: 'epic_war',
          length: 'epic',
          difficulty: 'expert',
          branchingPaths: true,
          fantasy_elements: {
            scope: 'epic',
            magic_system: 'hard',
            technology_level: 'medieval',
            atmosphere: 'heroic'
          }
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_epic_story',
      name: 'Validate Epic Fantasy Story',
      description: 'Validate epic fantasy story for thematic consistency and narrative structure',
      type: 'validation',
      config: {
        type: 'story',
        epic_validation: true,
        fantasy_consistency: true,
        narrative_structure: true
      },
      dependencies: ['generate_epic_story'],
      parallel: false
    });

    this.addStep({
      id: 'generate_epic_chapters',
      name: 'Generate Epic Fantasy Chapters',
      description: 'Generate epic fantasy story chapters with grand battles and heroic moments',
      type: 'generation',
      config: {
        type: 'story_chapters',
        count: 8,
        difficulty: 'expert',
        fantasy_elements: {
          epic_battles: true,
          heroic_moments: true,
          magical_conflicts: true
        }
      },
      dependencies: ['validate_epic_story'],
      parallel: false
    });

    this.addStep({
      id: 'generate_epic_dialogue',
      name: 'Generate Epic Fantasy Dialogue',
      description: 'Generate epic fantasy dialogue with heroic speeches and dramatic moments',
      type: 'generation',
      config: {
        type: 'story_dialogue',
        characterCount: 5,
        dialogueCount: 30,
        fantasy_elements: {
          heroic_speeches: true,
          dramatic_moments: true,
          magical_terminology: true
        }
      },
      dependencies: ['generate_epic_chapters'],
      parallel: true
    });

    // Fantasy Stage Steps
    this.addStep({
      id: 'generate_fantasy_stage',
      name: 'Generate Fantasy Stage',
      description: 'Generate a fantasy stage with magical elements and immersive atmosphere',
      type: 'generation',
      config: {
        type: 'stage',
        options: {
          theme: 'arcane_tower',
          size: 'large',
          hazards: true,
          interactiveElements: 5,
          fantasy_elements: {
            magic_effects: true,
            fantasy_architecture: true,
            magical_hazards: true
          }
        }
      },
      dependencies: [],
      parallel: false
    });

    this.addStep({
      id: 'validate_fantasy_stage',
      name: 'Validate Fantasy Stage',
      description: 'Validate fantasy stage for thematic consistency and performance',
      type: 'validation',
      config: {
        type: 'stage',
        fantasy_validation: true,
        magic_consistency: true,
        performance_check: true
      },
      dependencies: ['generate_fantasy_stage'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_fantasy_stage',
      name: 'Optimize Fantasy Stage',
      description: 'Optimize fantasy stage for performance while maintaining magical atmosphere',
      type: 'optimization',
      config: {
        type: 'stage',
        fantasy_optimization: true,
        magic_optimization: true
      },
      dependencies: ['validate_fantasy_stage'],
      parallel: false
    });

    this.addStep({
      id: 'generate_fantasy_effects',
      name: 'Generate Fantasy Effects',
      description: 'Generate magical effects and particles for fantasy stage',
      type: 'generation',
      config: {
        type: 'stage_effects',
        count: 8,
        types: ['magic_particle', 'spell_effect', 'magical_lighting'],
        fantasy_elements: {
          magical_particles: true,
          spell_effects: true,
          fantasy_lighting: true
        }
      },
      dependencies: ['optimize_fantasy_stage'],
      parallel: true
    });

    // Fantasy World Generation Steps
    this.addStep({
      id: 'generate_fantasy_characters',
      name: 'Generate Fantasy Characters',
      description: 'Generate a diverse cast of fantasy characters',
      type: 'generation',
      config: {
        type: 'character_batch',
        count: 8,
        archetypes: ['rushdown', 'grappler', 'zoner', 'all_rounder', 'technical', 'power', 'speed', 'defensive'],
        themes: ['arcane', 'divine', 'elemental', 'shadow', 'nature', 'crystal', 'void', 'celestial'],
        fantasy_elements: {
          diverse_classes: true,
          magical_abilities: true,
          fantasy_weapons: true
        }
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_fantasy_stages',
      name: 'Generate Fantasy Stages',
      description: 'Generate diverse fantasy stages and environments',
      type: 'generation',
      config: {
        type: 'stage_batch',
        count: 6,
        themes: ['arcane_tower', 'divine_cathedral', 'elemental_realm', 'shadow_keep', 'nature_sanctuary', 'crystal_cavern'],
        fantasy_elements: {
          diverse_environments: true,
          magical_atmosphere: true,
          fantasy_architecture: true
        }
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_fantasy_stories',
      name: 'Generate Fantasy Stories',
      description: 'Generate epic fantasy stories and narratives',
      type: 'generation',
      config: {
        type: 'story_batch',
        count: 4,
        themes: ['heroic_quest', 'epic_war', 'mysterious_artifact', 'divine_intervention'],
        fantasy_elements: {
          epic_scope: true,
          magical_conflicts: true,
          heroic_themes: true
        }
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_fantasy_assets',
      name: 'Generate Fantasy Assets',
      description: 'Generate fantasy-themed visual and audio assets',
      type: 'generation',
      config: {
        type: 'asset_batch',
        count: 15,
        types: ['sprite', 'animation', 'sound', 'effect'],
        themes: ['arcane', 'divine', 'elemental', 'shadow', 'nature', 'crystal'],
        fantasy_elements: {
          magical_visuals: true,
          fantasy_sounds: true,
          mystical_effects: true
        }
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'generate_fantasy_combos',
      name: 'Generate Fantasy Combos',
      description: 'Generate fantasy-themed combo sequences',
      type: 'generation',
      config: {
        type: 'combo_batch',
        count: 12,
        difficulties: ['beginner', 'intermediate', 'advanced', 'expert'],
        fantasy_elements: {
          magical_combos: true,
          fantasy_terminology: true,
          mystical_effects: true
        }
      },
      dependencies: [],
      parallel: true
    });

    this.addStep({
      id: 'validate_fantasy_content',
      name: 'Validate Fantasy Content',
      description: 'Validate all fantasy content for thematic consistency',
      type: 'validation',
      config: {
        type: 'all',
        fantasy_validation: true,
        theme_consistency: true,
        magic_balance: true
      },
      dependencies: ['generate_fantasy_characters', 'generate_fantasy_stages', 'generate_fantasy_stories', 'generate_fantasy_assets', 'generate_fantasy_combos'],
      parallel: false
    });

    this.addStep({
      id: 'optimize_fantasy_content',
      name: 'Optimize Fantasy Content',
      description: 'Optimize all fantasy content for performance and consistency',
      type: 'optimization',
      config: {
        type: 'all',
        fantasy_optimization: true,
        magic_optimization: true
      },
      dependencies: ['validate_fantasy_content'],
      parallel: false
    });
  }

  public async generateFantasyContent(
    type: string,
    config: Partial<FantasyContentConfig> = {}
  ): Promise<GeneratedContent | null> {
    const mergedConfig = { ...this.fantasyConfig, ...config };
    
    // Select appropriate workflow based on type and config
    let workflowId = '';
    
    switch (type) {
      case 'character':
        if (mergedConfig.theme === 'dark_fantasy') {
          workflowId = 'dark_fantasy_character';
        } else {
          workflowId = 'high_fantasy_character';
        }
        break;
      case 'story':
        workflowId = 'epic_fantasy_story';
        break;
      case 'stage':
        workflowId = 'fantasy_stage';
        break;
      case 'world':
        workflowId = 'fantasy_world_generation';
        break;
      default:
        workflowId = 'high_fantasy_character';
    }

    const result = await this.executeWorkflow(workflowId, mergedConfig);
    
    if (result.success && result.content.length > 0) {
      return result.content[0];
    }
    
    return null;
  }

  public async generateFantasyWorld(config: Partial<FantasyContentConfig> = {}): Promise<GeneratedContent[]> {
    const result = await this.executeWorkflow('fantasy_world_generation', config);
    return result.content;
  }

  public getFantasyThemes(): string[] {
    return ['arcane', 'divine', 'elemental', 'shadow', 'nature', 'crystal', 'void', 'celestial', 'infernal', 'primal'];
  }

  public getFantasyStages(): string[] {
    return ['arcane_tower', 'divine_cathedral', 'elemental_realm', 'shadow_keep', 'nature_sanctuary', 'crystal_cavern', 'void_dimension', 'celestial_plane', 'infernal_abyss', 'primal_forest'];
  }

  public getFantasyStories(): string[] {
    return ['heroic_quest', 'tragic_prophecy', 'mysterious_artifact', 'epic_war', 'personal_journey', 'revenge_plot', 'redemption_arc', 'discovery_adventure', 'romantic_tale', 'divine_intervention'];
  }

  public updateFantasyConfig(config: Partial<FantasyContentConfig>): void {
    this.fantasyConfig = { ...this.fantasyConfig, ...config };
    Logger.info('Fantasy content configuration updated');
  }

  public getFantasyConfig(): FantasyContentConfig {
    return { ...this.fantasyConfig };
  }
}