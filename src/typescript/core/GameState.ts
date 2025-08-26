
/**
 * Game State Management System - Converted from ACTIVE00.c
 */

export enum GamePhase {
  BOOT = 0,
  TITLE = 1,
  CHARACTER_SELECT = 2,
  BATTLE = 3,
  RESULT = 4,
  CREDITS = 5,
  TRAINING = 6,
  OPTIONS = 7
}

export enum BattlePhase {
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

export class GameStateManager {
  private static instance: GameStateManager;
  private state: GameStateData;
  private stateHistory: GameStateData[] = [];
  private maxHistorySize = 60; // 1 second at 60fps

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private constructor() {
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
  public update(): void {
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
  public setGamePhase(phase: GamePhase): void {
    this.state.currentPhase = phase;
    
    if (phase === GamePhase.BATTLE) {
      this.initializeBattle();
    }
  }

  /**
   * Changes the current battle phase
   */
  public setBattlePhase(phase: BattlePhase): void {
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
  private initializeBattle(): void {
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
  private handleRoundEnd(): void {
    // Round winner logic would be determined by character health
    // This is a simplified version
  }

  /**
   * Handles match end logic
   */
  private handleMatchEnd(): void {
    // Match is over, prepare for result screen
    setTimeout(() => {
      this.setGamePhase(GamePhase.RESULT);
    }, 180); // 3 seconds
  }

  /**
   * Awards a round win to a player
   */
  public awardRound(player: 1 | 2): void {
    if (player === 1) {
      this.state.player1Wins++;
    } else {
      this.state.player2Wins++;
    }

    // Check for match win
    const winsNeeded = Math.ceil(this.state.maxRounds / 2);
    if (this.state.player1Wins >= winsNeeded || this.state.player2Wins >= winsNeeded) {
      this.setBattlePhase(BattlePhase.MATCH_END);
    } else {
      this.state.roundNumber++;
      this.setBattlePhase(BattlePhase.ROUND_START);
    }
  }

  /**
   * Toggles pause state
   */
  public togglePause(): void {
    if (this.state.currentPhase === GamePhase.BATTLE) {
      this.state.pauseFlag = !this.state.pauseFlag;
    }
  }

  /**
   * Gets current game state (read-only)
   */
  public getState(): Readonly<GameStateData> {
    return this.state;
  }

  /**
   * Gets state from N frames ago
   */
  public getHistoryState(framesAgo: number): Readonly<GameStateData> | null {
    const index = this.stateHistory.length - 1 - framesAgo;
    return index >= 0 ? this.stateHistory[index] : null;
  }

  /**
   * Resets the game state
   */
  public reset(): void {
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
  public setDebugMode(enabled: boolean): void {
    this.state.debugMode = enabled;
  }

  /**
   * Gets time remaining as display string
   */
  public getTimeDisplay(): string {
    const seconds = Math.ceil(this.state.timeRemaining / 60);
    return seconds.toString().padStart(2, '0');
  }
}
