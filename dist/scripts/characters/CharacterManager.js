import * as pc from 'playcanvas';
import { DEFAULT_ARCHETYPE_TEMPLATES, DEFAULT_CHARACTER_STATES } from '../../../types/character';
import { CharacterFactory } from './CharacterFactory';
import { CharacterStateMachine } from './CharacterStateMachine';
export class CharacterManager {
    constructor(app) {
        this.initialized = false;
        // Character registry
        this.characters = new Map();
        this.characterData = new Map();
        this.characterVariations = new Map();
        this.activeCharacters = new Map(); // player1, player2
        this.stateMachines = new Map();
        // Animation system
        this.animationSystem = {
            frameRate: 60,
            frameTime: 1000 / 60,
            currentFrame: 0,
            interpolation: true,
            blending: true,
            spriteSheets: new Map(),
            animations: new Map()
        };
        // SF3:3S character archetypes with balanced stats
        this.archetypeTemplates = { ...DEFAULT_ARCHETYPE_TEMPLATES };
        // Character state management
        this.characterStates = { ...DEFAULT_CHARACTER_STATES };
        // Physics configuration
        this.physicsConfig = {
            gravity: -980, // pixels/second²
            groundFriction: 0.8,
            airFriction: 0.95,
            bounceThreshold: 100,
            maxFallSpeed: -600
        };
        this.app = app;
        this.factory = new CharacterFactory(app);
    }
    async initialize() {
        console.log('Initializing Character Manager...');
        try {
            // Load character data from original data files
            await this.loadCharacterData();
            // Setup animation system
            this.setupAnimationSystem();
            // Initialize character templates
            this.initializeCharacterTemplates();
            // Setup character physics
            this.setupCharacterPhysics();
            this.initialized = true;
            console.log('Character Manager initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Character Manager:', error);
            throw error;
        }
    }
    async loadCharacterData() {
        const characterIds = [
            'blitz', 'chain', 'crusher', 'maestro', 'ranger', 'shifter',
            'sky', 'titan', 'vanguard', 'volt', 'weaver', 'zephyr'
        ];
        for (const id of characterIds) {
            try {
                // Load base character data
                const baseResponse = await fetch(`assets/data/characters/${id}.base.json`);
                if (baseResponse.ok) {
                    const baseData = await baseResponse.json();
                    this.characterData.set(id, baseData);
                    console.log(`Loaded base character: ${baseData.displayName}`);
                }
                else {
                    console.warn(`Failed to load base character data for: ${id}`);
                    continue;
                }
                // Load character variations
                const variationsResponse = await fetch(`assets/data/characters/${id}.variations.json`);
                if (variationsResponse.ok) {
                    const variationsData = await variationsResponse.json();
                    this.characterVariations.set(id, variationsData.variations);
                    console.log(`Loaded ${variationsData.variations.length} variations for ${id}`);
                }
            }
            catch (error) {
                console.error(`Error loading character ${id}:`, error);
            }
        }
        console.log(`Loaded ${this.characterData.size} characters and their variations.`);
    }
    setupAnimationSystem() {
        // Configure animation system for SF3-style fluid motion
        this.animationSystem.frameTime = 1000 / this.animationSystem.frameRate;
        this.animationSystem.currentFrame = 0;
        console.log('Animation system configured for SF3-style animation');
    }
    initializeCharacterTemplates() {
        // Apply archetype templates to loaded character data
        this.characterData.forEach((data, characterId) => {
            const archetype = this.archetypeTemplates[data.archetype];
            if (archetype) {
                // Merge archetype template with character-specific data
                Object.assign(data, {
                    ...archetype,
                    ...data // Character-specific overrides
                });
            }
        });
    }
    setupCharacterPhysics() {
        // Physics configuration is already set in constructor
        console.log('Character physics configured');
    }
    // Character creation and management
    createCharacter(characterId, playerId, position = new pc.Vec3(0, 0, 0), characterDataOverride = null) {
        const characterData = characterDataOverride || this.characterData.get(characterId);
        if (!characterData) {
            console.error(`Character data not found: ${characterId}`);
            return null;
        }
        const character = this.factory.createCharacter(characterData, playerId, position);
        this.characters.set(character.getGuid(), character);
        this.activeCharacters.set(playerId, character);
        const stateMachine = new CharacterStateMachine(character, this.characterStates);
        this.stateMachines.set(character.getGuid(), stateMachine);
        return character;
    }
    // Character state management
    setCharacterState(character, newState, force = false) {
        const stateMachine = this.stateMachines.get(character.getGuid());
        if (stateMachine) {
            return stateMachine.setState(newState, force);
        }
        return false;
    }
    updateCharacterAnimation(character, animationName, loop = true) {
        if (character.currentAnimation === animationName)
            return;
        character.currentAnimation = animationName;
        character.animationFrame = 0;
        character.animationTimer = 0;
        // Get animation data
        const animationData = this.getAnimationData(character.characterData, animationName);
        if (animationData) {
            character.animationFrameCount = animationData.frameCount;
            character.animationDuration = animationData.duration;
            character.animationLoop = loop;
        }
    }
    getAnimationData(characterData, animationName) {
        // Get animation data from character definition
        const animations = characterData.animations || {};
        return animations[animationName] || {
            frameCount: 1,
            duration: 100,
            loop: true
        };
    }
    // Character control methods
    moveCharacter(character, direction, speed) {
        if (!character || character.currentState === 'hitstun' || character.currentState === 'knocked_down') {
            return;
        }
        const moveSpeed = speed || character.characterData.walkSpeed;
        const movement = direction * moveSpeed * (1 / 60); // Convert to per-frame movement
        // Update character position
        const currentPos = character.getPosition();
        character.setPosition(currentPos.x + movement, currentPos.y, currentPos.z);
        // Update facing direction
        if (direction !== 0) {
            character.facing = direction > 0 ? 1 : -1;
            character.setLocalScale(character.facing, 1, 1);
        }
        // Update animation
        if (Math.abs(direction) > 0) {
            this.setCharacterState(character, 'walking');
            this.updateCharacterAnimation(character, 'walk');
        }
        else if (character.currentState === 'walking') {
            this.setCharacterState(character, 'idle');
            this.updateCharacterAnimation(character, 'idle');
        }
    }
    jumpCharacter(character) {
        if (!character || !character.grounded)
            return;
        this.setCharacterState(character, 'jumping');
        this.updateCharacterAnimation(character, 'jump');
        // Apply jump velocity
        const jumpHeight = character.characterData.jumpHeight;
        const rigidbody = character.rigidbody;
        if (rigidbody) {
            rigidbody.linearVelocity = new pc.Vec3(rigidbody.linearVelocity.x, jumpHeight / 60, // Convert to per-frame velocity
            0);
        }
        character.grounded = false;
    }
    // Combat methods
    performAttack(character, attackType, isEx = false) {
        if (!character || character.currentState === 'hitstun' || character.currentState === 'knocked_down') {
            return false;
        }
        const attackData = this.getAttackData(character.characterData, attackType);
        if (!attackData)
            return false;
        if (isEx) {
            if (!attackData.ex) {
                console.warn(`Attack ${attackType} has no EX version.`);
                return false;
            }
            if (character.meter < (attackData.meterCost || 50)) {
                console.log('Not enough meter for EX move.');
                return false;
            }
            character.meter -= attackData.meterCost || 50;
            console.log(`${character.name} performed an EX attack!`);
        }
        this.setCharacterState(character, 'attacking');
        this.updateCharacterAnimation(character, attackType);
        // Create hitbox
        this.createHitbox(character, attackData);
        // Store attack data on character
        character.currentAttackData = attackData;
        // Trigger attack event
        const event = {
            character: character,
            attackType: attackType,
            attackData: attackData
        };
        this.app.fire('character:attack', event);
        return true;
    }
    getAttackData(characterData, attackType) {
        const moves = characterData.moves || {};
        return moves[attackType] || {
            damage: 100,
            startup: 8,
            active: 4,
            recovery: 12,
            blockAdvantage: -2,
            hitAdvantage: 3
        };
    }
    createHitbox(character, attackData) {
        // Create temporary hitbox entity
        const hitbox = new pc.Entity('hitbox');
        hitbox.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(1.5, 1.0, 0.2),
            trigger: true
        });
        // Position hitbox relative to character
        const hitboxPos = character.getPosition().clone();
        hitboxPos.x += character.facing * 1.5; // In front of character
        hitbox.setPosition(hitboxPos.x, hitboxPos.y, hitboxPos.z);
        // Add hitbox data
        hitbox.attackData = attackData;
        hitbox.owner = character;
        hitbox.lifetime = attackData.active || 4; // frames
        this.app.root.addChild(hitbox);
        character.hitboxes.push(hitbox);
        // Remove hitbox after active frames
        const lifetime = attackData.active || 4;
        setTimeout(() => {
            if (hitbox.parent) {
                hitbox.destroy();
            }
            const index = character.hitboxes.indexOf(hitbox);
            if (index > -1) {
                character.hitboxes.splice(index, 1);
            }
        }, lifetime * (1000 / 60));
    }
    createCharacterWithVariation(characterId, variationId, playerId, position = new pc.Vec3(0, 0, 0)) {
        const baseData = this.characterData.get(characterId);
        const variations = this.characterVariations.get(characterId);
        if (!baseData || !variations) {
            console.error(`Character or variation data not found for: ${characterId}`);
            return null;
        }
        const variationData = variations.find((v) => v.id === variationId);
        if (!variationData) {
            console.error(`Variation not found: ${variationId}`);
            return null;
        }
        console.log(`Creating character ${characterId} with variation ${variationId} for ${playerId}`);
        // Apply the variation to the base data
        const finalData = this.applyVariation(baseData, variationData);
        // Create the character using the modified data
        return this.createCharacter(characterId, playerId, position, finalData);
    }
    applyVariation(baseData, variationData) {
        // Deep clone base data to avoid modifying the original
        const finalData = JSON.parse(JSON.stringify(baseData));
        // Apply modifications
        if (variationData.mods) {
            for (const path in variationData.mods) {
                this.setObjectValueByPath(finalData, path, variationData.mods[path]);
            }
        }
        // Apply additions
        if (variationData.adds) {
            for (const key in variationData.adds) {
                if (finalData[key]) {
                    Object.assign(finalData[key], variationData.adds[key]);
                }
                else {
                    finalData[key] = variationData.adds[key];
                }
            }
        }
        // Apply removals
        if (variationData.removes) {
            for (const path of variationData.removes) {
                this.deleteObjectValueByPath(finalData, path);
            }
        }
        // Update display name
        finalData.displayName = `${baseData.displayName} (${variationData.name})`;
        return finalData;
    }
    setObjectValueByPath(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            if (current === undefined)
                return; // Path does not exist
        }
        current[keys[keys.length - 1]] = value;
    }
    deleteObjectValueByPath(obj, path) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            if (current === undefined)
                return; // Path does not exist
        }
        delete current[keys[keys.length - 1]];
    }
    // Update methods
    update(dt) {
        if (!this.initialized)
            return;
        // Update all active characters
        this.characters.forEach((character) => {
            this.updateCharacter(character, dt);
        });
        // Update animation system
        this.updateAnimationSystem(dt);
    }
    updateCharacter(character, dt) {
        // Update state timer
        character.frameCount++;
        // Update animation
        this.updateCharacterAnimationFrame(character, dt);
        // Update physics
        this.updateCharacterPhysics(character, dt);
        // Update state-specific behavior
        const stateMachine = this.stateMachines.get(character.getGuid());
        if (stateMachine) {
            stateMachine.update(dt);
        }
    }
    updateCharacterAnimationFrame(character, dt) {
        character.animationTimer += dt * 1000; // Convert to milliseconds
        if (character.animationTimer >= this.animationSystem.frameTime) {
            character.animationFrame++;
            character.animationTimer = 0;
            // Handle animation looping
            if (character.animationFrame >= (character.animationFrameCount || 1)) {
                if (character.animationLoop) {
                    character.animationFrame = 0;
                }
                else {
                    character.animationFrame = character.animationFrameCount - 1;
                }
            }
        }
    }
    updateCharacterPhysics(character, dt) {
        const rigidbody = character.rigidbody;
        if (!rigidbody)
            return;
        // Apply gravity if not grounded
        if (!character.grounded) {
            const gravity = this.physicsConfig.gravity * dt;
            const velocity = rigidbody.linearVelocity;
            rigidbody.linearVelocity = new pc.Vec3(velocity.x * this.physicsConfig.airFriction, Math.max(velocity.y + gravity, this.physicsConfig.maxFallSpeed), 0);
        }
        // Check ground collision
        this.checkGroundCollision(character);
    }
    checkGroundCollision(character) {
        const position = character.getPosition();
        const groundY = -5; // Ground level
        if (position.y <= groundY && !character.grounded) {
            // Land on ground
            character.setPosition(position.x, groundY, position.z);
            const rigidbody = character.rigidbody;
            if (rigidbody) {
                rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
            }
            character.grounded = true;
            if (character.currentState === 'jumping') {
                this.setCharacterState(character, 'idle');
                this.updateCharacterAnimation(character, 'idle');
            }
        }
    }
    updateAnimationSystem(dt) {
        // Global animation system updates
        this.animationSystem.currentFrame++;
    }
    // Public API
    getCharacter(playerId) {
        return this.activeCharacters.get(playerId);
    }
    getOpponent(character) {
        const opponentPlayerId = character.playerId === 'player1' ? 'player2' : 'player1';
        return this.activeCharacters.get(opponentPlayerId);
    }
    getCharacterVariations(characterId) {
        return this.characterVariations.get(characterId);
    }
    getCharacterData(characterId) {
        return this.characterData.get(characterId);
    }
    getAvailableCharacters() {
        return Array.from(this.characterData.keys());
    }
    getAllCharacters() {
        return Array.from(this.characters.values());
    }
    isInitialized() {
        return this.initialized;
    }
    // Type guards and validation
    isValidPlayerId(playerId) {
        return playerId === 'player1' || playerId === 'player2';
    }
    // Cleanup
    destroy() {
        this.characters.forEach((character) => {
            if (character.parent) {
                character.destroy();
            }
        });
        this.characters.clear();
        this.activeCharacters.clear();
        this.characterData.clear();
        this.spriteSheetCache.clear();
        console.log('Character Manager destroyed');
    }
}
//# sourceMappingURL=CharacterManager.js.map