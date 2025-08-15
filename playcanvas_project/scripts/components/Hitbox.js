// Hitbox component for visualizing and debugging collision boxes
var Hitbox = pc.createScript('hitbox');

// Hitbox properties
Hitbox.attributes.add('isHitbox', {
    type: 'boolean',
    default: true,
    title: 'Is Hitbox (vs Hurtbox)'
});

Hitbox.attributes.add('damage', {
    type: 'number',
    default: 50,
    title: 'Damage'
});

Hitbox.attributes.add('hitstun', {
    type: 'number',
    default: 12,
    title: 'Hitstun Frames'
});

Hitbox.attributes.add('blockstun', {
    type: 'number',
    default: 8,
    title: 'Blockstun Frames'
});

Hitbox.attributes.add('lifetime', {
    type: 'number',
    default: 5,
    title: 'Lifetime (frames)'
});

// Initialize code called once per entity
Hitbox.prototype.initialize = function() {
    this.frameCounter = 0;
    this.maxFrames = this.lifetime;
    this.hasHit = false;
    this.hitEntities = new Set();
    
    // Visual representation for debugging
    this.createVisualRepresentation();
    
    console.log(`Hitbox created: ${this.isHitbox ? 'Attack' : 'Hurt'} box`);
};

Hitbox.prototype.createVisualRepresentation = function() {
    // Only show visual representation in debug mode
    if (!window.DEBUG_HITBOXES) return;
    
    if (!this.entity.sprite) {
        this.entity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: this.isHitbox ? 
                new pc.Color(1, 0, 0, 0.3) :  // Red for hitboxes
                new pc.Color(0, 1, 0, 0.3),   // Green for hurtboxes
            width: 40,
            height: 40
        });
    }
};

// Update code called every frame
Hitbox.prototype.update = function(dt) {
    this.frameCounter++;
    
    // Expire hitbox after lifetime
    if (this.frameCounter >= this.maxFrames) {
        this.expire();
        return;
    }
    
    // Update visual representation
    this.updateVisual();
};

Hitbox.prototype.updateVisual = function() {
    if (!window.DEBUG_HITBOXES || !this.entity.sprite) return;
    
    // Fade out over time
    const alpha = 1 - (this.frameCounter / this.maxFrames);
    const color = this.entity.sprite.color;
    color.a = alpha * 0.3;
    this.entity.sprite.color = color;
};

Hitbox.prototype.expire = function() {
    console.log('Hitbox expired');
    this.entity.destroy();
};

// Check collision with another hitbox
Hitbox.prototype.checkCollision = function(otherHitbox) {
    if (!otherHitbox || otherHitbox.isHitbox === this.isHitbox) {
        return false; // Don't collide with same type
    }
    
    // Don't hit the same entity twice
    if (this.hitEntities.has(otherHitbox.entity.getGuid())) {
        return false;
    }
    
    // Simple AABB collision detection
    const pos1 = this.entity.getPosition();
    const pos2 = otherHitbox.entity.getPosition();
    
    const size1 = this.getSize();
    const size2 = otherHitbox.getSize();
    
    const left1 = pos1.x - size1.width / 2;
    const right1 = pos1.x + size1.width / 2;
    const top1 = pos1.y + size1.height / 2;
    const bottom1 = pos1.y - size1.height / 2;
    
    const left2 = pos2.x - size2.width / 2;
    const right2 = pos2.x + size2.width / 2;
    const top2 = pos2.y + size2.height / 2;
    const bottom2 = pos2.y - size2.height / 2;
    
    return !(left1 > right2 || right1 < left2 || top1 < bottom2 || bottom1 > top2);
};

Hitbox.prototype.getSize = function() {
    if (this.entity.sprite) {
        return {
            width: this.entity.sprite.width || 40,
            height: this.entity.sprite.height || 40
        };
    }
    return { width: 40, height: 40 };
};

// Handle collision
Hitbox.prototype.onCollision = function(otherHitbox) {
    if (this.isHitbox && !otherHitbox.isHitbox) {
        // This is an attack hitting a hurtbox
        this.processHit(otherHitbox);
    }
};

Hitbox.prototype.processHit = function(hurtbox) {
    // Mark that we've hit this entity
    this.hitEntities.add(hurtbox.entity.getGuid());
    this.hasHit = true;
    
    // Get the fighter component from the hit entity
    const hitFighter = hurtbox.entity.script?.fighter;
    if (hitFighter) {
        // Apply damage and hitstun
        hitFighter.takeDamage(this.damage, this.hitstun, false);
        
        // Create hit effect
        if (window.game?.animationSystem) {
            window.game.animationSystem.createEffect(
                'hit', 
                hurtbox.entity.getPosition(),
                0.5
            );
        }
        
        console.log(`Hit registered: ${this.damage} damage, ${this.hitstun} hitstun`);
    }
    
    // Expire the hitbox after hitting
    this.expire();
};