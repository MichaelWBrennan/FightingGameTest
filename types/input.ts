/**
 * Input system type definitions for SF3:3S HD-2D Fighting Game
 */

import { type Direction, type InputMapping, type PlayerInputMappings } from './core.js';

// Input State Types
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
  // Digital inputs
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
  
  // Processed directional state
  direction: Direction;
  lastDirection: Direction;
  directionFrames: number;
  
  // Button states with frame data
  buttons: Map<string, ButtonState>;
  
  // Charge state tracking
  chargeStates: Map<string, ChargeState>;
  
  // Frame timing
  lastInputFrame: number;
}

// Motion Command Types
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

// Input History and Snapshots
export interface InputSnapshot {
  frame: number;
  direction: Direction;
  buttons: Map<string, Omit<ButtonState, 'pressFrame' | 'releaseFrame' | 'holdFrames'>>;
  timestamp: number;
}

// Device and Configuration Types
export interface InputDevice {
  keyboard: any; // PlayCanvas keyboard
  gamepads: Map<number, Gamepad>;
  mouse: any; // PlayCanvas mouse
}

export interface InputConfiguration {
  bufferWindow: number;
  commandWindow: number;
  negativeEdge: boolean;
  buttonPriority: Record<string, number>;
  pollRate: number;
  maxInputDelay: number;
}

// Performance Tracking
export interface InputPerformanceStats {
  inputLatency: number;
  averageLatency: number;
  maxLatency: number;
  droppedInputs: number;
}

// System State
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

// Command Recognition System
export interface CommandSystem {
  motionCommands: Map<string, MotionCommand>;
  activeCommands: Map<string, Map<string, CommandState>>;
  commandHistory: Map<string, CommandHistory[]>;
}

// Event Types
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

// Utility Types
export type InputEventType = 
  | 'input:pressed'
  | 'input:released' 
  | 'input:direction'
  | 'input:command'
  | 'input:buffered'
  | 'input:negativeEdge';

export type PlayerId = 'player1' | 'player2';

export type InputName = 
  | 'up' | 'down' | 'left' | 'right'
  | 'lightPunch' | 'mediumPunch' | 'heavyPunch'
  | 'lightKick' | 'mediumKick' | 'heavyKick';

// Type Guards
export function isValidPlayerId(id: string): id is PlayerId {
  return id === 'player1' || id === 'player2';
}

export function isValidInputName(name: string): name is InputName {
  const validInputs: InputName[] = [
    'up', 'down', 'left', 'right',
    'lightPunch', 'mediumPunch', 'heavyPunch',
    'lightKick', 'mediumKick', 'heavyKick'
  ];
  return validInputs.includes(name as InputName);
}

export function isValidDirection(direction: string): direction is Direction {
  const validDirections: Direction[] = [
    'neutral', 'up', 'down', 'left', 'right', 'forward', 'back',
    'upForward', 'upBack', 'downForward', 'downBack'
  ];
  return validDirections.includes(direction as Direction);
}