import { ISystem, ParticlePool, ParticleType } from "../../../types/core";

export class ParticleManager implements ISystem {
  private app: pc.Application;
  private particleContainer!: pc.Entity;
  private particlePools: ParticlePool = {
    impact: [],
    spark: [],
    dust: [],
    energy: [],
    blood: []
  };

  constructor(app: pc.Application) {
    this.app = app;
  }

  public initialize(): void {
    this.particleContainer = new pc.Entity('ParticleEffects');
    this.app.root.addChild(this.particleContainer);

    Object.keys(this.particlePools).forEach((type: string) => {
      const particleType = type as ParticleType;
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

  public getParticle(type: ParticleType): pc.Entity | null {
    const pool = this.particlePools[type];
    if (!pool) return null;

    for (const particle of pool) {
        if (!particle.enabled) {
            return particle;
        }
    }

    return null; // Pool exhausted
  }

  public releaseParticle(particle: pc.Entity): void {
    particle.enabled = false;
    particle.setPosition(0, -100, 0); // Move offscreen
  }

  public getActiveParticleCount(): number {
    let count = 0;
    Object.values(this.particlePools).forEach((pool: pc.Entity[]) => {
        pool.forEach((particle: pc.Entity) => {
            if (particle.enabled) count++;
        });
    });
    return count;
  }

  public destroy(): void {
    this.particleContainer.destroy();
  }
}
