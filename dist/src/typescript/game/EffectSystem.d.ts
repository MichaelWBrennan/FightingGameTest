/**
 * Street Fighter III Effect System
 * Unified conversion of all EFF*.c files to TypeScript
 */
export interface EffectParams {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    duration: number;
    animationSpeed: number;
}
export interface EffectState {
    id: number;
    type: string;
    active: boolean;
    timer: number;
    params: EffectParams;
    frameIndex: number;
    totalFrames: number;
}
export declare class SF3EffectSystem {
    private effects;
    private nextId;
    private effectRegistry;
    constructor();
    private registerAllEffects;
    private registerEffect;
    createEffect(type: string, params: Partial<EffectParams>): number;
    private createHitSpark;
    private createBlockSpark;
    private createFireball;
    private createShockwave;
    private createLightning;
    private createIceEffect;
    private createWindEffect;
    update(): void;
    getActiveEffects(): EffectState[];
    removeEffect(id: number): void;
    clearAllEffects(): void;
}
//# sourceMappingURL=EffectSystem.d.ts.map