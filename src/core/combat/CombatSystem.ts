
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
  private projectiles: Array<{ x: number; y: number; dir: number; ownerId: string; speed: number; w: number; h: number; life: number }> = [];
  private freeProjectiles: Array<{ x: number; y: number; dir: number; ownerId: string; speed: number; w: number; h: number; life: number }> = [];

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
    this.updateFacing();
    this.updateProjectiles();
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
    this.updateFacing();
    this.updateProjectiles();
    this.updateHitboxes();
    this.checkCollisions();
  }

  private updateProjectiles(): void {
    if (this.projectiles.length === 0) return;
    const toRemove: number[] = [];
    for (let i = 0; i < this.projectiles.length; i++) {
      const pr = this.projectiles[i];
      pr.x += pr.dir * pr.speed;
      pr.life -= 1;
      if (pr.life <= 0) { toRemove.push(i); continue; }
      // Clash with other projectiles (owner filter)
      for (let j = i + 1; j < this.projectiles.length; j++) {
        const other = this.projectiles[j];
        if (other.ownerId === pr.ownerId) continue;
        if (Math.abs(pr.x - other.x) < Math.max(pr.w, other.w) && Math.abs(pr.y - other.y) < Math.max(pr.h, other.h)) {
          toRemove.push(i); toRemove.push(j);
        }
      }
      // Hit opponent
      const opp = this.characterManager.getActiveCharacters().find(c => c.id !== pr.ownerId);
      if (opp) {
        const op = opp.entity.getPosition();
        if (Math.abs(pr.x - op.x) < pr.w && Math.abs(pr.y - op.y) < pr.h) {
          const owner = this.characterManager.getActiveCharacters().find(c => c.id === pr.ownerId);
          if (owner) this.processHit(owner, opp);
          toRemove.push(i);
        }
      }
    }
    toRemove.sort((a,b) => b-a);
    let last = -1;
    for (const idx of toRemove) {
      if (idx === last) continue; last = idx;
      if (idx >= 0 && idx < this.projectiles.length) {
        const freed = this.projectiles.splice(idx, 1)[0];
        this.freeProjectiles.push(freed);
      }
    }
  }

  private updateFacing(): void {
    const a = this.characterManager.getActiveCharacters();
    if (a.length !== 2) return;
    const [p1, p2] = a;
    const dx = p2.entity.getPosition().x - p1.entity.getPosition().x;
    p1.facing = dx >= 0 ? 1 : -1;
    p2.facing = -p1.facing as 1 | -1;
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
    if ((inputs as any).throw) {
      this.executeThrow(character);
    }
  }

  private executeThrow(attacker: Character): void {
    const active = this.characterManager.getActiveCharacters();
    const defender = active.find(c => c.id !== attacker.id);
    if (!defender) return;
    const dx = Math.abs(attacker.entity.getPosition().x - defender.entity.getPosition().x);
    if (dx > 1.2) return;
    // Tech window: if defender pressed tech within ~150ms, negate throw
    try {
      const inputs = this.inputManager.getPlayerInputs(attacker.id === active[0].id ? 1 : 0);
      if ((inputs as any).tech) {
        Logger.info('Throw teched');
        this.hitstop = Math.max(this.hitstop, 4);
        return;
      }
    } catch {}
    const dmg = 120;
    defender.health = Math.max(0, defender.health - dmg);
    this.hitstop = Math.max(this.hitstop, 8);
    Logger.info(`${attacker.id} throws for ${dmg}`);
    if (defender.health <= 0) this.handleKO(defender, attacker);
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
    // Spawn simple projectile on hadoken
    if (moveName === 'hadoken') this.spawnProjectile(character, Math.sign(character.facing) || 1);
  }

  private spawnProjectile(owner: Character, dir: number): void {
    try {
      const p = owner.entity.getPosition();
      const md: any = owner.config.moves?.hadoken;
      const meta = md?.projectile || { speed: 0.18, lifetime: 90, width: 0.6, height: 0.6 };
      const slot = this.freeProjectiles.pop() || { x: 0, y: 0, dir, ownerId: owner.id, speed: meta.speed || 0.18, w: meta.width || 0.6, h: meta.height || 0.6, life: (meta.lifetime | 0) };
      slot.x = p.x + dir * 0.8;
      slot.y = p.y + 1.0;
      slot.dir = dir;
      slot.ownerId = owner.id;
      slot.speed = meta.speed || 0.18;
      slot.w = meta.width || 0.6;
      slot.h = meta.height || 0.6;
      slot.life = (meta.lifetime | 0);
      this.projectiles.push(slot);
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      sfx?.play?.('hadoken');
    } catch {}
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
    // If defender tapped toward attacker within parry window, parry
    const defenderIndex = attacker.id === this.characterManager.getActiveCharacters()[0]?.id ? 1 : 0;
    const parryWindowMs = 90;
    const ax = attacker.entity.getPosition().x;
    const dx = ax - defender.entity.getPosition().x;
    const toward: 'left'|'right' = dx < 0 ? 'left' : 'right';
    if (this.inputManager.wasTapped(defenderIndex, toward, parryWindowMs)) {
      this.processParry(attacker, defender);
      return;
    }
    // Else: block if holding back, else hit
    const inputs = this.inputManager.getPlayerInputs(defenderIndex);
    const away: 'left'|'right' = toward === 'left' ? 'right' : 'left';
    const defHoldingBack = (away === 'left' ? inputs.left : inputs.right);
    const moveData = attacker.currentMove?.data;
    if (!moveData) return;
    if (defHoldingBack) {
      this.processBlock(attacker, defender, moveData);
    } else {
      this.processHit(attacker, defender);
    }
  }

  private processParry(attacker: Character, defender: Character): void {
    // Nullify damage, small freeze, grant meter, play feedback
    this.hitstop = Math.max(this.hitstop, 6);
    defender.state = 'idle';
    try {
      // Meter gain
      defender.meter = Math.min(100, (defender.meter || 0) + 5);
      // Emit event for UI feedback
      this.app.fire('combat:parry', { attacker, defender });
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      const p = defender.entity.getPosition();
      effects?.spawn?.(p.x, p.y + 1.0, 'parry');
      sfx?.play?.('parry');
    } catch {}
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
    // Juggle limit: reduce damage heavily if juggle points exceed limit
    const juggle = (defender as any)._jugglePoints || 0;
    const juggleLimit = 6;
    const jugglePenalty = juggle >= juggleLimit ? 0.25 : 1.0;
    const damage = Math.max(1, Math.floor(moveData.damage * scale * jugglePenalty));
    
    defender.health = Math.max(0, defender.health - damage);
    this.hitstop = Math.floor(damage / 10); // Hitstop based on damage
    try { const sfx: any = (this.app as any)._services?.resolve?.('sfx'); sfx?.setDuck?.(true); setTimeout(()=>{ try { sfx?.setDuck?.(false); } catch {} }, Math.max(60, this.hitstop*16)); } catch {}
    
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
      // Hitspark at defender position
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      const p = defender.entity.getPosition();
      effects?.spawn?.(p.x, p.y + 1.0);
      sfx?.play?.('hit');
    } catch {}

    // Increment juggle points and decay later
    try {
      (defender as any)._jugglePoints = ((defender as any)._jugglePoints || 0) + 2;
      setTimeout(() => { try { (defender as any)._jugglePoints = 0; } catch {} }, 1500);
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

    // Launch/juggle: if consecutive hits rapidly, apply small vertical knock
    try {
      const dp = defender.entity.getPosition().clone();
      dp.y += 0.05; // visual nudge; proper physics would integrate velocity
      defender.entity.setPosition(dp);
    } catch {}

    if (defender.health <= 0) {
      this.handleKO(defender, attacker);
    }
  }

  private processBlock(attacker: Character, defender: Character, moveData: any): void {
    // Chip damage and blockstun
    const guard = Math.max(0, Math.min(100, (defender.guardMeter ?? 100)));
    const guardCost = Math.max(1, Math.floor(moveData.damage * 0.5));
    let chip = Math.max(0, Math.floor(moveData.damage * 0.1));
    if (guard <= guardCost) {
      // Guard crush: guard breaks, deal small bonus chip and reset guard
      chip += 10;
      defender.guardMeter = 100;
      defender.state = 'hitstun';
    } else {
      defender.guardMeter = guard - guardCost;
      defender.state = 'blockstun';
    }
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
    // Guard meter regen after short delay
    setTimeout(() => { try { defender.guardMeter = Math.min(100, (defender.guardMeter ?? 0) + 5); } catch {} }, 400);
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      const p = defender.entity.getPosition();
      effects?.spawn?.(p.x, p.y + 1.0, 'block');
      sfx?.play?.('block');
    } catch {}
  }

  // Allow cancels from startup/active into defined follow-ups
  private canCancel(fromMove: string, toMove: string, phase: 'startup'|'active'|'recovery'): boolean {
    // Prefer data-driven cancels from move config
    try {
      const cfg = this.characterManager.getActiveCharacters().find(c => c.currentMove?.name === fromMove)?.config;
      const move = cfg?.moves?.[fromMove];
      const table: string[] = (move?.cancels as string[]) || [];
      if (table.includes(toMove) && phase !== 'recovery') return true;
    } catch {}
    // Fallback: allow light->medium->heavy chains and specials from any non-recovery
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
