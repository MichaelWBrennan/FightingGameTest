import * as pc from 'playcanvas';
import { CharacterEntity } from './CharacterEntity';
import { CharacterData } from '../../../types/character';
export declare class CharacterFactory {
    private app;
    constructor(app: pc.Application);
    createCharacter(characterData: CharacterData, playerId: string, position: pc.Vec3): CharacterEntity;
    private addCharacterComponents;
    private setupCharacterGraphics;
    private initializeCharacterState;
}
