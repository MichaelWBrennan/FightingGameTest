/**
 * PlayCanvas Input Manager
 * Handles input with PlayCanvas integration and SF3 compatibility
 */
import * as pc from 'playcanvas';
export class InputManager extends pc.ScriptType {
    constructor() {
        super(...arguments);
        this.previousInputState = {};
        this.currentInputState = {};
        this.gamepadIndex = 0;
        this.deadZone = 0.2;
    }
    initialize() {
        this.setupInputMapping();
        this.setupEventListeners();
    }
    setupInputMapping() {
        this.inputMapping = {
            keyboard: {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'KeyZ': 'light_punch',
                'KeyX': 'medium_punch',
                'KeyC': 'heavy_punch',
                'KeyA': 'light_kick',
                'KeyS': 'medium_kick',
                'KeyD': 'heavy_kick',
                'Enter': 'start',
                'Space': 'select',
                'KeyQ': 'macro1',
                'KeyW': 'macro2',
                'KeyE': 'macro3'
            },
            gamepad: {
                '0': 'light_punch', // A/Cross
                '1': 'medium_punch', // B/Circle  
                '2': 'light_kick', // X/Square
                '3': 'heavy_punch', // Y/Triangle
                '4': 'medium_kick', // LB/L1
                '5': 'heavy_kick', // RB/R1
                '8': 'select', // Select/Share
                '9': 'start', // Start/Options
                '12': 'up', // D-pad up
                '13': 'down', // D-pad down
                '14': 'left', // D-pad left
                '15': 'right' // D-pad right
            }
        };
    }
    setupEventListeners() {
        // Keyboard events
        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
        this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
        // Gamepad events
        this.app.gamepads.on(pc.EVENT_GAMEPADCONNECTED, this.onGamepadConnected, this);
        this.app.gamepads.on(pc.EVENT_GAMEPADDISCONNECTED, this.onGamepadDisconnected, this);
    }
    onKeyDown(event) {
        const action = this.inputMapping.keyboard[event.key];
        if (action) {
            this.currentInputState[action] = true;
        }
    }
    onKeyUp(event) {
        const action = this.inputMapping.keyboard[event.key];
        if (action) {
            this.currentInputState[action] = false;
        }
    }
    onGamepadConnected(gamepad) {
        console.log('Gamepad connected:', gamepad.id);
    }
    onGamepadDisconnected(gamepad) {
        console.log('Gamepad disconnected:', gamepad.id);
    }
    update(dt) {
        // Store previous state
        this.previousInputState = { ...this.currentInputState };
        // Update gamepad input
        this.updateGamepadInput();
        // Handle special input combinations
        this.handleInputCombinations();
    }
    updateGamepadInput() {
        const pads = this.app.gamepads.poll();
        const gamepad = pads && pads.length > 0 ? pads[this.gamepadIndex] : null;
        if (!gamepad)
            return;
        // Update button states
        for (const [buttonIndex, action] of Object.entries(this.inputMapping.gamepad)) {
            const index = parseInt(buttonIndex);
            const pressed = this.app.gamepads.isPressed(this.gamepadIndex, index);
            this.currentInputState[action] = !!pressed;
        }
        // Update analog stick input
        const lx = this.app.gamepads.getAxis(this.gamepadIndex, pc.PAD_L_STICK_X);
        const ly = this.app.gamepads.getAxis(this.gamepadIndex, pc.PAD_L_STICK_Y);
        this.currentInputState['left'] = lx < -this.deadZone;
        this.currentInputState['right'] = lx > this.deadZone;
        this.currentInputState['up'] = ly < -this.deadZone;
        this.currentInputState['down'] = ly > this.deadZone;
    }
    handleInputCombinations() {
        // Handle special move combinations
        if (this.isButtonHeld('down') && this.isButtonPressed('heavy_punch')) {
            this.currentInputState['super_combo'] = true;
        }
        // Handle throw input
        if (this.isButtonPressed('light_punch') && this.isButtonPressed('light_kick')) {
            this.currentInputState['throw'] = true;
        }
    }
    isButtonPressed(action) {
        return this.currentInputState[action] && !this.previousInputState[action];
    }
    isButtonHeld(action) {
        return this.currentInputState[action] === true;
    }
    isButtonReleased(action) {
        return !this.currentInputState[action] && this.previousInputState[action];
    }
    getInputVector() {
        const x = (this.isButtonHeld('right') ? 1 : 0) - (this.isButtonHeld('left') ? 1 : 0);
        const y = (this.isButtonHeld('up') ? 1 : 0) - (this.isButtonHeld('down') ? 1 : 0);
        return new pc.Vec2(x, y);
    }
    setGamepadIndex(index) {
        this.gamepadIndex = index;
    }
    static get scriptName() {
        return 'inputManager';
    }
}
pc.registerScript(InputManager, 'inputManager');
//# sourceMappingURL=InputManager.js.map