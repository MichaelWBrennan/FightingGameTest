/**
 * SDL Game Renderer
 * Converted from C to TypeScript using WebGL
 */
export interface RenderTask {
    texture: WebGLTexture;
    vertices: Float32Array;
    indices: Uint16Array;
    depth: number;
}
export interface Vertex {
    position: {
        x: number;
        y: number;
    };
    texCoord: {
        u: number;
        v: number;
    };
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
}
export declare class SDLGameRenderer {
    private gl;
    private canvas;
    private program;
    private renderTasks;
    private drawRectBorders;
    constructor(canvas: HTMLCanvasElement);
    private initializeGL;
    private createShader;
    private createProgram;
    addRenderTask(task: RenderTask): void;
    renderFrame(): void;
    private renderTask;
    private renderBorders;
    endFrame(): void;
    setDrawBorders(draw: boolean): void;
}
//# sourceMappingURL=SDLRenderer.d.ts.map