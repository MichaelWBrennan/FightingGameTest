import * as pc from 'playcanvas';
import { StageLayerManager } from './StageLayerManager';

const SpriteRendererHD2D = pc.createScript('spriteRendererHD2D');

SpriteRendererHD2D.attributes.add('spriteAsset', {
    type: 'asset',
    assetType: 'texture',
    title: 'Sprite Texture',
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

    const material = new pc.StandardMaterial();
    material.diffuseMap = texture;
    material.transparent = true;
    material.alphaTest = 0.1;
    material.cull = pc.CULLFACE_NONE;
    material.update();

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
    }
};

export { SpriteRendererHD2D };
