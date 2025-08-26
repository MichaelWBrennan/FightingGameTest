/**
 * Input system type definitions for SF3:3S HD-2D Fighting Game
 */
// Type Guards
export function isValidPlayerId(id) {
    return id === 'player1' || id === 'player2';
}
export function isValidInputName(name) {
    const validInputs = [
        'up', 'down', 'left', 'right',
        'lightPunch', 'mediumPunch', 'heavyPunch',
        'lightKick', 'mediumKick', 'heavyKick'
    ];
    return validInputs.includes(name);
}
export function isValidDirection(direction) {
    const validDirections = [
        'neutral', 'up', 'down', 'left', 'right', 'forward', 'back',
        'upForward', 'upBack', 'downForward', 'downBack'
    ];
    return validDirections.includes(direction);
}
//# sourceMappingURL=input.js.map