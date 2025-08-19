/**
 * Graphics system type definitions for SF3:3S HD-2D Fighting Game
 */

import { type ISystem } from './core';

// Visual Style Configuration
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

// Animation System Types
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

// Material System Types
export interface MaterialSet {
  characterBase: pc.StandardMaterial | null;
  characterHighlight: pc.StandardMaterial | null;
  impactEffect: pc.StandardMaterial | null;
  backgroundElements: pc.StandardMaterial | null;
  stageReactive: pc.StandardMaterial | null;
}

// Lighting System Types
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

// Effect Pool Types
export interface EffectPools {
  hitSparks: pc.Entity[];
  impactWaves: pc.Entity[];
  motionTrails: pc.Entity[];
  screenDistortion: pc.Entity[];
  parryFlash: pc.Entity[];
}

// Stage Interaction Types
export interface StageElements {
  reactive: pc.Entity[];
  animated: pc.Entity[];
  dynamic: pc.Entity[];
}

// Performance Settings
export interface PerformanceSettings {
  maxParticles: number;
  cullingDistance: number;
  lodThreshold: number;
  dynamicBatching: boolean;
}

// SF3 Graphics Manager State
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

// HD-2D Renderer Types
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
  targetResolution: { width: number; height: number };
  pixelScale: number;
}

export interface BillboardSprite {
  entity: pc.Entity;
  texture: pc.Texture;
  size: pc.Vec2;
  position: pc.Vec3;
}

// Parallax Manager Types
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

// Post Processing Types
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

// Event Types for Graphics
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

// UI Manager Types
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

// Utility Types for Graphics
export type EffectType = 'normal' | 'counter' | 'block' | 'parry' | 'super';
export type PlayerId = 'player1' | 'player2';
export type LayerName = 'background' | 'midground' | 'characters' | 'effects' | 'ui';

// Type Guards
export function isValidEffectType(type: string): type is EffectType {
  const validTypes: EffectType[] = ['normal', 'counter', 'block', 'parry', 'super'];
  return validTypes.includes(type as EffectType);
}

export function isValidLayerName(name: string): name is LayerName {
  const validNames: LayerName[] = ['background', 'midground', 'characters', 'effects', 'ui'];
  return validNames.includes(name as LayerName);
}

// Constants
export const DEFAULT_VISUAL_STYLE: VisualStyle = {
  animationFrameRate: 60,
  frameBlending: true,
  motionBlur: true,
  rubberBandMotion: true,
  colorPalette: {
    ambient: new pc.Color(0.15, 0.18, 0.22),
    keyLight: new pc.Color(0.95, 0.90, 0.85),
    rimLight: new pc.Color(0.60, 0.75, 0.95),
    shadowTint: new pc.Color(0.25, 0.30, 0.45),
    playerOne: new pc.Color(0.95, 0.85, 0.70),
    playerTwo: new pc.Color(0.70, 0.85, 0.95),
    hitSpark: new pc.Color(1.0, 0.9, 0.6),
    blockSpark: new pc.Color(0.8, 0.9, 1.0),
    counterHit: new pc.Color(1.0, 0.4, 0.4)
  },
  stageReaction: true,
  backgroundAnimation: true,
  dynamicElements: true
} as const;

export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  maxParticles: 200,
  cullingDistance: 50,
  lodThreshold: 0.5,
  dynamicBatching: true
} as const;

export const DEFAULT_HD2D_SETTINGS: HD2DRenderSettings = {
  pixelPerfect: true,
  filterMode: 'point',
  scalingMode: 'pixel_perfect',
  targetResolution: { width: 320, height: 240 },
  pixelScale: 4
} as const;