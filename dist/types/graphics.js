import * as pc from 'playcanvas';
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
    colorPalette: {
        ambient: new pc.Color(0.15, 0.18, 0.22),
        keyLight: new pc.Color(0.95, 0.90, 0.85),
        rimLight: new pc.Color(0.60, 0.75, 0.95),
        shadowTint: new pc.Color(0.25, 0.30, 0.45),
        playerOne: new pc.Color(0.95, 0.85, 0.70),
        playerTwo: new pc.Color(0.70, 0.85, 0.95),
        hitSpark: new pc.Color(1.0, 0.9, 0.6),
        blockSpark: new pc.Color(0.8, 0.9, 1.0),
        counterHit: new pc.Color(1.0, 0.4, 0.4)
    },
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