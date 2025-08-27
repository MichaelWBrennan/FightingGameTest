import { CoachOverlay } from '../../client/coach/CoachOverlay';
export class CoachManager {
    constructor(app, gameManager) {
        this.app = app;
        this.gameManager = gameManager;
    }
    async initialize() {
        this.coachOverlay = new CoachOverlay({
            gameState: this,
            playerProfile: { skillLevel: 'beginner' } // Dummy profile
        });
    }
    // IGameState implementation
    on(event, callback) {
        this.app.on(event, callback);
    }
    off(event, callback) {
        this.app.off(event, callback);
    }
    fire(event, ...args) {
        this.app.fire(event, ...args);
    }
    getCurrentGameState() {
        return this.gameManager.getCurrentGameState();
    }
    getCurrentBattleState() {
        return this.gameManager.getCurrentBattleState();
    }
    getPlayerCharacter(playerId) {
        const character = this.gameManager.getCharacter(playerId);
        return character ? character.characterData.characterId : null;
    }
    getOpponentCharacter(playerId) {
        const opponentPlayerId = playerId === 'player1' ? 'player2' : 'player1';
        const character = this.gameManager.getCharacter(opponentPlayerId);
        return character ? character.characterData.characterId : null;
    }
    getPlayerProfile(playerId) {
        // Dummy profile
        return { skillLevel: 'beginner' };
    }
}
//# sourceMappingURL=CoachManager.js.map