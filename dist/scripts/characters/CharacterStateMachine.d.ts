import { CharacterEntity } from './CharacterEntity';
import { CharacterState, CharacterStates } from '../../../types/character';
export declare class CharacterStateMachine {
    private character;
    private states;
    constructor(character: CharacterEntity, states: CharacterStates);
    setState(newState: CharacterState, force?: boolean): boolean;
    update(dt: number): void;
}
