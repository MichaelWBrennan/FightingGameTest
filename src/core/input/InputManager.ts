
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
  private prevP1Inputs: PlayerInputs;
  private prevP2Inputs: PlayerInputs;
  private lastTapTs: Array<{ left: number; right: number; up: number; down: number }>; // per player
  private inputPressCount = 0;
  private keyMap: Record<string, string> = {
    lightPunch: 'KeyU', mediumPunch: 'KeyI', heavyPunch: 'KeyO',
    lightKick: 'KeyJ', mediumKick: 'KeyK', heavyKick: 'KeyL',
    up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD'
  };

  // Motion buffer and input leniency
  private history: Array<{ t: number; p1: PlayerInputs }>[] = [];
  private bufferMs = 120; // lenient buffer for motions
  private leniencyByMotion: Partial<Record<'QCF'|'QCB'|'DP', number>> = {};
  private lastUpdateTs = 0;
  // Negative-edge & hold buffers
  private negativeEdgeWindowMs = 60;
  private keyDownTimestamps: Record<string, number> = {};
  private keyUpTimestamps: Record<string, number> = {};
  // SOCD policy: 'neutral' or 'last'
  private socdPolicy: 'neutral' | 'last' = 'neutral';

  constructor(app: pc.Application) {
    this.app = app;
    this.keyboard = app.keyboard;
    this.gamepads = app.gamepads;

    this.keyboardInputs = this.createEmptyInputs();
    this.gamepadInputs = this.createEmptyInputs();
    this.touchInputs = this.createEmptyInputs();

    this.player1Inputs = this.createEmptyInputs();
    this.player2Inputs = this.createEmptyInputs();
    this.prevP1Inputs = this.createEmptyInputs();
    this.prevP2Inputs = this.createEmptyInputs();
    this.lastTapTs = [ { left: 0, right: 0, up: 0, down: 0 }, { left: 0, right: 0, up: 0, down: 0 } ];

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
      const code = e.event?.code || e.code;
      if (!code) return;
      const map = this.keyMap;
      const now = performance.now();
      if (code === map.up) { this.keyboardInputs.up = true; this.inputPressCount++; this.keyDownTimestamps['up'] = now; }
      if (code === map.down) { this.keyboardInputs.down = true; this.inputPressCount++; this.keyDownTimestamps['down'] = now; }
      if (code === map.left) { this.keyboardInputs.left = true; this.inputPressCount++; this.keyDownTimestamps['left'] = now; }
      if (code === map.right) { this.keyboardInputs.right = true; this.inputPressCount++; this.keyDownTimestamps['right'] = now; }
      if (code === map.lightPunch) { this.keyboardInputs.lightPunch = true; this.inputPressCount++; this.keyDownTimestamps['lightPunch'] = now; }
      if (code === map.mediumPunch) { this.keyboardInputs.mediumPunch = true; this.inputPressCount++; this.keyDownTimestamps['mediumPunch'] = now; }
      if (code === map.heavyPunch) { this.keyboardInputs.heavyPunch = true; this.inputPressCount++; this.keyDownTimestamps['heavyPunch'] = now; }
      if (code === map.lightKick) { this.keyboardInputs.lightKick = true; this.inputPressCount++; this.keyDownTimestamps['lightKick'] = now; }
      if (code === map.mediumKick) { this.keyboardInputs.mediumKick = true; this.inputPressCount++; this.keyDownTimestamps['mediumKick'] = now; }
      if (code === map.heavyKick) { this.keyboardInputs.heavyKick = true; this.inputPressCount++; this.keyDownTimestamps['heavyKick'] = now; }
    });

    this.keyboard.on(pc.EVENT_KEYUP as any, (e: any) => {
      const code = e.event?.code || e.code;
      if (!code) return;
      const map = this.keyMap;
      const now = performance.now();
      if (code === map.up) { this.keyboardInputs.up = false; this.keyUpTimestamps['up'] = now; }
      if (code === map.down) { this.keyboardInputs.down = false; this.keyUpTimestamps['down'] = now; }
      if (code === map.left) { this.keyboardInputs.left = false; this.keyUpTimestamps['left'] = now; }
      if (code === map.right) { this.keyboardInputs.right = false; this.keyUpTimestamps['right'] = now; }
      if (code === map.lightPunch) { this.keyboardInputs.lightPunch = false; this.keyUpTimestamps['lightPunch'] = now; }
      if (code === map.mediumPunch) { this.keyboardInputs.mediumPunch = false; this.keyUpTimestamps['mediumPunch'] = now; }
      if (code === map.heavyPunch) { this.keyboardInputs.heavyPunch = false; this.keyUpTimestamps['heavyPunch'] = now; }
      if (code === map.lightKick) { this.keyboardInputs.lightKick = false; this.keyUpTimestamps['lightKick'] = now; }
      if (code === map.mediumKick) { this.keyboardInputs.mediumKick = false; this.keyUpTimestamps['mediumKick'] = now; }
      if (code === map.heavyKick) { this.keyboardInputs.heavyKick = false; this.keyUpTimestamps['heavyKick'] = now; }
    });
  }

  public getPlayerInputs(playerIndex: number): PlayerInputs {
    return playerIndex === 0 ? this.player1Inputs : this.player2Inputs;
  }

  public update(): void {
    // Update gamepad inputs if connected
    this.updateGamepadInputs();

    // Aggregate per-device inputs for player 1; player 2 TBD
    const nextP1Raw = this.aggregateInputs(this.keyboardInputs, this.gamepadInputs, this.touchInputs);
    const nextP1 = this.applySocdPolicy(nextP1Raw, this.prevP1Inputs);
    this.updateDirectionTaps(0, nextP1, this.prevP1Inputs);
    this.prevP1Inputs = this.player1Inputs;
    this.player1Inputs = nextP1;

    // Record motion history for leniency and specials
    const now = performance.now();
    this.lastUpdateTs = now;
    this.pushHistory(now, this.player1Inputs);
    this.pruneHistory(now);
    // Update special move detection (buffered)
    this.updateSpecialMoves();
    this.applyNegativeEdge(this.player1Inputs);
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

  private applySocdPolicy(curr: PlayerInputs, prev: PlayerInputs): PlayerInputs {
    const out = { ...curr } as PlayerInputs;
    if (this.socdPolicy === 'neutral') {
      if (out.left && out.right) { out.left = false; out.right = false; }
      if (out.up && out.down) { out.up = false; out.down = false; }
    } else if (this.socdPolicy === 'last') {
      // last input priority for opposing directions
      if (curr.left && curr.right) {
        // use timestamps if available
        const lts = this.keyDownTimestamps['left'] || 0;
        const rts = this.keyDownTimestamps['right'] || 0;
        if (lts === rts) { out.left = false; out.right = false; } else if (lts > rts) { out.right = false; } else { out.left = false; }
      }
      if (curr.up && curr.down) {
        const uts = this.keyDownTimestamps['up'] || 0;
        const dts = this.keyDownTimestamps['down'] || 0;
        if (uts === dts) { out.up = false; out.down = false; } else if (uts > dts) { out.down = false; } else { out.up = false; }
      }
    }
    return out;
  }

  private updateSpecialMoves(): void {
    this.player1Inputs.hadoken = this.detectQCF('punch');
    this.player1Inputs.shoryuken = this.detectDP('punch');
    this.player1Inputs.tatsumaki = this.detectQCB('kick');
    // Simple throw: LP+LK pressed together
    (this.player1Inputs as any).throw = (this.player1Inputs.lightPunch && this.player1Inputs.lightKick);
    // Throw tech: MP+MK pressed together
    (this.player1Inputs as any).tech = (this.player1Inputs.mediumPunch && this.player1Inputs.mediumKick);
    this.player2Inputs.hadoken = false;
  }

  private applyNegativeEdge(p: PlayerInputs): void {
    const now = performance.now();
    const checkNeg = (key: keyof PlayerInputs) => {
      const upTs = this.keyUpTimestamps[key as string];
      if (upTs && (now - upTs) <= this.negativeEdgeWindowMs) {
        (p as any)[key] = true;
      }
    };
    // Negative edge for punches/kicks only
    ['lightPunch','mediumPunch','heavyPunch','lightKick','mediumKick','heavyKick'].forEach(k => checkNeg(k as any));
  }

  private pushHistory(ts: number, p1: PlayerInputs): void {
    this.history.push([{ t: ts, p1: { ...p1 } } as any]);
  }

  private pruneHistory(now: number): void {
    while (this.history.length && (now - (this.history[0][0] as any).t) > this.bufferMs) this.history.shift();
  }

  private detectBufferedHadoken(): boolean {
    // Detect down, down-forward, forward within buffer window + punch press
    const seq = ['down', 'down_forward', 'forward'] as const;
    let idx = 0;
    let punch = false;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const rec = (this.history[i][0] as any).p1 as PlayerInputs;
      const dir = this.getDir(rec);
      if (!punch && (rec.lightPunch || rec.mediumPunch || rec.heavyPunch)) punch = true;
      if (idx < seq.length && this.matchesDir(dir, seq[idx])) idx++;
      if (idx >= seq.length && punch) return true;
    }
    return false;
  }

  private getDir(p: PlayerInputs): 'neutral'|'down'|'forward'|'down_forward'|'up'|'back' {
    if (p.down && p.right) return 'down_forward';
    if (p.right) return 'forward';
    if (p.down) return 'down';
    if (p.up) return 'up';
    if (p.left) return 'back';
    return 'neutral';
  }

  private matchesDir(d: string, target: string): boolean { return d === target; }

  private updateDirectionTaps(playerIndex: number, curr: PlayerInputs, prev: PlayerInputs): void {
    const now = performance.now();
    const taps = this.lastTapTs[playerIndex];
    const directions: Array<keyof PlayerInputs & ('left'|'right'|'up'|'down')> = ['left','right','up','down'];
    for (const dir of directions) {
      if ((curr as any)[dir] && !(prev as any)[dir]) {
        taps[dir] = now;
        this.keyDownTimestamps[dir] = now;
      }
      if (!(curr as any)[dir] && (prev as any)[dir]) {
        this.keyUpTimestamps[dir] = now;
      }
    }
  }

  public wasTapped(playerIndex: number, dir: 'left'|'right'|'up'|'down', windowMs: number): boolean {
    const ts = this.lastTapTs[playerIndex]?.[dir] || 0;
    return (performance.now() - ts) <= Math.max(0, windowMs);
  }

  // ====== Motion parsers ======
  private detectQCF(button: 'punch'|'kick'): boolean {
    // quarter-circle forward: down -> down-forward -> forward + button within buffer
    const seq = ['down','down_forward','forward'];
    return this.scanSequence(seq, button, this.leniencyByMotion.QCF ?? 250);
  }
  private detectQCB(button: 'punch'|'kick'): boolean {
    const seq = ['down','down_forward','forward'];
    // approximate QCB by mirroring if player holds left more; reuse same for now
    return this.scanSequence(seq, button, this.leniencyByMotion.QCB ?? 250);
  }
  private detectDP(button: 'punch'|'kick'): boolean {
    // DP (forward, down, down-forward + button)
    const seq = ['forward','down','down_forward'];
    return this.scanSequence(seq, button, this.leniencyByMotion.DP ?? 220);
  }

  private scanSequence(dirs: string[], button: 'punch'|'kick', windowMs: number = 250): boolean {
    const now = performance.now();
    const hist = this.history;
    let idx = 0;
    let pressed = false;
    for (let i = hist.length - 1; i >= 0; i--) {
      const rec = (hist[i][0] as any);
      if (!rec) continue;
      if ((now - rec.t) > windowMs) break;
      const p = rec.p1 as PlayerInputs;
      const dir = this.getDir(p);
      if (idx < dirs.length && dir === dirs[idx]) idx++;
      if (!pressed && (button === 'punch' ? (p.lightPunch || p.mediumPunch || p.heavyPunch) : (p.lightKick || p.mediumKick || p.heavyKick))) pressed = true;
      if (idx >= dirs.length && pressed) return true;
    }
    return false;
  }

  // External API to tweak motion leniency
  public setMotionLeniency(ms: number): void { this.bufferMs = Math.max(60, Math.min(400, Math.floor(ms))); }
  public setMotionLeniencyFor(motion: 'QCF'|'QCB'|'DP', ms: number): void { this.leniencyByMotion[motion] = Math.max(60, Math.min(500, Math.floor(ms))); }
  public setSocdPolicy(policy: 'neutral'|'last'): void { this.socdPolicy = policy; }
  public setNegativeEdgeWindow(ms: number): void { this.negativeEdgeWindowMs = Math.max(0, Math.min(200, Math.floor(ms))); }

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

  public getPressCount(): number { return this.inputPressCount; }
  public setKeyMap(map: Partial<Record<string, string>>): void { Object.assign(this.keyMap, map); }
}
