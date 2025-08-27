/**
 * Character system type definitions for SF3:3S HD-2D Fighting Game
 */
// Type Guards
export function isValidCharacterState(state) {
    const validStates = [
        'idle', 'walking', 'crouching', 'jumping', 'attacking', 'blocking',
        'hitstun', 'blockstun', 'knocked_down', 'special_move', 'super_move', 'parrying'
    ];
    return validStates.includes(state);
}
export function isValidArchetype(archetype) {
    const validArchetypes = ['shoto', 'rushdown', 'grappler', 'zoner', 'technical'];
    return validArchetypes.includes(archetype);
}
export function isCharacterEntity(entity) {
    return 'characterData' in entity && 'currentState' in entity;
}
// Constants
export const DEFAULT_ARCHETYPE_TEMPLATES = {
    shoto: {
        health: 1000,
        walkSpeed: 150,
        dashSpeed: 300,
        jumpHeight: 400,
        complexity: 'easy',
        strengths: ['balanced', 'fundamentals', 'projectile'],
        weaknesses: ['specialization'],
        uniqueMechanics: ['hadoken', 'shoryuken', 'tatsu']
    },
    rushdown: {
        health: 900,
        walkSpeed: 180,
        dashSpeed: 400,
        jumpHeight: 350,
        complexity: 'medium',
        strengths: ['pressure', 'mixups', 'frametraps'],
        weaknesses: ['range', 'defense'],
        uniqueMechanics: ['lightning_legs', 'air_mobility']
    },
    grappler: {
        health: 1200,
        walkSpeed: 120,
        dashSpeed: 250,
        jumpHeight: 300,
        complexity: 'hard',
        strengths: ['damage', 'health', 'command_grabs'],
        weaknesses: ['mobility', 'range'],
        uniqueMechanics: ['command_grab', 'armor_moves']
    },
    zoner: {
        health: 1100,
        walkSpeed: 130,
        dashSpeed: 280,
        jumpHeight: 320,
        complexity: 'medium',
        strengths: ['range', 'projectiles', 'space_control'],
        weaknesses: ['close_range', 'mobility'],
        uniqueMechanics: ['multiple_projectiles', 'charge_moves']
    },
    technical: {
        health: 980,
        walkSpeed: 155,
        dashSpeed: 320,
        jumpHeight: 380,
        complexity: 'expert',
        strengths: ['versatility', 'stance_switching', 'mixups'],
        weaknesses: ['consistency', 'execution'],
        uniqueMechanics: ['stance_system', 'evasive_moves']
    }
};
export const DEFAULT_CHARACTER_STATES = {
    idle: { priority: 0, cancellable: true },
    walking: { priority: 1, cancellable: true },
    crouching: { priority: 1, cancellable: true },
    jumping: { priority: 2, cancellable: false },
    attacking: { priority: 3, cancellable: true },
    blocking: { priority: 2, cancellable: true },
    hitstun: { priority: 4, cancellable: false },
    blockstun: { priority: 3, cancellable: false },
    knocked_down: { priority: 5, cancellable: false },
    special_move: { priority: 4, cancellable: true },
    super_move: { priority: 5, cancellable: false },
    parrying: { priority: 6, cancellable: false }
};
export const DEFAULT_FRAME_DATA = {
    hitstun: { light: 8, medium: 12, heavy: 16 },
    blockstun: { light: 4, medium: 6, heavy: 8 },
    recovery: { light: 6, medium: 10, heavy: 14 },
    startup: { light: 4, medium: 7, heavy: 12 }
};
//# sourceMappingURL=character.js.map