// @ts-nocheck
export class GraphicsManager {
    constructor() {
        this.renderLayers = new Map();
        this.sprites = new Map();
        this.canvas = this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.setupGraphicsState();
        this.setupCamera();
        this.initializeRenderLayers();
    }
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvas.style.imageRendering = 'pixelated';
        document.body.appendChild(canvas);
        return canvas;
    }
    setupGraphicsState() {
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
    setupCamera() {
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            rotation: 0
        };
    }
    initializeRenderLayers() {
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
    setBackColor(r, g, b) {
        this.graphicsState.backgroundColor = { r, g, b };
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }
    bgDrawSystem() {
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
    renderLayer(layer) {
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
    renderSprite(sprite) {
        if (!sprite.visible || !sprite.texture)
            return;
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
    renderEffect(effect) {
        // Render visual effects
        // Implementation depends on effect type
    }
    bgMove() {
        // Update background animations and scrolling
        this.updateBackgroundLayers();
    }
    bgMoveEx(layer) {
        // Extended background movement for specific layer
        const targetLayer = this.renderLayers.get(layer);
        if (targetLayer) {
            this.updateLayerAnimation(targetLayer);
        }
    }
    bgPosHoseiSub2(layer) {
        // Background position correction
        const targetLayer = this.renderLayers.get(layer);
        if (targetLayer) {
            this.correctLayerPosition(targetLayer);
        }
    }
    bgFamilySetAppoint(layer) {
        // Set background family appointment
        // Implementation for background management
    }
    updateBackgroundLayers() {
        // Update all background layers
        for (const [id, layer] of this.renderLayers) {
            if (layer.name === 'background') {
                this.updateLayerAnimation(layer);
            }
        }
    }
    updateLayerAnimation(layer) {
        // Update layer animations
        layer.sprites.forEach(sprite => {
            if (sprite.animationSpeed > 0) {
                sprite.currentFrame = (sprite.currentFrame + sprite.animationSpeed) % sprite.totalFrames;
            }
        });
    }
    correctLayerPosition(layer) {
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
    addSprite(id, sprite, layerId = 1) {
        this.sprites.set(id, sprite);
        const layer = this.renderLayers.get(layerId);
        if (layer) {
            layer.sprites.push(sprite);
        }
    }
    removeSprite(id) {
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
    setCamera(x, y, zoom = 1.0) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = zoom;
    }
    getCamera() {
        return { ...this.camera };
    }
    getGraphicsState() {
        return { ...this.graphicsState };
    }
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.graphicsState.screenWidth = width;
        this.graphicsState.screenHeight = height;
    }
    takeScreenshot() {
        return this.canvas.toDataURL();
    }
    setLayerVisibility(layerId, visible) {
        const layer = this.renderLayers.get(layerId);
        if (layer) {
            layer.visible = visible;
        }
    }
    setLayerOpacity(layerId, opacity) {
        const layer = this.renderLayers.get(layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
        }
    }
}
//# sourceMappingURL=GraphicsManager.js.map