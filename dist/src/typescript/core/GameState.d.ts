/**
 * Game State Management System - Converted from ACTIVE00.c
 */
export declare enum GamePhase {
    BOOT = 0,
    TITLE = 1,
    CHARACTER_SELECT = 2,
    BATTLE = 3,
    RESULT = 4,
    CREDITS = 5,
    TRAINING = 6,
    OPTIONS = 7
}
export declare enum BattlePhase {
    INTRO = 0,
    ROUND_START = 1,
    FIGHTING = 2,
    ROUND_END = 3,
    MATCH_END = 4,
    TIME_UP = 5,
    KO = 6
}
export interface GameStateData {
    currentPhase: GamePhase;
    battlePhase: BattlePhase;
    roundNumber: number;
    maxRounds: number;
    timeRemaining: number;
    maxTime: number;
    player1Wins: number;
    player2Wins: number;
    frameCount: number;
    pauseFlag: boolean;
    debugMode: boolean;
}
export declare class GameStateManager {
    private static instance;
    private state;
    private stateHistory;
    private maxHistorySize;
    static getInstance(): GameStateManager;
    private constructor();
    /**
     * Updates the game state - called every frame
     */
    update(): void;
    /**
     * Changes the current game phase
     */
    setGamePhase(phase: GamePhase): void;
    /**
     * Changes the current battle phase
     */
    setBattlePhase(phase: BattlePhase): void;
    /**
     * Initializes a new battle
     */
    private initializeBattle;
    /**
     * Handles round end logic
     */
    private handleRoundEnd;
    /**
     * Handles match end logic
     */
    private handleMatchEnd;
    /**
     * Awards a round win to a player
     */
    awardRound(player: 1 | 2): void;
    /**
     * Toggles pause state
     */
    togglePause(): void;
    /**
     * Gets current game state (read-only)
     */
    getState(): Readonly<GameStateData>;
    /**
     * Gets state from N frames ago
     */
    getHistoryState(framesAgo: number): Readonly<GameStateData> | null;
    /**
     * Resets the game state
     */
    reset(): void;
    /**
     * Sets debug mode
     */
    setDebugMode(enabled: boolean): void;
    /**
     * Gets time remaining as display string
     */
    getTimeDisplay(): string;
}
//# sourceMappingURL=GameState.d.ts.map