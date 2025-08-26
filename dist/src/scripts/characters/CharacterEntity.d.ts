import * as pc from 'playcanvas';
import { type CharacterData, type CharacterState, type PlayerId, type AttackData } from '../../../types/character';
export declare class CharacterEntity extends pc.Entity {
    characterData: CharacterData;
    playerId: PlayerId;
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
    currentAnimation: string;
    animationFrame: number;
    animationTimer: number;
    animationSpeed: number;
    animationFrameCount?: number;
    animationDuration?: number;
    animationLoop?: boolean;
    currentAttackData?: AttackData;
    hitstunDuration?: number;
    blockstunDuration?: number;
    inputPrefix: string;
    uiSide: 'left' | 'right';
    constructor(name: string);
}
//# sourceMappingURL=CharacterEntity.d.ts.map