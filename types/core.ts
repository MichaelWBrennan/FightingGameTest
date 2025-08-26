
/**
 * Core type definitions for SF3:3S HD-2D Fighting Game System
 */

// Game State Types
export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'BATTLE' | 'PAUSE';
export type BattleState = 'NEUTRAL' | 'COMBO' | 'SUPER' | 'STUNNED';
export type CombatState = 'neutral' | 'attacking' | 'defending' | 'hitstun' | 'blockstun' | 'special_move';

// Direction Types
export type Direction = 
  | 'neutral' 
  | 'up' 
  | 'down' 
  | 'left' 
  | 'right' 
  | 'forward' 
  | 'back'
  | 'upForward' 
  | 'upBack' 
  | 'downForward' 
  | 'downBack';

// Input Types
export type InputType = 'keyboard' | 'gamepad' | 'mouse';

export interface InputMapping {
  type: InputType;
  code: string;
  gamepadIndex?: number;
  axis?: number;
}

export interface PlayerInputMappings {
  up: InputMapping;
  down: InputMapping;
  left: InputMapping;
  right: InputMapping;
  lightPunch: InputMapping;
  mediumPunch: InputMapping;
  heavyPunch: InputMapping;
  lightKick: InputMapping;
  mediumKick: InputMapping;
  heavyKick: InputMapping;
}

// PlayCanvas Mock Types (for compilation without actual PlayCanvas)
export namespace pc {
  export class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number = 0, y: number = 0, z: number = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }
  
  export class Vec2 {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
      this.x = x;
      this.y = y;
    }
  }
  
  export class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
  }
  
  export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
  }
  
  export class Entity {
    name: string = '';
    children: Entity[] = [];
    parent: Entity | null = null;
    
    addChild(entity: Entity): void {
      this.children.push(entity);
      entity.parent = this;
    }
    
    addComponent(type: string, data?: any): any {
      return { type, data };
    }
    
    findByName(name: string): Entity | null {
      if (this.name === name) return this;
      for (const child of this.children) {
        const found = child.findByName(name);
        if (found) return found;
      }
      return null;
    }
    
    destroy(): void {
      if (this.parent) {
        const index = this.parent.children.indexOf(this);
        if (index !== -1) {
          this.parent.children.splice(index, 1);
        }
      }
      this.children.length = 0;
    }
  }
  
  export class Application {
    canvas: HTMLCanvasElement;
    graphicsDevice: any;
    root: Entity = new Entity();
    
    constructor(canvas: HTMLCanvasElement, options?: any) {
      this.canvas = canvas;
      this.graphicsDevice = options?.graphicsDevice || null;
    }
    
    setCanvasFillMode(mode: any): void {
      // Mock implementation
    }
    
    setCanvasResolution(resolution: any): void {
      // Mock implementation
    }
    
    start(): void {
      // Mock implementation
    }
    
    on(event: string, callback: (...args: any[]) => void, scope?: any): void {
      // Mock implementation
    }
    
    off(event: string, callback: (...args: any[]) => void, scope?: any): void {
      // Mock implementation
    }
    
    fire(event: string, ...args: any[]): void {
      // Mock implementation
    }
  }
  
  export class StandardMaterial {
    diffuse: Color;
    emissive: Color;
    opacity: number;
    constructor() {
      this.diffuse = new Color(1, 1, 1, 1);
      this.emissive = new Color(0, 0, 0, 1);
      this.opacity = 1;
    }
  }
  
  export class Texture {
    width: number;
    height: number;
    constructor() {
      this.width = 256;
      this.height = 256;
    }
  }
  
  export class CurveSet {
    constructor() {
      // CurveSet implementation
    }
  }
  
  export const FILLMODE_FILL_WINDOW: any = 'FILLMODE_FILL_WINDOW';
  export const RESOLUTION_AUTO: any = 'RESOLUTION_AUTO';
}

// Character and Combat Types
export interface Character {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  model?: pc.Entity;
  animations?: Map<string, any>;
}

export interface AttackData {
  damage: number;
  startup: number;
  active: number;
  recovery: number;
  hitstun?: number;
  blockstun?: number;
  hitAdvantage?: number;
  blockAdvantage?: number;
  meterGain?: number;
  properties?: AttackProperties;
}

export interface AttackProperties {
  knockdown?: boolean;
  overhead?: boolean;
  low?: boolean;
  unblockable?: boolean;
  projectile?: boolean;
  invulnerable?: [number, number]; // [start frame, end frame]
  superArmor?: boolean;
  guardCrush?: boolean;
}

// System Interfaces
export interface ISystem {
  initialize(): Promise<void>;
  update?(dt: number): void;
  fixedUpdate?(fixedDt: number): void;
  interpolationUpdate?(dt: number): void;
  postUpdate?(dt: number): void;
  destroy?(): void;
}

// Performance and Debug Types
export interface PerformanceStats {
  frameCount: number;
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  gameState: GameState;
  battleState: BattleState;
  activeParticles?: number;
  inputLatency?: number;
  averageLatency?: number;
  maxLatency?: number;
  droppedInputs?: number;
}

// Event Types
export interface GameEvent {
  type: string;
  timestamp: number;
  data?: any;
}

export interface InputEvent extends GameEvent {
  playerId: string;
  inputName: string;
  frame: number;
  pressed?: boolean;
}

export interface CombatEvent extends GameEvent {
  attacker?: string;
  defender?: string;
  damage?: number;
  position?: pc.Vec3;
  attackData?: AttackData;
}

// Configuration Types
export interface GameConfig {
  targetFPS: number;
  frameTime: number;
  maxHistoryFrames: number;
  debug: boolean;
}

export interface InputConfig {
  bufferWindow: number;
  commandWindow: number;
  negativeEdge: boolean;
  buttonPriority: Record<string, number>;
  pollRate: number;
  maxInputDelay: number;
}

export interface CombatConfig {
  frameRate: number;
  frameTime: number;
  hitDetection: {
    enabled: boolean;
    precision: string;
    hitboxVisualization: boolean;
  };
  damageScaling: {
    enabled: boolean;
    scalingStart: number;
    scalingRate: number;
    minimumDamage: number;
  };
  parrySystem: {
    enabled: boolean;
    parryWindow: number;
    parryRecovery: number;
    parryAdvantage: number;
    redParryWindow: number;
    redParryAdvantage: number;
  };
  stun: {
    hitstunBase: number;
    blockstunBase: number;
    hitstunScaling: number;
    blockstunScaling: number;
  };
}

// Utility Types
export type Bounds = {
  min: pc.Vec3;
  max: pc.Vec3;
};

export type ParticleType = 'impact' | 'spark' | 'dust' | 'energy' | 'blood';

export interface ParticlePool {
  [key: string]: pc.Entity[];
}

// Generic event emitter type for PlayCanvas application
export interface EventEmitter {
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
  fire(event: string, ...args: any[]): void;
}
