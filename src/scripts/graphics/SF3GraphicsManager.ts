/**
 * SF3GraphicsManager - Street Fighter 3: Third Strike Graphics System
 * Implements the legendary fluid animation and visual style of SF3:3S
 * Features: Hand-drawn animation feel, muted atmospheric palettes, fluid motion
 */

import { type ISystem } from '../../../types/core.js';
import {
    type VisualStyle,
    type AnimationSystem,
    type MaterialSet,
    type LightingSystem,
    type EffectPools,
    type StageElements,
    type PerformanceSettings,
    type CharacterAnimator,
    type AnimationData,
    type CombatHitEvent,
    type SuperMoveEvent,
    type ParryEvent,
    type EffectType,
    type PlayerId,
    DEFAULT_VISUAL_STYLE,
    DEFAULT_PERFORMANCE_SETTINGS
} from '../../../types/graphics.js';

export class SF3GraphicsManager implements ISystem {
    private readonly app: pc.Application;
    private initialized: boolean = false;
    
    // SF3:3S Visual Style Configuration
    private readonly visualStyle: VisualStyle = { ...DEFAULT_VISUAL_STYLE };
    
    // Animation system for fluid SF3-style motion
    private readonly animationSystem: AnimationSystem = {
        characterAnimators: new Map<string, CharacterAnimator>(),
        spriteAtlases: new Map<string, any>(),
        frameData: new Map<string, AnimationData>(),
        interpolationCurves: new Map<string, pc.CurveSet>()
    };
    
    // Material system for SF3 visual effects
    private readonly materials: MaterialSet = {
        characterBase: null,
        characterHighlight: null,
        impactEffect: null,
        backgroundElements: null,
        stageReactive: null
    };
    
    // Dynamic lighting system
    private readonly lightingSystem: LightingSystem = {
        characterLights: new Map<string, any>(),
        environmentLights: [],
        dramatic: false,
        intensityMultiplier: 1.0
    };
    
    // Visual effects pools
    private readonly effectPools: EffectPools = {
        hitSparks: [],
        impactWaves: [],
        motionTrails: [],
        screenDistortion: [],
        parryFlash: []
    };
    
    // Stage interaction system
    private readonly stageElements: StageElements = {
        reactive: [],
        animated: [],
        dynamic: []
    };
    
    // Performance settings
    private readonly performanceSettings: PerformanceSettings = { ...DEFAULT_PERFORMANCE_SETTINGS };
    
    // Animation timing
    private animationFrameTime: number = 0;
    private lastAnimationUpdate: number = 0;
    private frameBlendAlpha?: number;
    private frameBlendSpeed?: number;

    constructor(app: pc.Application) {
        this.app = app;
    }

    public async initialize(): Promise<void> {
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

    private async createSF3Materials(): Promise<void> {
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

    private setupAnimationSystem(): void {
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

    private createInterpolationCurves(): void {
        // Smooth ease curves for natural motion (SF3 used rubber-like deformation)
        this.animationSystem.interpolationCurves.set('ease_out', new pc.CurveSet([
            new pc.Curve([
                new pc.Key(0, 0),
                new pc.Key(0.2, 0.8),
                new pc.Key(0.5, 0.95),
                new pc.Key(1, 1)
            ])
        ]));
        
        this.animationSystem.interpolationCurves.set('bounce', new pc.CurveSet([
            new pc.Curve([
                new pc.Key(0, 0),
                new pc.Key(0.3, 1.1),
                new pc.Key(0.7, 0.9),
                new pc.Key(1, 1)
            ])
        ]));
        
        this.animationSystem.interpolationCurves.set('rubber_band', new pc.CurveSet([
            new pc.Curve([
                new pc.Key(0, 0),
                new pc.Key(0.1, 1.2),
                new pc.Key(0.3, 0.8),
                new pc.Key(0.6, 1.05),
                new pc.Key(1, 1)
            ])
        ]));
        
        this.animationSystem.interpolationCurves.set('impact', new pc.CurveSet([
            new pc.Curve([
                new pc.Key(0, 0),
                new pc.Key(0.05, 2.0),
                new pc.Key(0.2, 0.5),
                new pc.Key(1, 1)
            ])
        ]));
    }

    private setupSF3Lighting(): void {
        // Character-specific lighting for dramatic effect
        this.createCharacterLighting('player1', this.visualStyle.colorPalette.playerOne);
        this.createCharacterLighting('player2', this.visualStyle.colorPalette.playerTwo);
        
        // Environmental lights for atmosphere
        this.createEnvironmentLighting();
        
        console.log('SF3 lighting system setup complete');
    }

    private createCharacterLighting(playerId: string, lightColor: pc.Color): void {
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

    private createEnvironmentLighting(): void {
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

    private createEffectPools(): void {
        // Create pools for common SF3 visual effects
        this.createHitSparkPool();
        this.createImpactWavePool();
        this.createMotionTrailPool();
        this.createParryFlashPool();
        
        console.log('SF3 effect pools created');
    }

    private createHitSparkPool(): void {
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

    private createImpactWavePool(): void {
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

    private createMotionTrailPool(): void {
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

    private createParryFlashPool(): void {
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

    private setupStageInteraction(): void {
        // SF3:3S had backgrounds that reacted to gameplay
        
        // Setup event listeners for stage reactions
        this.app.on('combat:hit', this.onCombatHit.bind(this));
        this.app.on('combat:super', this.onSuperMove.bind(this));
        this.app.on('combat:parry', this.onParry.bind(this));
        
        console.log('Stage interaction system setup complete');
    }

    // Public API for character management
    public createCharacter(playerId: string, characterData: any): pc.Entity {
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

    private setupCharacterLighting(character: pc.Entity, playerId: string): void {
        const lights = this.lightingSystem.characterLights.get(playerId);
        if (lights) {
            // Position lights relative to character
            const moveHandler = (position: pc.Vec3) => {
                lights.keyLight.setPosition(position.x, position.y + 3, position.z + 2);
                lights.fillLight.setPosition(position.x, position.y + 1, position.z + 1);
            };
            
            // Store handler reference for cleanup
            (character as any)._moveHandler = moveHandler;
            character.on('move', moveHandler);
        }
    }

    private createCharacterAnimator(character: pc.Entity, characterData: any): CharacterAnimator {
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
    public createHitEffect(position: pc.Vec3, power: number = 1.0, type: EffectType = 'normal'): void {
        const spark = this.getPooledEffect('hitSparks');
        if (!spark) return;
        
        spark.setPosition(position.x, position.y, position.z);
        spark.enabled = true;
        
        // Configure effect based on hit type
        const color = type === 'counter' ? 
            this.visualStyle.colorPalette.counterHit : 
            this.visualStyle.colorPalette.hitSpark;
            
        if (spark.render && spark.render.material) {
            spark.render.material.emissive = color;
        }
        
        if (spark.particlesystem) {
            spark.particlesystem.rate = power * 0.02;
            spark.particlesystem.startVelocity = power * 8;
        }
        
        // Auto-disable after effect duration
        setTimeout(() => {
            spark.enabled = false;
        }, 300);
        
        // Trigger stage reaction
        this.triggerStageReaction(position, power);
    }

    public createParryEffect(position: pc.Vec3): void {
        const flash = this.getPooledEffect('parryFlash');
        if (!flash) return;
        
        flash.setPosition(position.x, position.y, position.z);
        flash.enabled = true;
        
        if (flash.render && flash.render.material) {
            flash.render.material.emissive = this.visualStyle.colorPalette.blockSpark;
        }
        
        // Parry flash effect
        flash.setLocalScale(2, 2, 1);
        
        // Create tween animation
        const targetScale = new pc.Vec3(4, 4, 1);
        const endScale = new pc.Vec3(0, 0, 1);
        const originalScale = new pc.Vec3(1, 1, 1);
        
        // Manual animation since we can't guarantee tween library
        let elapsed = 0;
        const duration1 = 0.1;
        const duration2 = 0.2;
        
        const animate = () => {
            elapsed += 1/60; // Assume 60fps
            
            if (elapsed < duration1) {
                // First phase: expand
                const t = elapsed / duration1;
                const scale = flash.getLocalScale().lerp(targetScale, t);
                flash.setLocalScale(scale.x, scale.y, scale.z);
                requestAnimationFrame(animate);
            } else if (elapsed < duration1 + duration2) {
                // Second phase: shrink
                const t = (elapsed - duration1) / duration2;
                const scale = targetScale.clone().lerp(endScale, t);
                flash.setLocalScale(scale.x, scale.y, scale.z);
                requestAnimationFrame(animate);
            } else {
                // Complete
                flash.enabled = false;
                flash.setLocalScale(originalScale.x, originalScale.y, originalScale.z);
            }
        };
        
        requestAnimationFrame(animate);
    }

    public createSuperEffect(character: pc.Entity, superData: { duration?: number }): void {
        // Dramatic lighting change
        this.setDramaticLighting(true);
        
        // Screen effects
        this.app.fire('postprocess:super', superData);
        
        // Character highlighting
        if (character.render && this.materials.characterHighlight) {
            character.render.material = this.materials.characterHighlight;
        }
        
        // Reset after super duration
        setTimeout(() => {
            this.setDramaticLighting(false);
            if (character.render && this.materials.characterBase) {
                character.render.material = this.materials.characterBase;
            }
        }, superData.duration || 2000);
    }

    // Lighting control
    public setDramaticLighting(enabled: boolean): void {
        this.lightingSystem.dramatic = enabled;
        const multiplier = enabled ? 1.5 : 1.0;
        
        this.lightingSystem.characterLights.forEach((lights: any) => {
            if (lights.keyLight && lights.keyLight.light) {
                lights.keyLight.light.intensity = 1.5 * multiplier;
            }
            if (lights.rimLight && lights.rimLight.light) {
                lights.rimLight.light.intensity = 0.8 * multiplier;
            }
        });
        
        this.lightingSystem.environmentLights.forEach((light: pc.Entity) => {
            if (light.light) {
                light.light.intensity = 0.6 * (enabled ? 0.5 : 1.0);
            }
        });
    }

    // Event handlers
    private onCombatHit = (data: CombatHitEvent): void => {
        this.createHitEffect(data.position, data.power, data.type as EffectType);
    };

    private onSuperMove = (data: SuperMoveEvent): void => {
        this.createSuperEffect(data.character, data.superData);
    };

    private onParry = (data: ParryEvent): void => {
        this.createParryEffect(data.position);
    };

    private triggerStageReaction(position: pc.Vec3, intensity: number): void {
        // Animate reactive stage elements
        this.stageElements.reactive.forEach((element: pc.Entity) => {
            const distance = position.distance(element.getPosition());
            if (distance < 10) {
                const strength = Math.max(0, 1 - distance / 10) * intensity;
                this.animateStageElement(element, strength);
            }
        });
    }

    private animateStageElement(element: pc.Entity, strength: number): void {
        const originalScale = element.getLocalScale();
        const targetScale = originalScale.clone().scale(1 + strength * 0.1);
        
        // Simple manual animation
        let elapsed = 0;
        const expandDuration = 0.1;
        const contractDuration = 0.3;
        
        const animate = () => {
            elapsed += 1/60; // Assume 60fps
            
            if (elapsed < expandDuration) {
                // Expand phase
                const t = elapsed / expandDuration;
                const scale = originalScale.clone().lerp(targetScale, t);
                element.setLocalScale(scale.x, scale.y, scale.z);
                requestAnimationFrame(animate);
            } else if (elapsed < expandDuration + contractDuration) {
                // Contract phase with elastic effect
                const t = (elapsed - expandDuration) / contractDuration;
                const elasticT = 1 - Math.pow(2, -10 * t) * Math.cos((t - 0.1) * (2 * Math.PI) / 0.4);
                const scale = targetScale.clone().lerp(originalScale, elasticT);
                element.setLocalScale(scale.x, scale.y, scale.z);
                requestAnimationFrame(animate);
            } else {
                // Complete
                element.setLocalScale(originalScale.x, originalScale.y, originalScale.z);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Utility functions
    private getPooledEffect(poolName: keyof EffectPools): pc.Entity | null {
        const pool = this.effectPools[poolName];
        if (!pool) return null;
        
        return pool.find((effect: pc.Entity) => !effect.enabled) || null;
    }

    // Update loop
    public update(dt: number): void {
        if (!this.initialized) return;
        
        // Update animations
        this.updateAnimations(dt);
        
        // Update dynamic lighting
        this.updateLighting(dt);
        
        // Update stage elements
        this.updateStageElements(dt);
    }

    private updateAnimations(dt: number): void {
        this.animationSystem.characterAnimators.forEach((animator: CharacterAnimator) => {
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

    private advanceAnimationFrame(animator: CharacterAnimator): void {
        const animation = animator.animations[animator.currentAnimation];
        if (!animation) return;
        
        animator.frameIndex = (animator.frameIndex + 1) % animation.frameCount;
        
        // Apply rubber band motion if enabled
        if (animator.rubberBand) {
            this.applyRubberBandDeformation(animator);
        }
    }

    private updateFrameBlending(animator: CharacterAnimator, dt: number): void {
        // Smooth frame transitions for fluid motion
        if (this.frameBlendAlpha !== undefined && this.frameBlendSpeed !== undefined) {
            this.frameBlendAlpha += dt * this.frameBlendSpeed;
            if (this.frameBlendAlpha > 1) this.frameBlendAlpha = 1;
        }
    }

    private applyRubberBandDeformation(animator: CharacterAnimator): void {
        // SF3-style exaggerated deformation during motion
        const entity = animator.entity;
        const curve = this.animationSystem.interpolationCurves.get('rubber_band');
        
        if (curve && animator.currentAnimation.includes('attack')) {
            const deformation = curve.value(animator.frameIndex / 10);
            entity.setLocalScale(1 + deformation * 0.1, 1, 1);
        }
    }

    private updateLighting(dt: number): void {
        // Dynamic lighting updates
        if (this.lightingSystem.dramatic) {
            // Pulsing dramatic effect
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 1;
            this.lightingSystem.intensityMultiplier = pulse;
        }
    }

    private updateStageElements(dt: number): void {
        // Update animated background elements
        this.stageElements.animated.forEach((element: pc.Entity) => {
            // Simple breathing animation for background elements
            const time = Date.now() * 0.001;
            const scale = 1 + Math.sin(time) * 0.02;
            element.setLocalScale(scale, scale, 1);
        });
    }

    // Public getters
    public isInitialized(): boolean {
        return this.initialized;
    }

    public getVisualStyle(): VisualStyle {
        return { ...this.visualStyle };
    }

    public getCharacterAnimator(playerId: string): CharacterAnimator | undefined {
        return this.animationSystem.characterAnimators.get(playerId);
    }

    // Cleanup
    public destroy(): void {
        // Remove event listeners
        this.app.off('combat:hit', this.onCombatHit);
        this.app.off('combat:super', this.onSuperMove);
        this.app.off('combat:parry', this.onParry);
        
        // Cleanup character lighting
        this.lightingSystem.characterLights.forEach((lights: any) => {
            if (lights.keyLight && lights.keyLight.parent) lights.keyLight.destroy();
            if (lights.rimLight && lights.rimLight.parent) lights.rimLight.destroy();
            if (lights.fillLight && lights.fillLight.parent) lights.fillLight.destroy();
        });
        
        // Cleanup environment lights
        this.lightingSystem.environmentLights.forEach((light: pc.Entity) => {
            if (light.parent) light.destroy();
        });
        
        // Cleanup effect pools
        Object.values(this.effectPools).forEach((pool: pc.Entity[]) => {
            pool.forEach((effect: pc.Entity) => {
                if (effect.parent) effect.destroy();
            });
        });
        
        // Clear collections
        this.animationSystem.characterAnimators.clear();
        this.animationSystem.spriteAtlases.clear();
        this.animationSystem.frameData.clear();
        this.animationSystem.interpolationCurves.clear();
        this.lightingSystem.characterLights.clear();
        
        console.log('SF3 Graphics Manager destroyed');
    }
}