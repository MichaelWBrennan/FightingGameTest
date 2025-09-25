import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface DynamicStage {
  id: string;
  name: string;
  description: string;
  baseStage: string;
  variants: StageVariant[];
  interactions: StageInteraction[];
  hazards: StageHazard[];
  weather: WeatherSystem;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  crowdReactions: CrowdReactionSystem;
  destructible: DestructibleSystem;
  interactive: InteractiveSystem;
}

export interface StageVariant {
  id: string;
  name: string;
  description: string;
  visual: {
    background: string;
    lighting: string;
    effects: string[];
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  audio: {
    music: string;
    ambient: string;
    crowd: string;
  };
  gameplay: {
    platforms: Platform[];
    boundaries: Boundary[];
    obstacles: Obstacle[];
  };
}

export interface StageInteraction {
  id: string;
  name: string;
  description: string;
  trigger: {
    condition: 'combo_count' | 'damage_dealt' | 'special_move' | 'time' | 'health';
    threshold: number;
    probability: number;
  };
  effect: {
    type: 'wall_break' | 'floor_crack' | 'object_destruction' | 'environmental_change' | 'stage_transition';
    visual: string;
    audio: string;
    duration: number;
  };
  gameplayImpact: {
    damage?: number;
    meterGain?: number;
    stageChange?: string;
    platformChange?: boolean;
    boundaryChange?: boolean;
  };
}

export interface StageHazard {
  id: string;
  name: string;
  description: string;
  type: 'fire' | 'electric' | 'ice' | 'poison' | 'explosion' | 'falling';
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  damage: number;
  duration: number;
  cooldown: number;
  trigger: {
    condition: 'time' | 'damage' | 'combo' | 'special_move';
    threshold: number;
  };
  visual: {
    effect: string;
    color: string;
    size: number;
  };
  audio: {
    sound: string;
    volume: number;
  };
}

export interface WeatherSystem {
  enabled: boolean;
  current: 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'wind';
  intensity: number; // 0-1
  effects: {
    visual: string[];
    audio: string[];
    gameplay: {
      visibility: number;
      movement: number;
      damage: number;
    };
  };
  transitions: {
    duration: number;
    probability: number;
  };
}

export interface CrowdReactionSystem {
  enabled: boolean;
  size: number;
  reactions: CrowdReaction[];
  atmosphere: {
    excitement: number;
    tension: number;
    energy: number;
  };
  chants: {
    enabled: boolean;
    frequency: number;
    intensity: number;
  };
}

export interface CrowdReaction {
  id: string;
  name: string;
  trigger: {
    condition: 'combo' | 'counter' | 'clutch' | 'comeback' | 'perfect' | 'special_move';
    threshold: number;
  };
  visual: {
    animation: string;
    effect: string;
    color: string;
  };
  audio: {
    cheer: string;
    boo: string;
    chant: string;
  };
  intensity: number;
  duration: number;
}

export interface DestructibleSystem {
  enabled: boolean;
  objects: DestructibleObject[];
  debris: DebrisSystem;
  physics: PhysicsSystem;
}

export interface DestructibleObject {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  health: number;
  maxHealth: number;
  resistance: number;
  debris: string[];
  effects: string[];
  audio: string;
}

export interface DebrisSystem {
  enabled: boolean;
  particles: string[];
  physics: boolean;
  duration: number;
  cleanup: boolean;
}

export interface PhysicsSystem {
  enabled: boolean;
  gravity: number;
  friction: number;
  bounce: number;
  wind: number;
}

export interface InteractiveSystem {
  enabled: boolean;
  objects: InteractiveObject[];
  triggers: InteractiveTrigger[];
  rewards: InteractiveReward[];
}

export interface InteractiveObject {
  id: string;
  name: string;
  type: 'platform' | 'obstacle' | 'powerup' | 'hazard' | 'decoration';
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  interaction: {
    type: 'touch' | 'hit' | 'use' | 'activate';
    range: number;
    cooldown: number;
  };
  effects: {
    visual: string;
    audio: string;
    gameplay: any;
  };
}

export interface InteractiveTrigger {
  id: string;
  name: string;
  condition: string;
  action: string;
  target: string;
  parameters: any;
}

export interface InteractiveReward {
  id: string;
  name: string;
  type: 'health' | 'meter' | 'damage' | 'speed' | 'defense';
  value: number;
  duration: number;
  visual: string;
  audio: string;
}

export interface Platform {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  type: 'solid' | 'breakable' | 'moving' | 'temporary';
  properties: {
    friction: number;
    bounce: number;
    damage: number;
    destructible: boolean;
  };
}

export interface Boundary {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  type: 'wall' | 'ceiling' | 'floor' | 'barrier';
  properties: {
    solid: boolean;
    damage: number;
    bounce: number;
    destructible: boolean;
  };
}

export interface Obstacle {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  type: 'static' | 'moving' | 'rotating' | 'oscillating';
  properties: {
    damage: number;
    knockback: number;
    destructible: boolean;
    interactive: boolean;
  };
}

export class DynamicStageSystem {
  private app: pc.Application;
  private dynamicStages: Map<string, DynamicStage> = new Map();
  private activeStage: DynamicStage | null = null;
  private stageState: Map<string, any> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeDynamicStageSystem();
  }

  private initializeDynamicStageSystem(): void {
    this.initializeDefaultStages();
  }

  private initializeDefaultStages(): void {
    // Metro City Dynamic Stage
    this.addDynamicStage({
      id: 'metro_city_dynamic',
      name: 'Metro City Dynamic',
      description: 'A dynamic version of Metro City with interactive elements',
      baseStage: 'metro_city',
      variants: [
        {
          id: 'metro_city_day',
          name: 'Metro City Day',
          description: 'Metro City during the day',
          visual: {
            background: 'metro_city_day_bg',
            lighting: 'bright',
            effects: ['sunlight', 'shadows'],
            colors: {
              primary: '#87CEEB',
              secondary: '#4682B4',
              accent: '#FFD700'
            }
          },
          audio: {
            music: 'metro_city_day_music',
            ambient: 'city_ambient',
            crowd: 'crowd_chatter'
          },
          gameplay: {
            platforms: [
              {
                id: 'platform_1',
                name: 'Main Platform',
                position: { x: 0, y: 0, z: 0 },
                size: { width: 20, height: 2, depth: 10 },
                type: 'solid',
                properties: {
                  friction: 0.8,
                  bounce: 0.1,
                  damage: 0,
                  destructible: false
                }
              }
            ],
            boundaries: [
              {
                id: 'wall_left',
                name: 'Left Wall',
                position: { x: -10, y: 0, z: 0 },
                size: { width: 1, height: 10, depth: 10 },
                type: 'wall',
                properties: {
                  solid: true,
                  damage: 0,
                  bounce: 0.5,
                  destructible: true
                }
              }
            ],
            obstacles: []
          }
        }
      ],
      interactions: [
        {
          id: 'wall_break',
          name: 'Wall Break',
          description: 'Break through the wall with enough force',
          trigger: {
            condition: 'damage_dealt',
            threshold: 500,
            probability: 0.8
          },
          effect: {
            type: 'wall_break',
            visual: 'wall_break_effect',
            audio: 'wall_break_sound',
            duration: 2000
          },
          gameplayImpact: {
            damage: 50,
            meterGain: 25,
            stageChange: 'metro_city_destroyed'
          }
        }
      ],
      hazards: [
        {
          id: 'fire_hazard',
          name: 'Fire Hazard',
          description: 'Fire that can damage fighters',
          type: 'fire',
          position: { x: 5, y: 0, z: 0 },
          size: { width: 2, height: 1, depth: 2 },
          damage: 10,
          duration: 5000,
          cooldown: 10000,
          trigger: {
            condition: 'time',
            threshold: 30000
          },
          visual: {
            effect: 'fire_effect',
            color: '#FF4500',
            size: 1.0
          },
          audio: {
            sound: 'fire_crackle',
            volume: 0.7
          }
        }
      ],
      weather: {
        enabled: true,
        current: 'clear',
        intensity: 0.5,
        effects: {
          visual: ['sunlight', 'shadows'],
          audio: ['wind', 'city_ambient'],
          gameplay: {
            visibility: 1.0,
            movement: 1.0,
            damage: 1.0
          }
        },
        transitions: {
          duration: 10000,
          probability: 0.1
        }
      },
      timeOfDay: 'day',
      crowdReactions: {
        enabled: true,
        size: 100,
        reactions: [
          {
            id: 'combo_reaction',
            name: 'Combo Reaction',
            trigger: {
              condition: 'combo',
              threshold: 5
            },
            visual: {
              animation: 'cheer',
              effect: 'confetti',
              color: '#FFD700'
            },
            audio: {
              cheer: 'crowd_cheer',
              boo: 'crowd_boo',
              chant: 'crowd_chant'
            },
            intensity: 0.8,
            duration: 3000
          }
        ],
        atmosphere: {
          excitement: 0.5,
          tension: 0.3,
          energy: 0.6
        },
        chants: {
          enabled: true,
          frequency: 0.3,
          intensity: 0.5
        }
      },
      destructible: {
        enabled: true,
        objects: [
          {
            id: 'barrel_1',
            name: 'Barrel',
            position: { x: 3, y: 0, z: 0 },
            size: { width: 1, height: 1, depth: 1 },
            health: 100,
            maxHealth: 100,
            resistance: 0.5,
            debris: ['barrel_debris_1', 'barrel_debris_2'],
            effects: ['explosion_effect'],
            audio: 'barrel_break'
          }
        ],
        debris: {
          enabled: true,
          particles: ['wood_chips', 'metal_shards'],
          physics: true,
          duration: 5000,
          cleanup: true
        },
        physics: {
          enabled: true,
          gravity: 9.81,
          friction: 0.8,
          bounce: 0.3,
          wind: 0.1
        }
      },
      interactive: {
        enabled: true,
        objects: [
          {
            id: 'powerup_1',
            name: 'Health Powerup',
            type: 'powerup',
            position: { x: 0, y: 2, z: 0 },
            size: { width: 0.5, height: 0.5, depth: 0.5 },
            interaction: {
              type: 'touch',
              range: 1.0,
              cooldown: 30000
            },
            effects: {
              visual: 'health_glow',
              audio: 'powerup_sound',
              gameplay: { health: 50 }
            }
          }
        ],
        triggers: [],
        rewards: []
      }
    });
  }

  public addDynamicStage(stage: DynamicStage): void {
    this.dynamicStages.set(stage.id, stage);
    this.app.fire('stage:dynamic_stage_added', { stage });
    Logger.info(`Added dynamic stage: ${stage.name}`);
  }

  public setActiveStage(stageId: string): boolean {
    const stage = this.dynamicStages.get(stageId);
    if (!stage) {
      Logger.warn(`Dynamic stage ${stageId} not found`);
      return false;
    }

    this.activeStage = stage;
    this.initializeStageState(stage);

    this.app.fire('stage:dynamic_stage_activated', { stage });
    Logger.info(`Activated dynamic stage: ${stage.name}`);
    return true;
  }

  private initializeStageState(stage: DynamicStage): void {
    this.stageState.set('current_variant', 0);
    this.stageState.set('weather', stage.weather.current);
    this.stageState.set('time_of_day', stage.timeOfDay);
    this.stageState.set('destructible_objects', new Map());
    this.stageState.set('interactive_objects', new Map());
    this.stageState.set('hazards', new Map());
    this.stageState.set('crowd_atmosphere', stage.crowdReactions.atmosphere);
  }

  public updateStage(deltaTime: number): void {
    if (!this.activeStage) return;

    this.updateWeather(deltaTime);
    this.updateHazards(deltaTime);
    this.updateDestructibleObjects(deltaTime);
    this.updateInteractiveObjects(deltaTime);
    this.updateCrowdReactions(deltaTime);
  }

  private updateWeather(deltaTime: number): void {
    if (!this.activeStage?.weather.enabled) return;

    // Update weather system
    const weather = this.activeStage.weather;
    const currentWeather = this.stageState.get('weather');
    
    // Check for weather transitions
    if (Math.random() < weather.transitions.probability) {
      const weathers = ['clear', 'rain', 'snow', 'fog', 'storm', 'wind'];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      
      if (newWeather !== currentWeather) {
        this.stageState.set('weather', newWeather);
        this.triggerWeatherChange(newWeather);
      }
    }
  }

  private updateHazards(deltaTime: number): void {
    if (!this.activeStage?.hazards) return;

    for (const hazard of this.activeStage.hazards) {
      const hazardState = this.stageState.get('hazards').get(hazard.id);
      if (!hazardState) continue;

      // Update hazard cooldown
      if (hazardState.cooldown > 0) {
        hazardState.cooldown -= deltaTime;
      }

      // Check for hazard activation
      if (hazardState.cooldown <= 0 && this.checkHazardTrigger(hazard)) {
        this.activateHazard(hazard);
        hazardState.cooldown = hazard.cooldown;
      }
    }
  }

  private updateDestructibleObjects(deltaTime: number): void {
    if (!this.activeStage?.destructible.enabled) return;

    const destructibleObjects = this.stageState.get('destructible_objects');
    for (const [objectId, objectState] of destructibleObjects.entries()) {
      // Update object state
      if (objectState.health <= 0 && !objectState.destroyed) {
        this.destroyObject(objectId, objectState);
        objectState.destroyed = true;
      }
    }
  }

  private updateInteractiveObjects(deltaTime: number): void {
    if (!this.activeStage?.interactive.enabled) return;

    const interactiveObjects = this.stageState.get('interactive_objects');
    for (const [objectId, objectState] of interactiveObjects.entries()) {
      // Update object cooldown
      if (objectState.cooldown > 0) {
        objectState.cooldown -= deltaTime;
      }
    }
  }

  private updateCrowdReactions(deltaTime: number): void {
    if (!this.activeStage?.crowdReactions.enabled) return;

    const atmosphere = this.stageState.get('crowd_atmosphere');
    
    // Update crowd atmosphere based on match intensity
    // This would be updated based on actual match events
    atmosphere.excitement = Math.min(1.0, atmosphere.excitement + 0.01);
    atmosphere.tension = Math.max(0.0, atmosphere.tension - 0.005);
    atmosphere.energy = Math.min(1.0, atmosphere.energy + 0.02);
  }

  private checkHazardTrigger(hazard: StageHazard): boolean {
    switch (hazard.trigger.condition) {
      case 'time':
        return Math.random() < hazard.trigger.threshold / 1000;
      case 'damage':
        return this.getTotalDamageDealt() >= hazard.trigger.threshold;
      case 'combo':
        return this.getMaxComboCount() >= hazard.trigger.threshold;
      case 'special_move':
        return this.getSpecialMoveCount() >= hazard.trigger.threshold;
      default:
        return false;
    }
  }

  private activateHazard(hazard: StageHazard): void {
    this.app.fire('stage:hazard_activated', { hazard });
    Logger.info(`Activated hazard: ${hazard.name}`);
  }

  private destroyObject(objectId: string, objectState: any): void {
    this.app.fire('stage:object_destroyed', { objectId, objectState });
    Logger.info(`Destroyed object: ${objectId}`);
  }

  private triggerWeatherChange(newWeather: string): void {
    this.app.fire('stage:weather_changed', { weather: newWeather });
    Logger.info(`Weather changed to: ${newWeather}`);
  }

  private getTotalDamageDealt(): number {
    // This would get the total damage dealt in the current match
    return 0; // Placeholder
  }

  private getMaxComboCount(): number {
    // This would get the maximum combo count in the current match
    return 0; // Placeholder
  }

  private getSpecialMoveCount(): number {
    // This would get the special move count in the current match
    return 0; // Placeholder
  }

  public getDynamicStages(): DynamicStage[] {
    return Array.from(this.dynamicStages.values());
  }

  public getDynamicStage(id: string): DynamicStage | undefined {
    return this.dynamicStages.get(id);
  }

  public getActiveStage(): DynamicStage | null {
    return this.activeStage;
  }

  public destroy(): void {
    this.dynamicStages.clear();
    this.stageState.clear();
    this.activeStage = null;
  }
}