import * as pc from 'playcanvas';
import { ISystem, ParticleType } from "../../../types/core";
export declare class ParticleManager implements ISystem {
    private app;
    private particleContainer;
    private particlePools;
    constructor(app: pc.Application);
    initialize(): void;
    getParticle(type: ParticleType): pc.Entity | null;
    releaseParticle(particle: pc.Entity): void;
    getActiveParticleCount(): number;
    destroy(): void;
}
