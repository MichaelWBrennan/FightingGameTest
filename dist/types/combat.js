/**
 * Combat system type definitions for SF3:3S HD-2D Fighting Game
 */
// Type Guards and Utilities
export function isValidCombatState(state) {
    const validStates = [
        'neutral', 'attacking', 'defending', 'hitstun', 'blockstun', 'special_move'
    ];
    return validStates.includes(state);
}
export function isValidDamageType(type) {
    const validTypes = ['normal', 'chip', 'counter', 'critical'];
    return validTypes.includes(type);
}
export function isValidParryType(type) {
    return type === 'normal' || type === 'red';
}
// Constants
export const DEFAULT_COMBAT_CONFIG = {
    frameRate: 60,
    frameTime: 1000 / 60,
    hitDetection: {
        enabled: true,
        precision: 'frame-perfect',
        hitboxVisualization: false
    },
    damageScaling: {
        enabled: true,
        scalingStart: 3,
        scalingRate: 0.9,
        minimumDamage: 0.1
    },
    parrySystem: {
        enabled: true,
        parryWindow: 7,
        parryRecovery: 12,
        parryAdvantage: 15,
        redParryWindow: 2,
        redParryAdvantage: 30
    },
    stun: {
        hitstunBase: 12,
        blockstunBase: 8,
        hitstunScaling: 1.2,
        blockstunScaling: 1.0
    }
};
export const DEFAULT_COMBAT_STATE = {
    player1: {},
    player2: {},
    round: 1,
    timer: 99
};
export const DEFAULT_COMBO_DATA = {
    hits: 0,
    damage: 0,
    scaling: 1.0
};
export const DEFAULT_METER_DATA = {
    super: 0,
    ex: 0,
    maxSuper: 100,
    maxEx: 100
};
//# sourceMappingURL=combat.js.map