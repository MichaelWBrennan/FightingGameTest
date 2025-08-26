
import { GraphicsState, RenderLayer, Sprite, Camera } from '../../../types/graphics';

export class GraphicsManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private graphicsState: GraphicsState;
    private renderLayers: Map<number, RenderLayer> = new Map();
    private sprites: Map<string, Sprite> = new Map();
    private camera: Camera;

    constructor() {
        this.canvas = this.createCanvas();
        this.ctx = this.canvas.getContext('2d')!;
        this.setupGraphicsState();
        this.setupCamera();
        this.initializeRenderLayers();
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvas.style.imageRendering = 'pixelated';
        document.body.appendChild(canvas);
        return canvas;
    }

    private setupGraphicsState(): void {
        this.graphicsState = {
            screenWidth: 640,
            screenHeight: 480,
            backgroundColor: { r: 0, g: 0, b: 0 },
            currentPalette: 0,
            frameBuffer: new ArrayBuffer(640 * 480 * 4),
            vramUsage: 0,
            textureCache: new Map()
        };
    }

    private setupCamera(): void {
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            rotation: 0
        };
    }

    private initializeRenderLayers(): void {
        const layerNames = ['background', 'sprites', 'effects', 'ui', 'debug'];
        layerNames.forEach((name, index) => {
            this.renderLayers.set(index, {
                id: index,
                name,
                visible: true,
                opacity: 1.0,
                sprites: [],
                effects: []
            });
        });
    }

    public setBackColor(r: number, g: number, b: number): void {
        this.graphicsState.backgroundColor = { r, g, b };
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }

    public bgDrawSystem(): void {
        // Clear the canvas with background color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render all layers in order
        for (let i = 0; i < this.renderLayers.size; i++) {
            const layer = this.renderLayers.get(i);
            if (layer && layer.visible) {
                this.renderLayer(layer);
            }
        }
    }

    private renderLayer(layer: RenderLayer): void {
        this.ctx.globalAlpha = layer.opacity;
        
        // Render sprites in this layer
        layer.sprites.forEach(sprite => {
            this.renderSprite(sprite);
        });

        // Render effects in this layer
        layer.effects.forEach(effect => {
            this.renderEffect(effect);
        });

        this.ctx.globalAlpha = 1.0;
    }

    private renderSprite(sprite: Sprite): void {
        if (!sprite.visible || !sprite.texture) return;

        const x = sprite.x - this.camera.x;
        const y = sprite.y - this.camera.y;

        this.ctx.save();
        this.ctx.translate(x + sprite.width / 2, y + sprite.height / 2);
        this.ctx.rotate(sprite.rotation);
        this.ctx.scale(sprite.scaleX * this.camera.zoom, sprite.scaleY * this.camera.zoom);
        
        // Draw sprite (simplified - would need actual texture loading)
        this.ctx.fillStyle = sprite.color || '#ffffff';
        this.ctx.fillRect(-sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
        
        this.ctx.restore();
    }

    private renderEffect(effect: any): void {
        // Render visual effects
        // Implementation depends on effect type
    }

    public bgMove(): void {
        // Update background animations and scrolling
        this.updateBackgroundLayers();
    }

    public bgMoveEx(layer: number): void {
        // Extended background movement for specific layer
        const targetLayer = this.renderLayers.get(layer);
        if (targetLayer) {
            this.updateLayerAnimation(targetLayer);
        }
    }

    public bgPosHoseiSub2(layer: number): void {
        // Background position correction
        const targetLayer = this.renderLayers.get(layer);
        if (targetLayer) {
            this.correctLayerPosition(targetLayer);
        }
    }

    public bgFamilySetAppoint(layer: number): void {
        // Set background family appointment
        // Implementation for background management
    }

    private updateBackgroundLayers(): void {
        // Update all background layers
        for (const [id, layer] of this.renderLayers) {
            if (layer.name === 'background') {
                this.updateLayerAnimation(layer);
            }
        }
    }

    private updateLayerAnimation(layer: RenderLayer): void {
        // Update layer animations
        layer.sprites.forEach(sprite => {
            if (sprite.animationSpeed > 0) {
                sprite.currentFrame = (sprite.currentFrame + sprite.animationSpeed) % sprite.totalFrames;
            }
        });
    }

    private correctLayerPosition(layer: RenderLayer): void {
        // Correct positions for parallax and camera movement
        layer.sprites.forEach(sprite => {
            // Apply parallax factor if needed
            if (sprite.parallaxX !== undefined) {
                sprite.x += sprite.parallaxX * this.camera.x;
            }
            if (sprite.parallaxY !== undefined) {
                sprite.y += sprite.parallaxY * this.camera.y;
            }
        });
    }

    public addSprite(id: string, sprite: Sprite, layerId: number = 1): void {
        this.sprites.set(id, sprite);
        const layer = this.renderLayers.get(layerId);
        if (layer) {
            layer.sprites.push(sprite);
        }
    }

    public removeSprite(id: string): void {
        const sprite = this.sprites.get(id);
        if (sprite) {
            // Remove from all layers
            for (const layer of this.renderLayers.values()) {
                const index = layer.sprites.indexOf(sprite);
                if (index > -1) {
                    layer.sprites.splice(index, 1);
                }
            }
            this.sprites.delete(id);
        }
    }

    public setCamera(x: number, y: number, zoom: number = 1.0): void {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = zoom;
    }

    public getCamera(): Camera {
        return { ...this.camera };
    }

    public getGraphicsState(): GraphicsState {
        return { ...this.graphicsState };
    }

    public resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.graphicsState.screenWidth = width;
        this.graphicsState.screenHeight = height;
    }

    public takeScreenshot(): string {
        return this.canvas.toDataURL();
    }

    public setLayerVisibility(layerId: number, visible: boolean): void {
        const layer = this.renderLayers.get(layerId);
        if (layer) {
            layer.visible = visible;
        }
    }

    public setLayerOpacity(layerId: number, opacity: number): void {
        const layer = this.renderLayers.get(layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
        }
    }
}
