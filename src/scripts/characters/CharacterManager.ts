/**
 * CharacterManager - Character System for SF3:3S HD-2D Fighting Game
 * Handles character loading, animation, and state management
 * Features: Data-driven characters, SF3-style animation, HD-2D integration
 */

import { type ISystem } from '../../../types/core.js';
import {
    type CharacterData,
    type CharacterEntity,
    type CharacterState,
    type CharacterStates,
    type ArchetypeTemplates,
    type AnimationSystem,
    type AnimationData,
    type FrameData,
    type PhysicsConfig,
    type PlayerConfigs,
    type AttackData,
    type AttackType,
    type Direction,
    type PlayerId,
    type CharacterStateChangeEvent,
    type CharacterAttackEvent,
    isValidCharacterState,
    DEFAULT_ARCHETYPE_TEMPLATES,
    DEFAULT_CHARACTER_STATES,
    DEFAULT_FRAME_DATA
} from '../../../types/character.js';

export class CharacterManager implements ISystem {
    private readonly app: pc.Application;
    private initialized: boolean = false;
    
    // Character registry
    private readonly characters: Map<string, CharacterEntity> = new Map();
    private readonly characterData: Map<string, CharacterData> = new Map();
    private readonly characterVariations: Map<string, any> = new Map();
    private readonly activeCharacters: Map<string, CharacterEntity> = new Map(); // player1, player2
    
    // Animation system
    private readonly animationSystem: AnimationSystem = {
        frameRate: 60,
        frameTime: 1000 / 60,
        currentFrame: 0,
        interpolation: true,
        blending: true,
        spriteSheets: new Map(),
        animations: new Map()
    };
    
    // SF3:3S character archetypes with balanced stats
    private readonly archetypeTemplates: ArchetypeTemplates = { ...DEFAULT_ARCHETYPE_TEMPLATES };
    
    // Character state management
    private readonly characterStates: CharacterStates = { ...DEFAULT_CHARACTER_STATES };
    
    // Frame data for fighting game precision
    private readonly frameData: FrameData = { ...DEFAULT_FRAME_DATA };
    
    // Physics configuration
    private readonly physicsConfig: PhysicsConfig = {
        gravity: -980, // pixels/second²
        groundFriction: 0.8,
        airFriction: 0.95,
        bounceThreshold: 100,
        maxFallSpeed: -600
    };
    
    // Sprite sheet cache
    private readonly spriteSheetCache: Map<string, any> = new Map();

    constructor(app: pc.Application) {
        this.app = app;
    }

    public async initialize(): Promise<void> {
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

    private async loadCharacterData(): Promise<void> {
        const characterIds = [
            'blitz', 'chain', 'crusher', 'maestro', 'ranger', 'shifter',
            'sky', 'titan', 'vanguard', 'volt', 'weaver', 'zephyr'
        ];

        for (const id of characterIds) {
            try {
                // Load base character data
                const baseResponse = await fetch(`characters/data/${id}.base.json`);
                if (baseResponse.ok) {
                    const baseData: CharacterData = await baseResponse.json();
                    this.characterData.set(id, baseData);
                    console.log(`Loaded base character: ${baseData.displayName}`);
                } else {
                    console.warn(`Failed to load base character data for: ${id}`);
                    continue;
                }

                // Load character variations
                const variationsResponse = await fetch(`characters/data/${id}.variations.json`);
                if (variationsResponse.ok) {
                    const variationsData = await variationsResponse.json();
                    this.characterVariations.set(id, variationsData.variations);
                    console.log(`Loaded ${variationsData.variations.length} variations for ${id}`);
                }
            } catch (error) {
                console.error(`Error loading character ${id}:`, error);
            }
        }

        console.log(`Loaded ${this.characterData.size} characters and their variations.`);
    }

    private setupAnimationSystem(): void {
        // Configure animation system for SF3-style fluid motion
        this.animationSystem.frameTime = 1000 / this.animationSystem.frameRate;
        this.animationSystem.currentFrame = 0;
        
        console.log('Animation system configured for SF3-style animation');
    }

    private initializeCharacterTemplates(): void {
        // Apply archetype templates to loaded character data
        this.characterData.forEach((data: CharacterData, characterId: string) => {
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

    private setupCharacterPhysics(): void {
        // Physics configuration is already set in constructor
        console.log('Character physics configured');
    }

    // Character creation and management
    public createCharacter(characterId: string, playerId: string, position: pc.Vec3 = new pc.Vec3(0, 0, 0), characterDataOverride: CharacterData | null = null): CharacterEntity | null {
        const characterData = characterDataOverride || this.characterData.get(characterId);
        if (!characterData) {
            console.error(`Character data not found: ${characterId}`);
            return null;
        }
        
        console.log(`Creating character: ${characterData.name} for ${playerId}`);
        
        // Create character entity
        const character = new pc.Entity(`${playerId}_${characterId}`) as CharacterEntity;
        
        // Add character components
        this.addCharacterComponents(character, characterData, playerId);
        
        // Setup character graphics with SF3 + HD-2D style
        this.setupCharacterGraphics(character, characterData, playerId);
        
        // Initialize character state
        this.initializeCharacterState(character, characterData);
        
        // Position character
        character.setPosition(position.x, position.y, position.z);
        
        // Add to scene and track
        this.app.root.addChild(character);
        this.characters.set(character.getGuid(), character);
        this.activeCharacters.set(playerId, character);
        
        // Setup player-specific configuration
        this.setupPlayerConfiguration(character, playerId);
        
        return character;
    }

    private addCharacterComponents(character: CharacterEntity, characterData: CharacterData, playerId: string): void {
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

    private setupCharacterGraphics(character: CharacterEntity, characterData: CharacterData, playerId: string): void {
        // Add the SpriteRendererHD2D component to handle rendering
        character.addComponent('script');
        const spriteRenderer = character.script.create('spriteRendererHD2D', {
            attributes: {
                layerName: 'characters'
            }
        });

        // Load the sprite texture and assign it to the renderer
        // Note: In a real project, asset loading would be more robust.
        const spriteAsset = this.app.assets.find(characterData.spritePath, 'texture');
        if (spriteAsset) {
            spriteRenderer.spriteAsset = spriteAsset.id;
        } else {
            console.warn(`Sprite asset not found for: ${characterData.spritePath}`);
            // You might want to load a placeholder sprite here
        }
        
        // Setup character-specific lighting
        this.setupCharacterLighting(character, playerId);
    }

    private setupCharacterLighting(character: CharacterEntity, playerId: string): void {
        // Player-specific lighting colors
        const lightColors: Record<string, pc.Color> = {
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

    private initializeCharacterState(character: CharacterEntity, characterData: CharacterData): void {
        // Initialize character properties
        character.characterData = characterData;
        character.playerId = '';
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

    private setupPlayerConfiguration(character: CharacterEntity, playerId: string): void {
        // Player-specific configurations
        const playerConfigs: PlayerConfigs = {
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
            character.setPosition(config.startPosition.x, config.startPosition.y, config.startPosition.z);
            character.facing = config.facing;
            character.inputPrefix = config.inputPrefix;
            character.uiSide = config.uiSide;
            character.playerId = playerId;
            
            // Flip sprite for player 2
            if (config.facing === -1) {
                character.setLocalScale(-1, 1, 1);
            }
        }
    }

    private loadCharacterSprite(characterData: CharacterData): pc.Texture | null {
        // Load character sprite texture
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
    public setCharacterState(character: CharacterEntity, newState: CharacterState, force: boolean = false): boolean {
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
        const event: CharacterStateChangeEvent = {
            character: character,
            oldState: character.previousState,
            newState: newState
        };
        this.app.fire('character:statechange', event);
        
        console.log(`${character.name || 'Character'} state: ${character.previousState} -> ${newState}`);
        return true;
    }

    public updateCharacterAnimation(character: CharacterEntity, animationName: string, loop: boolean = true): void {
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

    private getAnimationData(characterData: CharacterData, animationName: string): AnimationData {
        // Get animation data from character definition
        const animations = characterData.animations || {};
        return animations[animationName] || {
            frameCount: 1,
            duration: 100,
            loop: true
        };
    }

    // Character control methods
    public moveCharacter(character: CharacterEntity, direction: Direction, speed?: number): void {
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

    public jumpCharacter(character: CharacterEntity): void {
        if (!character || !character.grounded) return;
        
        this.setCharacterState(character, 'jumping');
        this.updateCharacterAnimation(character, 'jump');
        
        // Apply jump velocity
        const jumpHeight = character.characterData.jumpHeight;
        const rigidbody = character.rigidbody;
        if (rigidbody) {
            rigidbody.linearVelocity = new pc.Vec3(
                rigidbody.linearVelocity.x,
                jumpHeight / 60, // Convert to per-frame velocity
                0
            );
        }
        
        character.grounded = false;
    }

    // Combat methods
    public performAttack(character: CharacterEntity, attackType: string): boolean {
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
            
            // Store attack data on character
            character.currentAttackData = attackData;
            
            // Trigger attack event
            const event: CharacterAttackEvent = {
                character: character,
                attackType: attackType,
                attackData: attackData
            };
            this.app.fire('character:attack', event);
        }
        
        return true;
    }

    private getAttackData(characterData: CharacterData, attackType: string): AttackData {
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

    private createHitbox(character: CharacterEntity, attackData: AttackData): void {
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
        (hitbox as any).attackData = attackData;
        (hitbox as any).owner = character;
        (hitbox as any).lifetime = attackData.active || 4; // frames
        
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
        }, lifetime * (1000/60));
    }

    public createCharacterWithVariation(characterId: string, variationId: string, playerId: string, position: pc.Vec3 = new pc.Vec3(0, 0, 0)): CharacterEntity | null {
        const baseData = this.characterData.get(characterId);
        const variations = this.characterVariations.get(characterId);

        if (!baseData || !variations) {
            console.error(`Character or variation data not found for: ${characterId}`);
            return null;
        }

        const variationData = variations.find((v: any) => v.id === variationId);
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

    private applyVariation(baseData: CharacterData, variationData: any): CharacterData {
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
                } else {
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

    private setObjectValueByPath(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            if (current === undefined) return; // Path does not exist
        }
        current[keys[keys.length - 1]] = value;
    }

    private deleteObjectValueByPath(obj: any, path: string): void {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            if (current === undefined) return; // Path does not exist
        }
        delete current[keys[keys.length - 1]];
    }

    // Update methods
    public update(dt: number): void {
        if (!this.initialized) return;
        
        // Update all active characters
        this.characters.forEach((character: CharacterEntity) => {
            this.updateCharacter(character, dt);
        });
        
        // Update animation system
        this.updateAnimationSystem(dt);
    }

    private updateCharacter(character: CharacterEntity, dt: number): void {
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

    private updateCharacterAnimationFrame(character: CharacterEntity, dt: number): void {
        character.animationTimer += dt * 1000; // Convert to milliseconds
        
        if (character.animationTimer >= this.animationSystem.frameTime) {
            character.animationFrame++;
            character.animationTimer = 0;
            
            // Handle animation looping
            if (character.animationFrame >= (character.animationFrameCount || 1)) {
                if (character.animationLoop) {
                    character.animationFrame = 0;
                } else {
                    character.animationFrame = character.animationFrameCount! - 1;
                }
            }
        }
    }

    private updateCharacterPhysics(character: CharacterEntity, dt: number): void {
        const rigidbody = character.rigidbody;
        if (!rigidbody) return;
        
        // Apply gravity if not grounded
        if (!character.grounded) {
            const gravity = this.physicsConfig.gravity * dt;
            const velocity = rigidbody.linearVelocity;
            rigidbody.linearVelocity = new pc.Vec3(
                velocity.x * this.physicsConfig.airFriction,
                Math.max(velocity.y + gravity, this.physicsConfig.maxFallSpeed),
                0
            );
        }
        
        // Check ground collision
        this.checkGroundCollision(character);
    }

    private checkGroundCollision(character: CharacterEntity): void {
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

    private updateCharacterStateBehavior(character: CharacterEntity, dt: number): void {
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
                
            default:
                // Handle other states or no special behavior
                break;
        }
    }

    private updateAnimationSystem(dt: number): void {
        // Global animation system updates
        this.animationSystem.currentFrame++;
    }

    // Public API
    public getCharacter(playerId: string): CharacterEntity | undefined {
        return this.activeCharacters.get(playerId);
    }

    public getCharacterVariations(characterId: string): any[] | undefined {
        return this.characterVariations.get(characterId);
    }

    public getCharacterData(characterId: string): CharacterData | undefined {
        return this.characterData.get(characterId);
    }

    public getAvailableCharacters(): string[] {
        return Array.from(this.characterData.keys());
    }

    public getAllCharacters(): CharacterEntity[] {
        return Array.from(this.characters.values());
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    // Type guards and validation
    private isValidPlayerId(playerId: string): playerId is PlayerId {
        return playerId === 'player1' || playerId === 'player2';
    }

    // Cleanup
    public destroy(): void {
        this.characters.forEach((character: CharacterEntity) => {
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