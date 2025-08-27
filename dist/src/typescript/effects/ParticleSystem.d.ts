/**
 * Particle System - TypeScript conversion from various EFF*.c files
 * Handles visual effects like sparks, dust, energy, etc.
 */
import * as pc from 'playcanvas';
export interface ParticleConfig {
    maxParticles: number;
    lifetime: number;
    emissionRate: number;
    startColor: pc.Color;
    endColor: pc.Color;
    startSize: number;
    endSize: number;
    velocity: pc.Vec3;
    acceleration: pc.Vec3;
    gravity: number;
    damping: number;
    fadeOut: boolean;
    texture?: string;
}
export interface Particle {
    id: number;
    position: pc.Vec3;
    velocity: pc.Vec3;
    size: number;
    color: pc.Color;
    lifetime: number;
    maxLifetime: number;
    active: boolean;
    entity?: pc.Entity;
}
export declare class ParticleEmitter {
    private config;
    private particles;
    private nextId;
    private emissionTimer;
    private active;
    private position;
    constructor(config: ParticleConfig);
    /**
     * Initialize particle pool
     */
    private initializeParticles;
    /**
     * Update particles
     */
    update(deltaTime: number): void;
    /**
     * Emit a new particle
     */
    private emitParticle;
    /**
     * Update individual particle
     */
    private updateParticle;
    /**
     * Find inactive particle for reuse
     */
    private findInactiveParticle;
    /**
     * Linear interpolation
     */
    private lerp;
    /**
     * Set emitter position
     */
    setPosition(position: pc.Vec3): void;
    /**
     * Start/stop emission
     */
    setActive(active: boolean): void;
    /**
     * Get active particles
     */
    getActiveParticles(): Particle[];
    /**
     * Clear all particles
     */
    clear(): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<ParticleConfig>): void;
}
export declare class ParticleSystem {
    private emitters;
    private presets;
    constructor();
    /**
     * Initialize effect presets
     */
    private initializePresets;
    /**
     * Create emitter from preset
     */
    createEmitter(name: string, presetName: string): boolean;
    /**
     * Create custom emitter
     */
    createCustomEmitter(name: string, config: ParticleConfig): boolean;
    /**
     * Update all emitters
     */
    update(deltaTime: number): void;
    /**
     * Play effect at position
     */
    playEffect(emitterName: string, position: pc.Vec3): boolean;
    /**
     * Stop effect
     */
    stopEffect(emitterName: string): boolean;
    /**
     * Remove emitter
     */
    removeEmitter(name: string): boolean;
    /**
     * Get emitter
     */
    getEmitter(name: string): ParticleEmitter | undefined;
    /**
     * Clear all effects
     */
    clearAll(): void;
    /**
     * Get active particle count
     */
    getActiveParticleCount(): number;
}
export declare const particleSystem: ParticleSystem;
