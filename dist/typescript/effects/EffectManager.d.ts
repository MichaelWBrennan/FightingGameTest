export interface Effect {
    id: string;
    type: string;
    x: number;
    y: number;
    active: boolean;
    lifetime: number;
    currentTime: number;
    properties: Map<string, any>;
}
export declare class EffectManager {
    private effects;
    private effectCounter;
    constructor();
    private initializeEffectSystem;
    createEffect(type: string, x: number, y: number, properties?: Map<string, any>): string;
    updateEffects(): void;
    private updateEffectByType;
    private updateExplosionEffect;
    private updateParticleEffect;
    private updateFlashEffect;
    private updateHitSparkEffect;
    private updateGenericEffect;
    removeEffect(id: string): void;
    removeAllEffects(): void;
    getEffect(id: string): Effect | undefined;
    getAllEffects(): Effect[];
    getActiveEffectCount(): number;
    createExplosion(x: number, y: number, size?: number): string;
    createHitSpark(x: number, y: number, color?: string): string;
    createParticle(x: number, y: number, velocityX: number, velocityY: number): string;
    createFlash(x: number, y: number, duration?: number): string;
    effectWorkInit(): void;
    effectWorkQuickInit(): void;
    moveEffectWork(layer: number): void;
}
