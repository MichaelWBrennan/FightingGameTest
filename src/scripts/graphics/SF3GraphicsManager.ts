/**
 * SF3GraphicsManager - HD-2D Fighting Game Graphics System
 * Implements fluid animation and visual style for 2D fighting games
 * Features: Hand-drawn animation feel, atmospheric palettes, fluid motion
 */

import * as pc from 'playcanvas';
import { ISystem } from '../../../types/core';
import { 
    VisualStyle, 
    AnimationSystem, 
    MaterialSet, 
    LightingSystem, 
    EffectPools, 
    PerformanceSettings, 
    StageElements,
    CharacterAnimator,
    CombatHitEvent,
    SuperMoveEvent,
    ParryEvent
} from '../../../types/graphics';

interface SF3GraphicsManagerState {
    initialized: boolean;
    visualStyle: VisualStyle;
    animationSystem: AnimationSystem;
    materials: MaterialSet;
    lightingSystem: LightingSystem;
    effectPools: EffectPools;
    performanceSettings: PerformanceSettings;
    stageElements: StageElements;
    animationFrameTime: number;
    lastAnimationUpdate: number;
    frameBlendAlpha?: number;
    frameBlendSpeed?: number;
}

export class SF3GraphicsManager implements ISystem {
    private app: pc.Application;
    private state: SF3GraphicsManagerState;

    constructor(app: pc.Application) {
        this.app = app;
        this.state = {
            initialized: false,
            visualStyle: {
                animationFrameRate: 60,
                frameBlending: true,
                motionBlur: true,
                rubberBandMotion: true,
                colorPalette: {
                    ambient: new pc.Color(0.15, 0.18, 0.22),
                    keyLight: new pc.Color(0.95, 0.90, 0.85),
                    rimLight: new pc.Color(0.60, 0.75, 0.95),
                    shadowTint: new pc.Color(0.25, 0.30, 0.45),
                    playerOne: new pc.Color(0.95, 0.85, 0.70),
                    playerTwo: new pc.Color(0.70, 0.85, 0.95),
                    hitSpark: new pc.Color(1.0, 0.9, 0.6),
                    blockSpark: new pc.Color(0.8, 0.9, 1.0),
                    counterHit: new pc.Color(1.0, 0.4, 0.4)
                },
                stageReaction: true,
                backgroundAnimation: true,
                dynamicElements: true
            },
            animationSystem: {
                characterAnimators: new Map(),
                spriteAtlases: new Map(),
                frameData: new Map(),
                interpolationCurves: new Map()
            },
            materials: {
                characterBase: null,
                characterHighlight: null,
                impactEffect: null,
                backgroundElements: null,
                stageReactive: null
            },
            lightingSystem: {
                characterLights: new Map(),
                environmentLights: [],
                dramatic: false,
                intensityMultiplier: 1.0
            },
            effectPools: {
                hitSparks: [],
                impactWaves: [],
                motionTrails: [],
                screenDistortion: [],
                parryFlash: []
            },
            performanceSettings: {
                maxParticles: 200,
                cullingDistance: 50,
                lodThreshold: 0.5,
                dynamicBatching: true
            },
            stageElements: {
                reactive: [],
                animated: [],
                dynamic: []
            },
            animationFrameTime: 0,
            lastAnimationUpdate: 0
        };
    }

    public async initialize(): Promise<void> {
        console.log('Initializing Graphics Manager...');
        
        try {
            // Create custom materials
            await this.createMaterials();
            
            // Setup animation system
            this.setupAnimationSystem();
            
            // Initialize lighting system
            this.setupLighting();
            
            // Create effect pools
            this.createEffectPools();
            
            // Setup stage interaction system
            this.setupStageInteraction();
            
            this.state.initialized = true;
            console.log('Graphics Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Graphics Manager:', error);
            throw error;
        }
    }

    private async createMaterials(): Promise<void> {
        // Character base material with hand-drawn look
        this.state.materials.characterBase = new pc.StandardMaterial();
        this.state.materials.characterBase.diffuse = new pc.Color(1, 1, 1);
        this.state.materials.characterBase.specular = new pc.Color(0.1, 0.1, 0.1);
        this.state.materials.characterBase.shininess = 5;
        this.state.materials.characterBase.metalness = 0;
        this.state.materials.characterBase.useMetalness = true;
        
        // Enable features for hand-drawn look
        this.state.materials.characterBase.useLighting = true;
        this.state.materials.characterBase.useSkybox = false;
        this.state.materials.characterBase.useFog = false;
        
        // Character highlight material for focus/selection
        this.state.materials.characterHighlight = new pc.StandardMaterial();
        this.state.materials.characterHighlight.diffuse = new pc.Color(1.2, 1.1, 1.0);
        this.state.materials.characterHighlight.emissive = new pc.Color(0.1, 0.1, 0.15);
        this.state.materials.characterHighlight.opacity = 0.9;
        this.state.materials.characterHighlight.blendType = pc.BLEND_NORMAL;
        
        // Impact effect material
        this.state.materials.impactEffect = new pc.StandardMaterial();
        this.state.materials.impactEffect.emissive = new pc.Color(1, 0.8, 0.4);
        this.state.materials.impactEffect.opacity = 0.8;
        this.state.materials.impactEffect.blendType = pc.BLEND_ADDITIVE;
        
        // Background elements material
        this.state.materials.backgroundElements = new pc.StandardMaterial();
        this.state.materials.backgroundElements.diffuse = new pc.Color(0.8, 0.85, 0.9);
        this.state.materials.backgroundElements.ambient = this.state.visualStyle.colorPalette.ambient;
        
        // Stage reactive material (for interactive elements)
        this.state.materials.stageReactive = new pc.StandardMaterial();
        this.state.materials.stageReactive.diffuse = new pc.Color(1, 1, 1);
        this.state.materials.stageReactive.emissive = new pc.Color(0, 0, 0);
        
        console.log('Materials created successfully');
    }

    private setupAnimationSystem(): void {
        // Configure for fluid animation
        this.state.animationFrameTime = 1000 / this.state.visualStyle.animationFrameRate;
        this.state.lastAnimationUpdate = 0;
        
        // Create interpolation curves for smooth motion
        this.createInterpolationCurves();
        
        // Setup frame blending for smoother animation
        if (this.state.visualStyle.frameBlending) {
            this.state.frameBlendAlpha = 0;
            this.state.frameBlendSpeed = 0.15;
        }
        
        console.log('Animation system configured');
    }

    private createInterpolationCurves(): void {
        // Smooth ease curves for natural motion
        this.state.animationSystem.interpolationCurves.set('ease_out', new pc.CurveSet([
            [0, 0], [0.2, 0.8], [0.5, 0.95], [1, 1]
        ]));
        
        this.state.animationSystem.interpolationCurves.set('bounce', new pc.CurveSet([
            [0, 0], [0.3, 1.1], [0.7, 0.9], [1, 1]
        ]));
        
        this.state.animationSystem.interpolationCurves.set('rubber_band', new pc.CurveSet([
            [0, 0], [0.1, 1.2], [0.3, 0.8], [0.6, 1.05], [1, 1]
        ]));
        
        this.state.animationSystem.interpolationCurves.set('impact', new pc.CurveSet([
            [0, 0], [0.05, 2.0], [0.2, 0.5], [1, 1]
        ]));
    }

    private setupLighting(): void {
        // Character-specific lighting for dramatic effect
        this.createCharacterLighting('player1', this.state.visualStyle.colorPalette.playerOne);
        this.createCharacterLighting('player2', this.state.visualStyle.colorPalette.playerTwo);
        
        // Environmental lights for atmosphere
        this.createEnvironmentLighting();
        
        console.log('Lighting system setup complete');
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
            color: this.state.visualStyle.colorPalette.rimLight,
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
        
        this.state.lightingSystem.characterLights.set(playerId, characterLight);
        
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
            color: this.state.visualStyle.colorPalette.ambient,
            intensity: 0.6,
            castShadows: true,
            shadowResolution: 1024
        });
        envLight.setEulerAngles(60, -20, 0);
        
        this.state.lightingSystem.environmentLights.push(envLight);
        this.app.root.addChild(envLight);
    }

    private createEffectPools(): void {
        // Create pools for common visual effects
        this.createHitSparkPool();
        this.createImpactWavePool();
        this.createMotionTrailPool();
        this.createParryFlashPool();
        
        console.log('Effect pools created');
    }

    private createHitSparkPool(): void {
        for (let i = 0; i < 50; i++) {
            const spark = new pc.Entity(`hitSpark_${i}`);
            spark.addComponent('render', {
                type: 'plane',
                material: this.state.materials.impactEffect!
            });
            spark.addComponent('particlesystem', {
                numParticles: 20,
                lifetime: 0.3,
                rate: 0.01,
                startVelocity: 5,
                endVelocity: 0
            });
            spark.enabled = false;
            this.state.effectPools.hitSparks.push(spark);
            this.app.root.addChild(spark);
        }
    }

    private createImpactWavePool(): void {
        for (let i = 0; i < 20; i++) {
            const wave = new pc.Entity(`impactWave_${i}`);
            wave.addComponent('render', {
                type: 'plane',
                material: this.state.materials.impactEffect!
            });
            wave.enabled = false;
            this.state.effectPools.impactWaves.push(wave);
            this.app.root.addChild(wave);
        }
    }

    private createMotionTrailPool(): void {
        for (let i = 0; i < 30; i++) {
            const trail = new pc.Entity(`motionTrail_${i}`);
            trail.addComponent('render', {
                type: 'plane',
                material: this.state.materials.characterHighlight!
            });
            trail.enabled = false;
            this.state.effectPools.motionTrails.push(trail);
            this.app.root.addChild(trail);
        }
    }

    private createParryFlashPool(): void {
        for (let i = 0; i < 10; i++) {
            const flash = new pc.Entity(`parryFlash_${i}`);
            flash.addComponent('render', {
                type: 'plane',
                material: this.state.materials.impactEffect!
            });
            flash.enabled = false;
            this.state.effectPools.parryFlash.push(flash);
            this.app.root.addChild(flash);
        }
    }

    private setupStageInteraction(): void {
        // Setup event listeners for stage reactions
        this.app.on('combat:hit', this.onCombatHit.bind(this));
        this.app.on('combat:super', this.onSuperMove.bind(this));
        this.app.on('combat:parry', this.onParry.bind(this));
        
        console.log('Stage interaction system setup complete');
    }

    // Public API for character management
    public createCharacter(playerId: string, characterData: any): pc.Entity {
        console.log(`Creating character: ${playerId}`);
        
        // Create character entity
        const character = new pc.Entity(playerId);
        
        // Add render component with material
        character.addComponent('render', {
            type: 'plane',
            material: this.state.materials.characterBase!
        });
        
        // Setup character-specific lighting
        this.setupCharacterLighting(character, playerId);
        
        // Create animation controller
        const animator = this.createCharacterAnimator(character, characterData);
        this.state.animationSystem.characterAnimators.set(playerId, animator);
        
        // Add to scene
        this.app.root.addChild(character);
        
        return character;
    }

    private setupCharacterLighting(character: pc.Entity, playerId: string): void {
        const lights = this.state.lightingSystem.characterLights.get(playerId);
        if (lights) {
            // Position lights relative to character
            // Note: In a real implementation, you would need to properly handle the move event
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
            motionBlur: this.state.visualStyle.motionBlur,
            rubberBand: this.state.visualStyle.rubberBandMotion,
            frameBlending: this.state.visualStyle.frameBlending
        };
    }

    // Visual effect triggers
    public createHitEffect(position: pc.Vec3, power: number = 1.0, type: string = 'normal'): void {
        const spark = this.getPooledEffect('hitSparks');
        if (!spark) return;
        
        spark.setPosition(position);
        spark.enabled = true;
        
        // Configure effect based on hit type
        const color = type === 'counter' ? 
            this.state.visualStyle.colorPalette.counterHit : 
            this.state.visualStyle.colorPalette.hitSpark;
            
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
        
        flash.setPosition(position);
        flash.enabled = true;
        if (flash.render && flash.render.material) {
            flash.render.material.emissive = this.state.visualStyle.colorPalette.blockSpark;
        }
        
        // Parry flash effect
        flash.setLocalScale(2, 2, 1);
        // Note: In a real implementation, you would need to properly handle the tweening
    }

    public createSuperEffect(character: pc.Entity, superData: any): void {
        // Dramatic lighting change
        this.setDramaticLighting(true);
        
        // Screen effects
        this.app.fire('postprocess:super', superData);
        
        // Character highlighting
        if (character.render) {
            character.render.material = this.state.materials.characterHighlight!;
        }
        
        // Reset after super duration
        setTimeout(() => {
            this.setDramaticLighting(false);
            if (character.render) {
                character.render.material = this.state.materials.characterBase!;
            }
        }, superData.duration || 2000);
    }

    // Lighting control
    public setDramaticLighting(enabled: boolean): void {
        this.state.lightingSystem.dramatic = enabled;
        const multiplier = enabled ? 1.5 : 1.0;
        
        this.state.lightingSystem.characterLights.forEach(lights => {
            if (lights.keyLight.light) {
                lights.keyLight.light.intensity = 1.5 * multiplier;
            }
            if (lights.rimLight.light) {
                lights.rimLight.light.intensity = 0.8 * multiplier;
            }
        });
        
        this.state.lightingSystem.environmentLights.forEach(light => {
            if (light.light) {
                light.light.intensity = 0.6 * (enabled ? 0.5 : 1.0);
            }
        });
    }

    // Event handlers
    private onCombatHit(data: CombatHitEvent): void {
        this.createHitEffect(data.position, data.power, data.type);
    }

    private onSuperMove(data: SuperMoveEvent): void {
        this.createSuperEffect(data.character, data.superData);
    }

    private onParry(data: ParryEvent): void {
        // Create a position from the parry data
        const position = data.position || new pc.Vec3(0, 0, 0);
        this.createParryEffect(position);
    }

    private triggerStageReaction(position: pc.Vec3, intensity: number): void {
        // Animate reactive stage elements
        this.state.stageElements.reactive.forEach(element => {
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
        
        // Note: In a real implementation, you would need to properly handle the tweening
    }

    // Utility functions
    private getPooledEffect(poolName: keyof EffectPools): pc.Entity | null {
        const pool = this.state.effectPools[poolName];
        if (!pool) return null;
        
        return pool.find((effect: pc.Entity) => !effect.enabled) || null;
    }

    // Update loop
    public update(dt: number): void {
        if (!this.state.initialized) return;
        
        // Update animations
        this.updateAnimations(dt);
        
        // Update dynamic lighting
        this.updateLighting(dt);
        
        // Update stage elements
        this.updateStageElements(dt);
    }

    private updateAnimations(dt: number): void {
        this.state.animationSystem.characterAnimators.forEach(animator => {
            // Update frame timing
            animator.frameTime += dt * 1000;
            
            if (animator.frameTime >= this.state.animationFrameTime) {
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
        if (this.state.frameBlendAlpha !== undefined && this.state.frameBlendSpeed !== undefined) {
            this.state.frameBlendAlpha += dt * this.state.frameBlendSpeed;
            if (this.state.frameBlendAlpha > 1) this.state.frameBlendAlpha = 1;
        }
    }

    private applyRubberBandDeformation(animator: CharacterAnimator): void {
        // Exaggerated deformation during motion
        const entity = animator.entity;
        const curve = this.state.animationSystem.interpolationCurves.get('rubber_band');
        
        if (curve && animator.currentAnimation.includes('attack')) {
            const deformation = curve.value(animator.frameIndex / 10);
            entity.setLocalScale(1 + deformation * 0.1, 1, 1);
        }
    }

    private updateLighting(dt: number): void {
        // Dynamic lighting updates
        if (this.state.lightingSystem.dramatic) {
            // Pulsing dramatic effect
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 1;
            this.state.lightingSystem.intensityMultiplier = pulse;
        }
    }

    private updateStageElements(dt: number): void {
        // Update animated background elements
        this.state.stageElements.animated.forEach(element => {
            // Simple breathing animation for background elements
            const time = Date.now() * 0.001;
            const scale = 1 + Math.sin(time) * 0.02;
            element.setLocalScale(scale, scale, 1);
        });
    }

    public destroy(): void {
        // Clean up resources
        this.state.lightingSystem.characterLights.forEach(lights => {
            lights.keyLight.destroy();
            lights.rimLight.destroy();
            lights.fillLight.destroy();
        });
        
        this.state.lightingSystem.environmentLights.forEach(light => {
            light.destroy();
        });
        
        // Clean up effect pools
        Object.values(this.state.effectPools).forEach(pool => {
            pool.forEach(effect => {
                effect.destroy();
            });
        });
        
        console.log('SF3GraphicsManager destroyed');
    }
}
