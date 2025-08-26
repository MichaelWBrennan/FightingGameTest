
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
    // Player 1 controls (WASD + keys)
    this.keyboard.on('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': this.player1Inputs.up = true; break;
        case 's': this.player1Inputs.down = true; break;
        case 'a': this.player1Inputs.left = true; break;
        case 'd': this.player1Inputs.right = true; break;
        case 'u': this.player1Inputs.lightPunch = true; break;
        case 'i': this.player1Inputs.mediumPunch = true; break;
        case 'o': this.player1Inputs.heavyPunch = true; break;
        case 'j': this.player1Inputs.lightKick = true; break;
        case 'k': this.player1Inputs.mediumKick = true; break;
        case 'l': this.player1Inputs.heavyKick = true; break;
      }
    });

    this.keyboard.on('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': this.player1Inputs.up = false; break;
        case 's': this.player1Inputs.down = false; break;
        case 'a': this.player1Inputs.left = false; break;
        case 'd': this.player1Inputs.right = false; break;
        case 'u': this.player1Inputs.lightPunch = false; break;
        case 'i': this.player1Inputs.mediumPunch = false; break;
        case 'o': this.player1Inputs.heavyPunch = false; break;
        case 'j': this.player1Inputs.lightKick = false; break;
        case 'k': this.player1Inputs.mediumKick = false; break;
        case 'l': this.player1Inputs.heavyKick = false; break;
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
    const gamepad = this.gamepads.get(0);
    if (gamepad) {
      // Map gamepad inputs to player 1
      this.player1Inputs.left = gamepad.left;
      this.player1Inputs.right = gamepad.right;
      this.player1Inputs.up = gamepad.up;
      this.player1Inputs.down = gamepad.down;
      
      this.player1Inputs.lightPunch = gamepad.square;
      this.player1Inputs.mediumPunch = gamepad.triangle;
      this.player1Inputs.heavyPunch = gamepad.r1;
      this.player1Inputs.lightKick = gamepad.cross;
      this.player1Inputs.mediumKick = gamepad.circle;
      this.player1Inputs.heavyKick = gamepad.r2;
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
