import * as pc from 'playcanvas';
import { StageLayerManager } from './StageLayerManager';
import { ShaderUtils } from '../../core/graphics/ShaderUtils';
import { getHD2DAutoEnhancer } from '../../core/graphics/HD2DAutoEnhancer';

const SpriteRendererHD2D = pc.createScript('spriteRendererHD2D');

SpriteRendererHD2D.attributes.add('spriteAsset', {
    type: 'asset',
    assetType: 'texture',
    title: 'Sprite Texture',
});

SpriteRendererHD2D.attributes.add('normalMapAsset', {
    type: 'asset',
    assetType: 'texture',
    title: 'Normal Map (optional)'
});

SpriteRendererHD2D.attributes.add('specularMapAsset', {
    type: 'asset',
    assetType: 'texture',
    title: 'Specular Map (optional)'
});

SpriteRendererHD2D.attributes.add('layerName', {
    type: 'string',
    default: 'characters',
    title: 'Render Layer',
    description: 'The name of the render layer to add this sprite to.',
});

// --- Lifecycle Methods ---
SpriteRendererHD2D.prototype.initialize = function() {
    this.stageLayerManager = this.app.root.findOne(
        (node: pc.Entity) => !!node.script?.stageLayerManager
    )?.script?.stageLayerManager as StageLayerManager | undefined;

    if (!this.stageLayerManager) {
        console.error('SpriteRendererHD2D requires a StageLayerManager in the scene.');
        return;
    }

    this.createSprite();

    this.on('attr:spriteAsset', this.onSpriteAssetChange, this);
    
    // Auto-enhance with HD-2D features
    this.autoEnhanceHD2D();
};

SpriteRendererHD2D.prototype.createSprite = function() {
    if (this.spriteEntity) {
        this.spriteEntity.destroy();
    }

    const texture = this.spriteAsset?.resource;
    if (!texture) {
        return;
    }

    this.spriteEntity = new pc.Entity('BillboardSprite');
    
    // Create custom shader material with sprite normal mapping
    const material = ShaderUtils.createSpriteNormalMappingMaterial(this.app);
    material.setParameter('texture_diffuseMap', texture);
    if (this.normalMapAsset && this.normalMapAsset.resource) {
        material.setParameter('texture_normalMap', this.normalMapAsset.resource);
    }
    if (this.specularMapAsset && this.specularMapAsset.resource) {
        material.setParameter('texture_specularMap', this.specularMapAsset.resource);
    }
    // Enable alpha test and disable culling for sprites
    (material as any).alphaTest = 0.1;
    (material as any).cull = pc.CULLFACE_NONE;

    this.spriteEntity.addComponent('render', {
        type: 'plane',
        material: material,
    });

    this.entity.addChild(this.spriteEntity);

    // This is a simplified approach. A full implementation would
    // get the layer from the StageLayerManager. For now, we assume
    // the 'characters' layer exists and is managed elsewhere.
    // this.stageLayerManager.addEntityToLayer(this.entity, this.layerName);

    console.log(`Sprite created and added to layer: ${this.layerName}`);
};

SpriteRendererHD2D.prototype.onSpriteAssetChange = function() {
    this.createSprite();
};

SpriteRendererHD2D.prototype.update = function(dt: number) {
    // Billboard logic: make the sprite face the camera
    const camera = this.app.systems.camera.cameras[0];
    if (camera && this.spriteEntity) {
        this.spriteEntity.lookAt(camera.entity.getPosition());
        this.spriteEntity.setEulerAngles(0, this.spriteEntity.getEulerAngles().y, 0);
        // Update shader uniforms that depend on camera each frame
        const mat = this.spriteEntity.render?.material as pc.Material;
        if (mat) {
            const camPos = camera.entity.getPosition();
            mat.setParameter('view_position', new Float32Array([camPos.x, camPos.y, camPos.z]));
            // Simple light rig around the camera
            const lp0 = new pc.Vec3(camPos.x + 3, camPos.y + 5, camPos.z + 3);
            const lp1 = new pc.Vec3(camPos.x - 4, camPos.y + 2, camPos.z + 2);
            const lp2 = new pc.Vec3(camPos.x + 0, camPos.y + 6, camPos.z - 3);
            mat.setParameter('light_position_0', new Float32Array([lp0.x, lp0.y, lp0.z]));
            mat.setParameter('light_position_1', new Float32Array([lp1.x, lp1.y, lp1.z]));
            mat.setParameter('light_position_2', new Float32Array([lp2.x, lp2.y, lp2.z]));
        }
    }
};

// Auto-enhancement method
SpriteRendererHD2D.prototype.autoEnhanceHD2D = function() {
    const autoEnhancer = getHD2DAutoEnhancer();
    if (!autoEnhancer) return;
    
    // Enhance sprite with HD-2D features
    if (this.spriteEntity && this.spriteEntity.render) {
        const material = this.spriteEntity.render.material;
        if (material) {
            // Add pixel-perfect positioning
            this.addPixelPerfectPositioning();
            
            // Add rim lighting enhancement
            this.addRimLightingEnhancement();
        }
    }
};

SpriteRendererHD2D.prototype.addPixelPerfectPositioning = function() {
    if (!this.spriteEntity) return;
    
    // Add pixel-perfect positioning to sprite
    const originalUpdate = this.spriteEntity.update;
    this.spriteEntity.update = (dt: number) => {
        if (originalUpdate) originalUpdate.call(this.spriteEntity, dt);
        
        // Snap position to pixel boundaries
        const position = this.spriteEntity.getPosition();
        const pixelSize = 1.0 / 32.0; // Adjust based on your game's scale
        
        const snappedX = Math.round(position.x * pixelSize) / pixelSize;
        const snappedY = Math.round(position.y * pixelSize) / pixelSize;
        
        this.spriteEntity.setPosition(snappedX, snappedY, position.z);
    };
};

SpriteRendererHD2D.prototype.addRimLightingEnhancement = function() {
    if (!this.spriteEntity || !this.spriteEntity.render) return;
    
    const material = this.spriteEntity.render.material;
    if (material && material.setParameter) {
        // Enhance rim lighting parameters
        material.setParameter('rim_power', 2.5);
        material.setParameter('rim_intensity', 1.2);
        material.setParameter('rim_color', new Float32Array([0.8, 0.9, 1.0, 1.0]));
    }
};

export { SpriteRendererHD2D };
