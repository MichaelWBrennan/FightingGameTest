import * as pc from 'playcanvas';
const StageLayerManager = pc.createScript('stageLayerManager');
// --- Lifecycle Methods ---
StageLayerManager.prototype.initialize = function () {
    this.stageRoot = new pc.Entity('StageRoot');
    this.entity.addChild(this.stageRoot);
    this.layerMap = new Map();
};
StageLayerManager.prototype.addLayer = function (layerData) {
    const layerEntity = new pc.Entity(layerData.name);
    // For now, use a placeholder material. Asset loading will be handled later.
    const material = new pc.StandardMaterial();
    if (layerData.tint) {
        material.diffuse = new pc.Color(...layerData.tint);
    }
    material.update();
    layerEntity.addComponent('render', {
        type: 'plane',
        material: material,
    });
    // Position and scale the layer
    layerEntity.setPosition(layerData.position[0], layerData.position[1], layerData.depth);
    layerEntity.setLocalScale(layerData.scale[0], layerData.scale[1], 1);
    this.stageRoot.addChild(layerEntity);
    this.layerMap.set(layerData.name, layerEntity);
    console.log(`Added stage layer: ${layerData.name}`);
};
StageLayerManager.prototype.clearLayers = function () {
    if (this.stageRoot) {
        this.stageRoot.destroy();
    }
    this.initialize(); // Re-initialize to create a new root
};
StageLayerManager.prototype.update = function (dt) {
    // Parallax effect would be updated here, relative to the camera position
};
export { StageLayerManager };
//# sourceMappingURL=StageLayerManager.js.map