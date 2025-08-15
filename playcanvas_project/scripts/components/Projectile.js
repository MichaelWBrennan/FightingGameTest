// Projectile component for special moves like fireballs
var Projectile = pc.createScript('projectile');

// Projectile attributes
Projectile.attributes.add('speed', {
    type: 'number',
    default: 300,
    title: 'Speed (units/second)'
});

Projectile.attributes.add('damage', {
    type: 'number',
    default: 100,
    title: 'Damage'
});

Projectile.attributes.add('lifetime', {
    type: 'number',
    default: 3,
    title: 'Lifetime (seconds)'
});

Projectile.attributes.add('direction', {
    type: 'vec3',
    default: [1, 0, 0],
    title: 'Direction Vector'
});

Projectile.attributes.add('projectileType', {
    type: 'string',
    default: 'fireball',
    title: 'Projectile Type'
});

// Initialize code called once per entity
Projectile.prototype.initialize = function() {
    this.velocity = new pc.Vec3();
    this.velocity.copy(this.direction);
    this.velocity.normalize();
    this.velocity.scale(this.speed);
    
    this.timeAlive = 0;
    this.hasHit = false;
    this.hitEntities = new Set();
    
    // Create visual representation
    this.createVisual();
    
    // Create hitbox
    this.createHitbox();
    
    console.log(`Projectile created: ${this.projectileType}`);
};

Projectile.prototype.createVisual = function() {
    if (!this.entity.sprite) {
        // Create sprite based on projectile type
        const color = this.getProjectileColor();
        const size = this.getProjectileSize();
        
        this.entity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: color,
            width: size.width,
            height: size.height
        });
    }
    
    // Add some visual effects
    this.addVisualEffects();
};

Projectile.prototype.getProjectileColor = function() {
    const colorMap = {
        'fireball': new pc.Color(1, 0.6, 0),      // Orange
        'hadoken': new pc.Color(0.5, 0.8, 1),    // Blue
        'sonic_boom': new pc.Color(1, 1, 0.5),   // Yellow
        'tiger_shot': new pc.Color(1, 0.8, 0),   // Golden
        'plasma': new pc.Color(0.8, 0.3, 1),     // Purple
        'energy_ball': new pc.Color(0.3, 1, 0.3) // Green
    };
    
    return colorMap[this.projectileType] || new pc.Color(1, 1, 1);
};

Projectile.prototype.getProjectileSize = function() {
    const sizeMap = {
        'fireball': { width: 40, height: 30 },
        'hadoken': { width: 45, height: 25 },
        'sonic_boom': { width: 50, height: 20 },
        'tiger_shot': { width: 35, height: 35 },
        'plasma': { width: 30, height: 30 },
        'energy_ball': { width: 25, height: 25 }
    };
    
    return sizeMap[this.projectileType] || { width: 40, height: 30 };
};

Projectile.prototype.addVisualEffects = function() {
    // Add trail effect by creating smaller sprites behind the projectile
    this.trail = [];
    this.maxTrailLength = 5;
    
    // Animation properties
    this.animationTimer = 0;
    this.animationSpeed = 8; // cycles per second
};

Projectile.prototype.createHitbox = function() {
    // Add hitbox component
    this.entity.addComponent('script');
    this.entity.script.create('hitbox', {
        attributes: {
            isHitbox: true,
            damage: this.damage,
            hitstun: 18,
            blockstun: 12,
            lifetime: this.lifetime * 60 // Convert to frames
        }
    });
};

// Update code called every frame
Projectile.prototype.update = function(dt) {
    this.timeAlive += dt;
    this.animationTimer += dt;
    
    // Check if projectile should expire
    if (this.timeAlive >= this.lifetime || this.hasHit) {
        this.destroy();
        return;
    }
    
    // Update position
    this.updateMovement(dt);
    
    // Update visual effects
    this.updateVisualEffects(dt);
    
    // Check for collisions
    this.checkCollisions();
    
    // Check bounds
    this.checkBounds();
};

Projectile.prototype.updateMovement = function(dt) {
    const position = this.entity.getPosition();
    
    // Apply velocity
    position.x += this.velocity.x * dt;
    position.y += this.velocity.y * dt;
    position.z += this.velocity.z * dt;
    
    // Apply gravity for certain projectile types
    if (this.shouldApplyGravity()) {
        this.velocity.y -= 400 * dt; // Gravity
    }
    
    this.entity.setPosition(position);
};

Projectile.prototype.shouldApplyGravity = function() {
    const gravityProjectiles = ['energy_ball', 'plasma'];
    return gravityProjectiles.includes(this.projectileType);
};

Projectile.prototype.updateVisualEffects = function(dt) {
    if (!this.entity.sprite) return;
    
    // Animate color/opacity
    const pulseSpeed = this.animationSpeed;
    const pulse = Math.sin(this.animationTimer * pulseSpeed * Math.PI) * 0.3 + 0.7;
    
    const baseColor = this.getProjectileColor();
    this.entity.sprite.color = new pc.Color(
        baseColor.r * pulse,
        baseColor.g * pulse,
        baseColor.b * pulse,
        1.0
    );
    
    // Scale animation for certain types
    if (this.projectileType === 'hadoken') {
        const scale = 1 + Math.sin(this.animationTimer * pulseSpeed * 2) * 0.1;
        this.entity.setLocalScale(scale, scale, 1);
    }
    
    // Update trail effect
    this.updateTrail();
};

Projectile.prototype.updateTrail = function() {
    // Add current position to trail
    this.trail.push({
        position: this.entity.getPosition().clone(),
        time: this.timeAlive
    });
    
    // Remove old trail points
    while (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
    }
    
    // Note: In a full implementation, we would create visual trail entities
    // For now, we just track the positions
};

Projectile.prototype.checkCollisions = function() {
    // Get all entities in the scene
    const entities = this.app.root.findByTag('fighter');
    
    for (const entity of entities) {
        if (this.checkCollisionWithEntity(entity)) {
            this.onHit(entity);
            break;
        }
    }
};

Projectile.prototype.checkCollisionWithEntity = function(entity) {
    if (!entity || this.hitEntities.has(entity.getGuid())) {
        return false;
    }
    
    // Simple distance-based collision
    const myPos = this.entity.getPosition();
    const entityPos = entity.getPosition();
    const distance = myPos.distance(entityPos);
    
    const mySize = this.getProjectileSize();
    const collisionDistance = Math.max(mySize.width, mySize.height) / 2 + 40; // Fighter size
    
    return distance < collisionDistance;
};

Projectile.prototype.onHit = function(hitEntity) {
    console.log(`Projectile hit: ${hitEntity.name}`);
    
    this.hitEntities.add(hitEntity.getGuid());
    this.hasHit = true;
    
    // Apply damage to fighter
    const fighter = hitEntity.script?.fighter;
    if (fighter) {
        fighter.takeDamage(this.damage, 18, false);
        
        // Build meter for the projectile owner
        // Note: We'd need to track the owner to do this properly
    }
    
    // Create hit effect
    if (window.game?.animationSystem) {
        window.game.animationSystem.createEffect(
            'hit',
            hitEntity.getPosition(),
            0.5
        );
    }
    
    // Destroy projectile
    this.destroy();
};

Projectile.prototype.checkBounds = function() {
    const position = this.entity.getPosition();
    
    // Destroy if projectile goes off screen
    if (Math.abs(position.x) > 600 || Math.abs(position.y) > 400) {
        this.destroy();
    }
};

Projectile.prototype.destroy = function() {
    console.log(`Projectile destroyed: ${this.projectileType}`);
    
    // Create destruction effect
    if (window.game?.animationSystem && !this.hasHit) {
        window.game.animationSystem.createEffect(
            'projectile_fade',
            this.entity.getPosition(),
            0.3
        );
    }
    
    this.entity.destroy();
};

// Static method to create projectile
Projectile.createProjectile = function(app, owner, projectileData, direction) {
    const projectileEntity = new pc.Entity('Projectile');
    
    // Set position at owner's position with offset
    const ownerPos = owner.getPosition();
    const facing = owner.script?.fighter?.facingDirection || 1;
    projectileEntity.setPosition(
        ownerPos.x + (50 * facing), // Offset in front of character
        ownerPos.y,
        ownerPos.z
    );
    
    // Add projectile script
    projectileEntity.addComponent('script');
    projectileEntity.script.create('projectile', {
        attributes: {
            speed: projectileData.speed || 300,
            damage: projectileData.damage || 100,
            lifetime: projectileData.lifetime || 3,
            direction: [direction.x * facing, direction.y, direction.z],
            projectileType: projectileData.name || 'fireball'
        }
    });
    
    // Add to scene
    app.root.addChild(projectileEntity);
    
    console.log(`Created projectile: ${projectileData.name}`);
    return projectileEntity;
};