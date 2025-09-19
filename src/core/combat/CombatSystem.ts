
import * as pc from 'playcanvas';
import { Character } from '../../../types/character';
import { CharacterManager } from '../characters/CharacterManager';
import { InputManager, PlayerInputs } from '../input/InputManager';
import { Logger } from '../utils/Logger';

interface HitResult {
  hit: boolean;
  damage: number;
  knockback: pc.Vec3;
  hitstun: number;
  blockstun: number;
}

export class CombatSystem {
  private app: pc.Application;
  private characterManager!: CharacterManager;
  private inputManager!: InputManager;
  private frameCounter = 0;
  private hitstop = 0;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public initialize(characterManager: CharacterManager, inputManager: InputManager): void {
    this.characterManager = characterManager;
    this.inputManager = inputManager;
    Logger.info('Combat system initialized');
  }

  public update(deltaTime: number): void {
    if (this.hitstop > 0) {
      this.hitstop--;
      return; // Skip frame during hitstop
    }

    this.frameCounter++;
    this.processInputs();
    this.updateHitboxes();
    this.checkCollisions();

    // Update HUD each frame from authoritative character state
    try {
      const active = this.characterManager.getActiveCharacters();
      const p1 = active[0];
      const p2 = active[1];
      if (p1 && p2) {
        // Meter and drive are placeholders for now; map to meter
        const ui: any = (this.app as any)._ui;
        ui?.updateHUD(p1.health, p2.health, p1.meter, p2.meter, p1.maxHealth || p1.health, p2.maxHealth || p2.health, 100, 100);
      }
    } catch {}
  }

  // Deterministic step for rollback, driven by netcode
  public stepWithInputs(p0: PlayerInputs, p1: PlayerInputs): void {
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    this.frameCounter++;
    const activeCharacters = this.characterManager.getActiveCharacters();
    if (activeCharacters[0]) this.processCharacterInputs(activeCharacters[0], p0);
    if (activeCharacters[1]) this.processCharacterInputs(activeCharacters[1], p1);
    this.updateHitboxes();
    this.checkCollisions();
  }

  private processInputs(): void {
    const activeCharacters = this.characterManager.getActiveCharacters();
    
    for (let i = 0; i < activeCharacters.length; i++) {
      const character = activeCharacters[i];
      const inputs = this.inputManager.getPlayerInputs(i);
      
      this.processCharacterInputs(character, inputs);
    }
  }

  private processCharacterInputs(character: Character, inputs: any): void {
    if (character.state !== 'idle' && character.state !== 'walking') {
      return; // Character is in an active state
    }

    // Process movement
    if (inputs.left) {
      this.moveCharacter(character, -1);
    } else if (inputs.right) {
      this.moveCharacter(character, 1);
    }

    // Process attacks
    if (inputs.lightPunch) {
      this.executeMove(character, 'lightPunch');
    } else if (inputs.mediumPunch) {
      this.executeMove(character, 'mediumPunch');
    } else if (inputs.heavyPunch) {
      this.executeMove(character, 'heavyPunch');
    }

    // Process special moves (simplified motion detection)
    if (inputs.hadoken) {
      this.executeMove(character, 'hadoken');
    }
  }

  private moveCharacter(character: Character, direction: number): void {
    const walkSpeed = character.config.stats.walkSpeed;
    const currentPos = character.entity.getPosition();
    
    currentPos.x += direction * walkSpeed * (1/60); // Assuming 60fps
    character.entity.setPosition(currentPos);
    
    character.state = 'walking';
  }

  private executeMove(character: Character, moveName: string): void {
    const moveData = character.config.moves[moveName];
    if (!moveData) {
      Logger.warn(`Move not found: ${moveName} for character ${character.id}`);
      return;
    }

    character.currentMove = {
      name: moveName,
      data: moveData,
      currentFrame: 0,
      phase: 'startup'
    };

    character.state = 'attacking';
    character.frameData = {
      startup: moveData.startupFrames,
      active: moveData.activeFrames,
      recovery: moveData.recoveryFrames,
      advantage: moveData.advantage || 0
    };

    Logger.info(`${character.id} executing ${moveName}`);
  }

  private updateHitboxes(): void {
    const activeCharacters = this.characterManager.getActiveCharacters();
    for (const character of activeCharacters) {
      if (character.currentMove) {
        this.updateMoveFrames(character);
      }
    }
  }

  private updateMoveFrames(character: Character): void {
    if (!character.currentMove) return;

    character.currentMove.currentFrame++;
    const move = character.currentMove;
    const frameData = character.frameData;

    if (move.currentFrame <= frameData.startup) {
      move.phase = 'startup';
    } else if (move.currentFrame <= frameData.startup + frameData.active) {
      move.phase = 'active';
    } else if (move.currentFrame <= frameData.startup + frameData.active + frameData.recovery) {
      move.phase = 'recovery';
    } else {
      // Move finished
      character.currentMove = null;
      character.state = 'idle';
    }
  }

  private checkCollisions(): void {
    const activeCharacters = this.characterManager.getActiveCharacters();
    
    if (activeCharacters.length !== 2) return;

    const [p1, p2] = activeCharacters;
    
    if (p1.currentMove?.phase === 'active' && this.charactersColliding(p1, p2)) {
      this.processHit(p1, p2);
    } else if (p2.currentMove?.phase === 'active' && this.charactersColliding(p2, p1)) {
      this.processHit(p2, p1);
    }
  }

  private charactersColliding(attacker: Character, defender: Character): boolean {
    // Basic AABB overlap using per-character bounds (placeholder until per-frame boxes wired)
    const a = attacker.entity.getPosition();
    const b = defender.entity.getPosition();
    const halfW = 0.6, halfH = 1.0;
    const aMinX = a.x - halfW, aMaxX = a.x + halfW, aMinY = a.y - 0.1, aMaxY = a.y + halfH;
    const bMinX = b.x - halfW, bMaxX = b.x + halfW, bMinY = b.y - 0.1, bMaxY = b.y + halfH;
    const overlapX = aMinX <= bMaxX && aMaxX >= bMinX;
    const overlapY = aMinY <= bMaxY && aMaxY >= bMinY;
    return overlapX && overlapY;
  }

  private processHit(attacker: Character, defender: Character): void {
    if (!attacker.currentMove) return;

    const moveData = attacker.currentMove.data;
    const damage = moveData.damage;
    
    defender.health = Math.max(0, defender.health - damage);
    this.hitstop = Math.floor(damage / 10); // Hitstop based on damage
    
    Logger.info(`${attacker.id} hits ${defender.id} for ${damage} damage`);

    // Emit combo-like UI event (simplified)
    try {
      const ui: any = (this.app as any)._ui;
      const hits = (attacker as any)._comboHits = ((attacker as any)._comboHits || 0) + 1;
      const dmgAcc = (attacker as any)._comboDmg = ((attacker as any)._comboDmg || 0) + damage;
      ui?.['app']?.fire?.('ui:combo', { playerId: attacker.id === this.characterManager.getActiveCharacters()[0]?.id ? 'player1' : 'player2', hits, damage: dmgAcc });
      // Clear combo after brief delay
      setTimeout(() => { try { (attacker as any)._comboHits = 0; (attacker as any)._comboDmg = 0; } catch {} }, 1200);
    } catch {}
    
    if (defender.health <= 0) {
      this.handleKO(defender, attacker);
    }
  }

  private handleKO(ko: Character, winner: Character): void {
    ko.state = 'ko';
    Logger.info(`${ko.id} is KO'd! ${winner.id} wins!`);
    
    // Trigger victory sequence
    this.app.fire('match:victory', winner.id);
  }

  public getCurrentFrame(): number {
    return this.frameCounter;
  }

  public isInHistop(): boolean {
    return this.hitstop > 0;
  }
}
