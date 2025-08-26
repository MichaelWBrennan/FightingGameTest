/**
 * SF3GraphicsManager - HD-2D Fighting Game Graphics System
 * Implements fluid animation and visual style for 2D fighting games
 * Features: Hand-drawn animation feel, atmospheric palettes, fluid motion
 */
import * as pc from 'playcanvas';
import { ISystem } from '../../../types/core';
export declare class SF3GraphicsManager implements ISystem {
    private app;
    private state;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private createMaterials;
    private setupAnimationSystem;
    private createInterpolationCurves;
    private setupLighting;
    private createCharacterLighting;
    private createEnvironmentLighting;
    private createEffectPools;
    private createHitSparkPool;
    private createImpactWavePool;
    private createMotionTrailPool;
    private createParryFlashPool;
    private setupStageInteraction;
    createCharacter(playerId: string, characterData: any): pc.Entity;
    private setupCharacterLighting;
    private createCharacterAnimator;
    createHitEffect(position: pc.Vec3, power?: number, type?: string): void;
    createParryEffect(position: pc.Vec3): void;
    createSuperEffect(character: pc.Entity, superData: any): void;
    setDramaticLighting(enabled: boolean): void;
    private onCombatHit;
    private onSuperMove;
    private onParry;
    private triggerStageReaction;
    private animateStageElement;
    private getPooledEffect;
    update(dt: number): void;
    private updateAnimations;
    private advanceAnimationFrame;
    private updateFrameBlending;
    private applyRubberBandDeformation;
    private updateLighting;
    private updateStageElements;
    destroy(): void;
}
//# sourceMappingURL=SF3GraphicsManager.d.ts.map