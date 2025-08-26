
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

export class SDLInputManager {
  private gamepads: Map<number, InputState> = new Map();
  private keyMappings: KeyMapping[] = [];
  private keyStates: Set<string> = new Set();
  private listeners: ((playerId: number, buttonIndex: number, pressed: boolean) => void)[] = [];

  constructor() {
    this.setupEventListeners();
    this.setupDefaultKeyMappings();
  }

  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (e) => {
      this.onGamepadConnected(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      this.onGamepadDisconnected(e.gamepad);
    });

    window.addEventListener('keydown', (e) => {
      this.onKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
      this.onKeyUp(e);
    });
  }

  private setupDefaultKeyMappings(): void {
    this.keyMappings = [
      { keyCode: 'ArrowUp', buttonIndex: 0 },
      { keyCode: 'ArrowDown', buttonIndex: 1 },
      { keyCode: 'ArrowLeft', buttonIndex: 2 },
      { keyCode: 'ArrowRight', buttonIndex: 3 },
      { keyCode: 'KeyZ', buttonIndex: 4 }, // Punch
      { keyCode: 'KeyX', buttonIndex: 5 }, // Kick
      { keyCode: 'KeyC', buttonIndex: 6 }, // Block
      { keyCode: 'Enter', buttonIndex: 7 }, // Start
    ];
  }

  private onGamepadConnected(gamepad: Gamepad): void {
    this.gamepads.set(gamepad.index, {
      buttons: new Array(gamepad.buttons.length).fill(false),
      axes: new Array(gamepad.axes.length).fill(0),
      connected: true
    });
  }

  private onGamepadDisconnected(gamepad: Gamepad): void {
    this.gamepads.delete(gamepad.index);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.keyStates.has(event.code)) return;
    
    this.keyStates.add(event.code);
    
    const mapping = this.keyMappings.find(m => m.keyCode === event.code);
    if (mapping) {
      this.notifyListeners(0, mapping.buttonIndex, true);
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keyStates.delete(event.code);
    
    const mapping = this.keyMappings.find(m => m.keyCode === event.code);
    if (mapping) {
      this.notifyListeners(0, mapping.buttonIndex, false);
    }
  }

  update(): void {
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;
      
      const state = this.gamepads.get(i);
      if (!state) continue;
      
      // Check buttons
      for (let j = 0; j < gamepad.buttons.length; j++) {
        const pressed = gamepad.buttons[j].pressed;
        if (pressed !== state.buttons[j]) {
          state.buttons[j] = pressed;
          this.notifyListeners(i, j, pressed);
        }
      }
      
      // Update axes
      for (let j = 0; j < gamepad.axes.length; j++) {
        state.axes[j] = gamepad.axes[j];
      }
    }
  }

  getButtonState(playerId: number, buttonIndex: number): boolean {
    const state = this.gamepads.get(playerId);
    return state?.buttons[buttonIndex] || false;
  }

  getAxisValue(playerId: number, axisIndex: number): number {
    const state = this.gamepads.get(playerId);
    return state?.axes[axisIndex] || 0;
  }

  addInputListener(callback: (playerId: number, buttonIndex: number, pressed: boolean) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(playerId: number, buttonIndex: number, pressed: boolean): void {
    for (const listener of this.listeners) {
      listener(playerId, buttonIndex, pressed);
    }
  }

  setKeyMapping(keyCode: string, buttonIndex: number): void {
    const existing = this.keyMappings.find(m => m.keyCode === keyCode);
    if (existing) {
      existing.buttonIndex = buttonIndex;
    } else {
      this.keyMappings.push({ keyCode, buttonIndex });
    }
  }
}
