// Animation system for character sprites and visual effects
class AnimationSystem {
    constructor(app) {
        this.app = app;
        
        // Animation data storage
        this.animations = new Map(); // Character ID -> animation data
        this.activeAnimations = new Map(); // Entity ID -> current animation state
        
        // Sprite atlas cache
        this.spriteAtlases = new Map();
        
        // Animation frame timing
        this.frameRate = 60;
        this.animationSpeed = 1.0;
        
        console.log('Animation System initialized');
    }
    
    // Load character animations
    loadCharacterAnimations(characterId, animationData) {
        this.animations.set(characterId, animationData);
        console.log(`Loaded animations for ${characterId}`);
    }
    
    // Register an entity for animation tracking
    registerEntity(entity, characterId) {
        const entityId = entity.getGuid();
        
        this.activeAnimations.set(entityId, {
            entity: entity,
            characterId: characterId,
            currentAnimation: 'idle',
            currentFrame: 0,
            frameTimer: 0,
            isPlaying: true,
            loop: true,
            
            // Animation queue for combo sequences
            queuedAnimations: [],
            
            // State tracking
            lastState: 'idle',
            stateChangeTime: 0
        });
        
        // Set initial animation
        this.playAnimation(entity, 'idle', true);
        
        console.log(`Registered entity for animation: ${characterId}`);
    }
    
    // Play an animation on an entity
    playAnimation(entity, animationName, loop = false, priority = 0) {
        const entityId = entity.getGuid();
        const animationState = this.activeAnimations.get(entityId);
        
        if (!animationState) {
            console.warn('Entity not registered for animation');
            return false;
        }
        
        // Check if we have animation data for this character
        const characterAnimations = this.animations.get(animationState.characterId);
        if (!characterAnimations || !characterAnimations[animationName]) {
            console.warn(`Animation not found: ${animationName} for ${animationState.characterId}`);
            return false;
        }
        
        // Set new animation
        animationState.currentAnimation = animationName;
        animationState.currentFrame = 0;
        animationState.frameTimer = 0;
        animationState.isPlaying = true;
        animationState.loop = loop;
        animationState.stateChangeTime = Date.now();
        
        // Update visual representation
        this.updateEntityVisual(entity, animationName, 0);
        
        console.log(`Playing animation: ${animationName} on ${animationState.characterId}`);
        return true;
    }
    
    // Queue an animation to play after the current one finishes
    queueAnimation(entity, animationName, loop = false) {
        const entityId = entity.getGuid();
        const animationState = this.activeAnimations.get(entityId);
        
        if (!animationState) return false;
        
        animationState.queuedAnimations.push({
            name: animationName,
            loop: loop
        });
        
        return true;
    }
    
    // Update entity visual based on animation frame
    updateEntityVisual(entity, animationName, frameIndex) {
        // For now, we'll use color changes to represent different animations
        // In a full implementation, this would load and display sprite frames
        
        if (!entity.sprite) return;
        
        const baseColor = this.getAnimationColor(animationName);
        const brightness = 0.8 + (Math.sin(frameIndex * 0.5) * 0.2); // Subtle animation effect
        
        entity.sprite.color = new pc.Color(
            baseColor.r * brightness,
            baseColor.g * brightness,
            baseColor.b * brightness,
            1.0
        );
        
        // Adjust sprite size for different animations
        const scale = this.getAnimationScale(animationName);
        entity.setLocalScale(scale.x, scale.y, 1);
    }
    
    getAnimationColor(animationName) {
        // Different colors for different animation types
        const colorMap = {
            'idle': new pc.Color(1, 0.8, 0.6),        // Skin tone
            'walking': new pc.Color(1, 0.8, 0.6),     // Same as idle
            'jumping': new pc.Color(0.9, 0.9, 1),     // Light blue
            'crouching': new pc.Color(0.8, 0.8, 0.8), // Slightly gray
            'blocking': new pc.Color(0.7, 0.7, 1),    // Blue tint
            'attacking': new pc.Color(1, 1, 0.7),     // Yellow tint
            'hit': new pc.Color(1, 0.5, 0.5),         // Red tint
            'knockdown': new pc.Color(0.8, 0.4, 0.4), // Dark red
            
            // Attack animations
            'lightPunch': new pc.Color(1, 0.9, 0.5),
            'mediumPunch': new pc.Color(1, 0.8, 0.3),
            'heavyPunch': new pc.Color(1, 0.7, 0.1),
            'lightKick': new pc.Color(0.9, 1, 0.5),
            'mediumKick': new pc.Color(0.7, 1, 0.3),
            'heavyKick': new pc.Color(0.5, 1, 0.1),
            
            // Special move animations
            'hadoken': new pc.Color(0.5, 0.8, 1),     // Blue energy
            'shoryuken': new pc.Color(1, 0.6, 0),     // Orange flame
            'shinku_hadoken': new pc.Color(0.3, 0.6, 1), // Deeper blue
            
            // Default
            'default': new pc.Color(1, 0.8, 0.6)
        };
        
        return colorMap[animationName] || colorMap['default'];
    }
    
    getAnimationScale(animationName) {
        // Different scales for different animations
        const scaleMap = {
            'idle': { x: 1, y: 1 },
            'walking': { x: 1, y: 1 },
            'jumping': { x: 0.9, y: 1.2 },
            'crouching': { x: 1.1, y: 0.7 },
            'blocking': { x: 0.95, y: 1 },
            'attacking': { x: 1.1, y: 1 },
            'hit': { x: 0.9, y: 1 },
            'knockdown': { x: 1.3, y: 0.6 },
            
            // Attack animations with emphasis
            'lightPunch': { x: 1.05, y: 1 },
            'mediumPunch': { x: 1.1, y: 1 },
            'heavyPunch': { x: 1.2, y: 1 },
            'lightKick': { x: 1.05, y: 1.05 },
            'mediumKick': { x: 1.1, y: 1.1 },
            'heavyKick': { x: 1.2, y: 1.1 },
            
            // Special moves
            'hadoken': { x: 1, y: 1.1 },
            'shoryuken': { x: 0.9, y: 1.3 },
            'shinku_hadoken': { x: 1.2, y: 1.2 }
        };
        
        return scaleMap[animationName] || { x: 1, y: 1 };
    }
    
    // Get animation duration in frames
    getAnimationDuration(characterId, animationName) {
        const characterAnimations = this.animations.get(characterId);
        if (!characterAnimations || !characterAnimations[animationName]) {
            return 30; // Default duration
        }
        
        const animData = characterAnimations[animationName];
        return animData.frames ? animData.frames.length : 30;
    }
    
    // Update animation system each frame
    update(dt) {
        for (const [entityId, animationState] of this.activeAnimations) {
            if (!animationState.isPlaying) continue;
            
            // Update frame timer
            animationState.frameTimer += dt * this.frameRate * this.animationSpeed;
            
            // Check if we need to advance to next frame
            if (animationState.frameTimer >= 1.0) {
                animationState.frameTimer = 0;
                animationState.currentFrame++;
                
                const duration = this.getAnimationDuration(
                    animationState.characterId, 
                    animationState.currentAnimation
                );
                
                // Check if animation is complete
                if (animationState.currentFrame >= duration) {
                    if (animationState.loop) {
                        animationState.currentFrame = 0;
                    } else {
                        // Animation finished
                        animationState.isPlaying = false;
                        
                        // Play queued animation if any
                        if (animationState.queuedAnimations.length > 0) {
                            const nextAnim = animationState.queuedAnimations.shift();
                            this.playAnimation(
                                animationState.entity, 
                                nextAnim.name, 
                                nextAnim.loop
                            );
                        } else {
                            // Return to idle animation
                            this.playAnimation(animationState.entity, 'idle', true);
                        }
                    }
                }
                
                // Update visual representation
                this.updateEntityVisual(
                    animationState.entity,
                    animationState.currentAnimation,
                    animationState.currentFrame
                );
            }
        }
    }
    
    // Sync animation with fighter state
    syncWithFighterState(entity, fighterState) {
        const entityId = entity.getGuid();
        const animationState = this.activeAnimations.get(entityId);
        
        if (!animationState) return;
        
        let targetAnimation = 'idle';
        let shouldLoop = true;
        
        // Determine animation based on fighter state
        if (fighterState.currentMove) {
            targetAnimation = fighterState.currentMove.name;
            shouldLoop = false;
        } else if (fighterState.isInHitstun) {
            targetAnimation = 'hit';
            shouldLoop = false;
        } else if (fighterState.isBlocking) {
            targetAnimation = 'blocking';
            shouldLoop = true;
        } else {
            // Map fighter states to animations
            switch (fighterState.currentState) {
                case 'walking':
                    targetAnimation = 'walking';
                    break;
                case 'jumping':
                    targetAnimation = 'jumping';
                    shouldLoop = false;
                    break;
                case 'crouching':
                    targetAnimation = 'crouching';
                    break;
                default:
                    targetAnimation = 'idle';
                    break;
            }
        }
        
        // Only change animation if it's different
        if (animationState.currentAnimation !== targetAnimation) {
            this.playAnimation(entity, targetAnimation, shouldLoop);
        }
    }
    
    // Create visual effect at position
    createEffect(effectName, position, duration = 1.0) {
        const effectEntity = new pc.Entity(`Effect_${effectName}`);
        
        // Add sprite component for effect
        effectEntity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: this.getEffectColor(effectName),
            width: 40,
            height: 40
        });
        
        effectEntity.setPosition(position);
        this.app.root.addChild(effectEntity);
        
        // Animate effect
        this.animateEffect(effectEntity, effectName, duration);
        
        // Clean up after duration
        setTimeout(() => {
            if (effectEntity.parent) {
                effectEntity.destroy();
            }
        }, duration * 1000);
        
        return effectEntity;
    }
    
    getEffectColor(effectName) {
        const effectColors = {
            'hit': new pc.Color(1, 1, 0),      // Yellow flash
            'block': new pc.Color(0.5, 0.5, 1), // Blue spark
            'parry': new pc.Color(1, 0.5, 1),   // Purple flash
            'ko': new pc.Color(1, 0, 0),        // Red explosion
            'super_flash': new pc.Color(1, 1, 1) // White flash
        };
        
        return effectColors[effectName] || new pc.Color(1, 1, 1);
    }
    
    animateEffect(entity, effectName, duration) {
        const startTime = Date.now();
        const startScale = entity.getLocalScale().clone();
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / duration;
            
            if (progress >= 1) return;
            
            // Different animation patterns for different effects
            switch (effectName) {
                case 'hit':
                    // Scale up then fade
                    const scale = 1 + progress * 2;
                    const alpha = 1 - progress;
                    entity.setLocalScale(scale, scale, 1);
                    if (entity.sprite) {
                        entity.sprite.color.a = alpha;
                    }
                    break;
                    
                case 'block':
                    // Quick flash
                    const flash = Math.sin(progress * Math.PI * 8);
                    if (entity.sprite) {
                        entity.sprite.color.a = Math.abs(flash) * (1 - progress);
                    }
                    break;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // Clean up animation state for an entity
    unregisterEntity(entity) {
        const entityId = entity.getGuid();
        this.activeAnimations.delete(entityId);
    }
    
    // Get current animation info for debugging
    getAnimationInfo(entity) {
        const entityId = entity.getGuid();
        return this.activeAnimations.get(entityId);
    }
}

// Make AnimationSystem globally available
window.AnimationSystem = AnimationSystem;