// Minimal ambient type declarations for PlayCanvas namespace used in TS types
// This avoids linter errors where we reference pc.* types while using the shimmed runtime.

declare namespace pc {
  class EventHandler {
    on(evt: string, cb: Function): void;
    off(evt: string, cb?: Function): void;
    fire(evt: string, ...args: any[]): void;
  }
  class Keyboard extends EventHandler {
    constructor(element?: Element | Window, options?: { preventDefault?: boolean; stopPropagation?: boolean });
  }
  class Mouse extends EventHandler { constructor(element?: Element); }
  class TouchDevice extends EventHandler { constructor(element: Element); }
  class GamePads extends EventHandler { poll(): any[]; }

  class Application extends EventHandler {
    constructor(canvas: any, opts?: any);
    start(): void;
    setCanvasFillMode(mode: number): void;
    setCanvasResolution(res: number): void;
    resizeCanvas(): void;
    root: any;
    scene: any;
    graphicsDevice: any;
    keyboard: Keyboard;
    mouse: Mouse;
    touch: TouchDevice;
    gamepads: GamePads;
    timeScale: number;
  }
  class RenderTarget { constructor(opts?: any); destroy(): void; colorBuffer: any; }
  class CurveSet {}
  type Entity = any;
  type Vec3 = any;
  type Vec2 = any;
  type Vec4 = any;
  type Color = any;
  type Texture = any;
  type StandardMaterial = any;
  type Material = any;
}

declare namespace pc {
  const LIGHTTYPE_DIRECTIONAL: number;
  const LIGHTTYPE_OMNI: number;
  const LIGHTTYPE_SPOT: number;
  const FOG_LINEAR: number;
  const FILLMODE_FILL_WINDOW: number;
  const RESOLUTION_AUTO: number;
  const PROJECTION_ORTHOGRAPHIC: number;
  const EVENT_KEYDOWN: string;
  const EVENT_KEYUP: string;
  const ELEMENTTYPE_TEXT: number;
  const ELEMENTTYPE_IMAGE: number;
  const ELEMENTTYPE_GROUP: number;
  const SCALEMODE_BLEND: number;
  const KEY_W: number; const KEY_S: number; const KEY_A: number; const KEY_D: number;
  const KEY_LEFT: number; const KEY_RIGHT: number; const KEY_UP: number; const KEY_DOWN: number;
  const KEY_RETURN: number; const KEY_NUMPAD_ENTER: number; const KEY_BACKSPACE: number;
  const PIXELFORMAT_R8_G8_B8_A8: number;
  const PAD_L_STICK_BUTTON: number; const PAD_LEFT: number; const PAD_RIGHT: number; const PAD_UP: number; const PAD_DOWN: number;
  const PAD_FACE_1: number; const PAD_FACE_2: number; const PAD_FACE_3: number; const PAD_FACE_4: number; const PAD_R_SHOULDER_1: number; const PAD_R_SHOULDER_2: number;
}

declare module 'playcanvas' {
  const pcNamespace: any;
  export = pcNamespace;
}

