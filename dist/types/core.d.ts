/**
 * Core type definitions for the game engine
 * Fixed unused parameter warnings
 */
export interface Entity {
    id: number;
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
    active: boolean;
}
export interface GameConfig {
    width: number;
    height: number;
    fps: number;
    fullscreen: boolean;
}
export interface ApplicationOptions {
    graphicsDevice?: any;
    canvas?: HTMLCanvasElement;
    keyboard?: any;
    mouse?: any;
    gamepads?: any;
    scriptPrefix?: string;
    assetPrefix?: string;
    scriptsOrder?: string[];
}
export interface ApplicationBase {
    graphicsDevice: any;
    scene: any;
    root: Entity;
    assets: any;
    systems: any;
    frame: number;
    timeScale: number;
    maxDeltaTime: number;
    configure(url: string, callback?: () => void): void;
    preload(callback?: () => void): void;
    loadScene(url: string, callback?: () => void): void;
    setCanvasFillMode(): void;
    setCanvasResolution(): void;
    start(): void;
    update(dt: number): void;
    render(): void;
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    fire(event: string, ...args: any[]): void;
    destroy(): void;
}
export interface ScriptType {
    new (args?: any): any;
    attributes: any;
    extend<T>(methods: T): T & ScriptType;
}
export interface Script {
    entity: Entity;
    enabled: boolean;
    initialize?(): void;
    postInitialize?(): void;
    update?(dt: number): void;
    postUpdate?(dt: number): void;
    destroy?(): void;
}
export interface Vec3 {
    x: number;
    y: number;
    z: number;
    clone(): Vec3;
    copy(rhs: Vec3): Vec3;
    set(x: number, y: number, z: number): Vec3;
    add(rhs: Vec3): Vec3;
    sub(rhs: Vec3): Vec3;
    mul(rhs: Vec3): Vec3;
    scale(scalar: number): Vec3;
    normalize(): Vec3;
    length(): number;
    dot(rhs: Vec3): number;
    cross(rhs: Vec3): Vec3;
}
export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}
export interface Transform {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
}
export interface Component {
    entity: Entity;
    enabled: boolean;
    system: any;
}
declare global {
    const pc: {
        Application: new (options?: ApplicationOptions) => ApplicationBase;
        Entity: new (name?: string) => Entity;
        Vec3: new (x?: number, y?: number, z?: number) => Vec3;
        Color: new (r?: number, g?: number, b?: number, a?: number) => Color;
        createScript: (name: string) => ScriptType;
        [key: string]: any;
    };
}
//# sourceMappingURL=core.d.ts.map