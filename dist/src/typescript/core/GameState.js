/**
 * Game State Management System - Converted from ACTIVE00.c
 */
export var GamePhase;
(function (GamePhase) {
    GamePhase[GamePhase["BOOT"] = 0] = "BOOT";
    GamePhase[GamePhase["TITLE"] = 1] = "TITLE";
    GamePhase[GamePhase["CHARACTER_SELECT"] = 2] = "CHARACTER_SELECT";
    GamePhase[GamePhase["BATTLE"] = 3] = "BATTLE";
    GamePhase[GamePhase["RESULT"] = 4] = "RESULT";
    GamePhase[GamePhase["CREDITS"] = 5] = "CREDITS";
    GamePhase[GamePhase["TRAINING"] = 6] = "TRAINING";
    GamePhase[GamePhase["OPTIONS"] = 7] = "OPTIONS";
})(GamePhase || (GamePhase = {}));
export var BattlePhase;
(function (BattlePhase) {
    BattlePhase[BattlePhase["INTRO"] = 0] = "INTRO";
    BattlePhase[BattlePhase["ROUND_START"] = 1] = "ROUND_START";
    BattlePhase[BattlePhase["FIGHTING"] = 2] = "FIGHTING";
    BattlePhase[BattlePhase["ROUND_END"] = 3] = "ROUND_END";
    BattlePhase[BattlePhase["MATCH_END"] = 4] = "MATCH_END";
    BattlePhase[BattlePhase["TIME_UP"] = 5] = "TIME_UP";
    BattlePhase[BattlePhase["KO"] = 6] = "KO";
})(BattlePhase || (BattlePhase = {}));
export class GameStateManager {
    static getInstance() {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }
    constructor() {
        this.stateHistory = [];
        this.maxHistorySize = 60; // 1 second at 60fps
        this.state = {
            currentPhase: GamePhase.BOOT,
            battlePhase: BattlePhase.INTRO,
            roundNumber: 1,
            maxRounds: 3,
            timeRemaining: 99 * 60, // 99 seconds in frames
            maxTime: 99 * 60,
            player1Wins: 0,
            player2Wins: 0,
            frameCount: 0,
            pauseFlag: false,
            debugMode: false
        };
    }
    /**
     * Updates the game state - called every frame
     */
    update() {
        this.state.frameCount++;
        // Save state to history
        this.stateHistory.push({ ...this.state });
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
        // Update time in battle
        if (this.state.currentPhase === GamePhase.BATTLE &&
            this.state.battlePhase === BattlePhase.FIGHTING &&
            !this.state.pauseFlag) {
            this.state.timeRemaining = Math.max(0, this.state.timeRemaining - 1);
            if (this.state.timeRemaining === 0) {
                this.setBattlePhase(BattlePhase.TIME_UP);
            }
        }
    }
    /**
     * Changes the current game phase
     */
    setGamePhase(phase) {
        this.state.currentPhase = phase;
        if (phase === GamePhase.BATTLE) {
            this.initializeBattle();
        }
    }
    /**
     * Changes the current battle phase
     */
    setBattlePhase(phase) {
        this.state.battlePhase = phase;
        switch (phase) {
            case BattlePhase.ROUND_START:
                this.state.timeRemaining = this.state.maxTime;
                break;
            case BattlePhase.ROUND_END:
                this.handleRoundEnd();
                break;
            case BattlePhase.MATCH_END:
                this.handleMatchEnd();
                break;
        }
    }
    /**
     * Initializes a new battle
     */
    initializeBattle() {
        this.state.battlePhase = BattlePhase.INTRO;
        this.state.roundNumber = 1;
        this.state.player1Wins = 0;
        this.state.player2Wins = 0;
        this.state.timeRemaining = this.state.maxTime;
        this.state.pauseFlag = false;
    }
    /**
     * Handles round end logic
     */
    handleRoundEnd() {
        // Round winner logic would be determined by character health
        // This is a simplified version
    }
    /**
     * Handles match end logic
     */
    handleMatchEnd() {
        // Match is over, prepare for result screen
        setTimeout(() => {
            this.setGamePhase(GamePhase.RESULT);
        }, 180); // 3 seconds
    }
    /**
     * Awards a round win to a player
     */
    awardRound(player) {
        if (player === 1) {
            this.state.player1Wins++;
        }
        else {
            this.state.player2Wins++;
        }
        // Check for match win
        const winsNeeded = Math.ceil(this.state.maxRounds / 2);
        if (this.state.player1Wins >= winsNeeded || this.state.player2Wins >= winsNeeded) {
            this.setBattlePhase(BattlePhase.MATCH_END);
        }
        else {
            this.state.roundNumber++;
            this.setBattlePhase(BattlePhase.ROUND_START);
        }
    }
    /**
     * Toggles pause state
     */
    togglePause() {
        if (this.state.currentPhase === GamePhase.BATTLE) {
            this.state.pauseFlag = !this.state.pauseFlag;
        }
    }
    /**
     * Gets current game state (read-only)
     */
    getState() {
        return this.state;
    }
    /**
     * Gets state from N frames ago
     */
    getHistoryState(framesAgo) {
        const index = this.stateHistory.length - 1 - framesAgo;
        return index >= 0 ? this.stateHistory[index] : null;
    }
    /**
     * Resets the game state
     */
    reset() {
        this.state = {
            currentPhase: GamePhase.TITLE,
            battlePhase: BattlePhase.INTRO,
            roundNumber: 1,
            maxRounds: 3,
            timeRemaining: 99 * 60,
            maxTime: 99 * 60,
            player1Wins: 0,
            player2Wins: 0,
            frameCount: 0,
            pauseFlag: false,
            debugMode: false
        };
        this.stateHistory.length = 0;
    }
    /**
     * Sets debug mode
     */
    setDebugMode(enabled) {
        this.state.debugMode = enabled;
    }
    /**
     * Gets time remaining as display string
     */
    getTimeDisplay() {
        const seconds = Math.ceil(this.state.timeRemaining / 60);
        return seconds.toString().padStart(2, '0');
    }
}
//# sourceMappingURL=GameState.js.map