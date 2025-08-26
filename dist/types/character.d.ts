/**
 * Character system type definitions for SF3:3S HD-2D Fighting Game
 */
import { type pc } from './core.js';
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
export type CharacterState = 'idle' | 'walking' | 'crouching' | 'jumping' | 'attacking' | 'blocking' | 'hitstun' | 'blockstun' | 'knocked_down' | 'special_move' | 'super_move' | 'parrying';
export interface CharacterStateData {
    priority: number;
    cancellable: boolean;
}
export type CharacterStates = Record<CharacterState, CharacterStateData>;
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
    vulnerability: number;
}
export interface EffectFrame {
    type: string;
    x: number;
    y: number;
    parameters?: Record<string, any>;
}
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
export interface AttackData {
    damage: number;
    startup: number;
    active: number;
    recovery: number;
    blockAdvantage: number;
    hitAdvantage: number;
    hitstun?: number;
    blockstun?: number;
    properties?: AttackProperties;
    ex?: boolean;
    meterCost?: number;
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
export interface CharacterData {
    characterId: string;
    name: string;
    archetype: CharacterArchetype;
    spritePath: string;
    health: number;
    walkSpeed: number;
    dashSpeed: number;
    jumpHeight: number;
    complexity: string;
    strengths: string[];
    weaknesses: string[];
    uniqueMechanics: string[];
    moves?: Record<string, AttackData>;
    specialMoves?: Record<string, AttackData>;
    superMoves?: Record<string, AttackData>;
    animations?: Record<string, AnimationData>;
    spriteSheets?: Record<string, string>;
    portraits?: Record<string, string>;
    voiceLines?: Record<string, string>;
    sfx?: Record<string, string>;
}
export interface CharacterEntity extends pc.Entity {
    characterData: CharacterData;
    playerId: string;
    currentState: CharacterState;
    previousState: CharacterState;
    stateTimer: number;
    frameCount: number;
    health: number;
    maxHealth: number;
    meter: number;
    maxMeter: number;
    facing: number;
    velocity: pc.Vec3;
    grounded: boolean;
    hitboxes: pc.Entity[];
    hurtboxes: pc.Entity[];
    invulnerable: boolean;
    comboCount: number;
    comboDamage: number;
    hitstunDuration?: number;
    blockstunDuration?: number;
    currentAttackData?: AttackData;
    currentAnimation: string;
    animationFrame: number;
    animationTimer: number;
    animationSpeed: number;
    animationFrameCount?: number;
    animationDuration?: number;
    animationLoop?: boolean;
    inputPrefix?: string;
    uiSide?: 'left' | 'right';
}
export interface AnimationSystem {
    frameRate: number;
    frameTime: number;
    currentFrame: number;
    interpolation: boolean;
    blending: boolean;
    spriteSheets: Map<string, any>;
    animations: Map<string, AnimationData>;
}
export interface PhysicsConfig {
    gravity: number;
    groundFriction: number;
    airFriction: number;
    bounceThreshold: number;
    maxFallSpeed: number;
}
export interface PlayerConfig {
    startPosition: pc.Vec3;
    facing: number;
    inputPrefix: string;
    uiSide: 'left' | 'right';
}
export type PlayerConfigs = Record<string, PlayerConfig>;
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
export type AttackType = 'light_punch' | 'medium_punch' | 'heavy_punch' | 'light_kick' | 'medium_kick' | 'heavy_kick';
export type Direction = -1 | 0 | 1;
export type PlayerId = 'player1' | 'player2';
export declare function isValidCharacterState(state: string): state is CharacterState;
export declare function isValidArchetype(archetype: string): archetype is CharacterArchetype;
export declare function isCharacterEntity(entity: pc.Entity): entity is CharacterEntity;
export declare const DEFAULT_ARCHETYPE_TEMPLATES: ArchetypeTemplates;
export declare const DEFAULT_CHARACTER_STATES: CharacterStates;
export declare const DEFAULT_FRAME_DATA: FrameData;
//# sourceMappingURL=character.d.ts.map