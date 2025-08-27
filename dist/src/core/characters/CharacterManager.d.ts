import * as pc from 'playcanvas';
import { Character } from '../../../types/character';
export declare class CharacterManager {
    private app;
    private characters;
    private characterConfigs;
    private activeCharacters;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private loadCharacterConfigs;
    createCharacter(characterId: string, position: pc.Vec3): Character | null;
    getCharacter(characterId: string): Character | undefined;
    setActiveCharacters(player1Id: string, player2Id: string): void;
    getActiveCharacters(): Character[];
    update(deltaTime: number): void;
    private updateCharacterState;
    getAvailableCharacters(): string[];
}
