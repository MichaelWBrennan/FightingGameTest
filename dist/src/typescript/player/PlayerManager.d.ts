import { PlayerData } from '../../../types/character';
export declare class PlayerManager {
    private players;
    private maxPlayers;
    constructor();
    private initializePlayers;
    private createDefaultCharacter;
    getPlayer(playerId: number): PlayerData | undefined;
    getAllPlayers(): PlayerData[];
    updatePlayer(playerId: number, updates: Partial<PlayerData>): void;
    setCharacter(playerId: number, characterName: string): void;
    private createCharacter;
    resetPlayer(playerId: number): void;
    updatePlayerPositions(): void;
    updatePlayerFacing(): void;
    dealDamage(playerId: number, damage: number): void;
    addScore(playerId: number, points: number): void;
    incrementWins(playerId: number): void;
    resetScores(): void;
    resetWins(): void;
    setOperator(playerId: number, isOperator: boolean): void;
    isOperator(playerId: number): boolean;
    getWinner(): PlayerData | null;
    areAllPlayersReady(): boolean;
    getPlayerCount(): number;
    clearPlayers(): void;
}
//# sourceMappingURL=PlayerManager.d.ts.map