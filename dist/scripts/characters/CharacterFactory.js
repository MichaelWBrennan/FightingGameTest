import * as pc from 'playcanvas';
import { CharacterEntity } from './CharacterEntity';
export class CharacterFactory {
    constructor(app) {
        this.app = app;
    }
    createCharacter(characterData, playerId, position) {
        const character = new CharacterEntity(`${playerId}_${characterData.characterId}`);
        this.addCharacterComponents(character, characterData, playerId);
        this.setupCharacterGraphics(character, characterData, playerId);
        this.initializeCharacterState(character, characterData, playerId, position);
        this.app.root.addChild(character);
        return character;
    }
    addCharacterComponents(character, characterData, playerId) {
        character.addComponent('render', {
            type: 'plane',
            castShadows: false,
            receiveShadows: true
        });
        character.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.8, 1.8, 0.1)
        });
        character.addComponent('rigidbody', {
            type: 'dynamic',
            mass: 70,
            linearDamping: 0.1,
            angularDamping: 0.9,
            linearFactor: new pc.Vec3(1, 1, 0),
            angularFactor: new pc.Vec3(0, 0, 0)
        });
        character.addComponent('script');
    }
    setupCharacterGraphics(character, characterData, playerId) {
        character.addComponent('script');
        const spriteRenderer = character.script.create('spriteRendererHD2D', {
            attributes: {
                layerName: 'characters'
            }
        });
        const spriteAsset = this.app.assets.find(characterData.spritePath, 'texture');
        if (spriteAsset) {
            spriteRenderer.spriteAsset = spriteAsset.id;
        }
    }
    initializeCharacterState(character, characterData, playerId, position) {
        character.characterData = characterData;
        character.playerId = playerId;
        character.health = characterData.health;
        character.maxHealth = characterData.health;
        character.setPosition(position);
        const playerConfigs = {
            player1: { facing: 1, uiSide: 'left' },
            player2: { facing: -1, uiSide: 'right' }
        };
        const config = playerConfigs[playerId];
        if (config) {
            character.facing = config.facing;
            character.uiSide = config.uiSide;
            if (config.facing === -1) {
                character.setLocalScale(-1, 1, 1);
            }
        }
    }
}
//# sourceMappingURL=CharacterFactory.js.map