import * as pc from 'playcanvas';
import { Logger } from '../utils/Logger';
export class CharacterManager {
    constructor(app) {
        this.characters = new Map();
        this.characterConfigs = new Map();
        this.activeCharacters = [];
        this.app = app;
    }
    async initialize() {
        await this.loadCharacterConfigs();
        Logger.info('Character manager initialized');
    }
    async loadCharacterConfigs() {
        const characterNames = ['ryu', 'ken', 'chun_li', 'sagat', 'zangief'];
        for (const name of characterNames) {
            try {
                const response = await fetch(`/data/characters/${name}.json`);
                const config = await response.json();
                this.characterConfigs.set(name, config);
                Logger.info(`Loaded character config: ${name}`);
            }
            catch (error) {
                Logger.error(`Failed to load character ${name}:`, error);
            }
        }
    }
    createCharacter(characterId, position) {
        const config = this.characterConfigs.get(characterId);
        if (!config) {
            Logger.error(`Character config not found: ${characterId}`);
            return null;
        }
        const characterEntity = new pc.Entity(characterId);
        characterEntity.setPosition(position);
        const character = {
            id: characterId,
            entity: characterEntity,
            config: config,
            health: config.stats.health,
            meter: 0,
            state: 'idle',
            currentMove: null,
            frameData: {
                startup: 0,
                active: 0,
                recovery: 0,
                advantage: 0
            }
        };
        this.characters.set(characterId, character);
        this.app.root.addChild(characterEntity);
        Logger.info(`Created character: ${characterId}`);
        return character;
    }
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }
    setActiveCharacters(player1Id, player2Id) {
        const p1 = this.characters.get(player1Id);
        const p2 = this.characters.get(player2Id);
        if (p1 && p2) {
            this.activeCharacters = [p1, p2];
            Logger.info(`Active characters set: ${player1Id} vs ${player2Id}`);
        }
    }
    getActiveCharacters() {
        return this.activeCharacters;
    }
    update(deltaTime) {
        for (const character of this.activeCharacters) {
            this.updateCharacterState(character, deltaTime);
        }
    }
    updateCharacterState(character, deltaTime) {
        // Update character animation, physics, and state
        // This will be expanded based on your specific needs
    }
    getAvailableCharacters() {
        return Array.from(this.characterConfigs.keys());
    }
}
//# sourceMappingURL=CharacterManager.js.map