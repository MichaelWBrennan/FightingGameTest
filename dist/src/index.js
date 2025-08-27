import { GameEngine } from './core/GameEngine';
import { Logger } from './core/utils/Logger';
import * as pc from 'playcanvas';
class SF3Game {
    constructor() {
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        // Style the canvas
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.display = 'block';
        this.gameEngine = new GameEngine(canvas);
    }
    async start() {
        try {
            Logger.info('Starting Street Fighter III: 3rd Strike - TypeScript Edition');
            await this.gameEngine.initialize();
            // Set up development characters for testing
            const characterManager = this.gameEngine.getCharacterManager();
            const ryu = characterManager.createCharacter('ryu', new pc.Vec3(-2, 0, 0));
            const ken = characterManager.createCharacter('ken', new pc.Vec3(2, 0, 0));
            if (ryu && ken) {
                characterManager.setActiveCharacters('ryu', 'ken');
            }
            Logger.info('Game started successfully');
        }
        catch (error) {
            Logger.error('Failed to start game:', error);
        }
    }
}
// Initialize and start the game
const game = new SF3Game();
game.start().catch(console.error);
export { SF3Game };
//# sourceMappingURL=index.js.map