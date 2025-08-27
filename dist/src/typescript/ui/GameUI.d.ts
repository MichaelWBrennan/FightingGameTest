/**
 * Game UI System - TypeScript Implementation
 * Converted from HTML to TypeScript DOM manipulation
 */
export interface UIConfig {
    healthBarWidth: number;
    healthBarHeight: number;
    timerFontSize: number;
    comboTextSize: number;
    playerColors: {
        p1: string;
        p2: string;
    };
}
export interface PlayerState {
    health: number;
    maxHealth: number;
    meter: number;
    maxMeter: number;
    combo: number;
    damage: number;
    name: string;
}
export interface MatchState {
    timeRemaining: number;
    round: number;
    maxRounds: number;
    p1Score: number;
    p2Score: number;
}
export declare class GameUIManager {
    private container;
    private config;
    private elements;
    constructor(containerId: string, config: UIConfig);
    private createUIElements;
    private setupStyles;
    updatePlayerState(player: 'p1' | 'p2', state: PlayerState): void;
    updateMatchState(state: MatchState): void;
    private showDamage;
    private showCombo;
    showRoundStart(roundNumber: number): void;
    showKO(winner: 'p1' | 'p2'): void;
    destroy(): void;
}
export declare const defaultUIConfig: UIConfig;
