import { pc } from 'playcanvas';
import { Character } from '../../../types/character';
import { CharacterManager } from '../characters/CharacterManager';
import { CombatSystem } from './CombatSystem';
import { InputManager } from '../input/InputManager';
import { Logger } from '../utils/Logger';

export interface AssistMove {
  id: string;
  name: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  properties: {
    invincible?: boolean;
    armor?: number;
    projectile?: boolean;
    knockdown?: boolean;
    wallBounce?: boolean;
    groundBounce?: boolean;
  };
  cooldown: number;
  meterCost: number;
}

export interface TagTeamConfig {
  maxCharacters: number;
  switchCooldown: number;
  assistCooldown: number;
  meterGainRate: number;
  maxMeter: number;
  switchMeterCost: number;
  assistMeterCost: number;
}

export class TagTeamSystem {
  private app: pc.Application;
  private characterManager: CharacterManager;
  private combatSystem: CombatSystem;
  private inputManager: InputManager;
  private config: TagTeamConfig;
  private activeCharacters: Map<string, Character[]> = new Map();
  private assistMoves: Map<string, AssistMove[]> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private meter: Map<string, number> = new Map();
  private switchHistory: Map<string, number[]> = new Map();

  constructor(app: pc.Application, characterManager: CharacterManager, combatSystem: CombatSystem, inputManager: InputManager) {
    this.app = app;
    this.characterManager = characterManager;
    this.combatSystem = combatSystem;
    this.inputManager = inputManager;
    
    this.config = {
      maxCharacters: 2,
      switchCooldown: 300, // 5 seconds at 60fps
      assistCooldown: 180, // 3 seconds at 60fps
      meterGainRate: 0.5, // per frame
      maxMeter: 100,
      switchMeterCost: 25,
      assistMeterCost: 15
    };

    this.initializeAssistMoves();
  }

  private initializeAssistMoves(): void {
    // Ryu assist moves
    this.assistMoves.set('ryu', [
      {
        id: 'hadoken_assist',
        name: 'Hadoken Assist',
        startup: 8,
        active: 1,
        recovery: 15,
        damage: 60,
        properties: {
          projectile: true,
          knockdown: false
        },
        cooldown: 180,
        meterCost: 15
      },
      {
        id: 'shoryuken_assist',
        name: 'Shoryuken Assist',
        startup: 4,
        active: 8,
        recovery: 20,
        damage: 80,
        properties: {
          invincible: true,
          knockdown: true
        },
        cooldown: 240,
        meterCost: 20
      },
      {
        id: 'tatsumaki_assist',
        name: 'Tatsumaki Assist',
        startup: 6,
        active: 12,
        recovery: 18,
        damage: 70,
        properties: {
          armor: 1,
          knockdown: true
        },
        cooldown: 200,
        meterCost: 18
      }
    ]);

    // Ken assist moves
    this.assistMoves.set('ken', [
      {
        id: 'hadoken_assist',
        name: 'Hadoken Assist',
        startup: 8,
        active: 1,
        recovery: 15,
        damage: 60,
        properties: {
          projectile: true,
          knockdown: false
        },
        cooldown: 180,
        meterCost: 15
      },
      {
        id: 'shoryuken_assist',
        name: 'Shoryuken Assist',
        startup: 4,
        active: 8,
        recovery: 20,
        damage: 85,
        properties: {
          invincible: true,
          knockdown: true
        },
        cooldown: 240,
        meterCost: 20
      },
      {
        id: 'tatsumaki_assist',
        name: 'Tatsumaki Assist',
        startup: 6,
        active: 12,
        recovery: 18,
        damage: 75,
        properties: {
          armor: 1,
          knockdown: true
        },
        cooldown: 200,
        meterCost: 18
      }
    ]);

    // Add more character assist moves as needed
  }

  public initializePlayer(playerId: string, characterIds: string[]): void {
    if (characterIds.length > this.config.maxCharacters) {
      Logger.warn(`Too many characters for player ${playerId}. Max is ${this.config.maxCharacters}`);
      characterIds = characterIds.slice(0, this.config.maxCharacters);
    }

    const characters: Character[] = [];
    for (const charId of characterIds) {
      const character = this.characterManager.getCharacter(charId);
      if (character) {
        characters.push(character);
      }
    }

    this.activeCharacters.set(playerId, characters);
    this.meter.set(playerId, 0);
    this.switchHistory.set(playerId, []);
    this.cooldowns.set(playerId, 0);

    Logger.info(`Initialized tag team for player ${playerId} with ${characters.length} characters`);
  }

  public update(deltaTime: number): void {
    // Update meter for all players
    for (const [playerId, currentMeter] of this.meter.entries()) {
      const newMeter = Math.min(this.config.maxMeter, currentMeter + this.config.meterGainRate);
      this.meter.set(playerId, newMeter);
    }

    // Update cooldowns
    for (const [playerId, cooldown] of this.cooldowns.entries()) {
      if (cooldown > 0) {
        this.cooldowns.set(playerId, cooldown - 1);
      }
    }
  }

  public async switchCharacters(playerId: string, targetCharacterId?: string): Promise<boolean> {
    const characters = this.activeCharacters.get(playerId);
    if (!characters || characters.length < 2) {
      Logger.warn(`Player ${playerId} doesn't have enough characters to switch`);
      return false;
    }

    const currentMeter = this.meter.get(playerId) || 0;
    if (currentMeter < this.config.switchMeterCost) {
      Logger.warn(`Player ${playerId} doesn't have enough meter to switch characters`);
      return false;
    }

    const cooldown = this.cooldowns.get(playerId) || 0;
    if (cooldown > 0) {
      Logger.warn(`Player ${playerId} is on cooldown for character switching`);
      return false;
    }

    const currentCharacter = this.getCurrentCharacter(playerId);
    if (!currentCharacter) {
      Logger.warn(`Player ${playerId} has no current character`);
      return false;
    }

    let targetCharacter: Character | undefined;
    if (targetCharacterId) {
      targetCharacter = characters.find(c => c.id === targetCharacterId);
    } else {
      // Switch to next character in rotation
      const currentIndex = characters.findIndex(c => c.id === currentCharacter.id);
      const nextIndex = (currentIndex + 1) % characters.length;
      targetCharacter = characters[nextIndex];
    }

    if (!targetCharacter) {
      Logger.warn(`Target character not found for player ${playerId}`);
      return false;
    }

    // Perform the switch
    await this.performCharacterSwitch(playerId, currentCharacter, targetCharacter);

    // Update meter and cooldown
    this.meter.set(playerId, currentMeter - this.config.switchMeterCost);
    this.cooldowns.set(playerId, this.config.switchCooldown);

    // Update switch history
    const history = this.switchHistory.get(playerId) || [];
    history.push(Date.now());
    this.switchHistory.set(playerId, history);

    Logger.info(`Player ${playerId} switched from ${currentCharacter.id} to ${targetCharacter.id}`);
    return true;
  }

  private async performCharacterSwitch(playerId: string, fromCharacter: Character, toCharacter: Character): Promise<void> {
    // Store current character state
    const fromState = {
      position: fromCharacter.entity.getPosition().clone(),
      health: fromCharacter.health,
      meter: fromCharacter.meter,
      state: fromCharacter.state,
      currentMove: fromCharacter.currentMove
    };

    // Set up target character
    toCharacter.entity.setPosition(fromState.position);
    toCharacter.health = fromState.health;
    toCharacter.meter = fromState.meter;
    toCharacter.state = 'idle';
    toCharacter.currentMove = null;

    // Update active characters in combat system
    const characters = this.activeCharacters.get(playerId) || [];
    const playerIndex = this.getPlayerIndex(playerId);
    if (playerIndex !== -1) {
      this.combatSystem.setActiveCharacter(playerIndex, toCharacter);
    }

    // Trigger switch effects
    await this.triggerSwitchEffects(playerId, fromCharacter, toCharacter);
  }

  private async triggerSwitchEffects(playerId: string, fromCharacter: Character, toCharacter: Character): Promise<void> {
    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = toCharacter.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'character_switch');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play('character_switch');
      }
    } catch {}

    // Camera effects
    try {
      const cam = this.app.root.findByName('MainCamera');
      if (cam) {
        this.pulseCamera(120, 0.95);
      }
    } catch {}

    // Emit event
    this.app.fire('tagteam:switch', {
      playerId,
      fromCharacter: fromCharacter.id,
      toCharacter: toCharacter.id
    });
  }

  public async performAssist(playerId: string, assistType: string): Promise<boolean> {
    const characters = this.activeCharacters.get(playerId);
    if (!characters || characters.length < 2) {
      Logger.warn(`Player ${playerId} doesn't have enough characters for assist`);
      return false;
    }

    const currentCharacter = this.getCurrentCharacter(playerId);
    if (!currentCharacter) {
      Logger.warn(`Player ${playerId} has no current character`);
      return false;
    }

    const assistMoves = this.assistMoves.get(currentCharacter.id) || [];
    const assistMove = assistMoves.find(a => a.id === assistType);
    if (!assistMove) {
      Logger.warn(`Assist move ${assistType} not found for character ${currentCharacter.id}`);
      return false;
    }

    const currentMeter = this.meter.get(playerId) || 0;
    if (currentMeter < assistMove.meterCost) {
      Logger.warn(`Player ${playerId} doesn't have enough meter for assist`);
      return false;
    }

    const cooldown = this.cooldowns.get(playerId) || 0;
    if (cooldown > 0) {
      Logger.warn(`Player ${playerId} is on cooldown for assists`);
      return false;
    }

    // Perform the assist
    await this.executeAssistMove(playerId, currentCharacter, assistMove);

    // Update meter and cooldown
    this.meter.set(playerId, currentMeter - assistMove.meterCost);
    this.cooldowns.set(playerId, assistMove.cooldown);

    Logger.info(`Player ${playerId} performed assist ${assistMove.name}`);
    return true;
  }

  private async executeAssistMove(playerId: string, character: Character, assistMove: AssistMove): Promise<void> {
    // Create temporary character for assist
    const assistCharacter = this.createAssistCharacter(character, assistMove);
    
    // Position assist character
    const currentPos = character.entity.getPosition();
    const facing = character.facing;
    assistCharacter.entity.setPosition(
      currentPos.x + (facing * 1.5),
      currentPos.y,
      currentPos.z
    );

    // Execute assist move
    assistCharacter.currentMove = {
      name: assistMove.id,
      data: assistMove,
      currentFrame: 0,
      phase: 'startup'
    };

    // Add to combat system temporarily
    this.combatSystem.addTemporaryCharacter(assistCharacter);

    // Trigger assist effects
    await this.triggerAssistEffects(playerId, assistCharacter, assistMove);

    // Remove assist character after move completes
    setTimeout(() => {
      this.combatSystem.removeTemporaryCharacter(assistCharacter);
    }, (assistMove.startup + assistMove.active + assistMove.recovery) * (1000 / 60));
  }

  private createAssistCharacter(originalCharacter: Character, assistMove: AssistMove): Character {
    const assistCharacter: Character = {
      id: `${originalCharacter.id}_assist`,
      entity: originalCharacter.entity.clone(),
      config: originalCharacter.config,
      health: originalCharacter.health,
      maxHealth: originalCharacter.maxHealth,
      meter: 0,
      state: 'attacking',
      currentMove: null,
      frameData: {
        startup: assistMove.startup,
        active: assistMove.active,
        recovery: assistMove.recovery,
        advantage: 0
      },
      facing: originalCharacter.facing,
      guardMeter: 100
    };

    return assistCharacter;
  }

  private async triggerAssistEffects(playerId: string, character: Character, assistMove: AssistMove): Promise<void> {
    // Visual effects
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      if (effects) {
        const pos = character.entity.getPosition();
        effects.spawn(pos.x, pos.y + 1.0, 'assist_move');
      }
    } catch {}

    // Audio effects
    try {
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      if (sfx) {
        sfx.play(`assist_${assistMove.id}`);
      }
    } catch {}

    // Emit event
    this.app.fire('tagteam:assist', {
      playerId,
      character: character.id,
      assistMove: assistMove.id
    });
  }

  public getCurrentCharacter(playerId: string): Character | undefined {
    const characters = this.activeCharacters.get(playerId);
    if (!characters || characters.length === 0) return undefined;

    // For now, return the first character
    // In a full implementation, you'd track which character is currently active
    return characters[0];
  }

  public getAvailableAssists(playerId: string): AssistMove[] {
    const currentCharacter = this.getCurrentCharacter(playerId);
    if (!currentCharacter) return [];

    return this.assistMoves.get(currentCharacter.id) || [];
  }

  public getMeter(playerId: string): number {
    return this.meter.get(playerId) || 0;
  }

  public getCooldown(playerId: string): number {
    return this.cooldowns.get(playerId) || 0;
  }

  public canSwitch(playerId: string): boolean {
    const meter = this.meter.get(playerId) || 0;
    const cooldown = this.cooldowns.get(playerId) || 0;
    return meter >= this.config.switchMeterCost && cooldown === 0;
  }

  public canAssist(playerId: string, assistType: string): boolean {
    const currentCharacter = this.getCurrentCharacter(playerId);
    if (!currentCharacter) return false;

    const assistMoves = this.assistMoves.get(currentCharacter.id) || [];
    const assistMove = assistMoves.find(a => a.id === assistType);
    if (!assistMove) return false;

    const meter = this.meter.get(playerId) || 0;
    const cooldown = this.cooldowns.get(playerId) || 0;
    return meter >= assistMove.meterCost && cooldown === 0;
  }

  private getPlayerIndex(playerId: string): number {
    // This would need to be implemented based on your player indexing system
    return 0; // Placeholder
  }

  private pulseCamera(durationMs: number, zoom: number): void {
    try {
      const cam = this.app.root.findByName('MainCamera');
      if (!cam || !(cam as any).camera) return;
      const start = performance.now();
      const initial = (cam as any).camera.orthoHeight || 5;
      const target = initial * zoom;
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / durationMs);
        const k = t < 0.5 ? (t * 2) : (1 - (t - 0.5) * 2);
        (cam as any).camera.orthoHeight = initial + (target - initial) * k;
        if (t < 1) requestAnimationFrame(tick); else (cam as any).camera.orthoHeight = initial;
      };
      requestAnimationFrame(tick);
    } catch {}
  }

  public destroy(): void {
    this.activeCharacters.clear();
    this.assistMoves.clear();
    this.cooldowns.clear();
    this.meter.clear();
    this.switchHistory.clear();
  }
}