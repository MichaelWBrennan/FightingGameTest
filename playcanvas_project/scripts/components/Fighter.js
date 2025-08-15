// Fighter component - main character controller for fighting game characters
var Fighter = pc.createScript('fighter');

// Character data attribute
Fighter.attributes.add('characterData', {
    type: 'json',
    title: 'Character Data'
});

Fighter.attributes.add('playerNumber', {
    type: 'number',
    default: 1,
    title: 'Player Number'
});

Fighter.attributes.add('facingDirection', {
    type: 'number',
    default: 1,
    title: 'Facing Direction'
});

// Initialize code called once per entity
Fighter.prototype.initialize = function() {
    // Core properties
    this.characterData = this.characterData || {};
    this.playerNumber = this.playerNumber || 1;
    this.facingDirection = this.facingDirection || 1;
    
    // Combat state
    this.health = this.characterData.health || 1000;
    this.meter = 0;
    this.maxMeter = this.characterData.meter || 100;
    
    // Movement properties
    this.velocity = new pc.Vec3(0, 0, 0);
    this.grounded = true;
    this.walkSpeed = this.characterData.walkSpeed || 150;
    this.runSpeed = this.characterData.runSpeed || 250;
    this.jumpHeight = this.characterData.jumpHeight || 300;
    
    // State tracking
    this.currentState = 'idle';
    this.previousState = 'idle';
    this.stateTimer = 0;
    this.animationTimer = 0;
    
    // Input state
    this.inputBuffer = [];
    this.currentInputs = new Set();
    
    // Combat state
    this.isBlocking = false;
    this.isAttacking = false;
    this.isInHitstun = false;
    this.isInBlockstun = false;
    this.canAct = true;
    
    // Frame data
    this.currentMove = null;
    this.moveFrame = 0;
    this.hitstunFrames = 0;
    this.blockstunFrames = 0;
    
    // Combo tracking
    this.comboCount = 0;
    this.comboTimer = 0;
    
    // Get references to game systems
    this.inputSystem = window.game?.inputSystem;
    this.combatSystem = window.game?.combatSystem;
    this.animationSystem = window.game?.animationSystem;
    
    // Register with combat system
    if (this.combatSystem) {
        this.combatSystem.registerFighter(this.entity, this.characterData);
    }
    
    // Set initial position
    const startX = this.playerNumber === 1 ? -200 : 200;
    this.entity.setPosition(startX, -170, 0);
    
    console.log(`Fighter initialized: ${this.characterData.name} (Player ${this.playerNumber})`);
};

// Update code called every frame
Fighter.prototype.update = function(dt) {
    this.stateTimer += dt;
    this.animationTimer += dt;
    
    // Update frame counters
    this.updateFrameCounters();
    
    // Process input
    this.processInput();
    
    // Update state machine
    this.updateStateMachine(dt);
    
    // Update movement
    this.updateMovement(dt);
    
    // Update facing direction
    this.updateFacing();
    
    // Update visual representation
    this.updateVisuals();
};

Fighter.prototype.updateFrameCounters = function() {
    // Update stun timers
    if (this.hitstunFrames > 0) {
        this.hitstunFrames--;
        this.isInHitstun = this.hitstunFrames > 0;
    }
    
    if (this.blockstunFrames > 0) {
        this.blockstunFrames--;
        this.isInBlockstun = this.blockstunFrames > 0;
    }
    
    // Update move frame counter
    if (this.currentMove) {
        this.moveFrame++;
    }
    
    // Update combo timer
    if (this.comboTimer > 0) {
        this.comboTimer--;
        if (this.comboTimer === 0) {
            this.comboCount = 0;
        }
    }
};

Fighter.prototype.processInput = function() {
    if (!this.inputSystem) return;
    
    const playerKey = `player${this.playerNumber}`;
    
    // Get current inputs
    this.currentInputs.clear();
    const inputs = this.inputSystem.getCurrentInputs(playerKey);
    inputs.forEach(input => this.currentInputs.add(input));
    
    // Only process input if character can act
    if (!this.canAct || this.isInHitstun || this.isInBlockstun) {
        return;
    }
    
    // Movement input
    this.handleMovementInput();
    
    // Attack input
    this.handleAttackInput();
    
    // Special input
    this.handleSpecialInput();
};

Fighter.prototype.handleMovementInput = function() {
    const playerKey = `player${this.playerNumber}`;
    
    // Walking
    if (this.inputSystem.isButtonPressed(playerKey, 'left')) {
        this.move(-1);
    } else if (this.inputSystem.isButtonPressed(playerKey, 'right')) {
        this.move(1);
    } else {
        this.move(0);
    }
    
    // Jumping
    if (this.inputSystem.isButtonJustPressed(playerKey, 'up') && this.grounded) {
        this.jump();
    }
    
    // Crouching
    if (this.inputSystem.isButtonPressed(playerKey, 'down')) {
        this.crouch();
    }
    
    // Blocking
    const opponent = this.getOpponent();
    if (opponent && this.inputSystem.isButtonPressed(playerKey, 'block')) {
        this.block();
    } else {
        this.isBlocking = false;
    }
};

Fighter.prototype.handleAttackInput = function() {
    const playerKey = `player${this.playerNumber}`;
    
    // Normal attacks
    if (this.inputSystem.isButtonJustPressed(playerKey, 'lightPunch')) {
        this.executeMove('lightPunch');
    } else if (this.inputSystem.isButtonJustPressed(playerKey, 'mediumPunch')) {
        this.executeMove('mediumPunch');
    } else if (this.inputSystem.isButtonJustPressed(playerKey, 'heavyPunch')) {
        this.executeMove('heavyPunch');
    } else if (this.inputSystem.isButtonJustPressed(playerKey, 'lightKick')) {
        this.executeMove('lightKick');
    } else if (this.inputSystem.isButtonJustPressed(playerKey, 'mediumKick')) {
        this.executeMove('mediumKick');
    } else if (this.inputSystem.isButtonJustPressed(playerKey, 'heavyKick')) {
        this.executeMove('heavyKick');
    }
};

Fighter.prototype.handleSpecialInput = function() {
    const playerKey = `player${this.playerNumber}`;
    
    // Check for special move patterns
    if (this.characterData.moves && this.characterData.moves.specials) {
        for (const [moveName, moveData] of Object.entries(this.characterData.moves.specials)) {
            if (this.checkSpecialMoveInput(moveData, playerKey)) {
                this.executeMove(moveName);
                break;
            }
        }
    }
    
    // Check for super moves
    if (this.characterData.moves && this.characterData.moves.supers) {
        for (const [moveName, moveData] of Object.entries(this.characterData.moves.supers)) {
            if (this.checkSpecialMoveInput(moveData, playerKey)) {
                this.executeMove(moveName);
                break;
            }
        }
    }
};

Fighter.prototype.checkSpecialMoveInput = function(moveData, playerKey) {
    if (!moveData.input || !this.inputSystem) return false;
    
    // Simple pattern checking - in a full implementation this would be more sophisticated
    const input = moveData.input;
    
    // Check for quarter circle forward + punch (236P)
    if (input === '236P') {
        return this.inputSystem.detectSpecialMove(playerKey, '236') &&
               (this.inputSystem.isButtonJustPressed(playerKey, 'lightPunch') ||
                this.inputSystem.isButtonJustPressed(playerKey, 'mediumPunch') ||
                this.inputSystem.isButtonJustPressed(playerKey, 'heavyPunch'));
    }
    
    // Check for dragon punch + punch (623P)
    if (input === '623P') {
        return this.inputSystem.detectSpecialMove(playerKey, '623') &&
               (this.inputSystem.isButtonJustPressed(playerKey, 'lightPunch') ||
                this.inputSystem.isButtonJustPressed(playerKey, 'mediumPunch') ||
                this.inputSystem.isButtonJustPressed(playerKey, 'heavyPunch'));
    }
    
    // Check for double quarter circle + punch (236236P)
    if (input === '236236P') {
        return this.inputSystem.detectSpecialMove(playerKey, '236') &&
               (this.inputSystem.isButtonJustPressed(playerKey, 'lightPunch') ||
                this.inputSystem.isButtonJustPressed(playerKey, 'mediumPunch') ||
                this.inputSystem.isButtonJustPressed(playerKey, 'heavyPunch'));
    }
    
    return false;
};

Fighter.prototype.executeMove = function(moveName) {
    if (!this.canExecuteMove(moveName)) return false;
    
    const moveData = this.getMoveData(moveName);
    if (!moveData) return false;
    
    // Check meter requirements
    if (moveData.meterCost && this.meter < moveData.meterCost) {
        return false;
    }
    
    // Execute the move through combat system
    if (this.combatSystem) {
        const success = this.combatSystem.executeMove(this.entity, moveName, moveData);
        if (success) {
            this.currentMove = {
                name: moveName,
                data: moveData
            };
            this.moveFrame = 0;
            this.isAttacking = true;
            this.canAct = false;
            
            // Consume meter
            if (moveData.meterCost) {
                this.meter = Math.max(0, this.meter - moveData.meterCost);
            }
            
            console.log(`${this.characterData.name} executed ${moveName}`);
            return true;
        }
    }
    
    return false;
};

Fighter.prototype.canExecuteMove = function(moveName) {
    // Can't execute moves while in stun
    if (this.isInHitstun || this.isInBlockstun) return false;
    
    // Can't execute moves while another move is active (unless cancelable)
    if (this.currentMove && !this.canCancelCurrentMove()) return false;
    
    return true;
};

Fighter.prototype.canCancelCurrentMove = function() {
    if (!this.currentMove) return true;
    
    const moveData = this.currentMove.data;
    const phase = this.getCurrentMovePhase();
    
    // Can cancel during recovery if move is cancelable
    return phase === 'recovery' && 
           moveData.properties && 
           moveData.properties.includes('cancelable');
};

Fighter.prototype.getCurrentMovePhase = function() {
    if (!this.currentMove) return 'neutral';
    
    const moveData = this.currentMove.data;
    
    if (this.moveFrame < moveData.startupFrames) {
        return 'startup';
    } else if (this.moveFrame < moveData.startupFrames + moveData.activeFrames) {
        return 'active';
    } else {
        return 'recovery';
    }
};

Fighter.prototype.getMoveData = function(moveName) {
    if (!this.characterData.moves) return null;
    
    // Check normals
    if (this.characterData.moves.normals && this.characterData.moves.normals[moveName]) {
        return this.characterData.moves.normals[moveName];
    }
    
    // Check specials
    if (this.characterData.moves.specials && this.characterData.moves.specials[moveName]) {
        return this.characterData.moves.specials[moveName];
    }
    
    // Check supers
    if (this.characterData.moves.supers && this.characterData.moves.supers[moveName]) {
        return this.characterData.moves.supers[moveName];
    }
    
    return null;
};

Fighter.prototype.move = function(direction) {
    if (!this.grounded || !this.canAct) return;
    
    const speed = this.walkSpeed * direction;
    this.velocity.x = speed;
    
    if (direction !== 0) {
        this.setState('walking');
    } else if (this.currentState === 'walking') {
        this.setState('idle');
    }
};

Fighter.prototype.jump = function() {
    if (!this.grounded || !this.canAct) return;
    
    this.velocity.y = this.jumpHeight;
    this.grounded = false;
    this.setState('jumping');
};

Fighter.prototype.crouch = function() {
    if (!this.grounded || !this.canAct) return;
    
    this.setState('crouching');
};

Fighter.prototype.block = function() {
    if (!this.canAct) return;
    
    this.isBlocking = true;
    this.setState('blocking');
};

Fighter.prototype.setState = function(newState) {
    if (this.currentState !== newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateTimer = 0;
        this.animationTimer = 0;
    }
};

Fighter.prototype.updateStateMachine = function(dt) {
    // Handle move completion
    if (this.currentMove) {
        const moveData = this.currentMove.data;
        const totalFrames = moveData.startupFrames + moveData.activeFrames + moveData.recoveryFrames;
        
        if (this.moveFrame >= totalFrames) {
            this.currentMove = null;
            this.moveFrame = 0;
            this.isAttacking = false;
            this.canAct = true;
            this.setState('idle');
        }
    }
    
    // Return to idle state
    if (this.canAct && !this.isAttacking && this.grounded) {
        if (this.currentState !== 'idle' && this.currentState !== 'walking' && 
            this.currentState !== 'crouching' && this.currentState !== 'blocking') {
            this.setState('idle');
        }
    }
};

Fighter.prototype.updateMovement = function(dt) {
    const position = this.entity.getPosition();
    
    // Apply velocity
    position.x += this.velocity.x * dt;
    position.y += this.velocity.y * dt;
    
    // Apply gravity
    if (!this.grounded) {
        this.velocity.y -= 980 * dt; // Gravity
        
        // Check for landing
        if (position.y <= -170) { // Ground level
            position.y = -170;
            this.velocity.y = 0;
            this.grounded = true;
            
            if (this.currentState === 'jumping') {
                this.setState('idle');
            }
        }
    } else {
        // Ground friction
        this.velocity.x *= 0.8;
        if (Math.abs(this.velocity.x) < 10) {
            this.velocity.x = 0;
        }
    }
    
    // Stage boundaries
    position.x = Math.max(-400, Math.min(400, position.x));
    
    this.entity.setPosition(position);
};

Fighter.prototype.updateFacing = function() {
    const opponent = this.getOpponent();
    if (!opponent) return;
    
    const myPos = this.entity.getPosition();
    const opponentPos = opponent.getPosition();
    
    // Face opponent
    if (myPos.x < opponentPos.x) {
        this.facingDirection = 1; // Facing right
    } else {
        this.facingDirection = -1; // Facing left
    }
    
    // Update visual facing
    const scale = this.entity.getLocalScale();
    scale.x = Math.abs(scale.x) * this.facingDirection;
    this.entity.setLocalScale(scale);
};

Fighter.prototype.updateVisuals = function() {
    // Update sprite color based on state
    if (this.entity.sprite) {
        let color = new pc.Color(1, 0.8, 0.6); // Default skin tone
        
        if (this.isInHitstun) {
            color = new pc.Color(1, 0.5, 0.5); // Red tint when hit
        } else if (this.isBlocking) {
            color = new pc.Color(0.7, 0.7, 1); // Blue tint when blocking
        } else if (this.isAttacking) {
            color = new pc.Color(1, 1, 0.7); // Yellow tint when attacking
        }
        
        this.entity.sprite.color = color;
    }
};

Fighter.prototype.getOpponent = function() {
    if (!window.game) return null;
    
    const opponentNumber = this.playerNumber === 1 ? 2 : 1;
    return window.game.getPlayer(opponentNumber);
};

// Damage handling
Fighter.prototype.takeDamage = function(damage, hitstun, knockdown) {
    this.health = Math.max(0, this.health - damage);
    this.hitstunFrames = hitstun;
    this.isInHitstun = true;
    this.canAct = false;
    
    if (knockdown) {
        this.grounded = false;
        this.velocity.y = 200; // Knockdown bounce
    }
    
    console.log(`${this.characterData.name} took ${damage} damage (Health: ${this.health})`);
};

Fighter.prototype.takeBlockstun = function(blockstun) {
    this.blockstunFrames = blockstun;
    this.isInBlockstun = true;
    this.canAct = false;
};

// Meter building
Fighter.prototype.buildMeter = function(amount) {
    this.meter = Math.min(this.maxMeter, this.meter + amount);
};