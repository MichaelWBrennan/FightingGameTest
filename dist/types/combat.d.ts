/**
 * Combat system type definitions for SF3:3S HD-2D Fighting Game
 */
import { type CombatState, type AttackData, type Character } from './core.js';
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
export interface PlayerCombatData {
    character: Character | null;
    state: CombatState;
    stateTimer: number;
    activeAttack: SpecialMoveData | null;
    attackStartFrame: number;
    attackRecovery: number;
    blocking: boolean;
    parryWindow: number;
    parryRecovery: number;
    lastParryFrame: number;
    comboCount: number;
    comboDamage: number;
    comboStartFrame: number;
    comboDecayTimer?: number;
    meter: number;
    maxMeter: number;
    tension: number;
    stunned: boolean;
    dizzy: boolean;
    invulnerable: boolean;
    hitstun: number;
    blockstun: number;
    advantage: number;
}
export interface SpecialMoveProperties {
    damage: number;
    startup: number;
    active: number;
    recovery: number;
    projectile?: boolean;
    meterGain?: number;
    meterCost?: number;
    invulnerable?: readonly [number, number];
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
export interface HitboxData {
    entity: pc.Entity;
    owner: Character;
    attackData: AttackData;
    active: boolean;
    startFrame: number;
    endFrame: number;
    hitTargets: Set<Character>;
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
export interface GraphicsSystemIntegration {
    sf3Graphics?: any;
    hd2dRenderer?: any;
    postProcessing?: any;
}
export interface CollisionSystemState {
    enabled: boolean;
    checkFrequency: number;
    lastCheck: number;
}
export interface DebugMaterials {
    hitbox: any;
    hurtbox: any;
    throwbox: any;
}
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
export declare function isValidCombatState(state: string): state is CombatState;
export declare function isValidDamageType(type: string): type is DamageType;
export declare function isValidParryType(type: string): type is ParryType;
export declare const DEFAULT_COMBAT_CONFIG: CombatSystemConfig;
export type ReadonlyCombatConfig = Readonly<CombatSystemConfig>;
//# sourceMappingURL=combat.d.ts.map