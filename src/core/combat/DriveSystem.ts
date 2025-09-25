import { pc } from 'playcanvas';
import { Character } from '../../../types/character';
import { Logger } from '../utils/Logger';

export interface DriveAbility {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  duration: number;
  effects: {
    damage?: number;
    speed?: number;
    defense?: number;
    meterGain?: number;
    specialProperties?: string[];
  };
  requirements: {
    health?: number;
    meter?: number;
    state?: string[];
  };
}

export interface DriveConfig {
  maxDrive: number;
  driveRegenRate: number;
  driveDecayRate: number;
  driveDecayDelay: number;
  abilities: DriveAbility[];
}

export class DriveSystem {
  private app: pc.Application;
  private config: DriveConfig;
  private characterDrive: Map<string, number> = new Map();
  private driveCooldowns: Map<string, number> = new Map();
  private activeAbilities: Map<string, Map<string, number>> = new Map();
  private driveDecayTimers: Map<string, number> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeDriveSystem();
  }

  private initializeDriveSystem(): void {
    this.config = {
      maxDrive: 100,
      driveRegenRate: 0.2, // per frame
      driveDecayRate: 0.1, // per frame
      driveDecayDelay: 300, // 5 seconds at 60fps
      abilities: [
        // Universal Drive Abilities
        {
          id: 'drive_rush',
          name: 'Drive Rush',
          description: 'Quick dash forward with armor',
          cost: 25,
          cooldown: 180,
          duration: 30,
          effects: {
            speed: 2.0,
            defense: 0.5,
            specialProperties: ['armor', 'invincible_startup']
          },
          requirements: {
            meter: 25,
            state: ['idle', 'walking', 'crouching']
          }
        },
        {
          id: 'drive_impact',
          name: 'Drive Impact',
          description: 'Heavy attack that breaks armor',
          cost: 30,
          cooldown: 240,
          duration: 20,
          effects: {
            damage: 120,
            specialProperties: ['armor_break', 'wall_bounce']
          },
          requirements: {
            meter: 30,
            state: ['idle', 'walking', 'crouching', 'attacking']
          }
        },
        {
          id: 'drive_parry',
          name: 'Drive Parry',
          description: 'Perfect parry that restores drive',
          cost: 20,
          cooldown: 60,
          duration: 10,
          effects: {
            meterGain: 15,
            specialProperties: ['perfect_parry', 'frame_advantage']
          },
          requirements: {
            meter: 20,
            state: ['idle', 'walking', 'crouching']
          }
        },
        {
          id: 'drive_reversal',
          name: 'Drive Reversal',
          description: 'Counter-attack from blockstun',
          cost: 40,
          cooldown: 300,
          duration: 15,
          effects: {
            damage: 80,
            specialProperties: ['reversal', 'invincible']
          },
          requirements: {
            meter: 40,
            state: ['blockstun', 'hitstun']
          }
        },
        {
          id: 'drive_burnout',
          name: 'Drive Burnout',
          description: 'Temporary power boost at cost of drive',
          cost: 50,
          cooldown: 600,
          duration: 120,
          effects: {
            damage: 1.5,
            speed: 1.3,
            meterGain: 2.0,
            specialProperties: ['enhanced_moves', 'faster_recovery']
          },
          requirements: {
            meter: 50,
            health: 0.3 // 30% health or less
          }
        }
      ]
    };
  }

  public initializeCharacter(characterId: string): void {
    this.characterDrive.set(characterId, this.config.maxDrive);
    this.driveCooldowns.set(characterId, 0);
    this.activeAbilities.set(characterId, new Map());
    this.driveDecayTimers.set(characterId, 0);
  }

  public update(deltaTime: number): void {
    // Update drive for all characters
    for (const [characterId, currentDrive] of this.characterDrive.entries()) {
      let newDrive = currentDrive;

      // Check if character is in a state that regenerates drive
      if (this.shouldRegenDrive(characterId)) {
        newDrive = Math.min(this.config.maxDrive, currentDrive + this.config.driveRegenRate);
      } else {
        // Start decay timer if not regenerating
        const decayTimer = this.driveDecayTimers.get(characterId) || 0;
        if (decayTimer < this.config.driveDecayDelay) {
          this.driveDecayTimers.set(characterId, decayTimer + 1);
        } else {
          // Start decaying drive
          newDrive = Math.max(0, currentDrive - this.config.driveDecayRate);
        }
      }

      this.characterDrive.set(characterId, newDrive);
    }

    // Update cooldowns
    for (const [characterId, cooldown] of this.driveCooldowns.entries()) {
      if (cooldown > 0) {
        this.driveCooldowns.set(characterId, cooldown - 1);
      }
    }

    // Update active abilities
    for (const [characterId, abilities] of this.activeAbilities.entries()) {
      for (const [abilityId, duration] of abilities.entries()) {
        if (duration > 0) {
          abilities.set(abilityId, duration - 1);
        } else {
          // Ability expired
          abilities.delete(abilityId);
          this.onAbilityExpired(characterId, abilityId);
        }
      }
    }
  }

  private shouldRegenDrive(characterId: string): boolean {
    // Drive regenerates when character is in neutral state
    // This would check the character's current state
    return true; // Placeholder
  }

  public async useDriveAbility(characterId: string, abilityId: string, character: Character): Promise<boolean> {
    const ability = this.config.abilities.find(a => a.id === abilityId);
    if (!ability) {
      Logger.warn(`Drive ability ${abilityId} not found`);
      return false;
    }

    // Check requirements
    if (!this.checkRequirements(character, ability)) {
      Logger.warn(`Requirements not met for drive ability ${abilityId}`);
      return false;
    }

    // Check cooldown
    const cooldown = this.driveCooldowns.get(characterId) || 0;
    if (cooldown > 0) {
      Logger.warn(`Drive ability ${abilityId} is on cooldown`);
      return false;
    }

    // Check drive cost
    const currentDrive = this.characterDrive.get(characterId) || 0;
    if (currentDrive < ability.cost) {
      Logger.warn(`Not enough drive for ability ${abilityId}`);
      return false;
    }

    // Use the ability
    await this.executeDriveAbility(characterId, ability, character);

    // Update drive and cooldown
    this.characterDrive.set(characterId, currentDrive - ability.cost);
    this.driveCooldowns.set(characterId, ability.cooldown);

    // Reset decay timer
    this.driveDecayTimers.set(characterId, 0);

    Logger.info(`Character ${characterId} used drive ability ${ability.name}`);
    return true;
  }

  private checkRequirements(character: Character, ability: DriveAbility): boolean {
    // Check health requirement
    if (ability.requirements.health !== undefined) {
      const healthPercentage = character.health / character.maxHealth;
      if (healthPercentage > ability.requirements.health) {
        return false;
      }
    }

    // Check meter requirement
    if (ability.requirements.meter !== undefined) {
      if (character.meter < ability.requirements.meter) {
        return false;
      }
    }

    // Check state requirement
    if (ability.requirements.state && ability.requirements.state.length > 0) {
      if (!ability.requirements.state.includes(character.state)) {
        return false;
      }
    }

    return true;
  }

  private async executeDriveAbility(characterId: string, ability: DriveAbility, character: Character): Promise<void> {
    // Apply ability effects
    await this.applyAbilityEffects(characterId, ability, character);

    // Set ability as active
    const activeAbilities = this.activeAbilities.get(characterId) || new Map();
    activeAbilities.set(ability.id, ability.duration);
    this.activeAbilities.set(characterId, activeAbilities);

    // Trigger ability-specific logic
    await this.triggerAbilityLogic(characterId, ability, character);

    // Emit event
    this.app.fire('drive:ability_used', {
      characterId,
      abilityId: ability.id,
      character: character.id
    });
  }

  private async applyAbilityEffects(characterId: string, ability: DriveAbility, character: Character): Promise<void> {
    // Apply damage multiplier
    if (ability.effects.damage) {
      character.damageMultiplier = (character.damageMultiplier || 1.0) * ability.effects.damage;
    }

    // Apply speed multiplier
    if (ability.effects.speed) {
      character.speedMultiplier = (character.speedMultiplier || 1.0) * ability.effects.speed;
    }

    // Apply defense multiplier
    if (ability.effects.defense) {
      character.defenseMultiplier = (character.defenseMultiplier || 1.0) * ability.effects.defense;
    }

    // Apply meter gain multiplier
    if (ability.effects.meterGain) {
      character.meterGainMultiplier = (character.meterGainMultiplier || 1.0) * ability.effects.meterGain;
    }

    // Apply special properties
    if (ability.effects.specialProperties) {
      character.specialProperties = character.specialProperties || [];
      character.specialProperties.push(...ability.effects.specialProperties);
    }
  }

  private async triggerAbilityLogic(characterId: string, ability: DriveAbility, character: Character): Promise<void> {
    switch (ability.id) {
      case 'drive_rush':
        await this.triggerDriveRush(characterId, character);
        break;
      case 'drive_impact':
        await this.triggerDriveImpact(characterId, character);
        break;
      case 'drive_parry':
        await this.triggerDriveParry(characterId, character);
        break;
      case 'drive_reversal':
        await this.triggerDriveReversal(characterId, character);
        break;
      case 'drive_burnout':
        await this.triggerDriveBurnout(characterId, character);
        break;
    }
  }

  private async triggerDriveRush(characterId: string, character: Character): Promise<void> {
    // Implement drive rush logic
    const pos = character.entity.getPosition();
    const facing = character.facing;
    const newPos = pos.clone();
    newPos.x += facing * 2.0; // Rush forward
    character.entity.setPosition(newPos);

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        effects.spawn(pos.x, pos.y + 1.0, 'drive_rush');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('drive_rush');
      }
    } catch {}
  }

  private async triggerDriveImpact(characterId: string, character: Character): Promise<void> {
    // Implement drive impact logic
    character.state = 'attacking';
    character.currentMove = {
      name: 'drive_impact',
      data: {
        damage: 120,
        startup: 8,
        active: 4,
        recovery: 20,
        properties: ['armor_break', 'wall_bounce']
      },
      currentFrame: 0,
      phase: 'startup'
    };

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'drive_impact');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('drive_impact');
      }
    } catch {}
  }

  private async triggerDriveParry(characterId: string, character: Character): Promise<void> {
    // Implement drive parry logic
    character.state = 'parrying';
    character.parryWindow = 10; // 10 frames of parry window

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'drive_parry');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('drive_parry');
      }
    } catch {}
  }

  private async triggerDriveReversal(characterId: string, character: Character): Promise<void> {
    // Implement drive reversal logic
    character.state = 'attacking';
    character.currentMove = {
      name: 'drive_reversal',
      data: {
        damage: 80,
        startup: 4,
        active: 6,
        recovery: 15,
        properties: ['reversal', 'invincible']
      },
      currentFrame: 0,
      phase: 'startup'
    };

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'drive_reversal');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('drive_reversal');
      }
    } catch {}
  }

  private async triggerDriveBurnout(characterId: string, character: Character): Promise<void> {
    // Implement drive burnout logic
    // This is handled by the ability effects already applied

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'drive_burnout');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('drive_burnout');
      }
    } catch {}
  }

  private onAbilityExpired(characterId: string, abilityId: string): void {
    // Remove ability effects
    const character = this.getCharacterById(characterId);
    if (character) {
      this.removeAbilityEffects(characterId, abilityId, character);
    }

    // Emit event
    this.app.fire('drive:ability_expired', {
      characterId,
      abilityId
    });
  }

  private removeAbilityEffects(characterId: string, abilityId: string, character: Character): void {
    const ability = this.config.abilities.find(a => a.id === abilityId);
    if (!ability) return;

    // Remove damage multiplier
    if (ability.effects.damage) {
      character.damageMultiplier = (character.damageMultiplier || 1.0) / ability.effects.damage;
    }

    // Remove speed multiplier
    if (ability.effects.speed) {
      character.speedMultiplier = (character.speedMultiplier || 1.0) / ability.effects.speed;
    }

    // Remove defense multiplier
    if (ability.effects.defense) {
      character.defenseMultiplier = (character.defenseMultiplier || 1.0) / ability.effects.defense;
    }

    // Remove meter gain multiplier
    if (ability.effects.meterGain) {
      character.meterGainMultiplier = (character.meterGainMultiplier || 1.0) / ability.effects.meterGain;
    }

    // Remove special properties
    if (ability.effects.specialProperties && character.specialProperties) {
      character.specialProperties = character.specialProperties.filter(
        prop => !ability.effects.specialProperties!.includes(prop)
      );
    }
  }

  private getCharacterById(characterId: string): Character | undefined {
    // This would need to be implemented based on your character management system
    return undefined; // Placeholder
  }

  public getDrive(characterId: string): number {
    return this.characterDrive.get(characterId) || 0;
  }

  public getMaxDrive(): number {
    return this.config.maxDrive;
  }

  public getAvailableAbilities(characterId: string, character: Character): DriveAbility[] {
    return this.config.abilities.filter(ability => 
      this.checkRequirements(character, ability) &&
      (this.driveCooldowns.get(characterId) || 0) === 0 &&
      (this.characterDrive.get(characterId) || 0) >= ability.cost
    );
  }

  public isAbilityActive(characterId: string, abilityId: string): boolean {
    const abilities = this.activeAbilities.get(characterId);
    if (!abilities) return false;
    return abilities.has(abilityId) && (abilities.get(abilityId) || 0) > 0;
  }

  public getActiveAbilities(characterId: string): string[] {
    const abilities = this.activeAbilities.get(characterId);
    if (!abilities) return [];
    
    const active: string[] = [];
    for (const [abilityId, duration] of abilities.entries()) {
      if (duration > 0) {
        active.push(abilityId);
      }
    }
    return active;
  }

  public destroy(): void {
    this.characterDrive.clear();
    this.driveCooldowns.clear();
    this.activeAbilities.clear();
    this.driveDecayTimers.clear();
  }
}