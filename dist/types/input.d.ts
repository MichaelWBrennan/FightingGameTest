/**
 * Input system type definitions for SF3:3S HD-2D Fighting Game
 */
export { type Direction, type PlayerInputMappings } from './core';
export interface ButtonState {
    pressed: boolean;
    justPressed: boolean;
    justReleased: boolean;
    pressFrame: number;
    releaseFrame: number;
    holdFrames: number;
}
export interface ChargeState {
    charging: boolean;
    chargeFrames: number;
    chargeComplete: boolean;
}
export interface InputState {
    [key: string]: any;
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
    direction: Direction;
    lastDirection: Direction;
    directionFrames: number;
    buttons: Map<string, ButtonState>;
    chargeStates: Map<string, ChargeState>;
    lastInputFrame: number;
}
export interface MotionCommand {
    name: string;
    pattern: readonly string[];
    frames: number;
    chargeTime?: number;
    description: string;
}
export interface CommandState {
    pattern: string[];
    position: number;
    startFrame: number;
    completed: boolean;
}
export interface CommandHistory {
    command: string;
    frame: number;
    frames: number;
}
export interface InputSnapshot {
    frame: number;
    direction: Direction;
    buttons: Map<string, Omit<ButtonState, 'pressFrame' | 'releaseFrame' | 'holdFrames'>>;
    timestamp: number;
}
export interface InputDevice {
    keyboard: any;
    gamepads: Map<number, Gamepad>;
    mouse: any;
}
export interface InputConfiguration {
    bufferWindow: number;
    commandWindow: number;
    negativeEdge: boolean;
    buttonPriority: Record<string, number>;
    pollRate: number;
    maxInputDelay: number;
}
export interface InputPerformanceStats {
    inputLatency: number;
    averageLatency: number;
    maxLatency: number;
    droppedInputs: number;
}
export interface InputManagerState {
    initialized: boolean;
    frameCount: number;
    inputHistory: Map<string, InputSnapshot[]>;
    maxHistoryFrames: number;
    inputConfig: InputConfiguration;
    playerMappings: Map<string, PlayerInputMappings>;
    inputStates: Map<string, InputState>;
    previousStates: Map<string, InputState>;
    devices: InputDevice;
    performanceStats: InputPerformanceStats;
}
export interface CommandSystem {
    motionCommands: Map<string, MotionCommand>;
    activeCommands: Map<string, Map<string, CommandState>>;
    commandHistory: Map<string, CommandHistory[]>;
}
export interface InputPressedEvent {
    playerId: string;
    inputName: string;
    frame: number;
}
export interface InputReleasedEvent {
    playerId: string;
    inputName: string;
    frame: number;
}
export interface InputDirectionEvent {
    playerId: string;
    direction: Direction;
    lastDirection: Direction;
    frame: number;
}
export interface InputCommandEvent {
    playerId: string;
    command: string;
    commandName: string;
    frame: number;
    frames: number;
}
export interface InputBufferedEvent {
    playerId: string;
    inputName: string;
    originalFrame: number;
    currentFrame: number;
    bufferFrames: number;
}
export interface InputNegativeEdgeEvent {
    playerId: string;
    inputName: string;
    frame: number;
}
export type InputEventType = 'input:pressed' | 'input:released' | 'input:direction' | 'input:command' | 'input:buffered' | 'input:negativeEdge';
export type PlayerAction = 'up' | 'down' | 'left' | 'right' | 'light_punch' | 'medium_punch' | 'heavy_punch' | 'light_kick' | 'medium_kick' | 'heavy_kick' | 'special_1' | 'special_2' | 'special_3' | 'special_4' | 'super' | 'parry' | 'throw';
export interface InputMapping {
    [input: string]: PlayerAction;
}
export interface ControlScheme {
    keyboard: InputMapping;
    gamepad: InputMapping;
}
export type PlayerId = 'player1' | 'player2';
export type InputName = 'up' | 'down' | 'left' | 'right' | 'lightPunch' | 'mediumPunch' | 'heavyPunch' | 'lightKick' | 'mediumKick' | 'heavyKick';
export declare function isValidPlayerId(id: string): id is PlayerId;
export declare function isValidInputName(name: string): name is InputName;
export declare function isValidDirection(direction: string): direction is Direction;
//# sourceMappingURL=input.d.ts.map