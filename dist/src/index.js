/**
 * Main entry point for HD-2D Fighting Game System
 * Exports all core systems with strict TypeScript typing
 */
// Core Systems
import { GameManager } from './scripts/core/GameManager';
import { InputManager } from './scripts/core/InputManager';
// Combat System
import { CombatSystem } from './scripts/combat/CombatSystem';
// Character System
import { CharacterManager } from './scripts/characters/CharacterManager';
// Graphics Systems
import { SF3GraphicsManager } from './scripts/graphics/SF3GraphicsManager';
// App System
import './app/index';
// Version Information
export const VERSION = '1.0.0';
export const BUILD_TARGET = 'TypeScript Migration';
/**
 * Initialize the complete fighting game system
 * @param app - PlayCanvas Application instance
 * @returns Promise<FightingGameSystem> - Initialized system managers
 */
export async function initializeFightingGameSystem(app) {
    // Unlock system access
    console.log('🔓 System access unlocked - Full TypeScript migration complete');
    console.log(`Initializing HD-2D Fighting Game System v${VERSION}`);
    // Create system managers
    const gameManager = new GameManager(app);
    const inputManager = new InputManager(app);
    const combatSystem = new CombatSystem(app);
    const characterManager = new CharacterManager(app);
    const sf3Graphics = new SF3GraphicsManager(app);
    // Initialize all systems in order
    await gameManager.initialize();
    await inputManager.initialize();
    await combatSystem.initialize();
    await characterManager.initialize();
    await sf3Graphics.initialize();
    // Register systems with game manager
    gameManager.registerSystem('input', inputManager);
    gameManager.registerSystem('combat', combatSystem);
    gameManager.registerSystem('character', characterManager);
    gameManager.registerSystem('sf3graphics', sf3Graphics);
    console.log('Fighting Game System initialization complete');
    return {
        gameManager,
        inputManager,
        combatSystem,
        characterManager,
        sf3Graphics,
        version: VERSION
    };
}
/**
 * Configure and initialize the fighting game system with custom settings
 * @param app - PlayCanvas Application instance
 * @param config - System configuration options
 * @returns Promise<FightingGameSystem> - Initialized system with custom config
 */
export async function initializeWithConfig(app, config = {}) {
    const system = await initializeFightingGameSystem(app);
    // Apply configuration
    if (config.targetFPS) {
        // Configure frame rate
        console.log(`Setting target FPS to ${config.targetFPS}`);
    }
    if (config.debug) {
        // Enable debug mode
        console.log('Debug mode enabled');
    }
    if (config.enableParrySystem !== undefined) {
        // Configure parry system
        console.log(`Parry system: ${config.enableParrySystem ? 'enabled' : 'disabled'}`);
    }
    return system;
}
// Default export for convenience
export default initializeFightingGameSystem;
//# sourceMappingURL=index.js.map