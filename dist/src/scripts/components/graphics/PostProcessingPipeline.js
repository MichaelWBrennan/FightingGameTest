const PostProcessingPipeline = pc.createScript('postProcessingPipeline');
// --- Attributes ---
PostProcessingPipeline.attributes.add('enableBloom', {
    type: 'boolean',
    default: true,
    title: 'Enable Bloom',
});
PostProcessingPipeline.attributes.add('bloomIntensity', {
    type: 'number',
    default: 0.8,
    title: 'Bloom Intensity',
    min: 0,
    max: 2,
});
PostProcessingPipeline.attributes.add('enableDof', {
    type: 'boolean',
    default: true,
    title: 'Enable Depth of Field',
});
PostProcessingPipeline.attributes.add('dofFocusDistance', {
    type: 'number',
    default: 15,
    title: 'DoF Focus Distance',
});
PostProcessingPipeline.attributes.add('dofBlurAmount', {
    type: 'number',
    default: 0.8,
    title: 'DoF Blur Amount',
});
PostProcessingPipeline.attributes.add('enableColorGrading', {
    type: 'boolean',
    default: true,
    title: 'Enable Color Grading',
});
PostProcessingPipeline.attributes.add('contrast', {
    type: 'number',
    default: 1.1,
    title: 'Contrast',
});
PostProcessingPipeline.attributes.add('saturation', {
    type: 'number',
    default: 1.15,
    title: 'Saturation',
});
// --- Lifecycle Methods ---
PostProcessingPipeline.prototype.initialize = function () {
    this.bloomEffect = null;
    this.dofEffect = null;
    this.colorGradingEffect = null;
    this.setupPipeline();
    this.on('attr', this.onAttributeChange, this);
};
PostProcessingPipeline.prototype.setupPipeline = function () {
    const camera = this.entity.camera;
    if (!camera) {
        console.error('PostProcessingPipeline requires a Camera component on the same entity.');
        return;
    }
    // Clear existing effects
    while (camera.postEffects.length > 0) {
        camera.removePostEffect(camera.postEffects[0]);
    }
    // Add Bloom
    if (this.enableBloom) {
        this.bloomEffect = new pc.PostEffectBloom(this.app.graphicsDevice);
        this.bloomEffect.intensity = this.bloomIntensity;
        camera.addPostEffect(this.bloomEffect);
    }
    // Add Depth of Field (Placeholder)
    if (this.enableDof) {
        console.log(`Depth of Field enabled: Focus=${this.dofFocusDistance}, Blur=${this.dofBlurAmount}`);
        // In a full implementation, a custom DoF post-effect would be created and added here.
    }
    // Add Color Grading (Placeholder)
    if (this.enableColorGrading) {
        console.log(`Color Grading enabled: Contrast=${this.contrast}, Saturation=${this.saturation}`);
        // In a full implementation, a custom color grading post-effect would be created and added here.
    }
};
PostProcessingPipeline.prototype.onAttributeChange = function (name, value, prev) {
    // Re-setup the pipeline when attributes change
    this.setupPipeline();
};
PostProcessingPipeline.prototype.update = function (dt) {
    // Effects can be updated here if needed (e.g., dynamic focus pulling)
};
export { PostProcessingPipeline };
//# sourceMappingURL=PostProcessingPipeline.js.map