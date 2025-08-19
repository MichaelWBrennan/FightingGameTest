import { ISystem } from '../../../types/core';
import { IGameState, GameState, BattleState } from '../../../types/game';
import { CoachOverlay } from '../../client/coach/CoachOverlay';

export class CoachManager implements ISystem, IGameState {
  private app: pc.Application;
  private gameManager: any; // Reference to the GameManager
  private coachOverlay!: CoachOverlay;

  constructor(app: pc.Application, gameManager: any) {
    this.app = app;
    this.gameManager = gameManager;
  }

  public async initialize(): Promise<void> {
    this.coachOverlay = new CoachOverlay({
      gameState: this,
      playerProfile: { skillLevel: 'beginner' } // Dummy profile
    });
  }

  // IGameState implementation
  public on(event: string, callback: (...args: any[]) => void): void {
    this.app.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this.app.off(event, callback);
  }

  public fire(event: string, ...args: any[]): void {
    this.app.fire(event, ...args);
  }

  public getCurrentGameState(): GameState {
    return this.gameManager.getCurrentGameState();
  }

  public getCurrentBattleState(): BattleState {
    return this.gameManager.getCurrentBattleState();
  }

  public getPlayerCharacter(playerId: string): string | null {
    const character = this.gameManager.getCharacter(playerId);
    return character ? character.characterData.characterId : null;
  }

  public getOpponentCharacter(playerId: string): string | null {
    const opponentPlayerId = playerId === 'player1' ? 'player2' : 'player1';
    const character = this.gameManager.getCharacter(opponentPlayerId);
    return character ? character.characterData.characterId : null;
  }

  public getPlayerProfile(playerId: string): any {
    // Dummy profile
    return { skillLevel: 'beginner' };
  }
}
