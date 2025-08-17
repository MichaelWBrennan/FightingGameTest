/**
 * SF3GraphicsManager - Street Fighter 3: Third Strike Graphics System
 * Implements the legendary fluid animation and visual style of SF3:3S
 * Features: Hand-drawn animation feel, muted atmospheric palettes, fluid motion
 */
class SF3GraphicsManager {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        
        // SF3:3S Visual Style Configuration
        this.visualStyle = {
            // Character animation settings (SF3:3S had 700-1200 frames per character)
            animationFrameRate: 60,
            frameBlending: true,
            motionBlur: true,
            rubberBandMotion: true, // Exaggerated deformation
            
            // Color palette (muted, atmospheric like SF3:3S)
            colorPalette: {
                ambient: new pc.Color(0.15, 0.18, 0.22), // Cool blue-grey
                keyLight: new pc.Color(0.95, 0.90, 0.85), // Warm white
                rimLight: new pc.Color(0.60, 0.75, 0.95), // Cool blue rim
                shadowTint: new pc.Color(0.25, 0.30, 0.45), // Deep blue shadows
                
                // Character-specific lighting
                playerOne: new pc.Color(0.95, 0.85, 0.70), // Warm
                playerTwo: new pc.Color(0.70, 0.85, 0.95), // Cool
                
                // Impact effects
                hitSpark: new pc.Color(1.0, 0.9, 0.6),
                blockSpark: new pc.Color(0.8, 0.9, 1.0),
                counterHit: new pc.Color(1.0, 0.4, 0.4)
            },
            
            // Stage interaction (SF3:3S had reactive backgrounds)
            stageReaction: true,
            backgroundAnimation: true,
            dynamicElements: true
        };
        
        // Animation system for fluid SF3-style motion
        this.animationSystem = {
            characterAnimators: new Map(),
            spriteAtlases: new Map(),
            frameData: new Map(),
            interpolationCurves: new Map()
        };
        
        // Material system for SF3 visual effects
        this.materials = {
            characterBase: null,
            characterHighlight: null,
            impactEffect: null,
            backgroundElements: null,
            stageReactive: null
        };
        
        // Dynamic lighting system
        this.lightingSystem = {
            characterLights: new Map(),
            environmentLights: [],
            dramaTic: false, // Enhanced lighting for special moments
            intensityMultiplier: 1.0
        };
        
        // Visual effects pools
        this.effectPools = {
            hitSparks: [],
            impactWaves: [],
            motionTrails: [],
            screenDistortion: [],
            parryFlash: []
        };
        
        // Performance settings
        this.performanceSettings = {
            maxParticles: 200,
            cullingDistance: 50,
            lodThreshold: 0.5,
            dynamicBatching: true
        };
    }

    async initialize() {
        console.log('Initializing SF3 Graphics Manager...');
        
        try {
            // Create custom materials for SF3 style
            await this.createSF3Materials();
            
            // Setup animation system
            this.setupAnimationSystem();
            
            // Initialize lighting system
            this.setupSF3Lighting();
            
            // Create effect pools
            this.createEffectPools();
            
            // Setup stage interaction system
            this.setupStageInteraction();
            
            this.initialized = true;
            console.log('SF3 Graphics Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize SF3 Graphics Manager:', error);
            throw error;
        }
    }

    async createSF3Materials() {
        // Character base material with SF3-style shading
        this.materials.characterBase = new pc.StandardMaterial();
        this.materials.characterBase.diffuse = new pc.Color(1, 1, 1);
        this.materials.characterBase.specular = new pc.Color(0.1, 0.1, 0.1);
        this.materials.characterBase.shininess = 5;
        this.materials.characterBase.metalness = 0;
        this.materials.characterBase.useMetalness = true;
        
        // Enable features for hand-drawn look
        this.materials.characterBase.useLighting = true;
        this.materials.characterBase.useSkybox = false;
        this.materials.characterBase.useFog = false;
        
        // Character highlight material for focus/selection
        this.materials.characterHighlight = new pc.StandardMaterial();
        this.materials.characterHighlight.diffuse = new pc.Color(1.2, 1.1, 1.0);
        this.materials.characterHighlight.emissive = new pc.Color(0.1, 0.1, 0.15);
        this.materials.characterHighlight.opacity = 0.9;
        this.materials.characterHighlight.blendType = pc.BLEND_NORMAL;
        
        // Impact effect material
        this.materials.impactEffect = new pc.StandardMaterial();
        this.materials.impactEffect.emissive = new pc.Color(1, 0.8, 0.4);
        this.materials.impactEffect.opacity = 0.8;
        this.materials.impactEffect.blendType = pc.BLEND_ADDITIVE;
        
        // Background elements material
        this.materials.backgroundElements = new pc.StandardMaterial();
        this.materials.backgroundElements.diffuse = new pc.Color(0.8, 0.85, 0.9);
        this.materials.backgroundElements.ambient = this.visualStyle.colorPalette.ambient;
        
        // Stage reactive material (for interactive elements)
        this.materials.stageReactive = new pc.StandardMaterial();
        this.materials.stageReactive.diffuse = new pc.Color(1, 1, 1);
        this.materials.stageReactive.emissive = new pc.Color(0, 0, 0);
        
        console.log('SF3 materials created successfully');
    }

    setupAnimationSystem() {
        // Configure for SF3-style fluid animation
        this.animationFrameTime = 1000 / this.visualStyle.animationFrameRate;
        this.lastAnimationUpdate = 0;
        
        // Create interpolation curves for smooth motion
        this.createInterpolationCurves();
        
        // Setup frame blending for smoother animation
        if (this.visualStyle.frameBlending) {
            this.frameBlendAlpha = 0;
            this.frameBlendSpeed = 0.15;
        }
        
        console.log('SF3 animation system configured');
    }

    createInterpolationCurves() {
        // Smooth ease curves for natural motion (SF3 used rubber-like deformation)
        this.interpolationCurves.set('ease_out', new pc.CurveSet([
            [0, 0], [0.2, 0.8], [0.5, 0.95], [1, 1]
        ]));
        
        this.interpolationCurves.set('bounce', new pc.CurveSet([
            [0, 0], [0.3, 1.1], [0.7, 0.9], [1, 1]
        ]));
        
        this.interpolationCurves.set('rubber_band', new pc.CurveSet([
            [0, 0], [0.1, 1.2], [0.3, 0.8], [0.6, 1.05], [1, 1]
        ]));
        
        this.interpolationCurves.set('impact', new pc.CurveSet([
            [0, 0], [0.05, 2.0], [0.2, 0.5], [1, 1]
        ]));
    }

    setupSF3Lighting() {
        // Character-specific lighting for dramatic effect
        this.createCharacterLighting('player1', this.visualStyle.colorPalette.playerOne);
        this.createCharacterLighting('player2', this.visualStyle.colorPalette.playerTwo);
        
        // Environmental lights for atmosphere
        this.createEnvironmentLighting();
        
        console.log('SF3 lighting system setup complete');
    }

    createCharacterLighting(playerId, lightColor) {
        const characterLight = {
            keyLight: new pc.Entity(`${playerId}_keyLight`),
            rimLight: new pc.Entity(`${playerId}_rimLight`),
            fillLight: new pc.Entity(`${playerId}_fillLight`)
        };
        
        // Key light (main character illumination)
        characterLight.keyLight.addComponent('light', {
            type: pc.LIGHTTYPE_SPOT,
            color: lightColor,
            intensity: 1.5,
            range: 15,
            innerConeAngle: 30,
            outerConeAngle: 60,
            castShadows: true,
            shadowBias: 0.001
        });
        
        // Rim light (character separation)
        characterLight.rimLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: this.visualStyle.colorPalette.rimLight,
            intensity: 0.8,
            castShadows: false
        });
        
        // Fill light (ambient character lighting)
        characterLight.fillLight.addComponent('light', {
            type: pc.LIGHTTYPE_OMNI,
            color: new pc.Color(0.9, 0.95, 1.0),
            intensity: 0.3,
            range: 10,
            castShadows: false
        });
        
        this.lightingSystem.characterLights.set(playerId, characterLight);
        
        // Add to scene
        this.app.root.addChild(characterLight.keyLight);
        this.app.root.addChild(characterLight.rimLight);
        this.app.root.addChild(characterLight.fillLight);
    }

    createEnvironmentLighting() {
        // Atmospheric lighting for stage depth
        const envLight = new pc.Entity('EnvironmentLight');
        envLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: this.visualStyle.colorPalette.ambient,
            intensity: 0.6,
            castShadows: true,
            shadowResolution: 1024
        });
        envLight.setEulerAngles(60, -20, 0);
        
        this.lightingSystem.environmentLights.push(envLight);
        this.app.root.addChild(envLight);
    }

    createEffectPools() {
        // Create pools for common SF3 visual effects
        this.createHitSparkPool();
        this.createImpactWavePool();
        this.createMotionTrailPool();
        this.createParryFlashPool();
        
        console.log('SF3 effect pools created');
    }

    createHitSparkPool() {
        for (let i = 0; i < 50; i++) {
            const spark = new pc.Entity(`hitSpark_${i}`);
            spark.addComponent('render', {
                type: 'plane',
                material: this.materials.impactEffect
            });
            spark.addComponent('particlesystem', {
                numParticles: 20,
                lifetime: 0.3,
                rate: 0.01,
                startVelocity: 5,
                endVelocity: 0
            });
            spark.enabled = false;
            this.effectPools.hitSparks.push(spark);
            this.app.root.addChild(spark);
        }
    }

    createImpactWavePool() {
        for (let i = 0; i < 20; i++) {
            const wave = new pc.Entity(`impactWave_${i}`);
            wave.addComponent('render', {
                type: 'plane',
                material: this.materials.impactEffect
            });
            wave.enabled = false;
            this.effectPools.impactWaves.push(wave);
            this.app.root.addChild(wave);
        }
    }

    createMotionTrailPool() {
        for (let i = 0; i < 30; i++) {
            const trail = new pc.Entity(`motionTrail_${i}`);
            trail.addComponent('render', {
                type: 'plane',
                material: this.materials.characterHighlight
            });
            trail.enabled = false;
            this.effectPools.motionTrails.push(trail);
            this.app.root.addChild(trail);
        }
    }

    createParryFlashPool() {
        for (let i = 0; i < 10; i++) {
            const flash = new pc.Entity(`parryFlash_${i}`);
            flash.addComponent('render', {
                type: 'plane',
                material: this.materials.impactEffect
            });
            flash.enabled = false;
            this.effectPools.parryFlash.push(flash);
            this.app.root.addChild(flash);
        }
    }

    setupStageInteraction() {
        // SF3:3S had backgrounds that reacted to gameplay
        this.stageElements = {
            reactive: [],
            animated: [],
            dynamic: []
        };
        
        // Setup event listeners for stage reactions
        this.app.on('combat:hit', this.onCombatHit.bind(this));
        this.app.on('combat:super', this.onSuperMove.bind(this));
        this.app.on('combat:parry', this.onParry.bind(this));
        
        console.log('Stage interaction system setup complete');
    }

    // Public API for character management
    createCharacter(playerId, characterData) {
        console.log(`Creating SF3 character: ${playerId}`);
        
        // Create character entity
        const character = new pc.Entity(playerId);
        
        // Add render component with SF3 material
        character.addComponent('render', {
            type: 'plane',
            material: this.materials.characterBase
        });
        
        // Setup character-specific lighting
        this.setupCharacterLighting(character, playerId);
        
        // Create animation controller
        const animator = this.createCharacterAnimator(character, characterData);
        this.animationSystem.characterAnimators.set(playerId, animator);
        
        // Add to scene
        this.app.root.addChild(character);
        
        return character;
    }

    setupCharacterLighting(character, playerId) {
        const lights = this.lightingSystem.characterLights.get(playerId);
        if (lights) {
            // Position lights relative to character
            character.on('move', (position) => {
                lights.keyLight.setPosition(position.x, position.y + 3, position.z + 2);
                lights.fillLight.setPosition(position.x, position.y + 1, position.z + 1);
            });
        }
    }

    createCharacterAnimator(character, characterData) {
        return {
            entity: character,
            currentAnimation: 'idle',
            frameIndex: 0,
            frameTime: 0,
            animations: characterData.animations || {},
            blendTime: 0,
            lastFrame: null,
            
            // SF3-style animation properties
            motionBlur: this.visualStyle.motionBlur,
            rubberBand: this.visualStyle.rubberBandMotion,
            frameBlending: this.visualStyle.frameBlending
        };
    }

    // Visual effect triggers
    createHitEffect(position, power = 1.0, type = 'normal') {
        const spark = this.getPooledEffect('hitSparks');
        if (!spark) return;
        
        spark.setPosition(position);
        spark.enabled = true;
        
        // Configure effect based on hit type
        const color = type === 'counter' ? 
            this.visualStyle.colorPalette.counterHit : 
            this.visualStyle.colorPalette.hitSpark;
            
        spark.render.material.emissive = color;
        spark.particlesystem.rate = power * 0.02;
        spark.particlesystem.startVelocity = power * 8;
        
        // Auto-disable after effect duration
        setTimeout(() => {
            spark.enabled = false;
        }, 300);
        
        // Trigger stage reaction
        this.triggerStageReaction(position, power);
    }

    createParryEffect(position) {
        const flash = this.getPooledEffect('parryFlash');
        if (!flash) return;
        
        flash.setPosition(position);
        flash.enabled = true;
        flash.render.material.emissive = this.visualStyle.colorPalette.blockSpark;
        
        // Parry flash effect
        flash.setLocalScale(2, 2, 1);
        flash.tween(flash.getLocalScale())
            .to(new pc.Vec3(4, 4, 1), 0.1, pc.SineOut)
            .to(new pc.Vec3(0, 0, 1), 0.2, pc.SineIn)
            .on('complete', () => {
                flash.enabled = false;
                flash.setLocalScale(1, 1, 1);
            })
            .start();
    }

    createSuperEffect(character, superData) {
        // Dramatic lighting change
        this.setDramaticLighting(true);
        
        // Screen effects
        this.app.fire('postprocess:super', superData);
        
        // Character highlighting
        character.render.material = this.materials.characterHighlight;
        
        // Reset after super duration
        setTimeout(() => {
            this.setDramaticLighting(false);
            character.render.material = this.materials.characterBase;
        }, superData.duration || 2000);
    }

    // Lighting control
    setDramaticLighting(enabled) {
        this.lightingSystem.dramatic = enabled;
        const multiplier = enabled ? 1.5 : 1.0;
        
        this.lightingSystem.characterLights.forEach(lights => {
            lights.keyLight.light.intensity = 1.5 * multiplier;
            lights.rimLight.light.intensity = 0.8 * multiplier;
        });
        
        this.lightingSystem.environmentLights.forEach(light => {
            light.light.intensity = 0.6 * (enabled ? 0.5 : 1.0);
        });
    }

    // Event handlers
    onCombatHit(data) {
        this.createHitEffect(data.position, data.power, data.type);
    }

    onSuperMove(data) {
        this.createSuperEffect(data.character, data.superData);
    }

    onParry(data) {
        this.createParryEffect(data.position);
    }

    triggerStageReaction(position, intensity) {
        // Animate reactive stage elements
        this.stageElements.reactive.forEach(element => {
            const distance = position.distance(element.getPosition());
            if (distance < 10) {
                const strength = Math.max(0, 1 - distance / 10) * intensity;
                this.animateStageElement(element, strength);
            }
        });
    }

    animateStageElement(element, strength) {
        const originalScale = element.getLocalScale();
        const targetScale = originalScale.clone().scale(1 + strength * 0.1);
        
        element.tween(element.getLocalScale())
            .to(targetScale, 0.1, pc.SineOut)
            .to(originalScale, 0.3, pc.ElasticOut)
            .start();
    }

    // Utility functions
    getPooledEffect(poolName) {
        const pool = this.effectPools[poolName];
        if (!pool) return null;
        
        return pool.find(effect => !effect.enabled);
    }

    // Update loop
    update(dt) {
        if (!this.initialized) return;
        
        // Update animations
        this.updateAnimations(dt);
        
        // Update dynamic lighting
        this.updateLighting(dt);
        
        // Update stage elements
        this.updateStageElements(dt);
    }

    updateAnimations(dt) {
        this.animationSystem.characterAnimators.forEach(animator => {
            // Update frame timing
            animator.frameTime += dt * 1000;
            
            if (animator.frameTime >= this.animationFrameTime) {
                this.advanceAnimationFrame(animator);
                animator.frameTime = 0;
            }
            
            // Apply frame blending if enabled
            if (animator.frameBlending) {
                this.updateFrameBlending(animator, dt);
            }
        });
    }

    advanceAnimationFrame(animator) {
        const animation = animator.animations[animator.currentAnimation];
        if (!animation) return;
        
        animator.frameIndex = (animator.frameIndex + 1) % animation.frameCount;
        
        // Apply rubber band motion if enabled
        if (animator.rubberBand) {
            this.applyRubberBandDeformation(animator);
        }
    }

    updateFrameBlending(animator, dt) {
        // Smooth frame transitions for fluid motion
        this.frameBlendAlpha += dt * this.frameBlendSpeed;
        if (this.frameBlendAlpha > 1) this.frameBlendAlpha = 1;
    }

    applyRubberBandDeformation(animator) {
        // SF3-style exaggerated deformation during motion
        const entity = animator.entity;
        const curve = this.interpolationCurves.get('rubber_band');
        
        if (curve && animator.currentAnimation.includes('attack')) {
            const deformation = curve.value(animator.frameIndex / 10);
            entity.setLocalScale(1 + deformation * 0.1, 1, 1);
        }
    }

    updateLighting(dt) {
        // Dynamic lighting updates
        if (this.lightingSystem.dramatic) {
            // Pulsing dramatic effect
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 1;
            this.lightingSystem.intensityMultiplier = pulse;
        }
    }

    updateStageElements(dt) {
        // Update animated background elements
        this.stageElements.animated.forEach(element => {
            // Simple breathing animation for background elements
            const time = Date.now() * 0.001;
            const scale = 1 + Math.sin(time) * 0.02;
            element.setLocalScale(scale, scale, 1);
        });
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SF3GraphicsManager;
}