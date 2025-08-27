import * as pc from 'playcanvas';
import { CharacterManager } from '../characters/CharacterManager';
import { InputManager } from '../input/InputManager';
export declare class CombatSystem {
    private app;
    private characterManager;
    private inputManager;
    private frameCounter;
    private hitstop;
    constructor(app: pc.Application);
    initialize(characterManager: CharacterManager, inputManager: InputManager): void;
    update(deltaTime: number): void;
    private processInputs;
    private processCharacterInputs;
    private moveCharacter;
    private executeMove;
    private updateHitboxes;
    private updateMoveFrames;
    private checkCollisions;
    private charactersColliding;
    private processHit;
    private handleKO;
    getCurrentFrame(): number;
    isInHistop(): boolean;
}
