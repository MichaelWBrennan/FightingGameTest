/**
 * PlayCanvas Input Manager
 * Handles input with PlayCanvas integration and SF3 compatibility
 */
import * as pc from 'playcanvas';
export interface InputMapping {
    keyboard: {
        [key: string]: string;
    };
    gamepad: {
        [button: string]: string;
    };
}
export declare class InputManager extends pc.ScriptType {
    private inputMapping;
    private previousInputState;
    private currentInputState;
    private gamepadIndex;
    private deadZone;
    initialize(): void;
    private setupInputMapping;
    private setupEventListeners;
    private onKeyDown;
    private onKeyUp;
    private onGamepadConnected;
    private onGamepadDisconnected;
    update(dt: number): void;
    private updateGamepadInput;
    private handleInputCombinations;
    isButtonPressed(action: string): boolean;
    isButtonHeld(action: string): boolean;
    isButtonReleased(action: string): boolean;
    getInputVector(): pc.Vec2;
    setGamepadIndex(index: number): void;
    static get scriptName(): string;
}
//# sourceMappingURL=InputManager.d.ts.map