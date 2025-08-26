/**
 * SDL Input Handler
 * Converted from C to TypeScript using Web APIs
 */
export class SDLInputManager {
    constructor() {
        Object.defineProperty(this, "gamepads", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "keyMappings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "keyStates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.setupEventListeners();
        this.setupDefaultKeyMappings();
    }
    setupEventListeners() {
        window.addEventListener('gamepadconnected', (e) => {
            this.onGamepadConnected(e.gamepad);
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            this.onGamepadDisconnected(e.gamepad);
        });
        window.addEventListener('keydown', (e) => {
            this.onKeyDown(e);
        });
        window.addEventListener('keyup', (e) => {
            this.onKeyUp(e);
        });
    }
    setupDefaultKeyMappings() {
        this.keyMappings = [
            { keyCode: 'ArrowUp', buttonIndex: 0 },
            { keyCode: 'ArrowDown', buttonIndex: 1 },
            { keyCode: 'ArrowLeft', buttonIndex: 2 },
            { keyCode: 'ArrowRight', buttonIndex: 3 },
            { keyCode: 'KeyZ', buttonIndex: 4 }, // Punch
            { keyCode: 'KeyX', buttonIndex: 5 }, // Kick
            { keyCode: 'KeyC', buttonIndex: 6 }, // Block
            { keyCode: 'Enter', buttonIndex: 7 }, // Start
        ];
    }
    onGamepadConnected(gamepad) {
        this.gamepads.set(gamepad.index, {
            buttons: new Array(gamepad.buttons.length).fill(false),
            axes: new Array(gamepad.axes.length).fill(0),
            connected: true
        });
    }
    onGamepadDisconnected(gamepad) {
        this.gamepads.delete(gamepad.index);
    }
    onKeyDown(event) {
        if (this.keyStates.has(event.code))
            return;
        this.keyStates.add(event.code);
        const mapping = this.keyMappings.find(m => m.keyCode === event.code);
        if (mapping) {
            this.notifyListeners(0, mapping.buttonIndex, true);
        }
    }
    onKeyUp(event) {
        this.keyStates.delete(event.code);
        const mapping = this.keyMappings.find(m => m.keyCode === event.code);
        if (mapping) {
            this.notifyListeners(0, mapping.buttonIndex, false);
        }
    }
    update() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad)
                continue;
            const state = this.gamepads.get(i);
            if (!state)
                continue;
            // Check buttons
            for (let j = 0; j < gamepad.buttons.length; j++) {
                const pressed = gamepad.buttons[j].pressed;
                if (pressed !== state.buttons[j]) {
                    state.buttons[j] = pressed;
                    this.notifyListeners(i, j, pressed);
                }
            }
            // Update axes
            for (let j = 0; j < gamepad.axes.length; j++) {
                state.axes[j] = gamepad.axes[j];
            }
        }
    }
    getButtonState(playerId, buttonIndex) {
        const state = this.gamepads.get(playerId);
        return state?.buttons[buttonIndex] || false;
    }
    getAxisValue(playerId, axisIndex) {
        const state = this.gamepads.get(playerId);
        return state?.axes[axisIndex] || 0;
    }
    addInputListener(callback) {
        this.listeners.push(callback);
    }
    notifyListeners(playerId, buttonIndex, pressed) {
        for (const listener of this.listeners) {
            listener(playerId, buttonIndex, pressed);
        }
    }
    setKeyMapping(keyCode, buttonIndex) {
        const existing = this.keyMappings.find(m => m.keyCode === keyCode);
        if (existing) {
            existing.buttonIndex = buttonIndex;
        }
        else {
            this.keyMappings.push({ keyCode, buttonIndex });
        }
    }
}
//# sourceMappingURL=SDLInput.js.map