/**
 * PostProcessingManager - HD-2D Post-Processing Effects
 * Implements Octopath Traveler style post-processing: depth-of-field, bloom, color grading
 * Features: Real-time DOF, volumetric lighting, cinematic color grading
 */
import * as pc from 'playcanvas';
import { ISystem } from '../../../types/core';
declare class PostProcessingManager implements ISystem {
    private app;
    private initialized;
    private effects;
    private renderTargets;
    private materials;
    private cameras;
    private quality;
    private resolution;
    private fullScreenQuad;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private createRenderTargets;
    private createPostProcessingMaterials;
    private getDOFFragmentShader;
    private getBloomFragmentShader;
    private getBlurFragmentShader;
    private getColorGradingFragmentShader;
    private getCombineFragmentShader;
    private setupPostProcessingCameras;
    private createEffectEntities;
    private setupRenderPipeline;
    setDepthOfField(focusDistance: number, focusRange: number, blurRadius: number): void;
    setBloom(threshold: number, intensity: number, radius: number): void;
    setColorGrading(contrast: number, saturation: number, brightness: number, warmth: number): void;
    triggerHitFlash(color?: [number, number, number], intensity?: number, duration?: number): void;
    triggerScreenShake(intensity?: number, duration?: number): void;
    triggerSlowMotion(factor?: number, duration?: number): void;
    setDramaticLighting(enabled: boolean): void;
    update(dt: number): void;
    private updateEffectParameters;
    private renderPostProcessing;
    setQuality(quality: string): void;
    destroy(): void;
}
export default PostProcessingManager;
