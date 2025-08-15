// Combat system for frame-accurate fighting game mechanics
class CombatSystem {
    constructor(app) {
        this.app = app;
        
        // Active hitboxes and hurtboxes
        this.activeHitboxes = [];
        this.activeHurtboxes = [];
        
        // Collision detection results
        this.collisionResults = [];
        
        // Combat state tracking
        this.combatStates = new Map(); // Entity ID -> combat state
        
        // Frame timing
        this.currentFrame = 0;
        this.frameRate = 60;
        
        // Priority system for clashing attacks
        this.clashPriorities = new Map();
        
        console.log('Combat System initialized');
    }
    
    // Register a fighter for combat tracking
    registerFighter(entity, characterData) {
        const fighterId = entity.getGuid();
        
        this.combatStates.set(fighterId, {
            entity: entity,
            characterData: characterData,
            currentMove: null,
            moveFrame: 0,
            hitstun: 0,
            blockstun: 0,
            isInvincible: false,
            canBlock: true,
            facingDirection: entity.script?.fighter?.facingDirection || 1,
            
            // State tracking
            isGrounded: true,
            isBlocking: false,
            isAttacking: false,
            isInCombo: false,
            
            // Resources
            health: characterData.health,
            meter: characterData.meter,
            
            // Move history for combo scaling
            moveHistory: [],
            comboCounter: 0
        });
        
        console.log(`Registered fighter: ${characterData.name}`);
    }
    
    // Execute a move for a fighter
    executeMove(entity, moveName, moveData) {
        const fighterId = entity.getGuid();
        const state = this.combatStates.get(fighterId);
        
        if (!state || !this.canExecuteMove(state, moveData)) {
            return false;
        }
        
        // Set move state
        state.currentMove = {
            name: moveName,
            data: moveData,
            startFrame: this.currentFrame
        };
        state.moveFrame = 0;
        state.isAttacking = true;
        
        // Add to move history for combo tracking
        state.moveHistory.push({
            move: moveName,
            frame: this.currentFrame
        });
        
        console.log(`${state.characterData.name} executing ${moveName}`);
        return true;
    }
    
    canExecuteMove(state, moveData) {
        // Check if fighter is in a state where they can execute moves
        if (state.hitstun > 0 || state.blockstun > 0) {
            return false;
        }
        
        // Check if current move allows canceling
        if (state.currentMove) {
            const currentMoveData = state.currentMove.data;
            const currentPhase = this.getMovePhase(state);
            
            // Can only cancel during recovery if move is cancelable
            if (currentPhase === 'recovery' && 
                currentMoveData.properties?.includes('cancelable')) {
                return true;
            }
            
            // Can't interrupt other phases
            if (currentPhase !== 'recovery') {
                return false;
            }
        }
        
        // Check meter requirements
        if (moveData.meterCost && state.meter < moveData.meterCost) {
            return false;
        }
        
        return true;
    }
    
    getMovePhase(state) {
        if (!state.currentMove) return 'neutral';
        
        const moveData = state.currentMove.data;
        const frameInMove = state.moveFrame;
        
        if (frameInMove < moveData.startupFrames) {
            return 'startup';
        } else if (frameInMove < moveData.startupFrames + moveData.activeFrames) {
            return 'active';
        } else {
            return 'recovery';
        }
    }
    
    // Create hitbox for active move
    createHitbox(entity, hitboxData, moveData) {
        const state = this.combatStates.get(entity.getGuid());
        if (!state) return;
        
        const position = entity.getPosition();
        const facing = state.facingDirection;
        
        const hitbox = {
            id: this.generateHitboxId(),
            owner: entity,
            ownerState: state,
            
            // Position and size
            position: {
                x: position.x + (hitboxData.position[0] * facing),
                y: position.y + hitboxData.position[1],
                z: position.z
            },
            size: {
                width: hitboxData.size[0],
                height: hitboxData.size[1]
            },
            
            // Damage properties
            damage: hitboxData.damage,
            hitstun: hitboxData.hitstun,
            blockstun: hitboxData.blockstun,
            knockdown: hitboxData.knockdown || false,
            
            // Move properties
            moveData: moveData,
            properties: moveData.properties || [],
            
            // Timing
            startFrame: this.currentFrame,
            endFrame: this.currentFrame + (hitboxData.endFrame - hitboxData.startFrame),
            
            // Collision state
            hasHit: false,
            hitEntities: new Set()
        };
        
        this.activeHitboxes.push(hitbox);
        return hitbox;
    }
    
    // Create hurtbox for fighter
    createHurtbox(entity) {
        const state = this.combatStates.get(entity.getGuid());
        if (!state) return;
        
        const position = entity.getPosition();
        
        const hurtbox = {
            id: this.generateHitboxId(),
            owner: entity,
            ownerState: state,
            
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            size: {
                width: 60, // Default character width
                height: 120 // Default character height
            },
            
            isBlocking: state.isBlocking,
            isInvincible: state.isInvincible,
            
            startFrame: this.currentFrame,
            endFrame: this.currentFrame + 1 // Hurtboxes are frame-based
        };
        
        this.activeHurtboxes.push(hurtbox);
        return hurtbox;
    }
    
    generateHitboxId() {
        return 'hitbox_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Check collision between hitbox and hurtbox
    checkCollision(hitbox, hurtbox) {
        // Don't hit yourself
        if (hitbox.owner === hurtbox.owner) {
            return false;
        }
        
        // Don't hit the same entity twice with the same hitbox
        if (hitbox.hitEntities.has(hurtbox.owner.getGuid())) {
            return false;
        }
        
        // Don't hit invincible targets
        if (hurtbox.isInvincible) {
            return false;
        }
        
        // AABB collision detection
        const hitboxLeft = hitbox.position.x - hitbox.size.width / 2;
        const hitboxRight = hitbox.position.x + hitbox.size.width / 2;
        const hitboxTop = hitbox.position.y + hitbox.size.height / 2;
        const hitboxBottom = hitbox.position.y - hitbox.size.height / 2;
        
        const hurtboxLeft = hurtbox.position.x - hurtbox.size.width / 2;
        const hurtboxRight = hurtbox.position.x + hurtbox.size.width / 2;
        const hurtboxTop = hurtbox.position.y + hurtbox.size.height / 2;
        const hurtboxBottom = hurtbox.position.y - hurtbox.size.height / 2;
        
        return !(hitboxLeft > hurtboxRight || 
                hitboxRight < hurtboxLeft || 
                hitboxTop < hurtboxBottom || 
                hitboxBottom > hurtboxTop);
    }
    
    // Process collision between hitbox and hurtbox
    processCollision(hitbox, hurtbox) {
        const attacker = hitbox.ownerState;
        const defender = hurtbox.ownerState;
        
        // Mark that this hitbox has hit this entity
        hitbox.hitEntities.add(hurtbox.owner.getGuid());
        
        let blocked = false;
        let damage = hitbox.damage;
        
        // Check for blocking
        if (hurtbox.isBlocking && this.canBlock(hitbox, hurtbox)) {
            blocked = true;
            damage = Math.floor(damage * 0.2); // 20% chip damage
            defender.blockstun = hitbox.blockstun;
            console.log(`${defender.characterData.name} blocked attack`);
        } else {
            // Normal hit
            defender.hitstun = hitbox.hitstun;
            defender.isInCombo = true;
            attacker.comboCounter++;
            
            // Apply combo scaling
            damage = this.applyComboScaling(damage, attacker.comboCounter);
            
            console.log(`${attacker.characterData.name} hit ${defender.characterData.name} for ${damage} damage`);
        }
        
        // Apply damage
        defender.health = Math.max(0, defender.health - damage);
        
        // Apply knockdown
        if (hitbox.knockdown && !blocked) {
            this.applyKnockdown(defender);
        }
        
        // Build meter
        this.buildMeter(attacker, blocked ? 5 : 10);
        this.buildMeter(defender, blocked ? 8 : 15);
        
        // Create collision result for visual feedback
        this.collisionResults.push({
            type: blocked ? 'block' : 'hit',
            position: { ...hurtbox.position },
            damage: damage,
            frame: this.currentFrame
        });
        
        return {
            hit: true,
            blocked: blocked,
            damage: damage,
            attacker: attacker,
            defender: defender
        };
    }
    
    canBlock(hitbox, hurtbox) {
        const defender = hurtbox.ownerState;
        
        // Check if defender can block
        if (!defender.canBlock) return false;
        
        // Check facing direction for blocking
        const attackerPos = hitbox.owner.getPosition();
        const defenderPos = hurtbox.owner.getPosition();
        const attackFromLeft = attackerPos.x < defenderPos.x;
        const defenderFacingRight = defender.facingDirection > 0;
        
        // Must be blocking in the correct direction
        return (attackFromLeft && !defenderFacingRight) || 
               (!attackFromLeft && defenderFacingRight);
    }
    
    applyComboScaling(damage, comboCount) {
        // Standard combo scaling: each hit after the first reduces damage
        const scalingFactors = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
        const scalingIndex = Math.min(comboCount - 1, scalingFactors.length - 1);
        return Math.floor(damage * scalingFactors[scalingIndex]);
    }
    
    applyKnockdown(state) {
        state.isGrounded = false;
        state.hitstun = Math.max(state.hitstun, 60); // Minimum knockdown time
        console.log(`${state.characterData.name} knocked down`);
    }
    
    buildMeter(state, amount) {
        const maxMeter = state.characterData.meter;
        state.meter = Math.min(maxMeter, state.meter + amount);
    }
    
    // Update combat system each frame
    update() {
        this.currentFrame++;
        
        // Update fighter states
        this.updateFighterStates();
        
        // Create hurtboxes for all fighters
        this.createHurtboxes();
        
        // Check collisions
        this.checkCollisions();
        
        // Clean up expired hitboxes and hurtboxes
        this.cleanupBoxes();
    }
    
    updateFighterStates() {
        for (const [fighterId, state] of this.combatStates) {
            // Update move timing
            if (state.currentMove) {
                state.moveFrame++;
                
                // Create hitboxes during active frames
                if (this.getMovePhase(state) === 'active') {
                    this.createMoveHitboxes(state);
                }
                
                // End move when complete
                const totalFrames = state.currentMove.data.startupFrames + 
                                  state.currentMove.data.activeFrames + 
                                  state.currentMove.data.recoveryFrames;
                
                if (state.moveFrame >= totalFrames) {
                    state.currentMove = null;
                    state.moveFrame = 0;
                    state.isAttacking = false;
                }
            }
            
            // Update stun timers
            if (state.hitstun > 0) {
                state.hitstun--;
                if (state.hitstun === 0) {
                    state.isInCombo = false;
                }
            }
            
            if (state.blockstun > 0) {
                state.blockstun--;
            }
            
            // Reset combo counter if enough time has passed
            if (!state.isInCombo && state.comboCounter > 0) {
                const timeSinceLastHit = this.currentFrame - 
                    (state.moveHistory[state.moveHistory.length - 1]?.frame || 0);
                
                if (timeSinceLastHit > 120) { // 2 seconds at 60 FPS
                    state.comboCounter = 0;
                    state.moveHistory = [];
                }
            }
        }
    }
    
    createMoveHitboxes(state) {
        const moveData = state.currentMove.data;
        
        if (moveData.hitboxes) {
            for (const hitboxData of moveData.hitboxes) {
                // Check if this hitbox should be active on this frame
                const frameInMove = state.moveFrame;
                if (frameInMove >= hitboxData.startFrame && 
                    frameInMove <= hitboxData.endFrame) {
                    
                    // Don't create duplicate hitboxes
                    const existingHitbox = this.activeHitboxes.find(h => 
                        h.owner === state.entity && 
                        h.moveData === moveData &&
                        h.startFrame <= this.currentFrame &&
                        h.endFrame >= this.currentFrame
                    );
                    
                    if (!existingHitbox) {
                        this.createHitbox(state.entity, hitboxData, moveData);
                    }
                }
            }
        }
    }
    
    createHurtboxes() {
        for (const [fighterId, state] of this.combatStates) {
            // Create hurtbox for each fighter every frame
            this.createHurtbox(state.entity);
        }
    }
    
    checkCollisions() {
        this.collisionResults = [];
        
        for (const hitbox of this.activeHitboxes) {
            if (hitbox.hasHit) continue;
            
            for (const hurtbox of this.activeHurtboxes) {
                if (this.checkCollision(hitbox, hurtbox)) {
                    const result = this.processCollision(hitbox, hurtbox);
                    hitbox.hasHit = true;
                    break; // Hitbox can only hit one target per frame
                }
            }
        }
    }
    
    cleanupBoxes() {
        // Remove expired hitboxes
        this.activeHitboxes = this.activeHitboxes.filter(hitbox => 
            this.currentFrame <= hitbox.endFrame
        );
        
        // Remove expired hurtboxes
        this.activeHurtboxes = this.activeHurtboxes.filter(hurtbox => 
            this.currentFrame <= hurtbox.endFrame
        );
    }
    
    // Get combat state for debugging
    getCombatState(entity) {
        return this.combatStates.get(entity.getGuid());
    }
    
    // Get recent collision results for visual effects
    getRecentCollisions() {
        return this.collisionResults.filter(result => 
            this.currentFrame - result.frame < 10
        );
    }
}

// Make CombatSystem globally available
window.CombatSystem = CombatSystem;