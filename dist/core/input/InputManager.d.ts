import * as pc from 'playcanvas';
export interface PlayerInputs {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    lightPunch: boolean;
    mediumPunch: boolean;
    heavyPunch: boolean;
    lightKick: boolean;
    mediumKick: boolean;
    heavyKick: boolean;
    hadoken: boolean;
    shoryuken: boolean;
    tatsumaki: boolean;
}
export declare class InputManager {
    private app;
    private player1Inputs;
    private player2Inputs;
    private keyboard;
    private gamepads;
    constructor(app: pc.Application);
    private createEmptyInputs;
    private setupKeyboardBindings;
    getPlayerInputs(playerIndex: number): PlayerInputs;
    update(): void;
    private updateGamepadInputs;
    private updateSpecialMoves;
    private detectHadoken;
}
