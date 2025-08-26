import * as pc from 'playcanvas';
/**
 * Main entry point for HD-2D Fighting Game System
 * Exports all core systems with strict TypeScript typing
 */
import { GameManager } from './scripts/core/GameManager';
import { InputManager } from './scripts/core/InputManager';
import { CombatSystem } from './scripts/combat/CombatSystem';
import { CharacterManager } from './scripts/characters/CharacterManager';
import { SF3GraphicsManager } from './scripts/graphics/SF3GraphicsManager';
import './app/index';
export type { GameState, BattleState, ISystem, Character, AttackData, PerformanceStats, ParticleType, Direction } from '../types/core';
export type { InputState, ButtonState, ChargeState, MotionCommand, CommandHistory, PlayerId, InputName } from '../types/input';
export type { CombatSystemConfig, PlayerCombatData, SpecialMoveData, HitboxData, HurtboxData, ParryResult, ParryType, DamageType } from '../types/combat';
export type { CharacterData, CharacterEntity, CharacterState, ArchetypeTemplate, AnimationData, AttackProperties } from '../types/character';
export type { VisualStyle, ColorPalette, CharacterAnimator, EffectType, LayerName } from '../types/graphics';
export declare const VERSION = "1.0.0";
export declare const BUILD_TARGET = "TypeScript Migration";
/**
 * Initialize the complete fighting game system
 * @param app - PlayCanvas Application instance
 * @returns Promise<FightingGameSystem> - Initialized system managers
 */
export declare function initializeFightingGameSystem(app: pc.Application): Promise<FightingGameSystem>;
/**
 * Complete fighting game system interface
 */
export interface FightingGameSystem {
    gameManager: GameManager;
    inputManager: InputManager;
    combatSystem: CombatSystem;
    characterManager: CharacterManager;
    sf3Graphics: SF3GraphicsManager;
    version: string;
}
/**
 * System configuration for initialization
 */
export interface SystemConfig {
    targetFPS?: number;
    debug?: boolean;
    enableParrySystem?: boolean;
    maxPlayers?: number;
    stageId?: string;
}
/**
 * Configure and initialize the fighting game system with custom settings
 * @param app - PlayCanvas Application instance
 * @param config - System configuration options
 * @returns Promise<FightingGameSystem> - Initialized system with custom config
 */
export declare function initializeWithConfig(app: pc.Application, config?: SystemConfig): Promise<FightingGameSystem>;
export default initializeFightingGameSystem;
//# sourceMappingURL=index.d.ts.map