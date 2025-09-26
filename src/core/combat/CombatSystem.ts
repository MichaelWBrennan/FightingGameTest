
import type * as pc from 'playcanvas';
import type { Character } from '../../../types/character';
import type { CharacterManager } from '../characters/CharacterManager';
import { ProjectileManager } from './ProjectileManager';
import type { InputManager, PlayerInputs } from '../input/InputManager';
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
  private guardRegenFrames: Map<string, number> = new Map();
  private juggleResetFrames: Map<string, number> = new Map();
  private comboResetFrames: Map<string, number> = new Map();
  private comboScalingStart = 0.8; // 80% after first hit
  private comboScalingStep = 0.9;  // multiply per subsequent hit
  private projectileManager: ProjectileManager | null = null;
  private pushboxHalfWidth = 0.45;
  private stageBounds = { left: -6, right: 6 };
  private gravity = 0.012;
  private bounceFactor = 0.42;
  private airFriction = 0.98;
  private projectiles: Array<{ x: number; y: number; dir: number; ownerId: string; speed: number; w: number; h: number; life: number }> = [];
  private freeProjectiles: Array<{ x: number; y: number; dir: number; ownerId: string; speed: number; w: number; h: number; life: number }> = [];
  private timeline: Array<{ t: number; kind: string; data?: any }> = [];
  private recentKOFlag = false;

  constructor(app: pc.Application) {
    this.app = app;
  }

  private updateDeferredTimers(): void {
    try {
      if (this.guardRegenFrames.size) {
        for (const [id, until] of Array.from(this.guardRegenFrames.entries())) {
          if (this.frameCounter >= until) {
            const list = this.characterManager.getActiveCharacters();
            const ch = list.find(c => c.id === id);
            if (ch) ch.guardMeter = Math.min(100, (ch.guardMeter ?? 0) + 5);
            this.guardRegenFrames.delete(id);
          }
        }
      }
    } catch {}
    try {
      if (this.juggleResetFrames.size) {
        for (const [id, until] of Array.from(this.juggleResetFrames.entries())) {
          if (this.frameCounter >= until) {
            const list = this.characterManager.getActiveCharacters();
            const ch = list.find(c => c.id === id) as any;
            if (ch) ch._jugglePoints = 0;
            this.juggleResetFrames.delete(id);
          }
        }
      }
    } catch {}
    try {
      if (this.comboResetFrames.size) {
        for (const [id, until] of Array.from(this.comboResetFrames.entries())) {
          if (this.frameCounter >= until) {
            const list = this.characterManager.getActiveCharacters();
            const ch = list.find(c => c.id === id) as any;
            if (ch) { ch._comboHits = 0; ch._comboDmg = 0; }
            this.comboResetFrames.delete(id);
          }
        }
      }
    } catch {}
  }

  public initialize(characterManager: CharacterManager, inputManager: InputManager): void {
    this.characterManager = characterManager;
    this.inputManager = inputManager;
    this.projectileManager = new ProjectileManager(this.app, this.characterManager, (o, d) => this.processHit(o, d));
    Logger.info('Combat system initialized');
  }

  public update(deltaTime: number): void {
    if (this.hitstop > 0) {
      this.hitstop--;
      return; // Skip frame during hitstop
    }

    this.frameCounter++;
    this.updateDeferredTimers();
    this.processInputs();
    this.updateFacing();
    this.updateAirbornePhysics();
    this.applyPushboxesAndCorner();
    this.projectileManager?.update();
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
    this.updateAirbornePhysics();
    this.applyPushboxesAndCorner();
    this.projectileManager?.update();
    this.updateHitboxes();
    this.checkCollisions();
  }

  private updateAirbornePhysics(): void {
    const list = this.characterManager.getActiveCharacters();
    const airborneEntries: Array<{ idx: number; x: number; y: number; vx: number; vy: number }> = [];
    for (let i = 0; i < list.length; i++) {
      const ch = list[i];
      if ((ch as any)._airborne === true) {
        const pos = ch.entity.getPosition();
        airborneEntries.push({ idx: i, x: pos.x, y: pos.y, vx: (ch as any)._velX ?? 0, vy: (ch as any)._velY ?? 0 });
      }
    }
    try {
      const sim: any = (this.app as any)._services?.resolve?.('sim');
      if (sim && airborneEntries.length) {
        const res = sim.computeAirborne(airborneEntries.map(e => ({ x: e.x, y: e.y, vx: e.vx, vy: e.vy })));
        for (let j = 0; j < res.length; j++) {
          const out = res[j]; const idx = airborneEntries[j].idx; const ch = list[idx];
          const p = ch.entity.getPosition().clone(); p.x = out.x; p.y = out.y; ch.entity.setPosition(p);
          (ch as any)._velX = out.vx; (ch as any)._velY = out.vy;
          if (out.grounded) {
            (ch as any)._airborne = false;
            (ch as any)._jugglePoints = Math.max(0, ((ch as any)._jugglePoints || 0) - 2);
            ch.state = 'idle';
          }
        }
        return;
      }
    } catch {}
    // Fallback local integration
    const gravity = this.gravity; const bounce = this.bounceFactor;
    for (const ch of list) {
      if ((ch as any)._airborne !== true) continue;
      const velY = (ch as any)._velY ?? 0; const velX = (ch as any)._velX ?? 0;
      let vy = velY - gravity; let vx = velX * this.airFriction;
      const pos = ch.entity.getPosition().clone(); pos.y += vy; pos.x += vx;
      if (pos.x + this.pushboxHalfWidth >= this.stageBounds.right) { pos.x = this.stageBounds.right - this.pushboxHalfWidth; vx = -Math.abs(vx) * bounce; this.pulseCamera(120, 0.92); }
      else if (pos.x - this.pushboxHalfWidth <= this.stageBounds.left) { pos.x = this.stageBounds.left + this.pushboxHalfWidth; vx = Math.abs(vx) * bounce; this.pulseCamera(120, 0.92); }
      if (pos.y <= 0) { pos.y = 0; if (Math.abs(vy) > 0.08) { vy = -vy * bounce; this.pulseCamera(120, 0.94); } else { vy = 0; (ch as any)._airborne = false; (ch as any)._jugglePoints = Math.max(0, ((ch as any)._jugglePoints || 0) - 2); ch.state = 'idle'; } }
      (ch as any)._velY = vy; (ch as any)._velX = vx; ch.entity.setPosition(pos);
    }
  }

  private applyPushboxesAndCorner(): void {
    const list = this.characterManager.getActiveCharacters();
    if (list.length !== 2) return;
    const a = list[0];
    const b = list[1];
    const aw = this.pushboxHalfWidth, bw = this.pushboxHalfWidth;
    const aPos = a.entity.getPosition().clone();
    const bPos = b.entity.getPosition().clone();
    // Stage clamp first
    aPos.x = Math.max(this.stageBounds.left + aw, Math.min(this.stageBounds.right - aw, aPos.x));
    bPos.x = Math.max(this.stageBounds.left + bw, Math.min(this.stageBounds.right - bw, bPos.x));
    // Resolve overlap by separating along x equally
    const aMin = aPos.x - aw, aMax = aPos.x + aw;
    const bMin = bPos.x - bw, bMax = bPos.x + bw;
    const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);
    if (overlap > 0) {
      const push = overlap * 0.5 + 1e-3;
      const dir = Math.sign(bPos.x - aPos.x) || 1;
      aPos.x -= dir * push;
      bPos.x += dir * push;
      // Corner rules: if one is at wall, only move the other
      const aAtLeft = aPos.x - aw <= this.stageBounds.left + 1e-3;
      const aAtRight = aPos.x + aw >= this.stageBounds.right - 1e-3;
      const bAtLeft = bPos.x - bw <= this.stageBounds.left + 1e-3;
      const bAtRight = bPos.x + bw >= this.stageBounds.right - 1e-3;
      if (aAtLeft || aAtRight) {
        // don't move A further into wall; move B only
        aPos.x += dir * push; // revert
        bPos.x += dir * push; // move double for separation
      } else if (bAtLeft || bAtRight) {
        bPos.x -= dir * push;
        aPos.x -= dir * push;
      } else {
        // Prefer moving the attacker slightly more to reduce corner drift
        const attackerIsA = Math.abs(aPos.x) < Math.abs(bPos.x) ? false : true;
        if (attackerIsA) aPos.x -= dir * (push * 0.1); else bPos.x += dir * (push * 0.1);
      }
      aPos.x = Math.max(this.stageBounds.left + aw, Math.min(this.stageBounds.right - aw, aPos.x));
      bPos.x = Math.max(this.stageBounds.left + bw, Math.min(this.stageBounds.right - bw, bPos.x));
    }
    a.entity.setPosition(aPos);
    b.entity.setPosition(bPos);
    try {
      const input: any = (this.app as any)._services?.resolve?.('input');
      if (input) input.setFacingRight?.(aPos.x <= bPos.x);
    } catch {}
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
    const move = attacker.config.moves?.['throw'] as any;
    const range = Math.max(0.6, Math.min(1.6, (move?.range || 1.0)));
    const techWindowMs = Math.max(80, Math.min(200, (move?.techWindowMs || 150)));
    const dx = Math.abs(attacker.entity.getPosition().x - defender.entity.getPosition().x);
    if (dx > range) return;
    // Tech window: if defender pressed tech within ~150ms, negate throw
    try {
      const defenderIndex = attacker.id === active[0].id ? 1 : 0;
      const inputs = this.inputManager.getPlayerInputs(defenderIndex);
      if ((inputs as any).tech || this.inputManager.wasTapped(defenderIndex, (attacker.entity.getPosition().x > defender.entity.getPosition().x) ? 'right' : 'left', techWindowMs)) {
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
      this.projectileManager?.spawnFromMove(owner, owner.config.moves?.hadoken, dir);
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
    // Invulnerability check (defender current move defines invuln window)
    try {
      const dMove = defender.currentMove;
      const inv = (dMove?.data as any)?.invulnFrames as [number, number] | undefined;
      if (inv && dMove?.currentFrame != null) {
        if (dMove.currentFrame >= inv[0] && dMove.currentFrame <= inv[1]) return; // no hit
      }
    } catch {}
    // Else: block if holding back, else hit (training dummy overrides)
    let inputs = this.inputManager.getPlayerInputs(defenderIndex);
    try {
      const training: any = (this.app as any)._training;
      const mode = training?.getDummyMode?.();
      if (mode === 'block_all') {
        // Force away direction
        const awayDir = toward === 'left' ? 'right' : 'left';
        (inputs as any)[awayDir] = true;
      } else if (mode === 'block_random') {
        if (Math.random() < 0.6) {
          const awayDir = toward === 'left' ? 'right' : 'left';
          (inputs as any)[awayDir] = true;
        }
      }
    } catch {}
    const away: 'left'|'right' = toward === 'left' ? 'right' : 'left';
    const defHoldingBack = (away === 'left' ? inputs.left : inputs.right);
    const moveData = attacker.currentMove?.data;
    if (!moveData) return;
    if (defHoldingBack) {
      this.processBlock(attacker, defender, moveData);
    } else {
      // Armor check: consume armor instead of full hit
      const armor = (defender.currentMove?.data as any)?.armor as { hits?: number } | undefined;
      if (armor && (defender as any)._armorHitsRemaining == null) (defender as any)._armorHitsRemaining = Math.max(1, armor.hits || 1);
      if ((defender as any)._armorHitsRemaining > 0) {
        (defender as any)._armorHitsRemaining--;
        try {
          const effects: any = (this.app as any)._services?.resolve?.('effects');
          effects?.spawn?.(defender.entity.getPosition().x, defender.entity.getPosition().y + 1.0, 'clash');
          const sfx: any = (this.app as any)._services?.resolve?.('sfx'); sfx?.play?.('block');
        } catch {}
        this.hitstop = Math.max(this.hitstop, 4);
      } else {
        this.processHit(attacker, defender);
        try { this.timeline.push({ t: this.frameCounter, kind: 'hit', data: { a: attacker.id, d: defender.id, move: attacker.currentMove?.name } }); } catch {}
      }
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
    const juggleLimit = (attacker.currentMove?.data as any)?.juggleLimit ?? 6;
    const scalingTable = (attacker.currentMove?.data as any)?.juggleScaling as number[] | undefined;
    let jugglePenalty = juggle >= juggleLimit ? 0.25 : 1.0;
    if (Array.isArray(scalingTable) && scalingTable.length > 0) {
      const idx = Math.min(scalingTable.length - 1, Math.max(0, Math.floor(juggle / Math.max(1, (attacker.currentMove?.data as any)?.juggleAdd ?? 2))));
      jugglePenalty = Math.min(jugglePenalty, scalingTable[idx] ?? jugglePenalty);
    }
    // Counterhit if defender was in startup
    const isCounter = !!(defender.currentMove && defender.currentMove.phase === 'startup');
    const counterScale = isCounter ? 1.2 : 1.0;
    const damage = Math.max(1, Math.floor(moveData.damage * scale * jugglePenalty * counterScale));
    
    defender.health = Math.max(0, defender.health - damage);
    // Base hitstop + scale with damage (capped)
    this.hitstop = Math.min(14, 4 + Math.floor(damage / 12) + (isCounter ? 1 : 0));
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
      effects?.spawn?.(p.x, p.y + 1.0, isCounter ? 'counter' : 'hit');
      const frame = this.getCurrentFrame();
      if (sfx?.playDeterministic) sfx.playDeterministic(`hit_${attacker.id}_${defender.id}`, frame, 'hit'); else sfx?.play?.('hit');
      sfx?.vibrate?.(25);
      // Broadcast spectator event
      try { const spec: any = (this.app as any)._services?.resolve?.('spectate'); spec?.broadcast?.({ t: frame, kind: 'hit' }); } catch {}
    } catch {}

    // Increment juggle points based on move data and decay later
    try {
      const add = (attacker.currentMove?.data as any)?.juggleAdd ?? 2;
      const start = (attacker.currentMove?.data as any)?.juggleStart ?? 0;
      const jp = (defender as any)._jugglePoints || 0;
      (defender as any)._jugglePoints = jp > 0 ? (jp + add) : (jp + Math.max(add, start));
      // schedule ~1500ms (90 frames) juggle reset
      this.juggleResetFrames.set(defender.id, this.frameCounter + 90);
    } catch {}

    // Emit combo-like UI event (simplified)
    try {
      const ui: any = (this.app as any)._ui;
      const hits = (attacker as any)._comboHits = ((attacker as any)._comboHits || 0) + 1;
      const dmgAcc = (attacker as any)._comboDmg = ((attacker as any)._comboDmg || 0) + damage;
      ui?.['app']?.fire?.('ui:combo', { playerId: attacker.id === this.characterManager.getActiveCharacters()[0]?.id ? 'player1' : 'player2', hits, damage: dmgAcc });
      // Clear combo after ~1200ms -> ~72 frames
      this.comboResetFrames.set(attacker.id, this.frameCounter + 72);
    } catch {}
    
    // Pushback (corner stronger)
    try {
      const dir = Math.sign(defender.entity.getPosition().x - attacker.entity.getPosition().x) || 1;
      const dp = defender.entity.getPosition().clone();
      const atRight = dp.x + this.pushboxHalfWidth >= this.stageBounds.right - 1e-3;
      const atLeft = dp.x - this.pushboxHalfWidth <= this.stageBounds.left + 1e-3;
      const atCorner = (dir > 0 && atRight) || (dir < 0 && atLeft);
      dp.x += dir * (atCorner ? 0.18 : 0.28);
      (defender as any)._velX = dir * (atCorner ? 0.06 : 0.12);
      defender.entity.setPosition(dp);
    } catch {}

    // Launch/juggle and wall/ground bounce
    try {
      (defender as any)._airborne = true;
      const velY = Math.max((defender as any)._velY || 0, 0.18 + Math.min(0.12, damage * 0.0008));
      (defender as any)._velY = velY;
      // Wall bounce: if at wall and strong hit, invert horizontal push slightly
      const p = defender.entity.getPosition().clone();
      const atRight = p.x + this.pushboxHalfWidth >= this.stageBounds.right - 1e-3;
      const atLeft = p.x - this.pushboxHalfWidth <= this.stageBounds.left + 1e-3;
      const bounceMeta = (attacker.currentMove?.data as any)?.bounce;
      if ((atRight || atLeft) && (damage > 80 || bounceMeta?.type === 'wall')) {
        const sfx: any = (this.app as any)._services?.resolve?.('sfx');
        const effects: any = (this.app as any)._services?.resolve?.('effects');
        sfx?.play?.('block');
        effects?.spawn?.(p.x, p.y + 0.8, 'clash');
        const str = Math.max(0.2, Math.min(1, bounceMeta?.strength ?? 0.6));
        (defender as any)._velX = -((defender as any)._velX || 0) * str;
      }
      if (bounceMeta?.type === 'ground') {
        (defender as any)._velY = Math.max((defender as any)._velY, (bounceMeta?.strength ?? 0.6) * 0.22);
      }
    } catch {}

    if (defender.health <= 0) {
      this.handleKO(defender, attacker);
    }

    // Enable cancel windows based on outcome
    try {
      (attacker as any)._cancelOutcome = 'hit';
      (attacker as any)._canCancelUntil = this.frameCounter + 10;
    } catch {}
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
      try { const effects: any = (this.app as any)._services?.resolve?.('effects'); const p = defender.entity.getPosition(); effects?.spawn?.(p.x, p.y + 1.0, 'guardcrush'); } catch {}
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
    // Guard meter regen after ~400ms (frame-based)
    try { this.guardRegenFrames.set(defender.id, this.frameCounter + 24); } catch {}
    try {
      const effects: any = (this.app as any)._services?.resolve?.('effects');
      const sfx: any = (this.app as any)._services?.resolve?.('sfx');
      const p = defender.entity.getPosition();
      effects?.spawn?.(p.x, p.y + 1.0, 'block');
      const frame = this.getCurrentFrame();
      if (sfx?.playDeterministic) sfx.playDeterministic(`block_${attacker.id}_${defender.id}`, frame, 'block'); else sfx?.play?.('block');
      sfx?.vibrate?.(12);
    } catch {}

    // Cancel window on block
    try {
      (attacker as any)._cancelOutcome = 'block';
      (attacker as any)._canCancelUntil = this.frameCounter + 6;
    } catch {}
  }

  // Allow cancels from startup/active into defined follow-ups
  private canCancel(fromMove: string, toMove: string, phase: 'startup'|'active'|'recovery'): boolean {
    // Prefer data-driven cancels from move config
    try {
      const cfg = this.characterManager.getActiveCharacters().find(c => c.currentMove?.name === fromMove)?.config;
      const move = cfg?.moves?.[fromMove];
      const until = (this as any).frameCounter;
      const allowOutcome = (this as any)._cancelOutcome || 'any';
      const limit = (this as any)._canCancelUntil || -1;
      const basic: string[] = Array.isArray((move as any)?.cancels) ? (move as any).cancels as string[] : [];
      const adv = (move as any)?.cancelTable as any;
      const inWindow = (limit >= 0) ? (until <= limit) : true;
      if (adv && inWindow && phase !== 'recovery') {
        const list = adv[allowOutcome] || adv['any'] || [];
        if (Array.isArray(list) && list.includes(toMove)) return true;
      }
      if (basic.includes(toMove) && phase !== 'recovery') return true;
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
    try { this.timeline.push({ t: this.frameCounter, kind: 'ko', data: { a: winner.id, d: ko.id } }); } catch {}
    this.recentKOFlag = true;
    try { const spec: any = (this.app as any)._services?.resolve?.('spectate'); spec?.broadcast?.({ t: this.frameCounter, kind: 'ko' }); } catch {}
    try { const tts: any = (this.app as any)._services?.resolve?.('tts'); const i18n: any = (this.app as any)._services?.resolve?.('i18n'); tts?.speak?.(i18n?.t?.('ko') || 'KO!'); } catch {}
  }

  public getCurrentFrame(): number {
    return this.frameCounter;
  }

  public isInHistop(): boolean {
    return this.hitstop > 0;
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
  public consumeTimeline(): Array<{ t: number; kind: string; data?: any }> { const out = this.timeline.slice(); this.timeline = []; return out; }
  public wasRecentKO(): boolean { const f = this.recentKOFlag; this.recentKOFlag = false; return f; }
}
