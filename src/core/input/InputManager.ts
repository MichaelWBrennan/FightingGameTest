
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
  private player1Inputs: PlayerInputs;
  private player2Inputs: PlayerInputs;
  private keyboard: pc.Keyboard;
  private gamepads: pc.GamePads;

  constructor(app: pc.Application) {
    this.app = app;
    this.keyboard = app.keyboard;
    this.gamepads = app.gamepads;
    
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
        case pc.KEY_W: this.player1Inputs.up = true; break;
        case pc.KEY_S: this.player1Inputs.down = true; break;
        case pc.KEY_A: this.player1Inputs.left = true; break;
        case pc.KEY_D: this.player1Inputs.right = true; break;
        case pc.KEY_U: this.player1Inputs.lightPunch = true; break;
        case pc.KEY_I: this.player1Inputs.mediumPunch = true; break;
        case pc.KEY_O: this.player1Inputs.heavyPunch = true; break;
        case pc.KEY_J: this.player1Inputs.lightKick = true; break;
        case pc.KEY_K: this.player1Inputs.mediumKick = true; break;
        case pc.KEY_L: this.player1Inputs.heavyKick = true; break;
      }
    });

    this.keyboard.on(pc.EVENT_KEYUP as any, (e: any) => {
      switch (e.key) {
        case pc.KEY_W: this.player1Inputs.up = false; break;
        case pc.KEY_S: this.player1Inputs.down = false; break;
        case pc.KEY_A: this.player1Inputs.left = false; break;
        case pc.KEY_D: this.player1Inputs.right = false; break;
        case pc.KEY_U: this.player1Inputs.lightPunch = false; break;
        case pc.KEY_I: this.player1Inputs.mediumPunch = false; break;
        case pc.KEY_O: this.player1Inputs.heavyPunch = false; break;
        case pc.KEY_J: this.player1Inputs.lightKick = false; break;
        case pc.KEY_K: this.player1Inputs.mediumKick = false; break;
        case pc.KEY_L: this.player1Inputs.heavyKick = false; break;
      }
    });
  }

  public getPlayerInputs(playerIndex: number): PlayerInputs {
    return playerIndex === 0 ? this.player1Inputs : this.player2Inputs;
  }

  public update(): void {
    // Update gamepad inputs if connected
    this.updateGamepadInputs();
    
    // Update special move detection
    this.updateSpecialMoves();
  }

  private updateGamepadInputs(): void {
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

  private updateSpecialMoves(): void {
    // Simple special move detection (should be expanded with proper motion buffer)
    this.player1Inputs.hadoken = this.detectHadoken(this.player1Inputs);
    this.player2Inputs.hadoken = this.detectHadoken(this.player2Inputs);
  }

  private detectHadoken(inputs: PlayerInputs): boolean {
    // Simplified hadoken detection (down -> forward + punch)
    return inputs.down && inputs.right && inputs.lightPunch;
  }
}
