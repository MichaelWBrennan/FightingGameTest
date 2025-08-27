// Type Guards
export function isValidEffectType(type) {
    const validTypes = ['normal', 'counter', 'block', 'parry', 'super'];
    return validTypes.includes(type);
}
export function isValidLayerName(name) {
    const validNames = ['background', 'midground', 'characters', 'effects', 'ui'];
    return validNames.includes(name);
}
// Constants
export const DEFAULT_VISUAL_STYLE = {
    animationFrameRate: 60,
    frameBlending: true,
    motionBlur: true,
    rubberBandMotion: true,
    colorPalette: {},
    stageReaction: true,
    backgroundAnimation: true,
    dynamicElements: true
};
export const DEFAULT_PERFORMANCE_SETTINGS = {
    maxParticles: 200,
    cullingDistance: 50,
    lodThreshold: 0.5,
    dynamicBatching: true
};
export const DEFAULT_HD2D_SETTINGS = {
    pixelPerfect: true,
    filterMode: 'point',
    scalingMode: 'pixel_perfect',
    targetResolution: { width: 320, height: 240 },
    pixelScale: 4
};
//# sourceMappingURL=graphics.js.map