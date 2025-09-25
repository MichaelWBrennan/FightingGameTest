import { pc } from 'playcanvas';
import { Character } from '../../../types/character';
import { Logger } from '../utils/Logger';

export interface CharacterMechanic {
  id: string;
  name: string;
  description: string;
  type: 'install' | 'resource' | 'stance' | 'special' | 'unique';
  requirements: {
    health?: number;
    meter?: number;
    state?: string[];
    comboCount?: number;
  };
  effects: {
    damage?: number;
    speed?: number;
    defense?: number;
    meterGain?: number;
    specialProperties?: string[];
    moveModifications?: MoveModification[];
  };
  duration?: number;
  cooldown?: number;
  cost?: number;
}

export interface MoveModification {
  moveId: string;
  modifications: {
    damage?: number;
    startup?: number;
    active?: number;
    recovery?: number;
    properties?: string[];
  };
}

export interface InstallMode {
  id: string;
  name: string;
  description: string;
  duration: number;
  effects: {
    damage: number;
    speed: number;
    defense: number;
    meterGain: number;
    specialProperties: string[];
  };
  requirements: {
    health: number;
    meter: number;
  };
  cooldown: number;
  cost: number;
}

export class CharacterMechanics {
  private app: pc.Application;
  private characterMechanics: Map<string, CharacterMechanic[]> = new Map();
  private installModes: Map<string, InstallMode[]> = new Map();
  private activeMechanics: Map<string, Map<string, number>> = new Map();
  private activeInstalls: Map<string, Map<string, number>> = new Map();
  private mechanicCooldowns: Map<string, Map<string, number>> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeCharacterMechanics();
  }

  private initializeCharacterMechanics(): void {
    // Ryu Mechanics
    this.characterMechanics.set('ryu', [
      {
        id: 'denjin_mode',
        name: 'Denjin Mode',
        description: 'Charges up for enhanced special moves',
        type: 'install',
        requirements: {
          meter: 50,
          state: ['idle', 'walking', 'crouching']
        },
        effects: {
          damage: 1.2,
          meterGain: 1.5,
          specialProperties: ['enhanced_specials', 'denjin_charge']
        },
        duration: 300, // 5 seconds
        cooldown: 600, // 10 seconds
        cost: 50
      },
      {
        id: 'v_system',
        name: 'V-System',
        description: 'Unique V-Skill and V-Trigger abilities',
        type: 'special',
        requirements: {
          meter: 25
        },
        effects: {
          specialProperties: ['v_skill', 'v_trigger']
        },
        cost: 25
      }
    ]);

    // Ken Mechanics
    this.characterMechanics.set('ken', [
      {
        id: 'jinrai_mode',
        name: 'Jinrai Mode',
        description: 'Enhanced rushdown capabilities',
        type: 'install',
        requirements: {
          meter: 40,
          state: ['idle', 'walking', 'crouching']
        },
        effects: {
          speed: 1.3,
          damage: 1.1,
          specialProperties: ['enhanced_rushdown', 'jinrai_combos']
        },
        duration: 240, // 4 seconds
        cooldown: 480, // 8 seconds
        cost: 40
      },
      {
        id: 'run_cancel',
        name: 'Run Cancel',
        description: 'Cancel moves into run for pressure',
        type: 'special',
        requirements: {
          meter: 15
        },
        effects: {
          specialProperties: ['run_cancel', 'pressure_enhancement']
        },
        cost: 15
      }
    ]);

    // Chun-Li Mechanics
    this.characterMechanics.set('chun_li', [
      {
        id: 'stance_system',
        name: 'Stance System',
        description: 'Switch between different fighting stances',
        type: 'stance',
        requirements: {
          meter: 20
        },
        effects: {
          specialProperties: ['stance_switch', 'stance_combos']
        },
        cost: 20
      },
      {
        id: 'legs_of_fury',
        name: 'Legs of Fury',
        description: 'Enhanced kick combos and pressure',
        type: 'install',
        requirements: {
          meter: 60,
          comboCount: 3
        },
        effects: {
          damage: 1.3,
          speed: 1.2,
          specialProperties: ['enhanced_kicks', 'leg_combos']
        },
        duration: 360, // 6 seconds
        cooldown: 720, // 12 seconds
        cost: 60
      }
    ]);

    // Zangief Mechanics
    this.characterMechanics.set('zangief', [
      {
        id: 'iron_muscle',
        name: 'Iron Muscle',
        description: 'Temporary armor and enhanced grabs',
        type: 'install',
        requirements: {
          meter: 45,
          health: 0.5 // 50% health or less
        },
        effects: {
          defense: 1.5,
          damage: 1.4,
          specialProperties: ['armor', 'enhanced_grabs', 'iron_muscle']
        },
        duration: 420, // 7 seconds
        cooldown: 900, // 15 seconds
        cost: 45
      },
      {
        id: 'spinning_piledriver',
        name: 'Spinning Piledriver',
        description: '360-degree command grab with armor',
        type: 'special',
        requirements: {
          meter: 30
        },
        effects: {
          damage: 150,
          specialProperties: ['command_grab', 'armor', 'spinning']
        },
        cost: 30
      }
    ]);

    // Dhalsim Mechanics
    this.characterMechanics.set('dhalsim', [
      {
        id: 'yoga_flame_charge',
        name: 'Yoga Flame Charge',
        description: 'Charges up for enhanced fire attacks',
        type: 'resource',
        requirements: {
          meter: 25
        },
        effects: {
          damage: 1.3,
          specialProperties: ['enhanced_fire', 'yoga_charge']
        },
        duration: 180, // 3 seconds
        cooldown: 300, // 5 seconds
        cost: 25
      },
      {
        id: 'yoga_teleport',
        name: 'Yoga Teleport',
        description: 'Teleport behind opponent',
        type: 'special',
        requirements: {
          meter: 20
        },
        effects: {
          specialProperties: ['teleport', 'behind_opponent']
        },
        cost: 20
      }
    ]);

    // Akuma Mechanics
    this.characterMechanics.set('akuma', [
      {
        id: 'demon_mode',
        name: 'Demon Mode',
        description: 'Transforms into demon form with enhanced abilities',
        type: 'install',
        requirements: {
          meter: 75,
          health: 0.25 // 25% health or less
        },
        effects: {
          damage: 1.5,
          speed: 1.4,
          meterGain: 2.0,
          specialProperties: ['demon_form', 'enhanced_specials', 'demon_rage']
        },
        duration: 600, // 10 seconds
        cooldown: 1200, // 20 seconds
        cost: 75
      },
      {
        id: 'rage_art',
        name: 'Rage Art',
        description: 'Ultimate attack that consumes all meter',
        type: 'special',
        requirements: {
          meter: 100
        },
        effects: {
          damage: 300,
          specialProperties: ['ultimate_attack', 'cinematic', 'rage_art']
        },
        cost: 100
      }
    ]);

    // Initialize Install Modes
    this.initializeInstallModes();
  }

  private initializeInstallModes(): void {
    // Ryu Install Modes
    this.installModes.set('ryu', [
      {
        id: 'denjin_install',
        name: 'Denjin Install',
        description: 'Powers up all special moves with electricity',
        duration: 300,
        effects: {
          damage: 1.3,
          speed: 1.1,
          defense: 0.9,
          meterGain: 1.8,
          specialProperties: ['denjin_power', 'electric_effects', 'enhanced_specials']
        },
        requirements: {
          health: 0.3,
          meter: 75
        },
        cooldown: 900,
        cost: 75
      }
    ]);

    // Ken Install Modes
    this.installModes.set('ken', [
      {
        id: 'jinrai_install',
        name: 'Jinrai Install',
        description: 'Maximum rushdown potential with enhanced mobility',
        duration: 240,
        effects: {
          damage: 1.2,
          speed: 1.5,
          defense: 0.8,
          meterGain: 1.6,
          specialProperties: ['jinrai_power', 'enhanced_mobility', 'rushdown_boost']
        },
        requirements: {
          health: 0.4,
          meter: 60
        },
        cooldown: 720,
        cost: 60
      }
    ]);

    // Chun-Li Install Modes
    this.installModes.set('chun_li', [
      {
        id: 'legs_of_fury_install',
        name: 'Legs of Fury Install',
        description: 'Maximum kick power and combo potential',
        duration: 360,
        effects: {
          damage: 1.4,
          speed: 1.3,
          defense: 0.9,
          meterGain: 1.7,
          specialProperties: ['legs_power', 'enhanced_kicks', 'combo_boost']
        },
        requirements: {
          health: 0.5,
          meter: 80
        },
        cooldown: 1080,
        cost: 80
      }
    ]);

    // Zangief Install Modes
    this.installModes.set('zangief', [
      {
        id: 'iron_muscle_install',
        name: 'Iron Muscle Install',
        description: 'Maximum strength and durability',
        duration: 420,
        effects: {
          damage: 1.6,
          speed: 0.8,
          defense: 2.0,
          meterGain: 1.2,
          specialProperties: ['iron_power', 'maximum_armor', 'enhanced_grabs']
        },
        requirements: {
          health: 0.2,
          meter: 90
        },
        cooldown: 1200,
        cost: 90
      }
    ]);

    // Dhalsim Install Modes
    this.installModes.set('dhalsim', [
      {
        id: 'yoga_master_install',
        name: 'Yoga Master Install',
        description: 'Maximum yoga power and range',
        duration: 300,
        effects: {
          damage: 1.3,
          speed: 1.2,
          defense: 1.1,
          meterGain: 1.9,
          specialProperties: ['yoga_master', 'enhanced_range', 'yoga_power']
        },
        requirements: {
          health: 0.3,
          meter: 70
        },
        cooldown: 900,
        cost: 70
      }
    ]);

    // Akuma Install Modes
    this.installModes.set('akuma', [
      {
        id: 'demon_install',
        name: 'Demon Install',
        description: 'Transforms into ultimate demon form',
        duration: 600,
        effects: {
          damage: 1.8,
          speed: 1.6,
          defense: 0.7,
          meterGain: 2.5,
          specialProperties: ['demon_form', 'ultimate_power', 'demon_rage']
        },
        requirements: {
          health: 0.1,
          meter: 100
        },
        cooldown: 1800,
        cost: 100
      }
    ]);
  }

  public initializeCharacter(characterId: string): void {
    this.activeMechanics.set(characterId, new Map());
    this.activeInstalls.set(characterId, new Map());
    this.mechanicCooldowns.set(characterId, new Map());
  }

  public update(deltaTime: number): void {
    // Update active mechanics
    for (const [characterId, mechanics] of this.activeMechanics.entries()) {
      for (const [mechanicId, duration] of mechanics.entries()) {
        if (duration > 0) {
          mechanics.set(mechanicId, duration - 1);
        } else {
          // Mechanic expired
          mechanics.delete(mechanicId);
          this.onMechanicExpired(characterId, mechanicId);
        }
      }
    }

    // Update active installs
    for (const [characterId, installs] of this.activeInstalls.entries()) {
      for (const [installId, duration] of installs.entries()) {
        if (duration > 0) {
          installs.set(installId, duration - 1);
        } else {
          // Install expired
          installs.delete(installId);
          this.onInstallExpired(characterId, installId);
        }
      }
    }

    // Update cooldowns
    for (const [characterId, cooldowns] of this.mechanicCooldowns.entries()) {
      for (const [mechanicId, cooldown] of cooldowns.entries()) {
        if (cooldown > 0) {
          cooldowns.set(mechanicId, cooldown - 1);
        }
      }
    }
  }

  public async useMechanic(characterId: string, mechanicId: string, character: Character): Promise<boolean> {
    const mechanics = this.characterMechanics.get(characterId);
    if (!mechanics) {
      Logger.warn(`No mechanics found for character ${characterId}`);
      return false;
    }

    const mechanic = mechanics.find(m => m.id === mechanicId);
    if (!mechanic) {
      Logger.warn(`Mechanic ${mechanicId} not found for character ${characterId}`);
      return false;
    }

    // Check requirements
    if (!this.checkMechanicRequirements(character, mechanic)) {
      Logger.warn(`Requirements not met for mechanic ${mechanicId}`);
      return false;
    }

    // Check cooldown
    const cooldowns = this.mechanicCooldowns.get(characterId) || new Map();
    if ((cooldowns.get(mechanicId) || 0) > 0) {
      Logger.warn(`Mechanic ${mechanicId} is on cooldown`);
      return false;
    }

    // Check cost
    if (mechanic.cost && character.meter < mechanic.cost) {
      Logger.warn(`Not enough meter for mechanic ${mechanicId}`);
      return false;
    }

    // Use the mechanic
    await this.executeMechanic(characterId, mechanic, character);

    // Update cooldown
    if (mechanic.cooldown) {
      cooldowns.set(mechanicId, mechanic.cooldown);
      this.mechanicCooldowns.set(characterId, cooldowns);
    }

    // Update meter
    if (mechanic.cost) {
      character.meter = Math.max(0, character.meter - mechanic.cost);
    }

    Logger.info(`Character ${characterId} used mechanic ${mechanic.name}`);
    return true;
  }

  public async useInstallMode(characterId: string, installId: string, character: Character): Promise<boolean> {
    const installs = this.installModes.get(characterId);
    if (!installs) {
      Logger.warn(`No install modes found for character ${characterId}`);
      return false;
    }

    const install = installs.find(i => i.id === installId);
    if (!install) {
      Logger.warn(`Install mode ${installId} not found for character ${characterId}`);
      return false;
    }

    // Check requirements
    if (!this.checkInstallRequirements(character, install)) {
      Logger.warn(`Requirements not met for install mode ${installId}`);
      return false;
    }

    // Check if already in install mode
    const activeInstalls = this.activeInstalls.get(characterId) || new Map();
    if (activeInstalls.size > 0) {
      Logger.warn(`Character ${characterId} is already in an install mode`);
      return false;
    }

    // Use the install mode
    await this.executeInstallMode(characterId, install, character);

    // Set as active
    activeInstalls.set(installId, install.duration);
    this.activeInstalls.set(characterId, activeInstalls);

    // Update meter
    character.meter = Math.max(0, character.meter - install.cost);

    Logger.info(`Character ${characterId} activated install mode ${install.name}`);
    return true;
  }

  private checkMechanicRequirements(character: Character, mechanic: CharacterMechanic): boolean {
    // Check health requirement
    if (mechanic.requirements.health !== undefined) {
      const healthPercentage = character.health / character.maxHealth;
      if (healthPercentage > mechanic.requirements.health) {
        return false;
      }
    }

    // Check meter requirement
    if (mechanic.requirements.meter !== undefined) {
      if (character.meter < mechanic.requirements.meter) {
        return false;
      }
    }

    // Check state requirement
    if (mechanic.requirements.state && mechanic.requirements.state.length > 0) {
      if (!mechanic.requirements.state.includes(character.state)) {
        return false;
      }
    }

    // Check combo count requirement
    if (mechanic.requirements.comboCount !== undefined) {
      const comboCount = (character as any).comboCount || 0;
      if (comboCount < mechanic.requirements.comboCount) {
        return false;
      }
    }

    return true;
  }

  private checkInstallRequirements(character: Character, install: InstallMode): boolean {
    // Check health requirement
    const healthPercentage = character.health / character.maxHealth;
    if (healthPercentage > install.requirements.health) {
      return false;
    }

    // Check meter requirement
    if (character.meter < install.requirements.meter) {
      return false;
    }

    return true;
  }

  private async executeMechanic(characterId: string, mechanic: CharacterMechanic, character: Character): Promise<void> {
    // Apply mechanic effects
    await this.applyMechanicEffects(characterId, mechanic, character);

    // Set as active if it has duration
    if (mechanic.duration) {
      const activeMechanics = this.activeMechanics.get(characterId) || new Map();
      activeMechanics.set(mechanic.id, mechanic.duration);
      this.activeMechanics.set(characterId, activeMechanics);
    }

    // Trigger mechanic-specific logic
    await this.triggerMechanicLogic(characterId, mechanic, character);

    // Emit event
    this.app.fire('character:mechanic_used', {
      characterId,
      mechanicId: mechanic.id,
      character: character.id
    });
  }

  private async executeInstallMode(characterId: string, install: InstallMode, character: Character): Promise<void> {
    // Apply install effects
    await this.applyInstallEffects(characterId, install, character);

    // Trigger install-specific logic
    await this.triggerInstallLogic(characterId, install, character);

    // Emit event
    this.app.fire('character:install_activated', {
      characterId,
      installId: install.id,
      character: character.id
    });
  }

  private async applyMechanicEffects(characterId: string, mechanic: CharacterMechanic, character: Character): Promise<void> {
    // Apply damage multiplier
    if (mechanic.effects.damage) {
      character.damageMultiplier = (character.damageMultiplier || 1.0) * mechanic.effects.damage;
    }

    // Apply speed multiplier
    if (mechanic.effects.speed) {
      character.speedMultiplier = (character.speedMultiplier || 1.0) * mechanic.effects.speed;
    }

    // Apply defense multiplier
    if (mechanic.effects.defense) {
      character.defenseMultiplier = (character.defenseMultiplier || 1.0) * mechanic.effects.defense;
    }

    // Apply meter gain multiplier
    if (mechanic.effects.meterGain) {
      character.meterGainMultiplier = (character.meterGainMultiplier || 1.0) * mechanic.effects.meterGain;
    }

    // Apply special properties
    if (mechanic.effects.specialProperties) {
      character.specialProperties = character.specialProperties || [];
      character.specialProperties.push(...mechanic.effects.specialProperties);
    }

    // Apply move modifications
    if (mechanic.effects.moveModifications) {
      character.moveModifications = character.moveModifications || [];
      character.moveModifications.push(...mechanic.effects.moveModifications);
    }
  }

  private async applyInstallEffects(characterId: string, install: InstallMode, character: Character): Promise<void> {
    // Apply install effects
    character.damageMultiplier = (character.damageMultiplier || 1.0) * install.effects.damage;
    character.speedMultiplier = (character.speedMultiplier || 1.0) * install.effects.speed;
    character.defenseMultiplier = (character.defenseMultiplier || 1.0) * install.effects.defense;
    character.meterGainMultiplier = (character.meterGainMultiplier || 1.0) * install.effects.meterGain;

    // Apply special properties
    character.specialProperties = character.specialProperties || [];
    character.specialProperties.push(...install.effects.specialProperties);
  }

  private async triggerMechanicLogic(characterId: string, mechanic: CharacterMechanic, character: Character): Promise<void> {
    // Trigger mechanic-specific logic
    switch (mechanic.id) {
      case 'denjin_mode':
        await this.triggerDenjinMode(characterId, character);
        break;
      case 'jinrai_mode':
        await this.triggerJinraiMode(characterId, character);
        break;
      case 'stance_system':
        await this.triggerStanceSystem(characterId, character);
        break;
      case 'iron_muscle':
        await this.triggerIronMuscle(characterId, character);
        break;
      case 'yoga_flame_charge':
        await this.triggerYogaFlameCharge(characterId, character);
        break;
      case 'demon_mode':
        await this.triggerDemonMode(characterId, character);
        break;
    }
  }

  private async triggerInstallLogic(characterId: string, install: InstallMode, character: Character): Promise<void> {
    // Trigger install-specific logic
    switch (install.id) {
      case 'denjin_install':
        await this.triggerDenjinInstall(characterId, character);
        break;
      case 'jinrai_install':
        await this.triggerJinraiInstall(characterId, character);
        break;
      case 'legs_of_fury_install':
        await this.triggerLegsOfFuryInstall(characterId, character);
        break;
      case 'iron_muscle_install':
        await this.triggerIronMuscleInstall(characterId, character);
        break;
      case 'yoga_master_install':
        await this.triggerYogaMasterInstall(characterId, character);
        break;
      case 'demon_install':
        await this.triggerDemonInstall(characterId, character);
        break;
    }
  }

  // Mechanic-specific implementations
  private async triggerDenjinMode(characterId: string, character: Character): Promise<void> {
    // Implement Denjin Mode logic
    character.state = 'charging';
    character.charging = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'denjin_mode');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('denjin_mode');
      }
    } catch {}
  }

  private async triggerJinraiMode(characterId: string, character: Character): Promise<void> {
    // Implement Jinrai Mode logic
    character.state = 'rushing';
    character.rushing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'jinrai_mode');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('jinrai_mode');
      }
    } catch {}
  }

  private async triggerStanceSystem(characterId: string, character: Character): Promise<void> {
    // Implement Stance System logic
    character.state = 'stance_switching';
    character.stance = (character.stance || 0) + 1;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'stance_switch');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('stance_switch');
      }
    } catch {}
  }

  private async triggerIronMuscle(characterId: string, character: Character): Promise<void> {
    // Implement Iron Muscle logic
    character.state = 'flexing';
    character.armor = 3; // 3 hits of armor

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'iron_muscle');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('iron_muscle');
      }
    } catch {}
  }

  private async triggerYogaFlameCharge(characterId: string, character: Character): Promise<void> {
    // Implement Yoga Flame Charge logic
    character.state = 'charging';
    character.charging = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'yoga_flame_charge');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('yoga_flame_charge');
      }
    } catch {}
  }

  private async triggerDemonMode(characterId: string, character: Character): Promise<void> {
    // Implement Demon Mode logic
    character.state = 'transforming';
    character.transforming = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'demon_mode');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('demon_mode');
      }
    } catch {}
  }

  // Install-specific implementations
  private async triggerDenjinInstall(characterId: string, character: Character): Promise<void> {
    // Implement Denjin Install logic
    character.state = 'installing';
    character.installing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'denjin_install');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('denjin_install');
      }
    } catch {}
  }

  private async triggerJinraiInstall(characterId: string, character: Character): Promise<void> {
    // Implement Jinrai Install logic
    character.state = 'installing';
    character.installing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'jinrai_install');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('jinrai_install');
      }
    } catch {}
  }

  private async triggerLegsOfFuryInstall(characterId: string, character: Character): Promise<void> {
    // Implement Legs of Fury Install logic
    character.state = 'installing';
    character.installing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'legs_of_fury_install');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('legs_of_fury_install');
      }
    } catch {}
  }

  private async triggerIronMuscleInstall(characterId: string, character: Character): Promise<void> {
    // Implement Iron Muscle Install logic
    character.state = 'installing';
    character.installing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'iron_muscle_install');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('iron_muscle_install');
      }
    } catch {}
  }

  private async triggerYogaMasterInstall(characterId: string, character: Character): Promise<void> {
    // Implement Yoga Master Install logic
    character.state = 'installing';
    character.installing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'yoga_master_install');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('yoga_master_install');
      }
    } catch {}
  }

  private async triggerDemonInstall(characterId: string, character: Character): Promise<void> {
    // Implement Demon Install logic
    character.state = 'installing';
    character.installing = true;

    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'demon_install');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('demon_install');
      }
    } catch {}
  }

  private onMechanicExpired(characterId: string, mechanicId: string): void {
    // Remove mechanic effects
    const character = this.getCharacterById(characterId);
    if (character) {
      this.removeMechanicEffects(characterId, mechanicId, character);
    }

    // Emit event
    this.app.fire('character:mechanic_expired', {
      characterId,
      mechanicId
    });
  }

  private onInstallExpired(characterId: string, installId: string): void {
    // Remove install effects
    const character = this.getCharacterById(characterId);
    if (character) {
      this.removeInstallEffects(characterId, installId, character);
    }

    // Emit event
    this.app.fire('character:install_expired', {
      characterId,
      installId
    });
  }

  private removeMechanicEffects(characterId: string, mechanicId: string, character: Character): void {
    const mechanics = this.characterMechanics.get(characterId);
    if (!mechanics) return;

    const mechanic = mechanics.find(m => m.id === mechanicId);
    if (!mechanic) return;

    // Remove damage multiplier
    if (mechanic.effects.damage) {
      character.damageMultiplier = (character.damageMultiplier || 1.0) / mechanic.effects.damage;
    }

    // Remove speed multiplier
    if (mechanic.effects.speed) {
      character.speedMultiplier = (character.speedMultiplier || 1.0) / mechanic.effects.speed;
    }

    // Remove defense multiplier
    if (mechanic.effects.defense) {
      character.defenseMultiplier = (character.defenseMultiplier || 1.0) / mechanic.effects.defense;
    }

    // Remove meter gain multiplier
    if (mechanic.effects.meterGain) {
      character.meterGainMultiplier = (character.meterGainMultiplier || 1.0) / mechanic.effects.meterGain;
    }

    // Remove special properties
    if (mechanic.effects.specialProperties && character.specialProperties) {
      character.specialProperties = character.specialProperties.filter(
        prop => !mechanic.effects.specialProperties!.includes(prop)
      );
    }

    // Remove move modifications
    if (mechanic.effects.moveModifications && character.moveModifications) {
      character.moveModifications = character.moveModifications.filter(
        mod => !mechanic.effects.moveModifications!.includes(mod)
      );
    }
  }

  private removeInstallEffects(characterId: string, installId: string, character: Character): void {
    const installs = this.installModes.get(characterId);
    if (!installs) return;

    const install = installs.find(i => i.id === installId);
    if (!install) return;

    // Remove install effects
    character.damageMultiplier = (character.damageMultiplier || 1.0) / install.effects.damage;
    character.speedMultiplier = (character.speedMultiplier || 1.0) / install.effects.speed;
    character.defenseMultiplier = (character.defenseMultiplier || 1.0) / install.effects.defense;
    character.meterGainMultiplier = (character.meterGainMultiplier || 1.0) / install.effects.meterGain;

    // Remove special properties
    if (character.specialProperties) {
      character.specialProperties = character.specialProperties.filter(
        prop => !install.effects.specialProperties.includes(prop)
      );
    }
  }

  private getCharacterById(characterId: string): Character | undefined {
    // This would need to be implemented based on your character management system
    return undefined; // Placeholder
  }

  public getAvailableMechanics(characterId: string, character: Character): CharacterMechanic[] {
    const mechanics = this.characterMechanics.get(characterId);
    if (!mechanics) return [];

    return mechanics.filter(mechanic => 
      this.checkMechanicRequirements(character, mechanic) &&
      (this.mechanicCooldowns.get(characterId)?.get(mechanic.id) || 0) === 0
    );
  }

  public getAvailableInstalls(characterId: string, character: Character): InstallMode[] {
    const installs = this.installModes.get(characterId);
    if (!installs) return [];

    return installs.filter(install => 
      this.checkInstallRequirements(character, install) &&
      (this.activeInstalls.get(characterId)?.size || 0) === 0
    );
  }

  public isMechanicActive(characterId: string, mechanicId: string): boolean {
    const mechanics = this.activeMechanics.get(characterId);
    if (!mechanics) return false;
    return mechanics.has(mechanicId) && (mechanics.get(mechanicId) || 0) > 0;
  }

  public isInstallActive(characterId: string, installId: string): boolean {
    const installs = this.activeInstalls.get(characterId);
    if (!installs) return false;
    return installs.has(installId) && (installs.get(installId) || 0) > 0;
  }

  public getActiveMechanics(characterId: string): string[] {
    const mechanics = this.activeMechanics.get(characterId);
    if (!mechanics) return [];
    
    const active: string[] = [];
    for (const [mechanicId, duration] of mechanics.entries()) {
      if (duration > 0) {
        active.push(mechanicId);
      }
    }
    return active;
  }

  public getActiveInstalls(characterId: string): string[] {
    const installs = this.activeInstalls.get(characterId);
    if (!installs) return [];
    
    const active: string[] = [];
    for (const [installId, duration] of installs.entries()) {
      if (duration > 0) {
        active.push(installId);
      }
    }
    return active;
  }

  public destroy(): void {
    this.characterMechanics.clear();
    this.installModes.clear();
    this.activeMechanics.clear();
    this.activeInstalls.clear();
    this.mechanicCooldowns.clear();
  }
}