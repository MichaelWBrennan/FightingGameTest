// @ts-nocheck
export class InputManager {
    constructor() {
        this.inputState = {
            p1sw_0: 0,
            p1sw_1: 0,
            p2sw_0: 0,
            p2sw_1: 0,
            direction: 'neutral',
            lastDirection: 'neutral',
            buttons: new Map(),
            buttonPressed: new Map(),
            buttonReleased: new Map()
        };
        this.playerMappings = new Map();
        this.initializeDefaultMappings();
        this.setupEventListeners();
    }
    initializeDefaultMappings() {
        const player1Mappings = {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            lightPunch: 'KeyZ',
            mediumPunch: 'KeyX',
            heavyPunch: 'KeyC',
            lightKick: 'KeyA',
            mediumKick: 'KeyS',
            heavyKick: 'KeyD',
            start: 'Enter',
            select: 'Space'
        };
        const player2Mappings = {
            up: 'Numpad8',
            down: 'Numpad2',
            left: 'Numpad4',
            right: 'Numpad6',
            lightPunch: 'KeyU',
            mediumPunch: 'KeyI',
            heavyPunch: 'KeyO',
            lightKick: 'KeyJ',
            mediumKick: 'KeyK',
            heavyKick: 'KeyL',
            start: 'NumpadEnter',
            select: 'Numpad0'
        };
        this.playerMappings.set('player1', player1Mappings);
        this.playerMappings.set('player2', player2Mappings);
    }
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    handleKeyDown(event) {
        const buttonName = this.getButtonName(event.code);
        if (buttonName) {
            const wasPressed = this.inputState.buttons.get(buttonName)?.pressed || false;
            this.inputState.buttons.set(buttonName, {
                pressed: true,
                justPressed: !wasPressed,
                justReleased: false
            });
            this.updateDirection();
            event.preventDefault();
        }
    }
    handleKeyUp(event) {
        const buttonName = this.getButtonName(event.code);
        if (buttonName) {
            this.inputState.buttons.set(buttonName, {
                pressed: false,
                justPressed: false,
                justReleased: true
            });
            this.updateDirection();
            event.preventDefault();
        }
    }
    getButtonName(code) {
        for (const [player, mappings] of this.playerMappings) {
            for (const [buttonName, keyCode] of Object.entries(mappings)) {
                if (keyCode === code) {
                    return `${player}_${buttonName}`;
                }
            }
        }
        return null;
    }
    updateDirection() {
        this.inputState.lastDirection = this.inputState.direction;
        const p1Up = this.isButtonPressed('player1_up');
        const p1Down = this.isButtonPressed('player1_down');
        const p1Left = this.isButtonPressed('player1_left');
        const p1Right = this.isButtonPressed('player1_right');
        if (p1Up && p1Left) {
            this.inputState.direction = 'upBack';
        }
        else if (p1Up && p1Right) {
            this.inputState.direction = 'upForward';
        }
        else if (p1Down && p1Left) {
            this.inputState.direction = 'downBack';
        }
        else if (p1Down && p1Right) {
            this.inputState.direction = 'downForward';
        }
        else if (p1Up) {
            this.inputState.direction = 'up';
        }
        else if (p1Down) {
            this.inputState.direction = 'down';
        }
        else if (p1Left) {
            this.inputState.direction = 'left';
        }
        else if (p1Right) {
            this.inputState.direction = 'right';
        }
        else {
            this.inputState.direction = 'neutral';
        }
    }
    isButtonPressed(buttonName) {
        return this.inputState.buttons.get(buttonName)?.pressed || false;
    }
    isButtonJustPressed(buttonName) {
        return this.inputState.buttons.get(buttonName)?.justPressed || false;
    }
    isButtonJustReleased(buttonName) {
        return this.inputState.buttons.get(buttonName)?.justReleased || false;
    }
    getDirection() {
        return this.inputState.direction;
    }
    getLastDirection() {
        return this.inputState.lastDirection;
    }
    update() {
        // Reset just pressed/released flags after frame
        for (const [key, buttonState] of this.inputState.buttons) {
            buttonState.justPressed = false;
            buttonState.justReleased = false;
        }
    }
    getInputState() {
        return { ...this.inputState };
    }
    setPlayerMapping(player, mappings) {
        this.playerMappings.set(player, mappings);
    }
}
export function isValidDirection(direction) {
    const validDirections = [
        'neutral', 'up', 'down', 'left', 'right', 'upBack', 'upForward', 'downBack', 'downForward'
    ];
    return validDirections.includes(direction);
}
//# sourceMappingURL=InputManager.js.map