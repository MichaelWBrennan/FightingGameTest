/**
 * Combat system type definitions for SF3:3S HD-2D Fighting Game
 */

import { type CombatState, type AttackData, type Character, type pc } from './core.js';

// Combat Configuration Types
export interface HitDetectionConfig {
  enabled: boolean;
  precision: 'frame-perfect' | 'approximate';
  hitboxVisualization: boolean;
}

export interface DamageScalingConfig {
  enabled: boolean;
  scalingStart: number;
  scalingRate: number;
  minimumDamage: number;
}

export interface ParrySystemConfig {
  enabled: boolean;
  parryWindow: number;
  parryRecovery: number;
  parryAdvantage: number;
  redParryWindow: number;
  redParryAdvantage: number;
}

export interface StunConfig {
  hitstunBase: number;
  blockstunBase: number;
  hitstunScaling: number;
  blockstunScaling: number;
}

export interface CombatSystemConfig {
  frameRate: number;
  frameTime: number;
  hitDetection: HitDetectionConfig;
  damageScaling: DamageScalingConfig;
  parrySystem: ParrySystemConfig;
  stun: StunConfig;
}

// Player Combat Data
export interface PlayerCombatData {
  character: Character | null;

  // State tracking
  state: CombatState;
  stateTimer: number;

  // Attack data
  activeAttack: SpecialMoveData | null;
  attackStartFrame: number;
  attackRecovery: number;

  // Defense data
  blocking: boolean;
  parryWindow: number;
  parryRecovery: number;
  lastParryFrame: number;

  // Combo tracking
  comboCount: number;
  comboDamage: number;
  comboStartFrame: number;
  comboDecayTimer?: number;

  // Meter and resources
  meter: number;
  maxMeter: number;
  tension: number;

  // Status effects
  stunned: boolean;
  dizzy: boolean;
  invulnerable: boolean;

  // Frame data
  hitstun: number;
  blockstun: number;
  advantage: number;
}

// Special Move System
export interface SpecialMoveProperties {
  damage: number;
  startup: number;
  active: number;
  recovery: number;
  projectile?: boolean;
  meterGain?: number;
  meterCost?: number;
  invulnerable?: readonly [number, number]; // [start frame, end frame]
  knockdown?: boolean;
  superFreeze?: number;
  fullScreen?: boolean;
  hitstun?: number;
  blockstun?: number;
  hitAdvantage?: number;
  blockAdvantage?: number;
}

export interface SpecialMoveData {
  motion: string;
  buttons: readonly string[];
  properties: SpecialMoveProperties;
}

// Hitbox and Collision System
export interface HitboxData {
  entity: pc.Entity;
  owner: Character;
  attackData: AttackData;
  active: boolean;
  startFrame: number;
  endFrame: number;
  hitTargets: Set<Character>; // Prevent multi-hit on same target
}

export interface HurtboxData {
  entity: pc.Entity;
  owner: Character;
  active: boolean;
  vulnerable: boolean;
}

export interface CollisionBounds {
  min: pc.Vec3;
  max: pc.Vec3;
}

// Parry System
export type ParryType = 'normal' | 'red';

export interface ParryResult {
  success: boolean;
  type?: ParryType;
}

export interface ParrySystemState {
  enabled: boolean;
  parryWindow: number;
  parryRecovery: number;
  redParryEnabled: boolean;
  redParryWindow: number;
  meterGain: number;
  healthGain: number;
  frameAdvantage: number;
}

// Combo System
export interface ComboSystemState {
  activeCombo: ActiveCombo | null;
  comboTracker: Map<string, ComboData>;
  maxComboLength: number;
  comboDecay: number;
}

export interface ActiveCombo {
  player: string;
  hits: number;
  damage: number;
  startFrame: number;
  lastHitFrame: number;
}

export interface ComboData {
  hits: number;
  damage: number;
  scaling: number;
  lastHitFrame: number;
}

export interface ComboTrackingConfig {
  enabled: boolean;
  damageScaling: boolean;
  maxComboHits: number;
  comboDecayFrames: number;
}

// Visual Effects
export interface VisualEffectsState {
  hitSparks: HitSparkEffect[];
  screenShake: ScreenShakeEffect;
  slowMotion: SlowMotionEffect;
  freeze: FreezeEffect;
}

export interface HitSparkEffect {
  position: pc.Vec3;
  intensity: number;
  duration: number;
  type: 'normal' | 'counter' | 'critical';
}

export interface ScreenShakeEffect {
  intensity: number;
  duration: number;
}

export interface SlowMotionEffect {
  active: boolean;
  factor: number;
  duration?: number;
}

export interface FreezeEffect {
  active: boolean;
  duration: number;
}

// Graphics System Integration
export interface GraphicsSystemIntegration {
  sf3Graphics?: any;
  hd2dRenderer?: any;
  postProcessing?: any;
}

// Collision System
export interface CollisionSystemState {
  enabled: boolean;
  checkFrequency: number;
  lastCheck: number;
}

export interface DebugMaterials {
  hitbox: any; // pc.StandardMaterial
  hurtbox: any;
  throwbox: any;
}

// Hit Effects and Damage
export type DamageType = 'normal' | 'chip' | 'counter' | 'critical';

export interface DamageInfo {
  amount: number;
  type: DamageType;
  source: string;
  scaled: boolean;
  originalAmount?: number;
}

export interface HitEffectConfig {
  position: pc.Vec3;
  damage: number;
  type: 'normal' | 'block' | 'parry' | 'counter';
  intensity?: number;
}

// Event Types
export interface CombatHitEvent {
  attacker: string;
  defender: string;
  damage: number;
  position: pc.Vec3;
  attackData: AttackData;
}

export interface CombatBlockEvent {
  defender: string;
  attacker: string;
  damage: number;
  position: pc.Vec3;
}

export interface CombatParryEvent {
  defender: string;
  attacker: string;
  type: ParryType;
  position: pc.Vec3;
}

export interface CombatDamageEvent {
  player: string;
  damage: number;
  type: DamageType;
  health: number;
}

export interface CombatComboEvent {
  player: string;
  hits: number;
  damage: number;
}

export interface CombatSpecialMoveEvent {
  player: string;
  move: string;
  data: SpecialMoveData;
}

export interface CombatKOEvent {
  winner: string;
  loser: string;
  finalHit?: AttackData;
}

// State Management
export interface CombatManagerState {
  initialized: boolean;
  combatConfig: CombatSystemConfig;
  activeCombat: {
    player1: PlayerCombatData;
    player2: PlayerCombatData;
  };
  hitboxes: Map<string, HitboxData>;
  hurtboxes: Map<string, HurtboxData>;
  collisionPairs: Array<[HitboxData, HurtboxData]>;
  specialMoves: Map<string, SpecialMoveData>;
  superMoves: Map<string, SpecialMoveData>;
  comboSystem: ComboSystemState;
  visualEffects: VisualEffectsState;
  graphics: GraphicsSystemIntegration;
  collisionSystem: CollisionSystemState;
  debugMaterials?: DebugMaterials;
  parrySystem: ParrySystemState;
  comboTracking: ComboTrackingConfig;
}

// Type Guards and Utilities
export function isValidCombatState(state: string): state is CombatState {
  const validStates: CombatState[] = [
    'neutral', 'attacking', 'defending', 'hitstun', 'blockstun', 'special_move'
  ];
  return validStates.includes(state as CombatState);
}

export function isValidDamageType(type: string): type is DamageType {
  const validTypes: DamageType[] = ['normal', 'chip', 'counter', 'critical'];
  return validTypes.includes(type as DamageType);
}

export function isValidParryType(type: string): type is ParryType {
  return type === 'normal' || type === 'red';
}

// Constants
export const DEFAULT_COMBAT_CONFIG: CombatSystemConfig = {
  frameRate: 60,
  frameTime: 1000 / 60,
  hitDetection: {
    enabled: true,
    precision: 'frame-perfect',
    hitboxVisualization: false
  },
  damageScaling: {
    enabled: true,
    scalingStart: 3,
    scalingRate: 0.9,
    minimumDamage: 0.1
  },
  parrySystem: {
    enabled: true,
    parryWindow: 7,
    parryRecovery: 12,
    parryAdvantage: 15,
    redParryWindow: 2,
    redParryAdvantage: 30
  },
  stun: {
    hitstunBase: 12,
    blockstunBase: 8,
    hitstunScaling: 1.2,
    blockstunScaling: 1.0
  }
} as const;

// Utility type for read-only combat config
export type ReadonlyCombatConfig = Readonly<CombatSystemConfig>;

export interface CharacterState {
  position: pc.Vec3;
  velocity: pc.Vec3;
  health: number;
  maxHealth: number;
  state: string;
  isGrounded: boolean;
  onPlatform: boolean;
  facing: number;
  animation: string;
}

export interface HitData {
  damage: number;
  stunTime: number;
  knockback: pc.Vec3;
}

export interface MeterData {
  super: number;
  ex: number;
  maxSuper: number;
  maxEx: number;
}

export interface CombatEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface HitEffect {
  type: string;
  position: pc.Vec3;
  duration: number;
}

export interface BlockData {
  canBlock: boolean;
  blockType: 'high' | 'low' | 'air';
}

export const DEFAULT_COMBAT_STATE: CombatState = {
  player1: {} as CharacterState,
  player2: {} as CharacterState,
  round: 1,
  timer: 99
};

export const DEFAULT_COMBO_DATA = {
  hits: 0,
  damage: 0,
  scaling: 1.0
};

export const DEFAULT_METER_DATA: MeterData = {
  super: 0,
  ex: 0,
  maxSuper: 100,
  maxEx: 100
};