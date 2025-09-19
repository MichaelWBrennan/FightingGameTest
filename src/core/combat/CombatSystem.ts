
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
  private comboScalingStart = 0.8; // 80% after first hit
  private comboScalingStep = 0.9;  // multiply per subsequent hit

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
    // Allow cancels when in startup/active
    const canAct = (character.state === 'idle' || character.state === 'walking');
    if (!canAct) {
      if (character.currentMove) {
        const next = this.findPressedAttack(inputs);
        if (next && this.canCancel(character.currentMove.name, next, character.currentMove.phase)) {
          this.executeMove(character, next);
        }
      }
      return;
    }

    // Process movement
    if (inputs.left) {
      this.moveCharacter(character, -1);
    } else if (inputs.right) {
      this.moveCharacter(character, 1);
    }

    // Process attacks
    const pressed = this.findPressedAttack(inputs);
    if (pressed) this.executeMove(character, pressed);

    // Process special moves (simplified motion detection)
    if (inputs.hadoken) {
      this.executeMove(character, 'hadoken');
    }
  }

  private findPressedAttack(inputs: any): string | null {
    if (inputs.lightPunch) return 'lightPunch';
    if (inputs.mediumPunch) return 'mediumPunch';
    if (inputs.heavyPunch) return 'heavyPunch';
    if (inputs.lightKick) return 'lightKick';
    if (inputs.mediumKick) return 'mediumKick';
    if (inputs.heavyKick) return 'heavyKick';
    return null;
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
      this.resolveContact(p1, p2);
    } else if (p2.currentMove?.phase === 'active' && this.charactersColliding(p2, p1)) {
      this.resolveContact(p2, p1);
    }
  }

  private resolveContact(attacker: Character, defender: Character): void {
    // Simple high-level: if defender is holding back, block; else hit. Future: parry window.
    const inputs = this.inputManager.getPlayerInputs(attacker.id === this.characterManager.getActiveCharacters()[0]?.id ? 1 : 0);
    const defHoldingBack = inputs?.left || inputs?.right; // placeholder; should be relative to facing
    const moveData = attacker.currentMove?.data;
    if (!moveData) return;
    if (defHoldingBack) {
      this.processBlock(attacker, defender, moveData);
    } else {
      this.processHit(attacker, defender);
    }
  }

  private charactersColliding(attacker: Character, defender: Character): boolean {
    // Try per-frame hit/hurtboxes from animations if available
    try {
      const aPos = attacker.entity.getPosition();
      const dPos = defender.entity.getPosition();
      const configA: any = attacker.config;
      const configD: any = defender.config;
      const animKeyA = attacker.currentMove ? `move_${attacker.currentMove.name}` : 'idle';
      const framesA = configA.animations?.[animKeyA]?.frames as any[] | undefined;
      const frameIdxA = attacker.currentMove ? Math.max(0, Math.min((framesA?.length || 1) - 1, attacker.currentMove.currentFrame | 0)) : 0;
      const fA = framesA && framesA[frameIdxA];
      const animKeyD = 'idle';
      const framesD = configD.animations?.[animKeyD]?.frames as any[] | undefined;
      const fD = framesD && framesD[0];
      const hitboxes: Array<{ x:number; y:number; width:number; height:number }> = (fA?.hitboxes || []) as any;
      const hurtboxes: Array<{ x:number; y:number; width:number; height:number }> = (fD?.hurtboxes || [{ x:-0.4, y:0, width:0.8, height:1.6 }]) as any;
      for (const hb of hitboxes) {
        const aMinX = aPos.x + hb.x;
        const aMaxX = aMinX + hb.width;
        const aMinY = aPos.y + hb.y;
        const aMaxY = aMinY + hb.height;
        for (const hu of hurtboxes) {
          const bMinX = dPos.x + hu.x;
          const bMaxX = bMinX + hu.width;
          const bMinY = dPos.y + hu.y;
          const bMaxY = bMinY + hu.height;
          const overlapX = aMinX <= bMaxX && aMaxX >= bMinX;
          const overlapY = aMinY <= bMaxY && aMaxY >= bMinY;
          if (overlapX && overlapY) return true;
        }
      }
    } catch {}
    // Fallback coarse AABB
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
    // Damage scaling based on current combo count on attacker
    const hitsSoFar = (attacker as any)._comboHits || 0;
    let scale = 1.0;
    if (hitsSoFar >= 1) {
      scale = this.comboScalingStart * Math.pow(this.comboScalingStep, Math.max(0, hitsSoFar - 1));
    }
    const damage = Math.max(1, Math.floor(moveData.damage * scale));
    
    defender.health = Math.max(0, defender.health - damage);
    this.hitstop = Math.floor(damage / 10); // Hitstop based on damage
    
    Logger.info(`${attacker.id} hits ${defender.id} for ${damage} damage`);

    // VFX/SFX and camera shake
    try {
      const cam = this.app.root.findByName('MainCamera');
      if (cam) {
        const start = performance.now();
        const original = cam.getLocalPosition().clone();
        const shake = () => {
          const t = performance.now() - start;
          if (t > 120) { cam.setLocalPosition(original); return; }
          const mag = 0.05;
          cam.setLocalPosition(original.x + (Math.random()-0.5)*mag, original.y + (Math.random()-0.5)*mag, original.z);
          requestAnimationFrame(shake);
        };
        requestAnimationFrame(shake);
      }
    } catch {}

    // Emit combo-like UI event (simplified)
    try {
      const ui: any = (this.app as any)._ui;
      const hits = (attacker as any)._comboHits = ((attacker as any)._comboHits || 0) + 1;
      const dmgAcc = (attacker as any)._comboDmg = ((attacker as any)._comboDmg || 0) + damage;
      ui?.['app']?.fire?.('ui:combo', { playerId: attacker.id === this.characterManager.getActiveCharacters()[0]?.id ? 'player1' : 'player2', hits, damage: dmgAcc });
      // Clear combo after brief delay
      setTimeout(() => { try { (attacker as any)._comboHits = 0; (attacker as any)._comboDmg = 0; } catch {} }, 1200);
    } catch {}
    
    // Pushback
    try {
      const dir = Math.sign(defender.entity.getPosition().x - attacker.entity.getPosition().x) || 1;
      const dp = defender.entity.getPosition().clone();
      dp.x += dir * 0.25;
      defender.entity.setPosition(dp);
    } catch {}

    if (defender.health <= 0) {
      this.handleKO(defender, attacker);
    }
  }

  private processBlock(attacker: Character, defender: Character, moveData: any): void {
    // Chip damage and blockstun
    const chip = Math.max(0, Math.floor(moveData.damage * 0.1));
    defender.health = Math.max(0, defender.health - chip);
    defender.state = 'blockstun';
    // Pushback stronger on block
    try {
      const dir = Math.sign(defender.entity.getPosition().x - attacker.entity.getPosition().x) || 1;
      const dp = defender.entity.getPosition().clone();
      dp.x += dir * 0.35;
      defender.entity.setPosition(dp);
    } catch {}
    // brief hitstop on block too
    this.hitstop = Math.max(this.hitstop, 3);
  }

  // Allow cancels from startup/active into defined follow-ups
  private canCancel(fromMove: string, toMove: string, phase: 'startup'|'active'|'recovery'): boolean {
    // Simple rule: allow light->medium->heavy chains and specials from any on hit
    const order: Record<string, number> = { lightPunch: 1, lightKick: 1, mediumPunch: 2, mediumKick: 2, heavyPunch: 3, heavyKick: 3 } as any;
    const a = order[fromMove] ?? 0;
    const b = order[toMove] ?? 0;
    if (b > a && phase !== 'recovery') return true;
    if (/hadoken|shoryuken|tatsu/.test(toMove) && phase !== 'recovery') return true;
    return false;
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
