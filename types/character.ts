/**
 * Character system type definitions for SF3:3S HD-2D Fighting Game
 */

import * as pc from 'playcanvas';

// Character Archetype Types
export type CharacterArchetype = 'shoto' | 'rushdown' | 'grappler' | 'zoner' | 'technical';

export interface ArchetypeTemplate {
  health: number;
  walkSpeed: number;
  dashSpeed: number;
  jumpHeight: number;
  complexity: 'easy' | 'medium' | 'hard' | 'expert';
  strengths: readonly string[];
  weaknesses: readonly string[];
  uniqueMechanics: readonly string[];
}

export type ArchetypeTemplates = Record<CharacterArchetype, ArchetypeTemplate>;

// Character State Types
export type CharacterState =
  | 'idle'
  | 'walking'
  | 'crouching'
  | 'jumping'
  | 'attacking'
  | 'blocking'
  | 'hitstun'
  | 'blockstun'
  | 'knocked_down'
  | 'special_move'
  | 'super_move'
  | 'parrying';

export interface CharacterStateData {
  priority: number;
  cancellable: boolean;
}

export type CharacterStates = Record<CharacterState, CharacterStateData>;

// Animation Types
export interface AnimationData {
  frameCount: number;
  duration: number;
  loop: boolean;
  frames?: AnimationFrame[];
}

export interface AnimationFrame {
  index: number;
  duration: number;
  hitboxes?: HitboxFrame[];
  hurtboxes?: HurtboxFrame[];
  effects?: EffectFrame[];
}

export interface HitboxFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  hitstun: number;
  blockstun: number;
}

export interface HurtboxFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  vulnerability: number; // 0 = invulnerable, 1 = normal, 2 = counter hit
}

export interface EffectFrame {
  type: string;
  x: number;
  y: number;
  parameters?: Record<string, any>;
}

// Frame Data Types
export interface FrameDataValues {
  light: number;
  medium: number;
  heavy: number;
}

export interface FrameData {
  hitstun: FrameDataValues;
  blockstun: FrameDataValues;
  recovery: FrameDataValues;
  startup: FrameDataValues;
}

// Attack Data Types
export interface AttackData {
  damage: number;
  startup: number;
  active: number;
  recovery: number;
  blockAdvantage: number;
  hitAdvantage: number;
  // Compatibility fields for legacy access
  startupFrames?: number;
  activeFrames?: number;
  recoveryFrames?: number;
  advantage?: number;
  hitstun?: number;
  blockstun?: number;
  properties?: AttackProperties;
  ex?: boolean;
  meterCost?: number;
  cancels?: string[];
  projectile?: { speed: number; lifetime: number; width?: number; height?: number };
  // Juggle rules (optional)
  juggleStart?: number; // points added on first launch
  juggleAdd?: number;   // points added on subsequent hits
  juggleLimit?: number; // max juggle points allowed before scaling/whiff
}

export interface AttackProperties {
  overhead?: boolean;
  low?: boolean;
  anti_air?: boolean;
  projectile?: boolean;
  command_grab?: boolean;
  unblockable?: boolean;
  guard_crush?: boolean;
  wall_bounce?: boolean;
  ground_bounce?: boolean;
  knockdown?: boolean;
  hard_knockdown?: boolean;
}

// Character Data Types
export interface CharacterData {
  characterId: string;
  name: string;
  displayName?: string;
  archetype: CharacterArchetype;
  spritePath: string;

  // Base stats
  health: number;
  walkSpeed: number;
  dashSpeed: number;
  jumpHeight: number;
  // Optional nested stats for alternate access patterns
  stats?: { health: number; walkSpeed: number };

  // Gameplay properties
  complexity: string;
  strengths: string[];
  weaknesses: string[];
  uniqueMechanics: string[];

  // Move lists
  moves?: Record<string, AttackData>;
  specialMoves?: Record<string, AttackData>;
  superMoves?: Record<string, AttackData>;

  // Animation data
  animations?: Record<string, AnimationData>;

  // Visual data
  spriteSheets?: Record<string, string>;
  portraits?: Record<string, string>;

  // Audio data
  voiceLines?: Record<string, string>;
  sfx?: Record<string, string>;
}

// Minimal runtime character type used by core systems
export interface Character {
  id: string;
  name?: string;
  entity: pc.Entity;
  config: CharacterData;
  health: number;
  maxHealth?: number;
  meter: number;
  state: 'idle' | 'walking' | 'attacking' | 'hitstun' | 'blockstun' | 'ko';
  currentMove: null | { name: string; data: AttackData; currentFrame: number; phase: 'startup' | 'active' | 'recovery' };
  frameData: { startup: number; active: number; recovery: number; advantage: number };
  facing: 1 | -1;
  guardMeter?: number;
}

export interface CharacterConfig extends CharacterData {}

// Extended PlayCanvas Entity for Characters
export interface CharacterEntity extends pc.Entity {
  // Character identification
  characterData: CharacterData;
  playerId: string;

  // State management
  currentState: CharacterState;
  previousState: CharacterState;
  stateTimer: number;
  frameCount: number;

  // Health and meter
  health: number;
  maxHealth: number;
  meter: number;
  maxMeter: number;

  // Movement properties
  facing: number; // 1 = right, -1 = left
  velocity: pc.Vec3;
  grounded: boolean;

  // Combat properties
  hitboxes: pc.Entity[];
  hurtboxes: pc.Entity[];
  invulnerable: boolean;
  comboCount: number;
  comboDamage: number;
  hitstunDuration?: number;
  blockstunDuration?: number;
  currentAttackData?: AttackData;

  // Animation properties
  currentAnimation: string;
  animationFrame: number;
  animationTimer: number;
  animationSpeed: number;
  animationFrameCount?: number;
  animationDuration?: number;
  animationLoop?: boolean;

  // Player-specific configuration
  inputPrefix?: string;
  uiSide?: 'left' | 'right';
}

// Animation System Types
export interface AnimationSystem {
  frameRate: number;
  frameTime: number;
  currentFrame: number;
  interpolation: boolean;
  blending: boolean;
  spriteSheets: Map<string, any>;
  animations: Map<string, AnimationData>;
}

// Physics Configuration
export interface PhysicsConfig {
  gravity: number;
  groundFriction: number;
  airFriction: number;
  bounceThreshold: number;
  maxFallSpeed: number;
}

// Player Configuration
export interface PlayerConfig {
  startPosition: pc.Vec3;
  facing: number;
  inputPrefix: string;
  uiSide: 'left' | 'right';
}

export type PlayerConfigs = Record<string, PlayerConfig>;

// Manager State
export interface CharacterManagerState {
  initialized: boolean;
  characters: Map<string, CharacterEntity>;
  characterData: Map<string, CharacterData>;
  activeCharacters: Map<string, CharacterEntity>;
  animationSystem: AnimationSystem;
  archetypeTemplates: ArchetypeTemplates;
  characterStates: CharacterStates;
  frameData: FrameData;
  physicsConfig: PhysicsConfig;
  spriteSheetCache: Map<string, any>;
}

// Event Types
export interface CharacterStateChangeEvent {
  character: CharacterEntity;
  oldState: CharacterState;
  newState: CharacterState;
}

export interface CharacterAttackEvent {
  character: CharacterEntity;
  attackType: string;
  attackData: AttackData;
}

export interface CharacterDamageEvent {
  character: CharacterEntity;
  damage: number;
  damageType: string;
  attacker?: CharacterEntity;
}

export interface CharacterKOEvent {
  character: CharacterEntity;
  winner: CharacterEntity;
}

// Utility Types
export type AttackType = 'light_punch' | 'medium_punch' | 'heavy_punch' | 'light_kick' | 'medium_kick' | 'heavy_kick';

export type Direction = -1 | 0 | 1;

export type PlayerId = 'player1' | 'player2';

// Type Guards
export function isValidCharacterState(state: string): state is CharacterState {
  const validStates: CharacterState[] = [
    'idle', 'walking', 'crouching', 'jumping', 'attacking', 'blocking',
    'hitstun', 'blockstun', 'knocked_down', 'special_move', 'super_move', 'parrying'
  ];
  return validStates.includes(state as CharacterState);
}

export function isValidArchetype(archetype: string): archetype is CharacterArchetype {
  const validArchetypes: CharacterArchetype[] = ['shoto', 'rushdown', 'grappler', 'zoner', 'technical'];
  return validArchetypes.includes(archetype as CharacterArchetype);
}

export function isCharacterEntity(entity: pc.Entity): entity is CharacterEntity {
  return 'characterData' in entity && 'currentState' in entity;
}

// Constants
export const DEFAULT_ARCHETYPE_TEMPLATES: ArchetypeTemplates = {
  shoto: {
    health: 1000,
    walkSpeed: 150,
    dashSpeed: 300,
    jumpHeight: 400,
    complexity: 'easy',
    strengths: ['balanced', 'fundamentals', 'projectile'] as const,
    weaknesses: ['specialization'] as const,
    uniqueMechanics: ['hadoken', 'shoryuken', 'tatsu'] as const
  },
  rushdown: {
    health: 900,
    walkSpeed: 180,
    dashSpeed: 400,
    jumpHeight: 350,
    complexity: 'medium',
    strengths: ['pressure', 'mixups', 'frametraps'] as const,
    weaknesses: ['range', 'defense'] as const,
    uniqueMechanics: ['lightning_legs', 'air_mobility'] as const
  },
  grappler: {
    health: 1200,
    walkSpeed: 120,
    dashSpeed: 250,
    jumpHeight: 300,
    complexity: 'hard',
    strengths: ['damage', 'health', 'command_grabs'] as const,
    weaknesses: ['mobility', 'range'] as const,
    uniqueMechanics: ['command_grab', 'armor_moves'] as const
  },
  zoner: {
    health: 1100,
    walkSpeed: 130,
    dashSpeed: 280,
    jumpHeight: 320,
    complexity: 'medium',
    strengths: ['range', 'projectiles', 'space_control'] as const,
    weaknesses: ['close_range', 'mobility'] as const,
    uniqueMechanics: ['multiple_projectiles', 'charge_moves'] as const
  },
  technical: {
    health: 980,
    walkSpeed: 155,
    dashSpeed: 320,
    jumpHeight: 380,
    complexity: 'expert',
    strengths: ['versatility', 'stance_switching', 'mixups'] as const,
    weaknesses: ['consistency', 'execution'] as const,
    uniqueMechanics: ['stance_system', 'evasive_moves'] as const
  }
} as const;

export const DEFAULT_CHARACTER_STATES: CharacterStates = {
  idle: { priority: 0, cancellable: true },
  walking: { priority: 1, cancellable: true },
  crouching: { priority: 1, cancellable: true },
  jumping: { priority: 2, cancellable: false },
  attacking: { priority: 3, cancellable: true },
  blocking: { priority: 2, cancellable: true },
  hitstun: { priority: 4, cancellable: false },
  blockstun: { priority: 3, cancellable: false },
  knocked_down: { priority: 5, cancellable: false },
  special_move: { priority: 4, cancellable: true },
  super_move: { priority: 5, cancellable: false },
  parrying: { priority: 6, cancellable: false }
} as const;

export const DEFAULT_FRAME_DATA: FrameData = {
  hitstun: { light: 8, medium: 12, heavy: 16 },
  blockstun: { light: 4, medium: 6, heavy: 8 },
  recovery: { light: 6, medium: 10, heavy: 14 },
  startup: { light: 4, medium: 7, heavy: 12 }
} as const;

export type PlayerData = any;