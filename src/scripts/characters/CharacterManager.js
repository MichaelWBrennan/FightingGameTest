/**
 * CharacterManager - Character System for SF3:3S HD-2D Fighting Game
 * Handles character loading, animation, and state management
 * Features: Data-driven characters, SF3-style animation, HD-2D integration
 */
class CharacterManager {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        
        // Character registry
        this.characters = new Map();
        this.characterData = new Map();
        this.activeCharacters = new Map(); // player1, player2
        
        // Animation system
        this.animationSystem = {
            frameRate: 60,
            interpolation: true,
            blending: true,
            spriteSheets: new Map(),
            animations: new Map()
        };
        
        // SF3:3S character archetypes with balanced stats
        this.archetypeTemplates = {
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
        
        // Character state management
        this.characterStates = {
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
            super_move: { priority: 5, cancellable: false }
        };
        
        // Frame data for fighting game precision
        this.frameData = {
            hitstun: { light: 8, medium: 12, heavy: 16 },
            blockstun: { light: 4, medium: 6, heavy: 8 },
            recovery: { light: 6, medium: 10, heavy: 14 },
            startup: { light: 4, medium: 7, heavy: 12 }
        };
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
            
        } catch (error) {
            console.error('Failed to initialize Character Manager:', error);
            throw error;
        }
    }

    async loadCharacterData() {
        // Load character data from the migrated data files
        const characterFiles = [
            'ryu.json',
            'ken.json', 
            'chun_li.json',
            'zangief.json',
            'sagat.json',
            'lei_wulong.json'
        ];
        
        for (const filename of characterFiles) {
            try {
                const response = await fetch(`data/characters/${filename}`);
                if (response.ok) {
                    const characterData = await response.json();
                    this.characterData.set(characterData.characterId, characterData);
                    console.log(`Loaded character data: ${characterData.name}`);
                }
            } catch (error) {
                console.warn(`Failed to load character: ${filename}`, error);
            }
        }
        
        console.log(`Loaded ${this.characterData.size} characters`);
    }

    setupAnimationSystem() {
        // Configure animation system for SF3-style fluid motion
        this.animationSystem.frameTime = 1000 / this.animationSystem.frameRate;
        this.animationSystem.currentFrame = 0;
        
        // Setup sprite sheet management
        this.spriteSheetCache = new Map();
        
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
        // Setup physics properties for 2D fighting game
        this.physicsConfig = {
            gravity: -980, // pixels/second²
            groundFriction: 0.8,
            airFriction: 0.95,
            bounceThreshold: 100,
            maxFallSpeed: -600
        };
    }

    // Character creation and management
    createCharacter(characterId, playerId, position = new pc.Vec3(0, 0, 0)) {
        const characterData = this.characterData.get(characterId);
        if (!characterData) {
            console.error(`Character data not found: ${characterId}`);
            return null;
        }
        
        console.log(`Creating character: ${characterData.name} for ${playerId}`);
        
        // Create character entity
        const character = new pc.Entity(`${playerId}_${characterId}`);
        
        // Add character components
        this.addCharacterComponents(character, characterData, playerId);
        
        // Setup character graphics with SF3 + HD-2D style
        this.setupCharacterGraphics(character, characterData, playerId);
        
        // Initialize character state
        this.initializeCharacterState(character, characterData);
        
        // Position character
        character.setPosition(position);
        
        // Add to scene and track
        this.app.root.addChild(character);
        this.characters.set(character.getGuid(), character);
        this.activeCharacters.set(playerId, character);
        
        // Setup player-specific configuration
        this.setupPlayerConfiguration(character, playerId);
        
        return character;
    }

    addCharacterComponents(character, characterData, playerId) {
        // Add render component for sprite rendering
        character.addComponent('render', {
            type: 'plane',
            castShadows: false,
            receiveShadows: true
        });
        
        // Add collision component for hitboxes
        character.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.8, 1.8, 0.1) // Character collision box
        });
        
        // Add rigidbody for physics
        character.addComponent('rigidbody', {
            type: 'dynamic',
            mass: 70,
            linearDamping: 0.1,
            angularDamping: 0.9,
            linearFactor: new pc.Vec3(1, 1, 0), // Lock Z movement
            angularFactor: new pc.Vec3(0, 0, 0)  // Prevent rotation
        });
        
        // Add script component for character behavior
        character.addComponent('script');
    }

    setupCharacterGraphics(character, characterData, playerId) {
        // Get graphics managers
        const sf3Graphics = window.SF3HD2D.sf3Graphics;
        const hd2dRenderer = window.SF3HD2D.hd2dRenderer;
        
        if (sf3Graphics) {
            // Apply SF3 character graphics
            sf3Graphics.createCharacter(playerId, characterData);
        }
        
        if (hd2dRenderer) {
            // Add to appropriate HD-2D layer
            hd2dRenderer.addEntityToLayer(character, 'characters');
            
            // Create billboard sprite for 2D character in 3D space
            const spriteTexture = this.loadCharacterSprite(characterData);
            if (spriteTexture) {
                const billboardSprite = hd2dRenderer.createBillboardSprite(
                    spriteTexture,
                    character.getPosition(),
                    new pc.Vec2(2, 3) // Character size
                );
                
                character.addChild(billboardSprite);
            }
        }
        
        // Setup character-specific lighting
        this.setupCharacterLighting(character, playerId);
    }

    setupCharacterLighting(character, playerId) {
        // Player-specific lighting colors
        const lightColors = {
            player1: new pc.Color(1.0, 0.9, 0.7), // Warm
            player2: new pc.Color(0.7, 0.9, 1.0)  // Cool
        };
        
        const lightColor = lightColors[playerId] || new pc.Color(1, 1, 1);
        
        // Create character spotlight
        const characterLight = new pc.Entity(`${playerId}_light`);
        characterLight.addComponent('light', {
            type: pc.LIGHTTYPE_SPOT,
            color: lightColor,
            intensity: 1.5,
            range: 8,
            innerConeAngle: 40,
            outerConeAngle: 60,
            castShadows: true
        });
        
        characterLight.setPosition(0, 4, 2);
        characterLight.lookAt(character.getPosition());
        character.addChild(characterLight);
    }

    initializeCharacterState(character, characterData) {
        // Initialize character properties
        character.characterData = characterData;
        character.currentState = 'idle';
        character.previousState = 'idle';
        character.stateTimer = 0;
        character.frameCount = 0;
        
        // Health and meter
        character.health = characterData.health;
        character.maxHealth = characterData.health;
        character.meter = 0;
        character.maxMeter = 100;
        
        // Movement properties
        character.facing = 1; // 1 = right, -1 = left
        character.velocity = new pc.Vec3();
        character.grounded = true;
        
        // Combat properties
        character.hitboxes = [];
        character.hurtboxes = [];
        character.invulnerable = false;
        character.comboCount = 0;
        character.comboDamage = 0;
        
        // Animation properties
        character.currentAnimation = 'idle';
        character.animationFrame = 0;
        character.animationTimer = 0;
        character.animationSpeed = 1.0;
        
        console.log(`Character state initialized: ${characterData.name}`);
    }

    setupPlayerConfiguration(character, playerId) {
        // Player-specific configurations
        const playerConfigs = {
            player1: {
                startPosition: new pc.Vec3(-3, 0, 0),
                facing: 1,
                inputPrefix: 'p1_',
                uiSide: 'left'
            },
            player2: {
                startPosition: new pc.Vec3(3, 0, 0),
                facing: -1,
                inputPrefix: 'p2_',
                uiSide: 'right'
            }
        };
        
        const config = playerConfigs[playerId];
        if (config) {
            character.setPosition(config.startPosition);
            character.facing = config.facing;
            character.inputPrefix = config.inputPrefix;
            character.uiSide = config.uiSide;
            
            // Flip sprite for player 2
            if (config.facing === -1) {
                character.setLocalScale(-1, 1, 1);
            }
        }
    }

    loadCharacterSprite(characterData) {
        // Load character sprite texture
        // This would typically load from the assets/sprites directory
        const spritePath = `assets/sprites/sf3_third_strike/${characterData.characterId}/idle.png`;
        
        // Create placeholder texture for now
        const device = this.app.graphicsDevice;
        const texture = new pc.Texture(device, {
            width: 64,
            height: 96,
            format: pc.PIXELFORMAT_R8_G8_B8_A8
        });
        
        return texture;
    }

    // Character state management
    setCharacterState(character, newState, force = false) {
        if (!character || !this.characterStates[newState]) return false;
        
        const currentStateData = this.characterStates[character.currentState];
        const newStateData = this.characterStates[newState];
        
        // Check if state change is allowed
        if (!force && newStateData.priority < currentStateData.priority) {
            return false; // Cannot interrupt higher priority state
        }
        
        if (!force && !currentStateData.cancellable) {
            return false; // Current state cannot be cancelled
        }
        
        // Change state
        character.previousState = character.currentState;
        character.currentState = newState;
        character.stateTimer = 0;
        
        // Trigger state change event
        this.app.fire('character:statechange', {
            character: character,
            oldState: character.previousState,
            newState: newState
        });
        
        console.log(`${character.name} state: ${character.previousState} -> ${newState}`);
        return true;
    }

    updateCharacterAnimation(character, animationName, loop = true) {
        if (character.currentAnimation === animationName) return;
        
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
    moveCharacter(character, direction, speed = null) {
        if (!character || character.currentState === 'hitstun' || character.currentState === 'knocked_down') {
            return;
        }
        
        const moveSpeed = speed || character.characterData.walkSpeed;
        const movement = direction * moveSpeed * (1/60); // Convert to per-frame movement
        
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
        } else if (character.currentState === 'walking') {
            this.setCharacterState(character, 'idle');
            this.updateCharacterAnimation(character, 'idle');
        }
    }

    jumpCharacter(character) {
        if (!character || !character.grounded) return;
        
        this.setCharacterState(character, 'jumping');
        this.updateCharacterAnimation(character, 'jump');
        
        // Apply jump velocity
        const jumpHeight = character.characterData.jumpHeight;
        character.rigidbody.linearVelocity = new pc.Vec3(
            character.rigidbody.linearVelocity.x,
            jumpHeight / 60, // Convert to per-frame velocity
            0
        );
        
        character.grounded = false;
    }

    // Combat methods
    performAttack(character, attackType) {
        if (!character || character.currentState === 'hitstun' || character.currentState === 'knocked_down') {
            return false;
        }
        
        this.setCharacterState(character, 'attacking');
        this.updateCharacterAnimation(character, attackType);
        
        // Get attack data
        const attackData = this.getAttackData(character.characterData, attackType);
        if (attackData) {
            // Create hitbox
            this.createHitbox(character, attackData);
            
            // Trigger attack event
            this.app.fire('character:attack', {
                character: character,
                attackType: attackType,
                attackData: attackData
            });
        }
        
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
        hitbox.setPosition(hitboxPos);
        
        // Add hitbox data
        hitbox.attackData = attackData;
        hitbox.owner = character;
        hitbox.lifetime = attackData.active || 4; // frames
        
        this.app.root.addChild(hitbox);
        character.hitboxes.push(hitbox);
        
        // Remove hitbox after active frames
        setTimeout(() => {
            if (hitbox.parent) {
                hitbox.destroy();
            }
            const index = character.hitboxes.indexOf(hitbox);
            if (index > -1) {
                character.hitboxes.splice(index, 1);
            }
        }, hitbox.lifetime * (1000/60));
    }

    // Update methods
    update(dt) {
        if (!this.initialized) return;
        
        // Update all active characters
        this.characters.forEach(character => {
            this.updateCharacter(character, dt);
        });
        
        // Update animation system
        this.updateAnimationSystem(dt);
    }

    updateCharacter(character, dt) {
        // Update state timer
        character.stateTimer += dt;
        character.frameCount++;
        
        // Update animation
        this.updateCharacterAnimationFrame(character, dt);
        
        // Update physics
        this.updateCharacterPhysics(character, dt);
        
        // Update state-specific behavior
        this.updateCharacterStateBehavior(character, dt);
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
                } else {
                    character.animationFrame = character.animationFrameCount - 1;
                }
            }
        }
    }

    updateCharacterPhysics(character, dt) {
        // Apply gravity if not grounded
        if (!character.grounded) {
            const gravity = this.physicsConfig.gravity * dt;
            const velocity = character.rigidbody.linearVelocity;
            character.rigidbody.linearVelocity = new pc.Vec3(
                velocity.x * this.physicsConfig.airFriction,
                Math.max(velocity.y + gravity, this.physicsConfig.maxFallSpeed),
                0
            );
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
            character.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
            character.grounded = true;
            
            if (character.currentState === 'jumping') {
                this.setCharacterState(character, 'idle');
                this.updateCharacterAnimation(character, 'idle');
            }
        }
    }

    updateCharacterStateBehavior(character, dt) {
        // State-specific updates
        switch (character.currentState) {
            case 'hitstun':
                // Auto-recovery after hitstun duration
                if (character.stateTimer > (character.hitstunDuration || 0.2)) {
                    this.setCharacterState(character, 'idle');
                    this.updateCharacterAnimation(character, 'idle');
                }
                break;
                
            case 'blockstun':
                // Auto-recovery after blockstun duration
                if (character.stateTimer > (character.blockstunDuration || 0.1)) {
                    this.setCharacterState(character, 'idle');
                    this.updateCharacterAnimation(character, 'idle');
                }
                break;
                
            case 'attacking':
                // Return to idle after attack recovery
                const attackData = character.currentAttackData;
                if (attackData && character.stateTimer > (attackData.recovery / 60)) {
                    this.setCharacterState(character, 'idle');
                    this.updateCharacterAnimation(character, 'idle');
                }
                break;
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

    getCharacterData(characterId) {
        return this.characterData.get(characterId);
    }

    getAvailableCharacters() {
        return Array.from(this.characterData.keys());
    }

    // Cleanup
    destroy() {
        this.characters.forEach(character => {
            if (character.parent) {
                character.destroy();
            }
        });
        
        this.characters.clear();
        this.activeCharacters.clear();
        this.characterData.clear();
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterManager;
}