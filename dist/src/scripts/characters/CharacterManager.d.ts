import * as pc from 'playcanvas';
/**
 * CharacterManager - Character System for SF3:3S HD-2D Fighting Game
 * Handles character loading, animation, and state management
 * Features: Data-driven characters, SF3-style animation, HD-2D integration
 */
import { type ISystem } from '../../../types/core';
import { type CharacterData, type CharacterState, type Direction } from '../../../types/character';
import { CharacterEntity } from './CharacterEntity';
export declare class CharacterManager implements ISystem {
    private readonly app;
    private initialized;
    private factory;
    private readonly characters;
    private readonly characterData;
    private readonly characterVariations;
    private readonly activeCharacters;
    private readonly stateMachines;
    private readonly animationSystem;
    private readonly archetypeTemplates;
    private readonly characterStates;
    private readonly physicsConfig;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private loadCharacterData;
    private setupAnimationSystem;
    private initializeCharacterTemplates;
    private setupCharacterPhysics;
    createCharacter(characterId: string, playerId: string, position?: pc.Vec3, characterDataOverride?: CharacterData | null): CharacterEntity | null;
    setCharacterState(character: CharacterEntity, newState: CharacterState, force?: boolean): boolean;
    updateCharacterAnimation(character: CharacterEntity, animationName: string, loop?: boolean): void;
    private getAnimationData;
    moveCharacter(character: CharacterEntity, direction: Direction, speed?: number): void;
    jumpCharacter(character: CharacterEntity): void;
    performAttack(character: CharacterEntity, attackType: string, isEx?: boolean): boolean;
    private getAttackData;
    private createHitbox;
    createCharacterWithVariation(characterId: string, variationId: string, playerId: string, position?: pc.Vec3): CharacterEntity | null;
    private applyVariation;
    private setObjectValueByPath;
    private deleteObjectValueByPath;
    update(dt: number): void;
    private updateCharacter;
    private updateCharacterAnimationFrame;
    private updateCharacterPhysics;
    private checkGroundCollision;
    private updateAnimationSystem;
    getCharacter(playerId: string): CharacterEntity | undefined;
    getOpponent(character: CharacterEntity): CharacterEntity | undefined;
    getCharacterVariations(characterId: string): any[] | undefined;
    getCharacterData(characterId: string): CharacterData | undefined;
    getAvailableCharacters(): string[];
    getAllCharacters(): CharacterEntity[];
    isInitialized(): boolean;
    private isValidPlayerId;
    destroy(): void;
}
//# sourceMappingURL=CharacterManager.d.ts.map