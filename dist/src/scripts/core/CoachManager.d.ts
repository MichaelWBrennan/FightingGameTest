import { ISystem } from '../../../types/core';
import { IGameState, GameState, BattleState } from '../../../types/game';
export declare class CoachManager implements ISystem, IGameState {
    private app;
    private gameManager;
    private coachOverlay;
    constructor(app: pc.Application, gameManager: any);
    initialize(): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    fire(event: string, ...args: any[]): void;
    getCurrentGameState(): GameState;
    getCurrentBattleState(): BattleState;
    getPlayerCharacter(playerId: string): string | null;
    getOpponentCharacter(playerId: string): string | null;
    getPlayerProfile(playerId: string): any;
}
