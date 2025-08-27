import * as pc from 'playcanvas';
export class InputManager {
    constructor(app) {
        this.app = app;
        this.keyboard = app.keyboard;
        this.gamepads = app.gamepads;
        this.player1Inputs = this.createEmptyInputs();
        this.player2Inputs = this.createEmptyInputs();
        this.setupKeyboardBindings();
    }
    createEmptyInputs() {
        return {
            up: false,
            down: false,
            left: false,
            right: false,
            lightPunch: false,
            mediumPunch: false,
            heavyPunch: false,
            lightKick: false,
            mediumKick: false,
            heavyKick: false,
            hadoken: false,
            shoryuken: false,
            tatsumaki: false
        };
    }
    setupKeyboardBindings() {
        // Player 1 controls (WASD + keys)
        this.keyboard.on('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.player1Inputs.up = true;
                    break;
                case 's':
                    this.player1Inputs.down = true;
                    break;
                case 'a':
                    this.player1Inputs.left = true;
                    break;
                case 'd':
                    this.player1Inputs.right = true;
                    break;
                case 'u':
                    this.player1Inputs.lightPunch = true;
                    break;
                case 'i':
                    this.player1Inputs.mediumPunch = true;
                    break;
                case 'o':
                    this.player1Inputs.heavyPunch = true;
                    break;
                case 'j':
                    this.player1Inputs.lightKick = true;
                    break;
                case 'k':
                    this.player1Inputs.mediumKick = true;
                    break;
                case 'l':
                    this.player1Inputs.heavyKick = true;
                    break;
            }
        });
        this.keyboard.on('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.player1Inputs.up = false;
                    break;
                case 's':
                    this.player1Inputs.down = false;
                    break;
                case 'a':
                    this.player1Inputs.left = false;
                    break;
                case 'd':
                    this.player1Inputs.right = false;
                    break;
                case 'u':
                    this.player1Inputs.lightPunch = false;
                    break;
                case 'i':
                    this.player1Inputs.mediumPunch = false;
                    break;
                case 'o':
                    this.player1Inputs.heavyPunch = false;
                    break;
                case 'j':
                    this.player1Inputs.lightKick = false;
                    break;
                case 'k':
                    this.player1Inputs.mediumKick = false;
                    break;
                case 'l':
                    this.player1Inputs.heavyKick = false;
                    break;
            }
        });
    }
    getPlayerInputs(playerIndex) {
        return playerIndex === 0 ? this.player1Inputs : this.player2Inputs;
    }
    update() {
        // Update gamepad inputs if connected
        this.updateGamepadInputs();
        // Update special move detection
        this.updateSpecialMoves();
    }
    updateGamepadInputs() {
        const pads = this.gamepads.poll();
        const gamepad = pads[0];
        if (gamepad) {
            // Map gamepad inputs to player 1
            this.player1Inputs.left = gamepad.isPressed(pc.PAD_L_STICK_BUTTON) || gamepad.isPressed(pc.PAD_LEFT);
            this.player1Inputs.right = gamepad.isPressed(pc.PAD_RIGHT);
            this.player1Inputs.up = gamepad.isPressed(pc.PAD_UP);
            this.player1Inputs.down = gamepad.isPressed(pc.PAD_DOWN);
            this.player1Inputs.lightPunch = gamepad.isPressed(pc.PAD_FACE_1);
            this.player1Inputs.mediumPunch = gamepad.isPressed(pc.PAD_FACE_2);
            this.player1Inputs.heavyPunch = gamepad.isPressed(pc.PAD_R_SHOULDER_1);
            this.player1Inputs.lightKick = gamepad.isPressed(pc.PAD_FACE_3);
            this.player1Inputs.mediumKick = gamepad.isPressed(pc.PAD_FACE_4);
            this.player1Inputs.heavyKick = gamepad.isPressed(pc.PAD_R_SHOULDER_2);
        }
    }
    updateSpecialMoves() {
        // Simple special move detection (should be expanded with proper motion buffer)
        this.player1Inputs.hadoken = this.detectHadoken(this.player1Inputs);
        this.player2Inputs.hadoken = this.detectHadoken(this.player2Inputs);
    }
    detectHadoken(inputs) {
        // Simplified hadoken detection (down -> forward + punch)
        return inputs.down && inputs.right && inputs.lightPunch;
    }
}
//# sourceMappingURL=InputManager.js.map