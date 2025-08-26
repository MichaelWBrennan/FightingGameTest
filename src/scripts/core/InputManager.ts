
import * as pc from 'playcanvas';

const InputManager = pc.createScript('InputManager');

InputManager.prototype.initialize = function() {
    this.inputState = {
        buttons: new Map(),
        directions: { current: 'neutral', previous: 'neutral' },
        justPressed: new Set(),
        justReleased: new Set()
    };

    this.playerMappings = new Map([
        ['player1', {
            up: pc.KEY_W,
            down: pc.KEY_S,
            left: pc.KEY_A,
            right: pc.KEY_D,
            punch: pc.KEY_J,
            kick: pc.KEY_K,
            heavy: pc.KEY_L
        }],
        ['player2', {
            up: pc.KEY_UP,
            down: pc.KEY_DOWN,
            left: pc.KEY_LEFT,
            right: pc.KEY_RIGHT,
            punch: pc.KEY_NUMPAD_1,
            kick: pc.KEY_NUMPAD_2,
            heavy: pc.KEY_NUMPAD_3
        }]
    ]);

    // Bind to PlayCanvas input events
    this.app.keyboard.on('keydown', this.onKeyDown, this);
    this.app.keyboard.on('keyup', this.onKeyUp, this);
    
    // Enable gamepad support
    if (this.app.gamepads) {
        this.app.gamepads.on('connect', this.onGamepadConnect, this);
        this.app.gamepads.on('disconnect', this.onGamepadDisconnect, this);
    }
};

InputManager.prototype.update = function(dt) {
    // Clear frame-specific input states
    this.inputState.justPressed.clear();
    this.inputState.justReleased.clear();
    
    // Update direction state
    this.updateDirection();
    
    // Handle gamepad input
    this.handleGamepadInput();
};

InputManager.prototype.onKeyDown = function(event) {
    const buttonName = this.getButtonName(event.key);
    if (buttonName) {
        if (!this.inputState.buttons.get(buttonName)) {
            this.inputState.justPressed.add(buttonName);
        }
        this.inputState.buttons.set(buttonName, true);
    }
};

InputManager.prototype.onKeyUp = function(event) {
    const buttonName = this.getButtonName(event.key);
    if (buttonName) {
        this.inputState.buttons.set(buttonName, false);
        this.inputState.justReleased.add(buttonName);
    }
};

InputManager.prototype.getButtonName = function(keyCode) {
    for (const [player, mappings] of this.playerMappings) {
        for (const [button, key] of Object.entries(mappings)) {
            if (key === keyCode) {
                return `${player}_${button}`;
            }
        }
    }
    return null;
};

InputManager.prototype.isButtonPressed = function(buttonName) {
    return this.inputState.buttons.get(buttonName) || false;
};

InputManager.prototype.isButtonJustPressed = function(buttonName) {
    return this.inputState.justPressed.has(buttonName);
};

InputManager.prototype.isButtonJustReleased = function(buttonName) {
    return this.inputState.justReleased.has(buttonName);
};

export { InputManager };
