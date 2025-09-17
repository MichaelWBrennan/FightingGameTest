
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

export class InputManager {
  private app: pc.Application;
  private keyboard: pc.Keyboard;
  private gamepads: pc.GamePads;

  // Separate per-device inputs; aggregated each frame
  private keyboardInputs: PlayerInputs;
  private gamepadInputs: PlayerInputs;
  private touchInputs: PlayerInputs;

  private player1Inputs: PlayerInputs;
  private player2Inputs: PlayerInputs;

  constructor(app: pc.Application) {
    this.app = app;
    this.keyboard = app.keyboard;
    this.gamepads = app.gamepads;

    this.keyboardInputs = this.createEmptyInputs();
    this.gamepadInputs = this.createEmptyInputs();
    this.touchInputs = this.createEmptyInputs();

    this.player1Inputs = this.createEmptyInputs();
    this.player2Inputs = this.createEmptyInputs();

    this.setupKeyboardBindings();
  }

  private createEmptyInputs(): PlayerInputs {
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

  private setupKeyboardBindings(): void {
    // Player 1 controls using PlayCanvas keycodes to ensure compatibility
    this.keyboard.on(pc.EVENT_KEYDOWN as any, (e: any) => {
      switch (e.key) {
        case pc.KEY_W: this.keyboardInputs.up = true; break;
        case pc.KEY_S: this.keyboardInputs.down = true; break;
        case pc.KEY_A: this.keyboardInputs.left = true; break;
        case pc.KEY_D: this.keyboardInputs.right = true; break;
        case pc.KEY_U: this.keyboardInputs.lightPunch = true; break;
        case pc.KEY_I: this.keyboardInputs.mediumPunch = true; break;
        case pc.KEY_O: this.keyboardInputs.heavyPunch = true; break;
        case pc.KEY_J: this.keyboardInputs.lightKick = true; break;
        case pc.KEY_K: this.keyboardInputs.mediumKick = true; break;
        case pc.KEY_L: this.keyboardInputs.heavyKick = true; break;
      }
    });

    this.keyboard.on(pc.EVENT_KEYUP as any, (e: any) => {
      switch (e.key) {
        case pc.KEY_W: this.keyboardInputs.up = false; break;
        case pc.KEY_S: this.keyboardInputs.down = false; break;
        case pc.KEY_A: this.keyboardInputs.left = false; break;
        case pc.KEY_D: this.keyboardInputs.right = false; break;
        case pc.KEY_U: this.keyboardInputs.lightPunch = false; break;
        case pc.KEY_I: this.keyboardInputs.mediumPunch = false; break;
        case pc.KEY_O: this.keyboardInputs.heavyPunch = false; break;
        case pc.KEY_J: this.keyboardInputs.lightKick = false; break;
        case pc.KEY_K: this.keyboardInputs.mediumKick = false; break;
        case pc.KEY_L: this.keyboardInputs.heavyKick = false; break;
      }
    });
  }

  public getPlayerInputs(playerIndex: number): PlayerInputs {
    return playerIndex === 0 ? this.player1Inputs : this.player2Inputs;
  }

  public update(): void {
    // Update gamepad inputs if connected
    this.updateGamepadInputs();

    // Aggregate per-device inputs for player 1; player 2 TBD
    this.player1Inputs = this.aggregateInputs(this.keyboardInputs, this.gamepadInputs, this.touchInputs);

    // Update special move detection
    this.updateSpecialMoves();
  }

  private aggregateInputs(...sources: PlayerInputs[]): PlayerInputs {
    const out = this.createEmptyInputs();
    for (const s of sources) {
      out.up = out.up || s.up;
      out.down = out.down || s.down;
      out.left = out.left || s.left;
      out.right = out.right || s.right;
      out.lightPunch = out.lightPunch || s.lightPunch;
      out.mediumPunch = out.mediumPunch || s.mediumPunch;
      out.heavyPunch = out.heavyPunch || s.heavyPunch;
      out.lightKick = out.lightKick || s.lightKick;
      out.mediumKick = out.mediumKick || s.mediumKick;
      out.heavyKick = out.heavyKick || s.heavyKick;
    }
    return out;
  }

  private updateGamepadInputs(): void {
    const pads = this.gamepads.poll();
    const gamepad = pads[0];
    if (gamepad) {
      // Map gamepad inputs to player 1
      this.gamepadInputs.left = gamepad.isPressed(pc.PAD_L_STICK_BUTTON) || gamepad.isPressed(pc.PAD_LEFT);
      this.gamepadInputs.right = gamepad.isPressed(pc.PAD_RIGHT);
      this.gamepadInputs.up = gamepad.isPressed(pc.PAD_UP);
      this.gamepadInputs.down = gamepad.isPressed(pc.PAD_DOWN);

      this.gamepadInputs.lightPunch = gamepad.isPressed(pc.PAD_FACE_1);
      this.gamepadInputs.mediumPunch = gamepad.isPressed(pc.PAD_FACE_2);
      this.gamepadInputs.heavyPunch = gamepad.isPressed(pc.PAD_R_SHOULDER_1);
      this.gamepadInputs.lightKick = gamepad.isPressed(pc.PAD_FACE_3);
      this.gamepadInputs.mediumKick = gamepad.isPressed(pc.PAD_FACE_4);
      this.gamepadInputs.heavyKick = gamepad.isPressed(pc.PAD_R_SHOULDER_2);
    } else {
      // Clear if no gamepad connected
      this.gamepadInputs = this.createEmptyInputs();
    }
  }

  private updateSpecialMoves(): void {
    // Simple special move detection (should be expanded with proper motion buffer)
    this.player1Inputs.hadoken = this.detectHadoken(this.player1Inputs);
    this.player2Inputs.hadoken = this.detectHadoken(this.player2Inputs);
  }

  private detectHadoken(inputs: PlayerInputs): boolean {
    // Simplified hadoken detection (down -> forward + punch)
    return inputs.down && inputs.right && inputs.lightPunch;
  }

  // ===== Touch API for UI layer =====
  public setTouchDpad(direction: 'up'|'down'|'left'|'right', pressed: boolean): void {
    this.touchInputs[direction] = pressed;
  }

  public setTouchButton(action: 'lightPunch'|'mediumPunch'|'heavyPunch'|'lightKick'|'mediumKick'|'heavyKick', pressed: boolean): void {
    (this.touchInputs as any)[action] = pressed;
  }

  public clearAllTouch(): void {
    this.touchInputs = this.createEmptyInputs();
  }
}
