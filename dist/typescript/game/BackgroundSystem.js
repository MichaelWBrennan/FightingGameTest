/**
 * Street Fighter III Background System
 * Converted from bg_sub.c and related background files
 */
export class SF3BackgroundSystem {
    constructor() {
        this.stages = new Map();
        this.currentStage = null;
        this.cameraPosition = { x: 0, y: 0 };
        this.suziOffset = { x: 0, y: 0 };
        this.initializeStages();
    }
    initializeStages() {
        // Metro City Stage
        this.stages.set('metro_city', {
            name: 'Metro City',
            layers: [
                {
                    id: 0,
                    texture: 'metro_bg_far',
                    scrollSpeed: 0.1,
                    depth: 0,
                    position: { x: 0, y: 0 },
                    scale: { x: 1, y: 1 },
                    alpha: 1,
                    visible: true
                },
                {
                    id: 1,
                    texture: 'metro_bg_mid',
                    scrollSpeed: 0.3,
                    depth: 1,
                    position: { x: 0, y: 0 },
                    scale: { x: 1, y: 1 },
                    alpha: 1,
                    visible: true
                },
                {
                    id: 2,
                    texture: 'metro_fg',
                    scrollSpeed: 1.0,
                    depth: 2,
                    position: { x: 0, y: 0 },
                    scale: { x: 1, y: 1 },
                    alpha: 1,
                    visible: true
                }
            ],
            bounds: { left: -400, right: 400, top: -200, bottom: 0 },
            music: 'metro_city_theme'
        });
        // New York Stage
        this.stages.set('new_york', {
            name: 'New York',
            layers: [
                {
                    id: 0,
                    texture: 'ny_skyline',
                    scrollSpeed: 0.05,
                    depth: 0,
                    position: { x: 0, y: -50 },
                    scale: { x: 1.2, y: 1.2 },
                    alpha: 0.8,
                    visible: true
                },
                {
                    id: 1,
                    texture: 'ny_buildings',
                    scrollSpeed: 0.2,
                    depth: 1,
                    position: { x: 0, y: 0 },
                    scale: { x: 1, y: 1 },
                    alpha: 1,
                    visible: true
                },
                {
                    id: 2,
                    texture: 'ny_street',
                    scrollSpeed: 1.0,
                    depth: 2,
                    position: { x: 0, y: 0 },
                    scale: { x: 1, y: 1 },
                    alpha: 1,
                    visible: true
                }
            ],
            bounds: { left: -600, right: 600, top: -300, bottom: 0 },
            music: 'new_york_theme'
        });
    }
    setStage(stageName) {
        if (this.stages.has(stageName)) {
            this.currentStage = stageName;
            return true;
        }
        return false;
    }
    getCurrentStage() {
        if (!this.currentStage)
            return null;
        return this.stages.get(this.currentStage) || null;
    }
    setCameraPosition(x, y) {
        this.cameraPosition.x = x;
        this.cameraPosition.y = y;
        this.updateLayerPositions();
    }
    updateLayerPositions() {
        const stage = this.getCurrentStage();
        if (!stage)
            return;
        for (const layer of stage.layers) {
            // Apply parallax scrolling based on camera position and layer scroll speed
            layer.position.x = -this.cameraPosition.x * layer.scrollSpeed + this.suziOffset.x;
            layer.position.y = -this.cameraPosition.y * layer.scrollSpeed + this.suziOffset.y;
        }
    }
    // Converted from suzi_offset_set_sub
    setSuziOffset(x, y) {
        // Convert from original C logic
        const workX = (x & 0x300);
        const adjustedX = 0x300 - workX;
        const workY = (x & 0xFF);
        const adjustedY = 0x100 - workY;
        this.suziOffset.x = adjustedX + adjustedY - 0x200;
        this.suziOffset.y = y;
        this.updateLayerPositions();
    }
    // Converted from Bg_Family_Set functionality
    setBgFamily(familyIndex) {
        const stage = this.getCurrentStage();
        if (!stage)
            return;
        // Apply family-specific modifications to layers
        switch (familyIndex) {
            case 0: // Day variant
                stage.layers.forEach(layer => {
                    layer.alpha = 1.0;
                });
                break;
            case 1: // Sunset variant
                stage.layers.forEach(layer => {
                    layer.alpha = 0.9;
                    // Apply orange tint logic here
                });
                break;
            case 2: // Night variant
                stage.layers.forEach(layer => {
                    layer.alpha = 0.7;
                    // Apply blue tint logic here
                });
                break;
        }
    }
    getLayerAtDepth(depth) {
        const stage = this.getCurrentStage();
        if (!stage)
            return null;
        return stage.layers.find(layer => layer.depth === depth) || null;
    }
    setLayerVisibility(layerId, visible) {
        const stage = this.getCurrentStage();
        if (!stage)
            return;
        const layer = stage.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = visible;
        }
    }
    update() {
        this.updateLayerPositions();
    }
    getVisibleLayers() {
        const stage = this.getCurrentStage();
        if (!stage)
            return [];
        return stage.layers
            .filter(layer => layer.visible)
            .sort((a, b) => a.depth - b.depth);
    }
    getStageBounds() {
        const stage = this.getCurrentStage();
        return stage?.bounds || null;
    }
}
//# sourceMappingURL=BackgroundSystem.js.map