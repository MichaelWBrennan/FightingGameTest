/**
 * Street Fighter III Character System
 * Converted from character-related C files
 */
export class SF3CharacterSystem {
    constructor() {
        this.characters = new Map();
        this.movesets = new Map();
        this.initializeCharacters();
        this.initializeMovesets();
    }
    initializeCharacters() {
        // Ryu
        this.createCharacter({
            id: 0,
            name: 'Ryu',
            health: 1000,
            maxHealth: 1000,
            meter: 0,
            maxMeter: 100,
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            facing: 'right',
            state: 'idle',
            animation: 'idle',
            frameIndex: 0
        });
        // Ken
        this.createCharacter({
            id: 1,
            name: 'Ken',
            health: 1000,
            maxHealth: 1000,
            meter: 0,
            maxMeter: 100,
            position: { x: 200, y: 0 },
            velocity: { x: 0, y: 0 },
            facing: 'left',
            state: 'idle',
            animation: 'idle',
            frameIndex: 0
        });
        // Add other characters (Chun-Li, Akuma, etc.)
    }
    initializeMovesets() {
        // Ryu moveset
        this.movesets.set('Ryu', [
            {
                name: 'Hadoken',
                input: ['down', 'down-forward', 'forward', 'punch'],
                damage: 60,
                startup: 13,
                active: 2,
                recovery: 39,
                blockstun: 12,
                hitstun: 16
            },
            {
                name: 'Shoryuken',
                input: ['forward', 'down', 'down-forward', 'punch'],
                damage: 120,
                startup: 3,
                active: 4,
                recovery: 31,
                blockstun: 15,
                hitstun: 20
            },
            {
                name: 'Tatsumaki',
                input: ['down', 'down-back', 'back', 'kick'],
                damage: 80,
                startup: 14,
                active: 15,
                recovery: 18,
                blockstun: 10,
                hitstun: 14
            }
        ]);
        // Ken moveset
        this.movesets.set('Ken', [
            {
                name: 'Hadoken',
                input: ['down', 'down-forward', 'forward', 'punch'],
                damage: 60,
                startup: 13,
                active: 2,
                recovery: 39,
                blockstun: 12,
                hitstun: 16
            },
            {
                name: 'Shoryuken',
                input: ['forward', 'down', 'down-forward', 'punch'],
                damage: 140,
                startup: 3,
                active: 4,
                recovery: 29,
                blockstun: 15,
                hitstun: 22
            }
        ]);
    }
    createCharacter(data) {
        this.characters.set(data.id, { ...data });
    }
    getCharacter(id) {
        return this.characters.get(id) || null;
    }
    updateCharacter(id, updates) {
        const character = this.characters.get(id);
        if (character) {
            Object.assign(character, updates);
        }
    }
    executeMove(characterId, moveName) {
        const character = this.characters.get(characterId);
        if (!character)
            return false;
        const moveset = this.movesets.get(character.name);
        if (!moveset)
            return false;
        const move = moveset.find(m => m.name === moveName);
        if (!move)
            return false;
        // Execute move logic
        character.state = 'attacking';
        character.animation = moveName.toLowerCase();
        character.frameIndex = 0;
        return true;
    }
    takeDamage(characterId, damage) {
        const character = this.characters.get(characterId);
        if (character) {
            character.health = Math.max(0, character.health - damage);
            if (character.health === 0) {
                character.state = 'knocked_out';
            }
        }
    }
    addMeter(characterId, amount) {
        const character = this.characters.get(characterId);
        if (character) {
            character.meter = Math.min(character.maxMeter, character.meter + amount);
        }
    }
    update() {
        for (const character of this.characters.values()) {
            // Update position
            character.position.x += character.velocity.x;
            character.position.y += character.velocity.y;
            // Apply gravity if in air
            if (character.position.y < 0) {
                character.velocity.y += 0.8; // gravity
            }
            else {
                character.position.y = 0;
                character.velocity.y = 0;
            }
            // Update animation frame
            character.frameIndex++;
        }
    }
    getCharacters() {
        return Array.from(this.characters.values());
    }
    getMoves(characterName) {
        return this.movesets.get(characterName) || [];
    }
}
//# sourceMappingURL=CharacterSystem.js.map