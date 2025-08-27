
/**
 * PlayCanvas Input Manager
 * Handles input with PlayCanvas integration and SF3 compatibility
 */

import * as pc from 'playcanvas';

export interface InputMapping {
  keyboard: { [key: string]: string };
  gamepad: { [button: string]: string };
}

export class InputManager extends pc.ScriptType {
  private inputMapping: InputMapping;
  private previousInputState: { [key: string]: boolean } = {};
  private currentInputState: { [key: string]: boolean } = {};
  
  private gamepadIndex: number = 0;
  private deadZone: number = 0.2;

  initialize(): void {
    this.setupInputMapping();
    this.setupEventListeners();
  }

  private setupInputMapping(): void {
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
        '0': 'light_punch',    // A/Cross
        '1': 'medium_punch',   // B/Circle  
        '2': 'light_kick',     // X/Square
        '3': 'heavy_punch',    // Y/Triangle
        '4': 'medium_kick',    // LB/L1
        '5': 'heavy_kick',     // RB/R1
        '8': 'select',         // Select/Share
        '9': 'start',          // Start/Options
        '12': 'up',            // D-pad up
        '13': 'down',          // D-pad down
        '14': 'left',          // D-pad left
        '15': 'right'          // D-pad right
      }
    };
  }

  private setupEventListeners(): void {
    // Keyboard events
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
    
    // Gamepad events
    this.app.gamepads.on(pc.EVENT_GAMEPADCONNECTED, this.onGamepadConnected, this);
    this.app.gamepads.on(pc.EVENT_GAMEPADDISCONNECTED, this.onGamepadDisconnected, this);
  }

  private onKeyDown(event: pc.KeyboardEvent): void {
    const action = this.inputMapping.keyboard[event.key];
    if (action) {
      this.currentInputState[action] = true;
    }
  }

  private onKeyUp(event: pc.KeyboardEvent): void {
    const action = this.inputMapping.keyboard[event.key];
    if (action) {
      this.currentInputState[action] = false;
    }
  }

  private onGamepadConnected(gamepad: pc.Gamepad): void {
    console.log('Gamepad connected:', gamepad.id);
  }

  private onGamepadDisconnected(gamepad: pc.Gamepad): void {
    console.log('Gamepad disconnected:', gamepad.id);
  }

  update(dt: number): void {
    // Store previous state
    this.previousInputState = { ...this.currentInputState };
    
    // Update gamepad input
    this.updateGamepadInput();
    
    // Handle special input combinations
    this.handleInputCombinations();
  }

  private updateGamepadInput(): void {
    const pads = this.app.gamepads.poll();
    const gamepad = pads && pads.length > 0 ? pads[this.gamepadIndex] : null;
    if (!gamepad) return;

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

  private handleInputCombinations(): void {
    // Handle special move combinations
    if (this.isButtonHeld('down') && this.isButtonPressed('heavy_punch')) {
      this.currentInputState['super_combo'] = true;
    }
    
    // Handle throw input
    if (this.isButtonPressed('light_punch') && this.isButtonPressed('light_kick')) {
      this.currentInputState['throw'] = true;
    }
  }

  public isButtonPressed(action: string): boolean {
    return this.currentInputState[action] && !this.previousInputState[action];
  }

  public isButtonHeld(action: string): boolean {
    return this.currentInputState[action] === true;
  }

  public isButtonReleased(action: string): boolean {
    return !this.currentInputState[action] && this.previousInputState[action];
  }

  public getInputVector(): pc.Vec2 {
    const x = (this.isButtonHeld('right') ? 1 : 0) - (this.isButtonHeld('left') ? 1 : 0);
    const y = (this.isButtonHeld('up') ? 1 : 0) - (this.isButtonHeld('down') ? 1 : 0);
    return new pc.Vec2(x, y);
  }

  public setGamepadIndex(index: number): void {
    this.gamepadIndex = index;
  }

  public static get scriptName(): string {
    return 'inputManager';
  }
}

pc.registerScript(InputManager, 'inputManager');
