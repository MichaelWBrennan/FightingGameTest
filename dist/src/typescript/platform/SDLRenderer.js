/**
 * SDL Game Renderer
 * Converted from C to TypeScript using WebGL
 */
export class SDLGameRenderer {
    constructor(canvas) {
        this.program = null;
        this.renderTasks = [];
        this.drawRectBorders = false;
        this.canvas = canvas;
        const gl = canvas.getContext('webgl');
        if (!gl)
            throw new Error('WebGL not supported');
        this.gl = gl;
        this.initializeGL();
    }
    initializeGL() {
        const gl = this.gl;
        const vertexShader = this.createShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      
      uniform sampler2D u_texture;
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
      }
    `);
        this.program = this.createProgram(vertexShader, fragmentShader);
        gl.useProgram(this.program);
    }
    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader)
            throw new Error('Failed to create shader');
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}`);
        }
        return shader;
    }
    createProgram(vertexShader, fragmentShader) {
        const gl = this.gl;
        const program = gl.createProgram();
        if (!program)
            throw new Error('Failed to create program');
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        return program;
    }
    addRenderTask(task) {
        this.renderTasks.push(task);
    }
    renderFrame() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Sort by depth
        this.renderTasks.sort((a, b) => a.depth - b.depth);
        for (const task of this.renderTasks) {
            this.renderTask(task);
        }
        if (this.drawRectBorders) {
            this.renderBorders();
        }
    }
    renderTask(task) {
        const gl = this.gl;
        if (!this.program)
            return;
        gl.bindTexture(gl.TEXTURE_2D, task.texture);
        // Set up vertex attributes
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
        const colorLocation = gl.getAttribLocation(this.program, 'a_color');
        // Create and bind buffers
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, task.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 32, 8);
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 32, 16);
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, task.indices, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, task.indices.length, gl.UNSIGNED_SHORT, 0);
        // Cleanup
        gl.deleteBuffer(vertexBuffer);
        gl.deleteBuffer(indexBuffer);
    }
    renderBorders() {
        // Border rendering implementation
        for (let i = 0; i < this.renderTasks.length; i++) {
            const factor = i / (this.renderTasks.length - 1);
            const red = 1 - factor;
            const green = factor;
            // Draw border using WebGL lines
            // Implementation details...
        }
    }
    endFrame() {
        this.renderTasks = [];
    }
    setDrawBorders(draw) {
        this.drawRectBorders = draw;
    }
}
//# sourceMappingURL=SDLRenderer.js.map