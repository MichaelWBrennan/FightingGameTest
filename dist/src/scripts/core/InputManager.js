/**
 * InputManager - Fighting game input handling
 * Supports multiple input methods and fighting game notation
 */
import { DEFAULT_INPUT_STATE } from '../../../types/core';
import { DEFAULT_INPUT_HISTORY, DEFAULT_INPUT_BUFFER } from '../../../types/input';
export class InputManager {
    constructor(app) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerStates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputBuffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bindings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "controlSchemes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerControlSchemes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "debug", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.app = app;
        this.playerStates = new Map();
        this.playerStates.set('player1', { ...DEFAULT_INPUT_STATE });
        this.playerStates.set('player2', { ...DEFAULT_INPUT_STATE });
        this.inputHistory = { ...DEFAULT_INPUT_HISTORY };
        this.inputBuffer = { ...DEFAULT_INPUT_BUFFER };
        this.bindings = new Map();
        this.controlSchemes = new Map();
        this.playerControlSchemes = new Map();
        this.setupControlSchemes();
        this.setupEventListeners();
    }
    setupControlSchemes() {
        const classicKeyboard = {
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right',
            'KeyU': 'light_punch',
            'KeyI': 'medium_punch',
            'KeyO': 'heavy_punch',
            'KeyJ': 'light_kick',
            'KeyK': 'medium_kick',
            'KeyL': 'heavy_kick',
        };
        const modernKeyboard = {
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right',
            'KeyU': 'light_punch',
            'KeyI': 'medium_punch',
            'KeyO': 'heavy_punch',
            'KeyJ': 'special_1',
            'KeyK': 'special_2',
            'KeyL': 'special_3',
        };
        this.controlSchemes.set('classic', {
            keyboard: classicKeyboard,
            gamepad: {} // To be implemented
        });
        this.controlSchemes.set('modern', {
            keyboard: modernKeyboard,
            gamepad: {} // To be implemented
        });
        // Set default scheme for players
        this.playerControlSchemes.set('player1', 'classic');
        this.playerControlSchemes.set('player2', 'classic');
    }
    setupEventListeners() {
        // Setup keyboard input listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        // Setup gamepad input listeners
        window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
    }
    onKeyDown(event) {
        // For now, assume keyboard is player 1
        const playerId = 'player1';
        const schemeName = this.playerControlSchemes.get(playerId);
        if (!schemeName)
            return;
        const scheme = this.controlSchemes.get(schemeName);
        if (!scheme)
            return;
        const action = scheme.keyboard[event.code];
        if (action) {
            const state = this.playerStates.get(playerId);
            if (state) {
                state[action] = true;
            }
        }
    }
    onKeyUp(event) {
        // For now, assume keyboard is player 1
        const playerId = 'player1';
        const schemeName = this.playerControlSchemes.get(playerId);
        if (!schemeName)
            return;
        const scheme = this.controlSchemes.get(schemeName);
        if (!scheme)
            return;
        const action = scheme.keyboard[event.code];
        if (action) {
            const state = this.playerStates.get(playerId);
            if (state) {
                state[action] = false;
            }
        }
    }
    getPlayerState(playerId) {
        return this.playerStates.get(playerId);
    }
    onGamepadConnected(event) {
        // Handle gamepad connected events
        console.log(`Gamepad connected: ${event.gamepad.id}`);
    }
    onGamepadDisconnected(event) {
        // Handle gamepad disconnected events
        console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    }
    async initialize() {
        console.log('Initializing Input Manager...');
        // Initialize input manager
        console.log('Input Manager initialized successfully');
    }
    update(dt) {
        // Update input manager
    }
    destroy() {
        // Clean up input manager
        console.log('InputManager destroyed');
    }
}
//# sourceMappingURL=InputManager.js.map