
/**
 * Effect System Manager - Converted from EFFECT.c and EFF*.c files
 */

import * as pc from 'playcanvas';

export enum EffectType {
  IMPACT = 0,
  SPARK = 1,
  DUST = 2,
  ENERGY = 3,
  BLOOD = 4,
  PROJECTILE = 5,
  EXPLOSION = 6,
  AURA = 7,
  TRAIL = 8,
  SCREEN_FLASH = 9
}

export interface EffectData {
  type: EffectType;
  position: pc.Vec3;
  velocity: pc.Vec3;
  scale: pc.Vec3;
  rotation: pc.Vec3;
  color: pc.Color;
  life: number;
  maxLife: number;
  fadeRate: number;
  gravity: number;
  bounce: number;
  active: boolean;
  parent?: pc.Entity;
}

export interface EffectTemplate {
  type: EffectType;
  initialScale: pc.Vec3;
  initialVelocity: pc.Vec3;
  life: number;
  fadeRate: number;
  gravity: number;
  bounce: number;
  color: pc.Color;
  blendMode: string;
  texture?: string;
}

export class EffectSystem {
  private static instance: EffectSystem;
  private effects: EffectData[] = [];
  private effectPool: EffectData[] = [];
  private maxEffects = 1000;
  private templates: Map<EffectType, EffectTemplate> = new Map();
  private app: pc.Application | null = null;

  public static getInstance(): EffectSystem {
    if (!EffectSystem.instance) {
      EffectSystem.instance = new EffectSystem();
    }
    return EffectSystem.instance;
  }

  private constructor() {
    this.initializeTemplates();
    this.initializePool();
  }

  /**
   * Initialize the effect system with PlayCanvas app
   */
  public initialize(app: pc.Application): void {
    this.app = app;
  }

  /**
   * Initialize effect templates - converted from individual EFF*.c files
   */
  private initializeTemplates(): void {
    // Impact effects (EFF00.c)
    this.templates.set(EffectType.IMPACT, {
      type: EffectType.IMPACT,
      initialScale: new pc.Vec3(1, 1, 1),
      initialVelocity: new pc.Vec3(0, 0, 0),
      life: 20,
      fadeRate: 0.05,
      gravity: 0,
      bounce: 0,
      color: new pc.Color(1, 1, 1, 1),
      blendMode: 'normal'
    });

    // Spark effects (EFF01.c)
    this.templates.set(EffectType.SPARK, {
      type: EffectType.SPARK,
      initialScale: new pc.Vec3(0.5, 0.5, 0.5),
      initialVelocity: new pc.Vec3(0, 2, 0),
      life: 30,
      fadeRate: 0.033,
      gravity: -0.1,
      bounce: 0.3,
      color: new pc.Color(1, 0.8, 0.2, 1),
      blendMode: 'additive'
    });

    // Dust effects (EFF02.c)
    this.templates.set(EffectType.DUST, {
      type: EffectType.DUST,
      initialScale: new pc.Vec3(0.8, 0.8, 0.8),
      initialVelocity: new pc.Vec3(0, 1, 0),
      life: 60,
      fadeRate: 0.016,
      gravity: -0.05,
      bounce: 0,
      color: new pc.Color(0.7, 0.6, 0.5, 0.8),
      blendMode: 'alpha'
    });

    // Energy effects (EFF04.c)
    this.templates.set(EffectType.ENERGY, {
      type: EffectType.ENERGY,
      initialScale: new pc.Vec3(1.2, 1.2, 1.2),
      initialVelocity: new pc.Vec3(0, 0, 0),
      life: 40,
      fadeRate: 0.025,
      gravity: 0,
      bounce: 0,
      color: new pc.Color(0.2, 0.8, 1, 1),
      blendMode: 'additive'
    });

    // Blood effects (EFF07.c)
    this.templates.set(EffectType.BLOOD, {
      type: EffectType.BLOOD,
      initialScale: new pc.Vec3(0.6, 0.6, 0.6),
      initialVelocity: new pc.Vec3(0, 1.5, 0),
      life: 45,
      fadeRate: 0.022,
      gravity: -0.15,
      bounce: 0.1,
      color: new pc.Color(0.8, 0.1, 0.1, 1),
      blendMode: 'normal'
    });
  }

  /**
   * Initialize the effect pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.maxEffects; i++) {
      this.effectPool.push({
        type: EffectType.IMPACT,
        position: new pc.Vec3(),
        velocity: new pc.Vec3(),
        scale: new pc.Vec3(1, 1, 1),
        rotation: new pc.Vec3(),
        color: new pc.Color(1, 1, 1, 1),
        life: 0,
        maxLife: 60,
        fadeRate: 0.016,
        gravity: 0,
        bounce: 0,
        active: false
      });
    }
  }

  /**
   * Spawn a new effect
   */
  public spawnEffect(
    type: EffectType,
    position: pc.Vec3,
    velocity?: pc.Vec3,
    scale?: pc.Vec3,
    color?: pc.Color
  ): EffectData | null {
    const template = this.templates.get(type);
    if (!template) return null;

    const effect = this.getPooledEffect();
    if (!effect) return null;

    // Initialize effect from template
    effect.type = type;
    effect.position.copy(position);
    effect.velocity.copy(velocity || template.initialVelocity);
    effect.scale.copy(scale || template.initialScale);
    effect.color.copy(color || template.color);
    effect.life = template.life;
    effect.maxLife = template.life;
    effect.fadeRate = template.fadeRate;
    effect.gravity = template.gravity;
    effect.bounce = template.bounce;
    effect.active = true;
    effect.rotation.set(0, 0, 0);

    this.effects.push(effect);
    return effect;
  }

  /**
   * Get an effect from the pool
   */
  private getPooledEffect(): EffectData | null {
    return this.effectPool.pop() || null;
  }

  /**
   * Return an effect to the pool
   */
  private returnToPool(effect: EffectData): void {
    effect.active = false;
    this.effectPool.push(effect);
  }

  /**
   * Update all active effects
   */
  public update(deltaTime: number): void {
    const frameTime = deltaTime * 60; // Convert to frame-based timing

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      
      if (!effect.active) {
        this.effects.splice(i, 1);
        this.returnToPool(effect);
        continue;
      }

      // Update position
      effect.position.x += effect.velocity.x * frameTime;
      effect.position.y += effect.velocity.y * frameTime;
      effect.position.z += effect.velocity.z * frameTime;

      // Apply gravity
      effect.velocity.y += effect.gravity * frameTime;

      // Handle ground collision (simple bounce)
      if (effect.position.y <= 0 && effect.velocity.y < 0) {
        effect.position.y = 0;
        effect.velocity.y *= -effect.bounce;
      }

      // Update life and fade
      effect.life -= frameTime;
      if (effect.life <= 0) {
        effect.active = false;
        continue;
      }

      // Update alpha based on life remaining
      const lifeRatio = effect.life / effect.maxLife;
      effect.color.a = Math.max(0, lifeRatio);

      // Update scale based on effect type
      if (effect.type === EffectType.EXPLOSION) {
        const growthFactor = 1 + (1 - lifeRatio) * 2;
        effect.scale.set(growthFactor, growthFactor, growthFactor);
      }
    }
  }

  /**
   * Spawn multiple effects in a pattern
   */
  public spawnBurst(
    type: EffectType,
    position: pc.Vec3,
    count: number,
    spread: number = 1
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = new pc.Vec3(
        Math.cos(angle) * spread,
        Math.sin(angle) * spread,
        0
      );
      
      this.spawnEffect(type, position, velocity);
    }
  }

  /**
   * Clear all active effects
   */
  public clearAll(): void {
    for (const effect of this.effects) {
      this.returnToPool(effect);
    }
    this.effects.length = 0;
  }

  /**
   * Get active effect count
   */
  public getActiveCount(): number {
    return this.effects.length;
  }

  /**
   * Get all active effects (read-only)
   */
  public getEffects(): ReadonlyArray<EffectData> {
    return this.effects;
  }

  /**
   * Spawn hit effect based on attack strength
   */
  public spawnHitEffect(position: pc.Vec3, strength: 'light' | 'medium' | 'heavy'): void {
    let effectType = EffectType.IMPACT;
    let sparkCount = 3;
    
    switch (strength) {
      case 'light':
        effectType = EffectType.IMPACT;
        sparkCount = 3;
        break;
      case 'medium':
        effectType = EffectType.SPARK;
        sparkCount = 6;
        break;
      case 'heavy':
        effectType = EffectType.ENERGY;
        sparkCount = 10;
        break;
    }

    this.spawnEffect(effectType, position);
    this.spawnBurst(EffectType.SPARK, position, sparkCount, 2);
  }

  /**
   * Spawn block effect
   */
  public spawnBlockEffect(position: pc.Vec3): void {
    this.spawnEffect(EffectType.SPARK, position);
    this.spawnBurst(EffectType.SPARK, position, 5, 1.5);
  }
}
