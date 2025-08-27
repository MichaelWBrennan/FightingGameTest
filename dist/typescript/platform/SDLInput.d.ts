/**
 * SDL Input Handler
 * Converted from C to TypeScript using Web APIs
 */
export interface InputState {
    buttons: boolean[];
    axes: number[];
    connected: boolean;
}
export interface KeyMapping {
    keyCode: string;
    buttonIndex: number;
}
export declare class SDLInputManager {
    private gamepads;
    private keyMappings;
    private keyStates;
    private listeners;
    constructor();
    private setupEventListeners;
    private setupDefaultKeyMappings;
    private onGamepadConnected;
    private onGamepadDisconnected;
    private onKeyDown;
    private onKeyUp;
    update(): void;
    getButtonState(playerId: number, buttonIndex: number): boolean;
    getAxisValue(playerId: number, axisIndex: number): number;
    addInputListener(callback: (playerId: number, buttonIndex: number, pressed: boolean) => void): void;
    private notifyListeners;
    setKeyMapping(keyCode: string, buttonIndex: number): void;
}
