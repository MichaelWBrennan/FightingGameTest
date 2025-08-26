/**
 * InputManager - Fighting game input handling
 * Supports multiple input methods and fighting game notation
 */
import * as pc from 'playcanvas';
import { type ISystem, type InputState } from '../../../types/core';
export declare class InputManager implements ISystem {
    private app;
    private playerStates;
    private inputHistory;
    private inputBuffer;
    private bindings;
    private controlSchemes;
    private playerControlSchemes;
    private debug;
    constructor(app: pc.Application);
    private setupControlSchemes;
    private setupEventListeners;
    private onKeyDown;
    private onKeyUp;
    getPlayerState(playerId: string): InputState | undefined;
    private onGamepadConnected;
    private onGamepadDisconnected;
    initialize(): Promise<void>;
    update(dt: number): void;
    destroy(): void;
}
//# sourceMappingURL=InputManager.d.ts.map