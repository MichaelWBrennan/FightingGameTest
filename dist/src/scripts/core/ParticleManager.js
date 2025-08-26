import * as pc from 'playcanvas';
export class ParticleManager {
    constructor(app) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "particleContainer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "particlePools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                impact: [],
                spark: [],
                dust: [],
                energy: [],
                blood: []
            }
        });
        this.app = app;
    }
    initialize() {
        this.particleContainer = new pc.Entity('ParticleEffects');
        this.app.root.addChild(this.particleContainer);
        Object.keys(this.particlePools).forEach((type) => {
            const particleType = type;
            for (let i = 0; i < 50; i++) {
                const particle = new pc.Entity(`${type}_particle_${i}`);
                particle.addComponent('render', {
                    type: 'plane'
                });
                particle.enabled = false;
                this.particleContainer.addChild(particle);
                this.particlePools[particleType].push(particle);
            }
        });
    }
    getParticle(type) {
        const pool = this.particlePools[type];
        if (!pool)
            return null;
        for (const particle of pool) {
            if (!particle.enabled) {
                return particle;
            }
        }
        return null; // Pool exhausted
    }
    releaseParticle(particle) {
        particle.enabled = false;
        particle.setPosition(0, -100, 0); // Move offscreen
    }
    getActiveParticleCount() {
        let count = 0;
        Object.values(this.particlePools).forEach((pool) => {
            pool.forEach((particle) => {
                if (particle.enabled)
                    count++;
            });
        });
        return count;
    }
    destroy() {
        this.particleContainer.destroy();
    }
}
//# sourceMappingURL=ParticleManager.js.map