/**
 * CombatSystem - Frame-accurate SF3:3S Combat System
 * Handles hit detection, damage calculation, special moves, and parry system
 * Features: Frame-perfect timing, SF3 parry system, HD-2D visual effects
 */

import { type ISystem, type Character, type AttackData } from '../../../types/core.js';
import {
    type CombatSystemConfig,
    type PlayerCombatData,
    type SpecialMoveData,
    type HitboxData,
    type HurtboxData,
    type CollisionBounds,
    type ParryResult,
    type ParryType,
    type ComboSystemState,
    type VisualEffectsState,
    type GraphicsSystemIntegration,
    type CollisionSystemState,
    type DebugMaterials,
    type DamageType,
    type DamageInfo,
    type HitEffectConfig,
    type CombatHitEvent,
    type CombatBlockEvent,
    type CombatParryEvent,
    type CombatDamageEvent,
    type CombatComboEvent,
    type CombatSpecialMoveEvent,
    type CombatKOEvent,
    DEFAULT_COMBAT_CONFIG,
    isValidCombatState,
    isValidDamageType,
    isValidParryType
} from '../../../types/combat.js';

export class CombatSystem implements ISystem {
    private readonly app: pc.Application;
    private initialized: boolean = false;
    
    // Combat configuration
    private readonly combatConfig: CombatSystemConfig = { ...DEFAULT_COMBAT_CONFIG };
    
    // Active combat data
    private readonly activeCombat: {
        player1: PlayerCombatData;
        player2: PlayerCombatData;
    } = {
        player1: this.createPlayerCombatData(),
        player2: this.createPlayerCombatData()
    };
    
    // Hit detection tracking
    private readonly hitboxes: Map<string, HitboxData> = new Map();
    private readonly hurtboxes: Map<string, HurtboxData> = new Map();
    private collisionPairs: Array<[HitboxData, HurtboxData]> = [];
    
    // Special move system
    private readonly specialMoves: Map<string, SpecialMoveData> = new Map();
    private readonly superMoves: Map<string, SpecialMoveData> = new Map();
    
    // Combo system
    private readonly comboSystem: ComboSystemState = {
        activeCombo: null,
        comboTracker: new Map(),
        maxComboLength: 50,
        comboDecay: 180 // frames before combo resets
    };
    
    // Visual effects integration
    private readonly visualEffects: VisualEffectsState = {
        hitSparks: [],
        screenShake: { intensity: 0, duration: 0 },
        slowMotion: { active: false, factor: 1.0 },
        freeze: { active: false, duration: 0 }
    };
    
    // Graphics system integration
    private readonly graphics: GraphicsSystemIntegration = {
        sf3Graphics: undefined,
        hd2dRenderer: undefined,
        postProcessing: undefined
    };
    
    // Collision system
    private readonly collisionSystem: CollisionSystemState = {
        enabled: true,
        checkFrequency: 1, // Check every frame
        lastCheck: 0
    };
    
    // Debug materials for hitbox visualization
    private debugMaterials?: DebugMaterials;

    constructor(app: pc.Application) {
        this.app = app;
    }

    public async initialize(): Promise<void> {
        console.log('Initializing Combat System...');
        
        try {
            // Setup hit detection
            this.setupHitDetection();
            
            // Initialize special move system
            this.initializeSpecialMoves();
            
            // Setup SF3:3S parry system
            this.setupParrySystem();
            
            // Setup combo tracking
            this.setupComboSystem();
            
            // Initialize visual effects
            this.setupVisualEffects();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('Combat System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Combat System:', error);
            throw error;
        }
    }

    private createPlayerCombatData(): PlayerCombatData {
        return {
            character: null,
            
            // State tracking
            state: 'neutral',
            stateTimer: 0,
            
            // Attack data
            activeAttack: null,
            attackStartFrame: 0,
            attackRecovery: 0,
            
            // Defense data
            blocking: false,
            parryWindow: 0,
            parryRecovery: 0,
            lastParryFrame: -1,
            
            // Combo tracking
            comboCount: 0,
            comboDamage: 0,
            comboStartFrame: 0,
            
            // Meter and resources
            meter: 0,
            maxMeter: 100,
            tension: 0, // Tension for aggressive play
            
            // Status effects
            stunned: false,
            dizzy: false,
            invulnerable: false,
            
            // Frame data
            hitstun: 0,
            blockstun: 0,
            advantage: 0
        };
    }

    private setupHitDetection(): void {
        // Setup collision detection system
        this.collisionSystem.enabled = true;
        this.collisionSystem.checkFrequency = 1; // Check every frame
        this.collisionSystem.lastCheck = 0;
        
        // Setup hitbox/hurtbox visualization for debug
        this.setupHitboxVisualization();
        
        console.log('Hit detection system configured');
    }

    private setupHitboxVisualization(): void {
        // Create debug visualization materials
        this.debugMaterials = {
            hitbox: new pc.StandardMaterial(),
            hurtbox: new pc.StandardMaterial(),
            throwbox: new pc.StandardMaterial()
        };
        
        // Hitbox (red, semi-transparent)
        this.debugMaterials.hitbox.diffuse = new pc.Color(1, 0, 0);
        this.debugMaterials.hitbox.opacity = 0.3;
        this.debugMaterials.hitbox.blendType = pc.BLEND_NORMAL;
        this.debugMaterials.hitbox.update();
        
        // Hurtbox (blue, semi-transparent)
        this.debugMaterials.hurtbox.diffuse = new pc.Color(0, 0, 1);
        this.debugMaterials.hurtbox.opacity = 0.3;
        this.debugMaterials.hurtbox.blendType = pc.BLEND_NORMAL;
        this.debugMaterials.hurtbox.update();
        
        // Throwbox (green, semi-transparent)
        this.debugMaterials.throwbox.diffuse = new pc.Color(0, 1, 0);
        this.debugMaterials.throwbox.opacity = 0.3;
        this.debugMaterials.throwbox.blendType = pc.BLEND_NORMAL;
        this.debugMaterials.throwbox.update();
    }

    private initializeSpecialMoves(): void {
        // Define special move patterns (from SF3:3S)
        this.defineSpecialMoves();
        this.defineSuperMoves();
        
        console.log('Special move system initialized');
    }

    private defineSpecialMoves(): void {
        // Quarter Circle Forward + Punch (Hadoken)
        this.specialMoves.set('hadoken', {
            motion: '236',
            buttons: ['lightPunch', 'mediumPunch', 'heavyPunch'] as const,
            properties: {
                damage: 80,
                startup: 13,
                active: 4,
                recovery: 35,
                projectile: true,
                meterGain: 8
            }
        });
        
        // Dragon Punch (Shoryuken)
        this.specialMoves.set('shoryuken', {
            motion: '623',
            buttons: ['lightPunch', 'mediumPunch', 'heavyPunch'] as const,
            properties: {
                damage: 120,
                startup: 3,
                active: 8,
                recovery: 30,
                invulnerable: [1, 8] as const, // Frames 1-8 invulnerable
                meterGain: 12
            }
        });
        
        // Quarter Circle Back + Kick (Tatsu)
        this.specialMoves.set('tatsu', {
            motion: '214',
            buttons: ['lightKick', 'mediumKick', 'heavyKick'] as const,
            properties: {
                damage: 90,
                startup: 14,
                active: 6,
                recovery: 22,
                knockdown: true,
                meterGain: 10
            }
        });
    }

    private defineSuperMoves(): void {
        // Double Quarter Circle + Punch (Shinku Hadoken)
        this.superMoves.set('shinku_hadoken', {
            motion: '236236',
            buttons: ['lightPunch', 'mediumPunch', 'heavyPunch'] as const,
            properties: {
                damage: 300,
                startup: 10,
                active: 15,
                recovery: 45,
                meterCost: 50,
                superFreeze: 30, // Freeze frames
                fullScreen: true
            }
        });
        
        // Shoryuken + Kick (Shin Shoryuken)
        this.superMoves.set('shin_shoryuken', {
            motion: '623',
            buttons: ['lightPunch', 'lightKick'] as const, // LP+LK
            properties: {
                damage: 350,
                startup: 1,
                active: 12,
                recovery: 60,
                meterCost: 75,
                superFreeze: 20,
                invulnerable: [1, 15] as const
            }
        });
    }

    private setupParrySystem(): void {
        // SF3:3S-style parry system configuration is already in combatConfig
        console.log('SF3:3S Parry system configured');
    }

    private setupComboSystem(): void {
        // Combo tracking and damage scaling
        console.log('Combo system configured');
    }

    private setupVisualEffects(): void {
        // Integration with graphics systems
        this.graphics.sf3Graphics = (globalThis as any).SF3HD2D?.sf3Graphics;
        this.graphics.hd2dRenderer = (globalThis as any).SF3HD2D?.hd2dRenderer;
        this.graphics.postProcessing = (globalThis as any).SF3HD2D?.postProcessing;
        
        console.log('Visual effects integration configured');
    }

    private setupEventListeners(): void {
        // Listen for input events
        this.app.on('input:specialmove', this.onSpecialMoveInput.bind(this));
        
        // Listen for character events
        this.app.on('character:attack', this.onCharacterAttack.bind(this));
        this.app.on('character:statechange', this.onCharacterStateChange.bind(this));
        
        // Listen for collision events
        this.app.on('collision:hit', this.onCollisionHit.bind(this));
        
        console.log('Combat event listeners configured');
    }

    // Main update loop
    public update(dt: number): void {
        if (!this.initialized) return;
        
        // Update combat state for each player
        this.updatePlayerCombat('player1', dt);
        this.updatePlayerCombat('player2', dt);
        
        // Process hit detection
        this.processHitDetection(dt);
        
        // Update combo system
        this.updateComboSystem(dt);
        
        // Update visual effects
        this.updateVisualEffects(dt);
        
        // Update frame counters
        this.updateFrameCounters(dt);
    }

    private updatePlayerCombat(playerId: 'player1' | 'player2', dt: number): void {
        const combatData = this.activeCombat[playerId];
        if (!combatData.character) return;
        
        // Update state timers
        combatData.stateTimer += dt;
        
        // Update frame-specific data
        if (combatData.hitstun > 0) {
            combatData.hitstun--;
            if (combatData.hitstun <= 0) {
                this.exitHitstun(playerId);
            }
        }
        
        if (combatData.blockstun > 0) {
            combatData.blockstun--;
            if (combatData.blockstun <= 0) {
                this.exitBlockstun(playerId);
            }
        }
        
        if (combatData.parryWindow > 0) {
            combatData.parryWindow--;
        }
        
        if (combatData.parryRecovery > 0) {
            combatData.parryRecovery--;
        }
        
        // Update meter
        this.updateMeter(playerId, dt);
    }

    private exitHitstun(playerId: 'player1' | 'player2'): void {
        const combatData = this.activeCombat[playerId];
        combatData.state = 'neutral';
        this.app.fire('combat:hitstun_end', { player: playerId });
    }

    private exitBlockstun(playerId: 'player1' | 'player2'): void {
        const combatData = this.activeCombat[playerId];
        combatData.state = 'neutral';
        this.app.fire('combat:blockstun_end', { player: playerId });
    }

    private processHitDetection(dt: number): void {
        if (!this.collisionSystem.enabled) return;
        
        // Check all active hitboxes against all hurtboxes
        this.hitboxes.forEach((hitbox: HitboxData, hitboxId: string) => {
            this.hurtboxes.forEach((hurtbox: HurtboxData, hurtboxId: string) => {
                // Don't check self-collision
                if (hitbox.owner === hurtbox.owner) return;
                
                // Check if collision exists
                if (this.checkCollision(hitbox, hurtbox)) {
                    this.processHit(hitbox, hurtbox);
                }
            });
        });
    }

    private checkCollision(hitbox: HitboxData, hurtbox: HurtboxData): boolean {
        // Simple AABB collision detection
        const hitboxBounds = this.getEntityBounds(hitbox.entity);
        const hurtboxBounds = this.getEntityBounds(hurtbox.entity);
        
        return (hitboxBounds.min.x <= hurtboxBounds.max.x &&
                hitboxBounds.max.x >= hurtboxBounds.min.x &&
                hitboxBounds.min.y <= hurtboxBounds.max.y &&
                hitboxBounds.max.y >= hurtboxBounds.min.y);
    }

    private getEntityBounds(entity: pc.Entity): CollisionBounds {
        const pos = entity.getPosition();
        const scale = entity.getLocalScale();
        
        return {
            min: new pc.Vec3(pos.x - scale.x/2, pos.y - scale.y/2, pos.z - scale.z/2),
            max: new pc.Vec3(pos.x + scale.x/2, pos.y + scale.y/2, pos.z + scale.z/2)
        };
    }

    private processHit(hitbox: HitboxData, hurtbox: HurtboxData): void {
        const attacker = hitbox.owner;
        const defender = hurtbox.owner;
        
        // Get player IDs
        const attackerId = this.getPlayerIdFromCharacter(attacker);
        const defenderId = this.getPlayerIdFromCharacter(defender);
        
        if (!attackerId || !defenderId) return;
        
        const defenderCombat = this.activeCombat[defenderId];
        
        // Check if defender is blocking
        const isBlocking = this.isCharacterBlocking(defender, hitbox);
        
        // Check for parry
        const parryResult = this.checkParry(defenderId, hitbox);
        
        if (parryResult.success) {
            this.processParry(attackerId, defenderId, hitbox, parryResult);
        } else if (isBlocking) {
            this.processBlock(attackerId, defenderId, hitbox);
        } else {
            this.processHitConfirm(attackerId, defenderId, hitbox);
        }
        
        // Remove hitbox after hit (no multi-hit on same hurtbox)
        this.removeHitbox(hitbox);
    }

    private removeHitbox(hitbox: HitboxData): void {
        // Find and remove the hitbox from the map
        for (const [key, value] of this.hitboxes.entries()) {
            if (value === hitbox) {
                this.hitboxes.delete(key);
                break;
            }
        }
    }

    private checkParry(defenderId: 'player1' | 'player2', hitbox: HitboxData): ParryResult {
        const combatData = this.activeCombat[defenderId];
        
        // Check if in parry window
        if (combatData.parryWindow <= 0) {
            return { success: false };
        }
        
        // Check for red parry (parry during blockstun)
        const isRedParry = combatData.blockstun > 0;
        
        if (isRedParry) {
            // Red parry has stricter timing
            if (combatData.parryWindow <= this.combatConfig.parrySystem.redParryWindow) {
                return { success: true, type: 'red' };
            }
        } else {
            // Normal parry
            return { success: true, type: 'normal' };
        }
        
        return { success: false };
    }

    private processParry(attackerId: 'player1' | 'player2', defenderId: 'player1' | 'player2', hitbox: HitboxData, parryResult: ParryResult): void {
        const defenderCombat = this.activeCombat[defenderId];
        const attackerCombat = this.activeCombat[attackerId];
        
        // Parry successful - defender gains advantage
        defenderCombat.parryRecovery = this.combatConfig.parrySystem.parryRecovery;
        defenderCombat.advantage = parryResult.type === 'red' ? 
            this.combatConfig.parrySystem.redParryAdvantage :
            this.combatConfig.parrySystem.parryAdvantage;
        
        // Reset defender's disadvantage
        defenderCombat.hitstun = 0;
        defenderCombat.blockstun = 0;
        
        // Attacker gets recovery frames
        attackerCombat.advantage = -defenderCombat.advantage;
        
        // Meter and health gains
        defenderCombat.meter += 15; // parrySystem.meterGain
        if (defenderCombat.character) {
            defenderCombat.character.health += 5; // parrySystem.healthGain
        }
        
        // Visual effects
        this.createParryEffect(defenderId, hitbox, parryResult.type!);
        
        // Audio feedback
        this.playParrySound(parryResult.type!);
        
        console.log(`${defenderId} performed ${parryResult.type} parry!`);
        
        // Fire parry event
        const event: CombatParryEvent = {
            defender: defenderId,
            attacker: attackerId,
            type: parryResult.type!,
            position: hitbox.entity.getPosition()
        };
        this.app.fire('combat:parry', event);
    }

    private processBlock(attackerId: 'player1' | 'player2', defenderId: 'player1' | 'player2', hitbox: HitboxData): void {
        const defenderCombat = this.activeCombat[defenderId];
        const attackData = hitbox.attackData;
        
        // Calculate blockstun
        const blockstun = Math.floor(attackData.blockstun || 
            this.combatConfig.stun.blockstunBase * this.combatConfig.stun.blockstunScaling);
        
        defenderCombat.blockstun = blockstun;
        defenderCombat.advantage = -(attackData.blockAdvantage || 0);
        
        // Chip damage (minimal)
        const chipDamage = Math.floor((attackData.damage || 100) * 0.1);
        this.dealDamage(defenderId, chipDamage, 'chip');
        
        // Visual effects
        this.createBlockEffect(defenderId, hitbox);
        
        // Fire block event
        const event: CombatBlockEvent = {
            defender: defenderId,
            attacker: attackerId,
            damage: chipDamage,
            position: hitbox.entity.getPosition()
        };
        this.app.fire('combat:block', event);
    }

    private processHitConfirm(attackerId: 'player1' | 'player2', defenderId: 'player1' | 'player2', hitbox: HitboxData): void {
        const attackerCombat = this.activeCombat[attackerId];
        const defenderCombat = this.activeCombat[defenderId];
        const attackData = hitbox.attackData;
        
        // Calculate damage with scaling
        let damage = attackData.damage || 100;
        damage = this.applyDamageScaling(attackerId, damage);
        
        // Deal damage
        this.dealDamage(defenderId, damage, 'normal');
        
        // Calculate hitstun
        const hitstun = Math.floor(attackData.hitstun || 
            this.combatConfig.stun.hitstunBase * this.combatConfig.stun.hitstunScaling);
        
        defenderCombat.hitstun = hitstun;
        defenderCombat.advantage = -(attackData.hitAdvantage || 0);
        
        // Update combo
        this.updateCombo(attackerId, damage);
        
        // Meter gain
        attackerCombat.meter += attackData.meterGain || 5;
        
        // Visual effects
        this.createHitEffect(attackerId, defenderId, hitbox, damage);
        
        // Check for special hit properties
        this.processSpecialHitProperties(attackerId, defenderId, attackData);
        
        // Fire hit event
        const event: CombatHitEvent = {
            attacker: attackerId,
            defender: defenderId,
            damage: damage,
            position: hitbox.entity.getPosition(),
            attackData: attackData
        };
        this.app.fire('combat:hit', event);
        
        console.log(`${attackerId} hit ${defenderId} for ${damage} damage`);
    }

    private applyDamageScaling(attackerId: 'player1' | 'player2', baseDamage: number): number {
        const combatData = this.activeCombat[attackerId];
        
        if (!this.combatConfig.damageScaling.enabled) {
            return baseDamage;
        }
        
        if (combatData.comboCount < this.combatConfig.damageScaling.scalingStart) {
            return baseDamage;
        }
        
        // Apply scaling
        const scalingHits = combatData.comboCount - this.combatConfig.damageScaling.scalingStart;
        const scalingFactor = Math.pow(this.combatConfig.damageScaling.scalingRate, scalingHits);
        const minDamage = baseDamage * this.combatConfig.damageScaling.minimumDamage;
        
        return Math.max(Math.floor(baseDamage * scalingFactor), minDamage);
    }

    private dealDamage(playerId: 'player1' | 'player2', damage: number, type: DamageType = 'normal'): void {
        const combatData = this.activeCombat[playerId];
        if (!combatData.character) return;
        
        // Apply damage
        combatData.character.health -= damage;
        
        // Prevent negative health
        if (combatData.character.health < 0) {
            combatData.character.health = 0;
        }
        
        // Check for KO
        if (combatData.character.health <= 0) {
            this.processKO(playerId);
        }
        
        // Fire damage event
        const event: CombatDamageEvent = {
            player: playerId,
            damage: damage,
            type: type,
            health: combatData.character.health
        };
        this.app.fire('combat:damage', event);
    }

    private processKO(playerId: 'player1' | 'player2'): void {
        const winner = playerId === 'player1' ? 'player2' : 'player1';
        const event: CombatKOEvent = {
            winner: winner,
            loser: playerId
        };
        this.app.fire('combat:ko', event);
        console.log(`${winner} wins! ${playerId} is KO'd`);
    }

    private updateCombo(attackerId: 'player1' | 'player2', damage: number): void {
        const combatData = this.activeCombat[attackerId];
        
        combatData.comboCount++;
        combatData.comboDamage += damage;
        
        // Reset combo decay timer
        combatData.comboDecayTimer = this.comboSystem.comboDecay;
        
        // Fire combo update event
        const event: CombatComboEvent = {
            player: attackerId,
            hits: combatData.comboCount,
            damage: combatData.comboDamage
        };
        this.app.fire('combat:combo', event);
    }

    private updateComboSystem(dt: number): void {
        // Update combo decay for both players
        (['player1', 'player2'] as const).forEach((playerId: 'player1' | 'player2') => {
            const combatData = this.activeCombat[playerId];
            
            if (combatData.comboCount > 0) {
                if (combatData.comboDecayTimer !== undefined) {
                    combatData.comboDecayTimer--;
                    
                    if (combatData.comboDecayTimer <= 0) {
                        // Reset combo
                        combatData.comboCount = 0;
                        combatData.comboDamage = 0;
                        
                        this.app.fire('combat:combo_end', {
                            player: playerId
                        });
                    }
                }
            }
        });
    }

    // Visual effect methods
    private createHitEffect(attackerId: 'player1' | 'player2', defenderId: 'player1' | 'player2', hitbox: HitboxData, damage: number): void {
        const position = hitbox.entity.getPosition();
        
        // SF3 graphics hit effect
        if (this.graphics.sf3Graphics) {
            this.graphics.sf3Graphics.createHitEffect(position, damage / 100, 'normal');
        }
        
        // Screen shake based on damage
        const shakeIntensity = Math.min(damage / 50, 2.0);
        if (this.graphics.postProcessing) {
            this.graphics.postProcessing.triggerScreenShake(shakeIntensity, 150);
        }
        
        // Hit flash effect
        if (damage > 150) { // Heavy hit
            if (this.graphics.postProcessing) {
                this.graphics.postProcessing.triggerHitFlash([1, 0.8, 0.6], 0.6, 100);
            }
        }
    }

    private createParryEffect(defenderId: 'player1' | 'player2', hitbox: HitboxData, parryType: ParryType): void {
        const position = hitbox.entity.getPosition();
        
        // SF3 graphics parry effect
        if (this.graphics.sf3Graphics) {
            this.graphics.sf3Graphics.createParryEffect(position);
        }
        
        // Special effects for red parry
        if (parryType === 'red') {
            if (this.graphics.postProcessing) {
                this.graphics.postProcessing.triggerHitFlash([1, 0.2, 0.2], 0.8, 200);
                this.graphics.postProcessing.triggerSlowMotion(0.5, 500);
            }
        }
    }

    private createBlockEffect(defenderId: 'player1' | 'player2', hitbox: HitboxData): void {
        const position = hitbox.entity.getPosition();
        
        // SF3 graphics block effect
        if (this.graphics.sf3Graphics) {
            this.graphics.sf3Graphics.createHitEffect(position, 0.5, 'block');
        }
    }

    private playParrySound(parryType: ParryType): void {
        // Audio system integration would go here
        console.log(`Playing ${parryType} parry sound`);
    }

    private processSpecialHitProperties(attackerId: 'player1' | 'player2', defenderId: 'player1' | 'player2', attackData: AttackData): void {
        // Handle special hit properties like knockdown, wallbounce, etc.
        if (attackData.properties?.knockdown) {
            const defenderCombat = this.activeCombat[defenderId];
            defenderCombat.state = 'hitstun';
            // Additional knockdown logic would go here
        }
    }

    // Event handlers
    private onSpecialMoveInput(data: any): void {
        const { player, move, pattern } = data;
        
        // Check if special move exists
        const specialMove = this.specialMoves.get(move) || this.superMoves.get(move);
        if (!specialMove) return;
        
        // Check if player can perform move
        if (this.canPerformSpecialMove(player, specialMove)) {
            this.executeSpecialMove(player, move, specialMove);
        }
    }

    private onCharacterAttack(data: any): void {
        // Handle character attack events
        console.log('Character attack event:', data);
    }

    private onCharacterStateChange(data: any): void {
        // Handle character state change events
        console.log('Character state change event:', data);
    }

    private onCollisionHit(data: any): void {
        // Handle collision hit events
        console.log('Collision hit event:', data);
    }

    private canPerformSpecialMove(playerId: 'player1' | 'player2', moveData: SpecialMoveData): boolean {
        const combatData = this.activeCombat[playerId];
        
        // Check if in valid state
        if (combatData.hitstun > 0 || combatData.blockstun > 0) {
            return false;
        }
        
        // Check meter requirements
        if (moveData.properties.meterCost && combatData.meter < moveData.properties.meterCost) {
            return false;
        }
        
        return true;
    }

    private executeSpecialMove(playerId: 'player1' | 'player2', moveName: string, moveData: SpecialMoveData): void {
        const combatData = this.activeCombat[playerId];
        
        // Consume meter if required
        if (moveData.properties.meterCost) {
            combatData.meter -= moveData.properties.meterCost;
        }
        
        // Set character state
        combatData.state = 'special_move';
        combatData.activeAttack = moveData;
        
        // Super freeze for super moves
        if (moveData.properties.superFreeze) {
            this.triggerSuperFreeze(moveData.properties.superFreeze);
        }
        
        // Fire special move event
        const event: CombatSpecialMoveEvent = {
            player: playerId,
            move: moveName,
            data: moveData
        };
        this.app.fire('combat:specialmove', event);
        
        console.log(`${playerId} executed ${moveName}`);
    }

    private triggerSuperFreeze(frames: number): void {
        // Freeze the game for dramatic effect
        this.visualEffects.freeze.active = true;
        this.visualEffects.freeze.duration = frames;
        
        // Dramatic lighting
        if (this.graphics.postProcessing) {
            this.graphics.postProcessing.setDramaticLighting(true);
        }
        
        // Slow motion effect
        this.app.timeScale = 0.1;
        
        setTimeout(() => {
            this.visualEffects.freeze.active = false;
            this.app.timeScale = 1.0;
            
            if (this.graphics.postProcessing) {
                this.graphics.postProcessing.setDramaticLighting(false);
            }
        }, frames * (1000/60));
    }

    // Utility methods
    private getPlayerIdFromCharacter(character: Character): 'player1' | 'player2' | null {
        // Return player ID based on character
        if (this.activeCombat.player1.character === character) return 'player1';
        if (this.activeCombat.player2.character === character) return 'player2';
        return null;
    }

    private isCharacterBlocking(character: Character, hitbox: HitboxData): boolean {
        // Check if character is in blocking state
        const playerId = this.getPlayerIdFromCharacter(character);
        if (!playerId) return false;
        
        const combatData = this.activeCombat[playerId];
        return combatData.blocking;
    }

    public setPlayerCharacter(playerId: 'player1' | 'player2', character: Character): void {
        this.activeCombat[playerId].character = character;
    }

    private updateMeter(playerId: 'player1' | 'player2', dt: number): void {
        const combatData = this.activeCombat[playerId];
        
        // Passive meter gain
        combatData.meter += 0.1; // Small passive gain
        
        // Clamp meter
        combatData.meter = Math.min(combatData.meter, combatData.maxMeter);
        combatData.meter = Math.max(combatData.meter, 0);
    }

    private updateVisualEffects(dt: number): void {
        // Update screen shake
        if (this.visualEffects.screenShake.intensity > 0) {
            this.visualEffects.screenShake.intensity *= 0.95; // Decay
            if (this.visualEffects.screenShake.intensity < 0.01) {
                this.visualEffects.screenShake.intensity = 0;
            }
        }
    }

    private updateFrameCounters(dt: number): void {
        // Update frame-based timers
        // Implementation would update all frame counters
    }

    // Public API methods
    public startMatch(player1Character: Character, player2Character: Character): void {
        this.setPlayerCharacter('player1', player1Character);
        this.setPlayerCharacter('player2', player2Character);
        
        // Reset all combat data
        this.resetCombatData();
        
        console.log('Combat match started');
    }

    private resetCombatData(): void {
        this.activeCombat.player1 = this.createPlayerCombatData();
        this.activeCombat.player2 = this.createPlayerCombatData();
    }

    public getCombatData(playerId: 'player1' | 'player2'): PlayerCombatData {
        return this.activeCombat[playerId];
    }

    // Debug methods
    public toggleHitboxVisualization(): void {
        this.combatConfig.hitDetection.hitboxVisualization = 
            !this.combatConfig.hitDetection.hitboxVisualization;
        
        console.log('Hitbox visualization:', 
            this.combatConfig.hitDetection.hitboxVisualization ? 'enabled' : 'disabled');
    }

    public destroy(): void {
        // Clear all collections
        this.hitboxes.clear();
        this.hurtboxes.clear();
        this.specialMoves.clear();
        this.superMoves.clear();
        this.comboSystem.comboTracker.clear();
        
        console.log('Combat System destroyed');
    }
}