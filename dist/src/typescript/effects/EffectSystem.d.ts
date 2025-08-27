/**
 * Effect System Manager - Converted from EFFECT.c and EFF*.c files
 */
import * as pc from 'playcanvas';
export declare enum EffectType {
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
export declare class EffectSystem {
    private static instance;
    private effects;
    private effectPool;
    private maxEffects;
    private templates;
    private app;
    static getInstance(): EffectSystem;
    private constructor();
    /**
     * Initialize the effect system with PlayCanvas app
     */
    initialize(app: pc.Application): void;
    /**
     * Initialize effect templates - converted from individual EFF*.c files
     */
    private initializeTemplates;
    /**
     * Initialize the effect pool
     */
    private initializePool;
    /**
     * Spawn a new effect
     */
    spawnEffect(type: EffectType, position: pc.Vec3, velocity?: pc.Vec3, scale?: pc.Vec3, color?: pc.Color): EffectData | null;
    /**
     * Get an effect from the pool
     */
    private getPooledEffect;
    /**
     * Return an effect to the pool
     */
    private returnToPool;
    /**
     * Update all active effects
     */
    update(deltaTime: number): void;
    /**
     * Spawn multiple effects in a pattern
     */
    spawnBurst(type: EffectType, position: pc.Vec3, count: number, spread?: number): void;
    /**
     * Clear all active effects
     */
    clearAll(): void;
    /**
     * Get active effect count
     */
    getActiveCount(): number;
    /**
     * Get all active effects (read-only)
     */
    getEffects(): ReadonlyArray<EffectData>;
    /**
     * Spawn hit effect based on attack strength
     */
    spawnHitEffect(position: pc.Vec3, strength: 'light' | 'medium' | 'heavy'): void;
    /**
     * Spawn block effect
     */
    spawnBlockEffect(position: pc.Vec3): void;
}
