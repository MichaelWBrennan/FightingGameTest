import * as pc from 'playcanvas';
/**
 * Core type definitions for SF3:3S HD-2D Fighting Game System
 */
export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'BATTLE' | 'PAUSE';
export type BattleState = 'NEUTRAL' | 'COMBO' | 'SUPER' | 'STUNNED';
export type CombatState = 'neutral' | 'attacking' | 'defending' | 'hitstun' | 'blockstun' | 'special_move';
export type Direction = 'neutral' | 'up' | 'down' | 'left' | 'right' | 'forward' | 'back' | 'upForward' | 'upBack' | 'downForward' | 'downBack';
export type InputType = 'keyboard' | 'gamepad' | 'mouse';
export interface InputMapping {
    type: InputType;
    code: string;
    gamepadIndex?: number;
    axis?: number;
}
export interface PlayerInputMappings {
    up: InputMapping;
    down: InputMapping;
    left: InputMapping;
    right: InputMapping;
    lightPunch: InputMapping;
    mediumPunch: InputMapping;
    heavyPunch: InputMapping;
    lightKick: InputMapping;
    mediumKick: InputMapping;
    heavyKick: InputMapping;
}
export interface Character {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    model?: pc.Entity;
    animations?: Map<string, any>;
}
export interface AttackData {
    damage: number;
    startup: number;
    active: number;
    recovery: number;
    hitstun?: number;
    blockstun?: number;
    hitAdvantage?: number;
    blockAdvantage?: number;
    meterGain?: number;
    properties?: AttackProperties;
}
export interface AttackProperties {
    knockdown?: boolean;
    overhead?: boolean;
    low?: boolean;
    unblockable?: boolean;
    projectile?: boolean;
    invulnerable?: [number, number];
    superArmor?: boolean;
    guardCrush?: boolean;
}
export interface ISystem {
    initialize(): Promise<void>;
    update?(dt: number): void;
    fixedUpdate?(fixedDt: number): void;
    interpolationUpdate?(dt: number): void;
    postUpdate?(dt: number): void;
    destroy?(): void;
}
export interface PerformanceStats {
    frameCount: number;
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    gameState: GameState;
    battleState: BattleState;
    activeParticles?: number;
    inputLatency?: number;
    averageLatency?: number;
    maxLatency?: number;
    droppedInputs?: number;
}
export interface GameEvent {
    type: string;
    timestamp: number;
    data?: any;
}
export interface InputEvent extends GameEvent {
    playerId: string;
    inputName: string;
    frame: number;
    pressed?: boolean;
}
export interface CombatEvent extends GameEvent {
    attacker?: string;
    defender?: string;
    damage?: number;
    position?: pc.Vec3;
    attackData?: AttackData;
}
export interface GameConfig {
    targetFPS: number;
    frameTime: number;
    maxHistoryFrames: number;
    debug: boolean;
}
export interface InputConfig {
    bufferWindow: number;
    commandWindow: number;
    negativeEdge: boolean;
    buttonPriority: Record<string, number>;
    pollRate: number;
    maxInputDelay: number;
}
export interface CombatConfig {
    frameRate: number;
    frameTime: number;
    hitDetection: {
        enabled: boolean;
        precision: string;
        hitboxVisualization: boolean;
    };
    damageScaling: {
        enabled: boolean;
        scalingStart: number;
        scalingRate: number;
        minimumDamage: number;
    };
    parrySystem: {
        enabled: boolean;
        parryWindow: number;
        parryRecovery: number;
        parryAdvantage: number;
        redParryWindow: number;
        redParryAdvantage: number;
    };
    stun: {
        hitstunBase: number;
        blockstunBase: number;
        hitstunScaling: number;
        blockstunScaling: number;
    };
}
export type Bounds = {
    min: pc.Vec3;
    max: pc.Vec3;
};
export type ParticleType = 'impact' | 'spark' | 'dust' | 'energy' | 'blood';
export interface ParticlePool {
    [key: string]: pc.Entity[];
}
export interface EventEmitter {
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    fire(event: string, ...args: any[]): void;
}
//# sourceMappingURL=core.d.ts.map