/**
 * Street Fighter III Character System
 * Converted from character-related C files
 */
export interface CharacterData {
    id: number;
    name: string;
    health: number;
    maxHealth: number;
    meter: number;
    maxMeter: number;
    position: {
        x: number;
        y: number;
    };
    velocity: {
        x: number;
        y: number;
    };
    facing: 'left' | 'right';
    state: string;
    animation: string;
    frameIndex: number;
}
export interface MoveData {
    name: string;
    input: string[];
    damage: number;
    startup: number;
    active: number;
    recovery: number;
    blockstun: number;
    hitstun: number;
}
export declare class SF3CharacterSystem {
    private characters;
    private movesets;
    constructor();
    private initializeCharacters;
    private initializeMovesets;
    createCharacter(data: CharacterData): void;
    getCharacter(id: number): CharacterData | null;
    updateCharacter(id: number, updates: Partial<CharacterData>): void;
    executeMove(characterId: number, moveName: string): boolean;
    takeDamage(characterId: number, damage: number): void;
    addMeter(characterId: number, amount: number): void;
    update(): void;
    getCharacters(): CharacterData[];
    getMoves(characterName: string): MoveData[];
}
//# sourceMappingURL=CharacterSystem.d.ts.map