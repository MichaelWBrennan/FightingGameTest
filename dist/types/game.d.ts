export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'BATTLE' | 'PAUSE' | 'COMBO_TRIAL';
export type BattleState = 'NEUTRAL' | 'COMBO' | 'SUPER' | 'STUNNED';
export interface IGameState {
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    fire(event: string, ...args: any[]): void;
    getCurrentGameState(): GameState;
    getCurrentBattleState(): BattleState;
    getPlayerCharacter(playerId: string): string | null;
    getOpponentCharacter(playerId: string): string | null;
    getPlayerProfile(playerId: string): any;
}
