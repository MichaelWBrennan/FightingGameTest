/**
 * HD2DAutoEnhancer - HD-2D Visual Enhancement System
 * Provides automatic visual enhancements for HD-2D style graphics
 * Features: Atmospheric perspective, depth-based effects, pixel-perfect positioning
 */

import * as pc from 'playcanvas';

export interface HD2DAutoEnhancerConfig {
    enableAtmosphericPerspective: boolean;
    enablePixelPerfectPositioning: boolean;
    enableRimLighting: boolean;
    enableDepthOfField: boolean;
    atmosphericFogDistance: number;
    pixelSnapSize: number;
    rimLightingIntensity: number;
}

export interface HD2DEnhancementOptions {
    depth?: number;
    layerType?: 'background' | 'midground' | 'foreground' | 'character' | 'ui';
    enablePixelSnap?: boolean;
    enableAtmosphericTinting?: boolean;
    enableRimLighting?: boolean;
}

class HD2DAutoEnhancer {
    private config: HD2DAutoEnhancerConfig;
    private app: pc.Application | null = null;
    private initialized: boolean = false;

    constructor(config?: Partial<HD2DAutoEnhancerConfig>) {
        this.config = {
            enableAtmosphericPerspective: true,
            enablePixelPerfectPositioning: true,
            enableRimLighting: true,
            enableDepthOfField: false,
            atmosphericFogDistance: 50,
            pixelSnapSize: 1.0 / 32.0,
            rimLightingIntensity: 1.0,
            ...config
        };
    }

    public initialize(app: pc.Application): void {
        this.app = app;
        this.initialized = true;
        console.log('HD2DAutoEnhancer initialized');
    }

    public isInitialized(): boolean {
        return this.initialized && this.app !== null;
    }

    public enhanceEntity(entity: pc.Entity, options: HD2DEnhancementOptions = {}): void {
        if (!this.isInitialized()) {
            console.warn('HD2DAutoEnhancer not initialized');
            return;
        }

        const {
            depth = 0,
            layerType = 'midground',
            enablePixelSnap = this.config.enablePixelPerfectPositioning,
            enableAtmosphericTinting = this.config.enableAtmosphericPerspective,
            enableRimLighting = this.config.enableRimLighting
        } = options;

        // Apply pixel-perfect positioning
        if (enablePixelSnap) {
            this.applyPixelPerfectPositioning(entity);
        }

        // Apply atmospheric perspective
        if (enableAtmosphericTinting && layerType !== 'ui') {
            this.applyAtmosphericPerspective(entity, depth, layerType);
        }

        // Apply rim lighting enhancement
        if (enableRimLighting && entity.render?.material) {
            this.applyRimLightingEnhancement(entity);
        }
    }

    public enhanceLayer(layerName: string, entities: pc.Entity[]): void {
        if (!this.isInitialized()) return;

        const layerType = this.getLayerTypeFromName(layerName);
        
        entities.forEach(entity => {
            const depth = Math.abs(entity.getPosition().z);
            this.enhanceEntity(entity, {
                depth,
                layerType,
                enableAtmosphericTinting: layerType === 'background' || layerType === 'midground'
            });
        });
    }

    private applyPixelPerfectPositioning(entity: pc.Entity): void {
        const originalUpdate = entity.update;
        entity.update = (dt: number) => {
            if (originalUpdate) originalUpdate.call(entity, dt);
            
            // Snap position to pixel boundaries
            const position = entity.getPosition();
            const pixelSize = this.config.pixelSnapSize;
            
            const snappedX = Math.round(position.x * pixelSize) / pixelSize;
            const snappedY = Math.round(position.y * pixelSize) / pixelSize;
            
            entity.setPosition(snappedX, snappedY, position.z);
        };
    }

    private applyAtmosphericPerspective(entity: pc.Entity, depth: number, layerType: string): void {
        const render = entity.render;
        if (!render || !render.material) return;

        const material = render.material as pc.StandardMaterial;
        const fogFactor = Math.min(1.0, depth / this.config.atmosphericFogDistance);
        
        // Apply atmospheric tinting based on depth and layer type
        const atmosphericColor = this.getAtmosphericColor(layerType);
        const originalColor = material.diffuse || new pc.Color(1, 1, 1);
        const tintedColor = originalColor.clone().lerp(atmosphericColor, fogFactor * 0.4);
        
        material.diffuse = tintedColor;
        material.opacity = Math.max(0.1, 1.0 - fogFactor * 0.3);
        
        // Add slight desaturation for distant objects
        if (depth > 20) {
            const saturation = Math.max(0.3, 1.0 - fogFactor * 0.5);
            const gray = tintedColor.r * 0.299 + tintedColor.g * 0.587 + tintedColor.b * 0.114;
            tintedColor.r = gray + (tintedColor.r - gray) * saturation;
            tintedColor.g = gray + (tintedColor.g - gray) * saturation;
            tintedColor.b = gray + (tintedColor.b - gray) * saturation;
        }
    }

    private applyRimLightingEnhancement(entity: pc.Entity): void {
        const material = entity.render?.material;
        if (!material || !material.setParameter) return;

        // Enhance rim lighting parameters
        material.setParameter('rim_power', 2.5);
        material.setParameter('rim_intensity', this.config.rimLightingIntensity);
        material.setParameter('rim_color', new Float32Array([0.8, 0.9, 1.0, 1.0]));
    }

    private getAtmosphericColor(layerType: string): pc.Color {
        switch (layerType) {
            case 'background':
                return new pc.Color(0.7, 0.8, 0.9); // Cool blue tint
            case 'midground':
                return new pc.Color(0.8, 0.85, 0.9); // Slight cool tint
            case 'foreground':
                return new pc.Color(0.9, 0.9, 0.95); // Very slight cool tint
            case 'character':
                return new pc.Color(1.0, 1.0, 1.0); // No tint for characters
            default:
                return new pc.Color(0.8, 0.85, 0.9);
        }
    }

    private getLayerTypeFromName(layerName: string): 'background' | 'midground' | 'foreground' | 'character' | 'ui' {
        const name = layerName.toLowerCase();
        
        if (name.includes('sky') || name.includes('background') || name.includes('far')) {
            return 'background';
        } else if (name.includes('mid') || name.includes('middle')) {
            return 'midground';
        } else if (name.includes('foreground') || name.includes('near') || name.includes('stage')) {
            return 'foreground';
        } else if (name.includes('character') || name.includes('player') || name.includes('fighter')) {
            return 'character';
        } else {
            return 'midground';
        }
    }

    public updateConfig(newConfig: Partial<HD2DAutoEnhancerConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    public getConfig(): HD2DAutoEnhancerConfig {
        return { ...this.config };
    }

    public destroy(): void {
        this.app = null;
        this.initialized = false;
        console.log('HD2DAutoEnhancer destroyed');
    }
}

// Singleton instance
let hd2dAutoEnhancer: HD2DAutoEnhancer | null = null;

export function getHD2DAutoEnhancer(): HD2DAutoEnhancer | null {
    if (!hd2dAutoEnhancer) {
        hd2dAutoEnhancer = new HD2DAutoEnhancer();
    }
    return hd2dAutoEnhancer;
}

export function initializeHD2DAutoEnhancer(app: pc.Application, config?: Partial<HD2DAutoEnhancerConfig>): HD2DAutoEnhancer {
    if (!hd2dAutoEnhancer) {
        hd2dAutoEnhancer = new HD2DAutoEnhancer(config);
    }
    hd2dAutoEnhancer.initialize(app);
    return hd2dAutoEnhancer;
}

export function destroyHD2DAutoEnhancer(): void {
    if (hd2dAutoEnhancer) {
        hd2dAutoEnhancer.destroy();
        hd2dAutoEnhancer = null;
    }
}

export default HD2DAutoEnhancer;