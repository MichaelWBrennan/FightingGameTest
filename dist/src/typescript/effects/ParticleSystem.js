/**
 * Particle System - TypeScript conversion from various EFF*.c files
 * Handles visual effects like sparks, dust, energy, etc.
 */
import * as pc from 'playcanvas';
export class ParticleEmitter {
    constructor(config) {
        this.particles = [];
        this.nextId = 0;
        this.emissionTimer = 0;
        this.active = true;
        this.position = new pc.Vec3();
        this.config = { ...config };
        this.initializeParticles();
    }
    /**
     * Initialize particle pool
     */
    initializeParticles() {
        for (let i = 0; i < this.config.maxParticles; i++) {
            this.particles.push({
                id: this.nextId++,
                position: new pc.Vec3(),
                velocity: new pc.Vec3(),
                size: 0,
                color: new pc.Color(),
                lifetime: 0,
                maxLifetime: 0,
                active: false
            });
        }
    }
    /**
     * Update particles
     */
    update(deltaTime) {
        if (!this.active)
            return;
        // Update emission
        this.emissionTimer += deltaTime;
        const emissionInterval = 1.0 / this.config.emissionRate;
        while (this.emissionTimer >= emissionInterval) {
            this.emitParticle();
            this.emissionTimer -= emissionInterval;
        }
        // Update existing particles
        for (const particle of this.particles) {
            if (!particle.active)
                continue;
            this.updateParticle(particle, deltaTime);
        }
    }
    /**
     * Emit a new particle
     */
    emitParticle() {
        const particle = this.findInactiveParticle();
        if (!particle)
            return;
        // Initialize particle
        particle.active = true;
        particle.position.copy(this.position);
        particle.velocity.copy(this.config.velocity);
        particle.size = this.config.startSize;
        particle.color.copy(this.config.startColor);
        particle.lifetime = 0;
        particle.maxLifetime = this.config.lifetime;
        // Add some randomness
        particle.velocity.x += (Math.random() - 0.5) * 2;
        particle.velocity.y += (Math.random() - 0.5) * 2;
        particle.velocity.z += (Math.random() - 0.5) * 2;
    }
    /**
     * Update individual particle
     */
    updateParticle(particle, deltaTime) {
        // Update lifetime
        particle.lifetime += deltaTime;
        if (particle.lifetime >= particle.maxLifetime) {
            particle.active = false;
            return;
        }
        const lifetimeRatio = particle.lifetime / particle.maxLifetime;
        // Update physics
        particle.velocity.x += this.config.acceleration.x * deltaTime;
        particle.velocity.y += this.config.acceleration.y * deltaTime;
        particle.velocity.z += this.config.acceleration.z * deltaTime;
        // Apply gravity
        particle.velocity.y -= this.config.gravity * deltaTime;
        // Apply damping
        particle.velocity.x *= Math.pow(this.config.damping, deltaTime);
        particle.velocity.y *= Math.pow(this.config.damping, deltaTime);
        particle.velocity.z *= Math.pow(this.config.damping, deltaTime);
        // Update position
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        // Update visual properties
        particle.size = this.lerp(this.config.startSize, this.config.endSize, lifetimeRatio);
        // Interpolate color
        particle.color.r = this.lerp(this.config.startColor.r, this.config.endColor.r, lifetimeRatio);
        particle.color.g = this.lerp(this.config.startColor.g, this.config.endColor.g, lifetimeRatio);
        particle.color.b = this.lerp(this.config.startColor.b, this.config.endColor.b, lifetimeRatio);
        if (this.config.fadeOut) {
            particle.color.a = this.lerp(this.config.startColor.a, 0, lifetimeRatio);
        }
        else {
            particle.color.a = this.lerp(this.config.startColor.a, this.config.endColor.a, lifetimeRatio);
        }
    }
    /**
     * Find inactive particle for reuse
     */
    findInactiveParticle() {
        return this.particles.find(p => !p.active) || null;
    }
    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    /**
     * Set emitter position
     */
    setPosition(position) {
        this.position.copy(position);
    }
    /**
     * Start/stop emission
     */
    setActive(active) {
        this.active = active;
    }
    /**
     * Get active particles
     */
    getActiveParticles() {
        return this.particles.filter(p => p.active);
    }
    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.particles) {
            particle.active = false;
        }
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
export class ParticleSystem {
    constructor() {
        this.emitters = new Map();
        this.presets = new Map();
        this.initializePresets();
    }
    /**
     * Initialize effect presets
     */
    initializePresets() {
        // Hit spark effect
        this.presets.set('hit_spark', {
            maxParticles: 20,
            lifetime: 0.3,
            emissionRate: 100,
            startColor: new pc.Color(1, 1, 0.5, 1),
            endColor: new pc.Color(1, 0.5, 0, 0),
            startSize: 0.1,
            endSize: 0.05,
            velocity: new pc.Vec3(0, 2, 0),
            acceleration: new pc.Vec3(0, -5, 0),
            gravity: 9.8,
            damping: 0.95,
            fadeOut: true
        });
        // Dust effect
        this.presets.set('dust', {
            maxParticles: 30,
            lifetime: 0.8,
            emissionRate: 50,
            startColor: new pc.Color(0.8, 0.7, 0.6, 0.8),
            endColor: new pc.Color(0.6, 0.5, 0.4, 0),
            startSize: 0.05,
            endSize: 0.2,
            velocity: new pc.Vec3(0, 1, 0),
            acceleration: new pc.Vec3(0, 0, 0),
            gravity: 2,
            damping: 0.98,
            fadeOut: true
        });
        // Energy burst
        this.presets.set('energy_burst', {
            maxParticles: 50,
            lifetime: 0.5,
            emissionRate: 200,
            startColor: new pc.Color(0.5, 0.8, 1, 1),
            endColor: new pc.Color(0.2, 0.4, 1, 0),
            startSize: 0.08,
            endSize: 0.15,
            velocity: new pc.Vec3(0, 0, 0),
            acceleration: new pc.Vec3(0, 0, 0),
            gravity: 0,
            damping: 0.9,
            fadeOut: true
        });
    }
    /**
     * Create emitter from preset
     */
    createEmitter(name, presetName) {
        const preset = this.presets.get(presetName);
        if (!preset) {
            console.error(`Particle preset '${presetName}' not found`);
            return false;
        }
        const emitter = new ParticleEmitter(preset);
        this.emitters.set(name, emitter);
        return true;
    }
    /**
     * Create custom emitter
     */
    createCustomEmitter(name, config) {
        if (this.emitters.has(name)) {
            console.warn(`Emitter '${name}' already exists`);
            return false;
        }
        const emitter = new ParticleEmitter(config);
        this.emitters.set(name, emitter);
        return true;
    }
    /**
     * Update all emitters
     */
    update(deltaTime) {
        for (const emitter of this.emitters.values()) {
            emitter.update(deltaTime);
        }
    }
    /**
     * Play effect at position
     */
    playEffect(emitterName, position) {
        const emitter = this.emitters.get(emitterName);
        if (!emitter) {
            console.error(`Emitter '${emitterName}' not found`);
            return false;
        }
        emitter.setPosition(position);
        emitter.setActive(true);
        return true;
    }
    /**
     * Stop effect
     */
    stopEffect(emitterName) {
        const emitter = this.emitters.get(emitterName);
        if (!emitter) {
            return false;
        }
        emitter.setActive(false);
        return true;
    }
    /**
     * Remove emitter
     */
    removeEmitter(name) {
        return this.emitters.delete(name);
    }
    /**
     * Get emitter
     */
    getEmitter(name) {
        return this.emitters.get(name);
    }
    /**
     * Clear all effects
     */
    clearAll() {
        for (const emitter of this.emitters.values()) {
            emitter.clear();
        }
    }
    /**
     * Get active particle count
     */
    getActiveParticleCount() {
        let count = 0;
        for (const emitter of this.emitters.values()) {
            count += emitter.getActiveParticles().length;
        }
        return count;
    }
}
// Global particle system instance
export const particleSystem = new ParticleSystem();
//# sourceMappingURL=ParticleSystem.js.map