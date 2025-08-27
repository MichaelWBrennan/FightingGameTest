import * as pc from 'playcanvas';
/**
 * Graphics system type definitions for SF3:3S HD-2D Fighting Game
 */
export interface ColorPalette {
    ambient: pc.Color;
    keyLight: pc.Color;
    rimLight: pc.Color;
    shadowTint: pc.Color;
    playerOne: pc.Color;
    playerTwo: pc.Color;
    hitSpark: pc.Color;
    blockSpark: pc.Color;
    counterHit: pc.Color;
}
export interface VisualStyle {
    animationFrameRate: number;
    frameBlending: boolean;
    motionBlur: boolean;
    rubberBandMotion: boolean;
    colorPalette: ColorPalette;
    stageReaction: boolean;
    backgroundAnimation: boolean;
    dynamicElements: boolean;
}
export interface CharacterAnimator {
    entity: pc.Entity;
    currentAnimation: string;
    frameIndex: number;
    frameTime: number;
    animations: Record<string, AnimationData>;
    blendTime: number;
    lastFrame: any;
    motionBlur: boolean;
    rubberBand: boolean;
    frameBlending: boolean;
}
export interface AnimationData {
    frameCount: number;
    duration: number;
    frames?: AnimationFrame[];
}
export interface AnimationFrame {
    index: number;
    duration: number;
    sprite?: string;
    effects?: FrameEffect[];
}
export interface FrameEffect {
    type: string;
    parameters: Record<string, any>;
}
export interface AnimationSystem {
    characterAnimators: Map<string, CharacterAnimator>;
    spriteAtlases: Map<string, any>;
    frameData: Map<string, AnimationData>;
    interpolationCurves: Map<string, pc.CurveSet>;
}
export interface MaterialSet {
    characterBase: pc.StandardMaterial | null;
    characterHighlight: pc.StandardMaterial | null;
    impactEffect: pc.StandardMaterial | null;
    backgroundElements: pc.StandardMaterial | null;
    stageReactive: pc.StandardMaterial | null;
}
export interface CharacterLights {
    keyLight: pc.Entity;
    rimLight: pc.Entity;
    fillLight: pc.Entity;
}
export interface LightingSystem {
    characterLights: Map<string, CharacterLights>;
    environmentLights: pc.Entity[];
    dramatic: boolean;
    intensityMultiplier: number;
}
export interface EffectPools {
    hitSparks: pc.Entity[];
    impactWaves: pc.Entity[];
    motionTrails: pc.Entity[];
    screenDistortion: pc.Entity[];
    parryFlash: pc.Entity[];
}
export interface StageElements {
    reactive: pc.Entity[];
    animated: pc.Entity[];
    dynamic: pc.Entity[];
}
export interface PerformanceSettings {
    maxParticles: number;
    cullingDistance: number;
    lodThreshold: number;
    dynamicBatching: boolean;
}
export interface SF3GraphicsManagerState {
    initialized: boolean;
    visualStyle: VisualStyle;
    animationSystem: AnimationSystem;
    materials: MaterialSet;
    lightingSystem: LightingSystem;
    effectPools: EffectPools;
    performanceSettings: PerformanceSettings;
    stageElements: StageElements;
    animationFrameTime: number;
    lastAnimationUpdate: number;
    frameBlendAlpha?: number;
    frameBlendSpeed?: number;
}
export interface LayerConfig {
    name: string;
    depth: number;
    parallaxFactor: number;
    visible: boolean;
    entities: pc.Entity[];
}
export interface HD2DLayer {
    name: string;
    depth: number;
    parallaxFactor: number;
    container: pc.Entity;
    entities: pc.Entity[];
    visible: boolean;
}
export interface HD2DRenderSettings {
    pixelPerfect: boolean;
    filterMode: 'point' | 'linear';
    scalingMode: 'pixel_perfect' | 'smooth';
    targetResolution: {
        width: number;
        height: number;
    };
    pixelScale: number;
}
export interface BillboardSprite {
    entity: pc.Entity;
    texture: pc.Texture;
    size: pc.Vec2;
    position: pc.Vec3;
}
export interface ParallaxLayer {
    entity: pc.Entity;
    basePosition: pc.Vec3;
    parallaxFactor: number;
    autoScroll: boolean;
    scrollSpeed: pc.Vec2;
}
export interface ParallaxSettings {
    enabled: boolean;
    referenceCamera: pc.Entity | null;
    autoScrollSpeed: number;
    depthSorting: boolean;
}
export interface PostProcessEffect {
    name: string;
    enabled: boolean;
    shader: any;
    uniforms: Record<string, any>;
    priority: number;
}
export interface ScreenShake {
    intensity: number;
    duration: number;
    decay: number;
    frequency: number;
    active: boolean;
}
export interface HitFlash {
    color: pc.Color;
    intensity: number;
    duration: number;
    active: boolean;
}
export interface SlowMotion {
    factor: number;
    duration: number;
    active: boolean;
}
export interface PostProcessingState {
    effects: Map<string, PostProcessEffect>;
    screenShake: ScreenShake;
    hitFlash: HitFlash;
    slowMotion: SlowMotion;
    dramaTicLighting: boolean;
    bloomIntensity: number;
    contrastLevel: number;
    saturationLevel: number;
}
export interface CombatHitEvent {
    position: pc.Vec3;
    power: number;
    type: string;
}
export interface SuperMoveEvent {
    character: pc.Entity;
    superData: {
        duration?: number;
        intensity?: number;
        effects?: string[];
    };
}
export interface ParryEvent {
    position: pc.Vec3;
    type: 'normal' | 'red';
}
export interface UIElement {
    entity: pc.Entity;
    type: string;
    visible: boolean;
    position: pc.Vec2;
    size: pc.Vec2;
    data?: any;
}
export interface HealthBar {
    entity: pc.Entity;
    background: pc.Entity;
    fill: pc.Entity;
    maxHealth: number;
    currentHealth: number;
    animationSpeed: number;
}
export interface MeterBar {
    entity: pc.Entity;
    background: pc.Entity;
    fill: pc.Entity;
    segments: pc.Entity[];
    maxMeter: number;
    currentMeter: number;
    segmentCount: number;
}
export interface ComboDisplay {
    entity: pc.Entity;
    hitsText: pc.Entity;
    damageText: pc.Entity;
    visible: boolean;
    fadeTimer: number;
}
export interface UIManagerState {
    initialized: boolean;
    uiElements: Map<string, UIElement>;
    healthBars: Map<string, HealthBar>;
    meterBars: Map<string, MeterBar>;
    comboDisplays: Map<string, ComboDisplay>;
    debugOverlay: boolean;
    canvas: pc.Entity | null;
    screen: any;
}
export type EffectType = 'normal' | 'counter' | 'block' | 'parry' | 'super';
export type PlayerId = 'player1' | 'player2';
export type LayerName = 'background' | 'midground' | 'characters' | 'effects' | 'ui';
export declare function isValidEffectType(type: string): type is EffectType;
export declare function isValidLayerName(name: string): name is LayerName;
export declare const DEFAULT_VISUAL_STYLE: VisualStyle;
export declare const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings;
export declare const DEFAULT_HD2D_SETTINGS: HD2DRenderSettings;
export interface GraphicsState {
    renderLayers: RenderLayer[];
    camera: Camera;
    lighting: any;
}
export interface RenderLayer {
    id: string;
    sprites: Sprite[];
    visible: boolean;
}
export interface Sprite {
    id: string;
    texture: pc.Texture;
    position: pc.Vec3;
}
export interface Camera {
    position: pc.Vec3;
    target: pc.Vec3;
}
