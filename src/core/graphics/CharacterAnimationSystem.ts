import * as pc from 'playcanvas';

export interface CharacterAnimation {
  name: string;
  duration: number;
  frames: AnimationFrame[];
  loop: boolean;
  blendMode: 'replace' | 'add' | 'multiply';
  speed: number;
  weight: number;
}

export interface AnimationFrame {
  frame: number;
  position: pc.Vec3;
  rotation: pc.Vec3;
  scale: pc.Vec3;
  boneTransforms: BoneTransform[];
}

export interface BoneTransform {
  boneName: string;
  position: pc.Vec3;
  rotation: pc.Vec3;
  scale: pc.Vec3;
}

export interface AnimationState {
  currentAnimation: string | null;
  animationTime: number;
  animationSpeed: number;
  isPlaying: boolean;
  isLooping: boolean;
  blendWeight: number;
  nextAnimation: string | null;
  transitionTime: number;
}

export class CharacterAnimationSystem {
  private app: pc.Application;
  private characterAnimations: Map<string, CharacterAnimation> = new Map();
  private animationStates: Map<string, AnimationState> = new Map();
  private animationQueue: Map<string, string[]> = new Map();
  private transitionCurves: Map<string, (t: number) => number> = new Map();
  
  // Animation parameters
  private defaultTransitionTime: number = 0.3;
  private maxBlendWeight: number = 1.0;
  private minBlendWeight: number = 0.0;
  
  // Animation types
  private animationTypes = [
    'idle', 'walk', 'run', 'jump', 'attack', 'special', 'super',
    'hit', 'block', 'victory', 'defeat', 'taunt', 'emote'
  ];

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeAnimationSystem();
    this.setupTransitionCurves();
  }

  private initializeAnimationSystem(): void {
    // Initialize transition curves
    this.transitionCurves.set('linear', (t: number) => t);
    this.transitionCurves.set('easeIn', (t: number) => t * t);
    this.transitionCurves.set('easeOut', (t: number) => 1 - (1 - t) * (1 - t));
    this.transitionCurves.set('easeInOut', (t: number) => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
  }

  private setupTransitionCurves(): void {
    // Add more transition curves
    this.transitionCurves.set('smooth', (t: number) => t * t * (3 - 2 * t));
    this.transitionCurves.set('bounce', (t: number) => t < 0.5 ? 4 * t * t : 1 - 4 * (1 - t) * (1 - t));
    this.transitionCurves.set('elastic', (t: number) => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1);
  }

  public addAnimation(characterId: string, animation: CharacterAnimation): void {
    this.characterAnimations.set(`${characterId}_${animation.name}`, animation);
  }

  public playAnimation(characterId: string, animationName: string, options: {
    loop?: boolean;
    speed?: number;
    weight?: number;
    transitionTime?: number;
    transitionCurve?: string;
  } = {}): void {
    const fullAnimationName = `${characterId}_${animationName}`;
    const animation = this.characterAnimations.get(fullAnimationName);
    
    if (!animation) {
      console.warn(`Animation ${animationName} not found for character ${characterId}`);
      return;
    }
    
    const state = this.getOrCreateAnimationState(characterId);
    const transitionTime = options.transitionTime || this.defaultTransitionTime;
    const transitionCurve = options.transitionCurve || 'smooth';
    
    // Set up transition
    if (state.currentAnimation && state.currentAnimation !== fullAnimationName) {
      state.nextAnimation = fullAnimationName;
      state.transitionTime = transitionTime;
      state.blendWeight = 0.0;
    } else {
      state.currentAnimation = fullAnimationName;
      state.nextAnimation = null;
      state.transitionTime = 0;
      state.blendWeight = 1.0;
    }
    
    // Apply options
    state.isLooping = options.loop !== undefined ? options.loop : animation.loop;
    state.animationSpeed = options.speed !== undefined ? options.speed : animation.speed;
    state.isPlaying = true;
    state.animationTime = 0;
    
    // Fire animation start event
    this.app.fire('animation:started', {
      characterId,
      animationName,
      options
    });
  }

  public stopAnimation(characterId: string, animationName?: string): void {
    const state = this.animationStates.get(characterId);
    if (!state) return;
    
    if (animationName) {
      const fullAnimationName = `${characterId}_${animationName}`;
      if (state.currentAnimation === fullAnimationName) {
        state.isPlaying = false;
        state.currentAnimation = null;
        state.animationTime = 0;
      }
    } else {
      state.isPlaying = false;
      state.currentAnimation = null;
      state.animationTime = 0;
    }
    
    // Fire animation stop event
    this.app.fire('animation:stopped', {
      characterId,
      animationName
    });
  }

  public pauseAnimation(characterId: string): void {
    const state = this.animationStates.get(characterId);
    if (state) {
      state.isPlaying = false;
    }
  }

  public resumeAnimation(characterId: string): void {
    const state = this.animationStates.get(characterId);
    if (state) {
      state.isPlaying = true;
    }
  }

  public setAnimationSpeed(characterId: string, speed: number): void {
    const state = this.animationStates.get(characterId);
    if (state) {
      state.animationSpeed = speed;
    }
  }

  public setAnimationWeight(characterId: string, weight: number): void {
    const state = this.animationStates.get(characterId);
    if (state) {
      state.blendWeight = Math.max(this.minBlendWeight, Math.min(this.maxBlendWeight, weight));
    }
  }

  public queueAnimation(characterId: string, animationName: string, options: any = {}): void {
    const queue = this.animationQueue.get(characterId) || [];
    queue.push(animationName);
    this.animationQueue.set(characterId, queue);
    
    // If no animation is currently playing, start the first one in queue
    const state = this.animationStates.get(characterId);
    if (!state || !state.isPlaying) {
      this.playNextInQueue(characterId);
    }
  }

  public clearAnimationQueue(characterId: string): void {
    this.animationQueue.delete(characterId);
  }

  public updateAnimation(characterId: string, deltaTime: number): void {
    const state = this.animationStates.get(characterId);
    if (!state || !state.isPlaying) return;
    
    const animation = this.characterAnimations.get(state.currentAnimation || '');
    if (!animation) return;
    
    // Update animation time
    state.animationTime += deltaTime * state.animationSpeed;
    
    // Check if animation should loop
    if (state.animationTime >= animation.duration) {
      if (state.isLooping) {
        state.animationTime = 0;
      } else {
        // Animation finished, check queue
        this.playNextInQueue(characterId);
        return;
      }
    }
    
    // Update character transform based on animation
    this.updateCharacterTransform(characterId, animation, state.animationTime);
    
    // Handle transitions
    if (state.nextAnimation && state.transitionTime > 0) {
      this.updateTransition(characterId, deltaTime);
    }
  }

  private updateCharacterTransform(characterId: string, animation: CharacterAnimation, time: number): void {
    const character = this.app.root.findByName(`Character_${characterId}`);
    if (!character) return;
    
    // Find the current frame
    const frameIndex = Math.floor(time * 60); // Assuming 60 FPS
    const frame = animation.frames[frameIndex];
    
    if (!frame) return;
    
    // Apply frame transform
    character.setPosition(frame.position);
    character.setEulerAngles(frame.rotation);
    character.setLocalScale(frame.scale);
    
    // Apply bone transforms
    this.applyBoneTransforms(character, frame.boneTransforms);
  }

  private applyBoneTransforms(character: pc.Entity, boneTransforms: BoneTransform[]): void {
    // This would apply bone transforms to the character's skeleton
    // For now, we'll just log the transforms
    boneTransforms.forEach(transform => {
      // Apply transform to specific bone
      const bone = character.findByName(transform.boneName);
      if (bone) {
        bone.setPosition(transform.position);
        bone.setEulerAngles(transform.rotation);
        bone.setLocalScale(transform.scale);
      }
    });
  }

  private updateTransition(characterId: string, deltaTime: number): void {
    const state = this.animationStates.get(characterId);
    if (!state || !state.nextAnimation) return;
    
    state.transitionTime -= deltaTime;
    
    if (state.transitionTime <= 0) {
      // Transition complete
      state.currentAnimation = state.nextAnimation;
      state.nextAnimation = null;
      state.transitionTime = 0;
      state.blendWeight = 1.0;
    } else {
      // Update blend weight
      const progress = 1 - (state.transitionTime / this.defaultTransitionTime);
      const curve = this.transitionCurves.get('smooth') || ((t: number) => t);
      state.blendWeight = curve(progress);
    }
  }

  private playNextInQueue(characterId: string): void {
    const queue = this.animationQueue.get(characterId);
    if (!queue || queue.length === 0) return;
    
    const nextAnimation = queue.shift()!;
    this.playAnimation(characterId, nextAnimation);
  }

  private getOrCreateAnimationState(characterId: string): AnimationState {
    let state = this.animationStates.get(characterId);
    if (!state) {
      state = {
        currentAnimation: null,
        animationTime: 0,
        animationSpeed: 1.0,
        isPlaying: false,
        isLooping: false,
        blendWeight: 1.0,
        nextAnimation: null,
        transitionTime: 0
      };
      this.animationStates.set(characterId, state);
    }
    return state;
  }

  public getAnimationState(characterId: string): AnimationState | undefined {
    return this.animationStates.get(characterId);
  }

  public getCurrentAnimation(characterId: string): string | null {
    const state = this.animationStates.get(characterId);
    return state ? state.currentAnimation : null;
  }

  public isAnimationPlaying(characterId: string): boolean {
    const state = this.animationStates.get(characterId);
    return state ? state.isPlaying : false;
  }

  public getAnimationProgress(characterId: string): number {
    const state = this.animationStates.get(characterId);
    if (!state || !state.currentAnimation) return 0;
    
    const animation = this.characterAnimations.get(state.currentAnimation);
    if (!animation) return 0;
    
    return state.animationTime / animation.duration;
  }

  public getAnimationQueue(characterId: string): string[] {
    return this.animationQueue.get(characterId) || [];
  }

  public createIdleAnimation(characterId: string): void {
    const idleAnimation: CharacterAnimation = {
      name: 'idle',
      duration: 2.0,
      frames: this.generateIdleFrames(),
      loop: true,
      blendMode: 'replace',
      speed: 1.0,
      weight: 1.0
    };
    
    this.addAnimation(characterId, idleAnimation);
  }

  public createWalkAnimation(characterId: string): void {
    const walkAnimation: CharacterAnimation = {
      name: 'walk',
      duration: 1.0,
      frames: this.generateWalkFrames(),
      loop: true,
      blendMode: 'replace',
      speed: 1.0,
      weight: 1.0
    };
    
    this.addAnimation(characterId, walkAnimation);
  }

  public createAttackAnimation(characterId: string, attackType: string): void {
    const attackAnimation: CharacterAnimation = {
      name: `attack_${attackType}`,
      duration: 0.5,
      frames: this.generateAttackFrames(attackType),
      loop: false,
      blendMode: 'replace',
      speed: 1.0,
      weight: 1.0
    };
    
    this.addAnimation(characterId, attackAnimation);
  }

  private generateIdleFrames(): AnimationFrame[] {
    const frames: AnimationFrame[] = [];
    const frameCount = 120; // 2 seconds at 60 FPS
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / frameCount;
      const bob = Math.sin(time * Math.PI * 2) * 0.02; // Subtle breathing motion
      
      frames.push({
        frame: i,
        position: new pc.Vec3(0, bob, 0),
        rotation: new pc.Vec3(0, 0, 0),
        scale: new pc.Vec3(1, 1, 1),
        boneTransforms: []
      });
    }
    
    return frames;
  }

  private generateWalkFrames(): AnimationFrame[] {
    const frames: AnimationFrame[] = [];
    const frameCount = 60; // 1 second at 60 FPS
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / frameCount;
      const step = Math.sin(time * Math.PI * 2) * 0.1; // Walking motion
      const bob = Math.abs(Math.sin(time * Math.PI * 2)) * 0.05; // Head bobbing
      
      frames.push({
        frame: i,
        position: new pc.Vec3(step, bob, 0),
        rotation: new pc.Vec3(0, 0, 0),
        scale: new pc.Vec3(1, 1, 1),
        boneTransforms: []
      });
    }
    
    return frames;
  }

  private generateAttackFrames(attackType: string): AnimationFrame[] {
    const frames: AnimationFrame[] = [];
    const frameCount = 30; // 0.5 seconds at 60 FPS
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / frameCount;
      let position = new pc.Vec3(0, 0, 0);
      let rotation = new pc.Vec3(0, 0, 0);
      
      if (attackType === 'punch') {
        position = new pc.Vec3(time * 0.2, 0, 0);
        rotation = new pc.Vec3(0, 0, time * 10);
      } else if (attackType === 'kick') {
        position = new pc.Vec3(0, time * 0.3, 0);
        rotation = new pc.Vec3(time * 15, 0, 0);
      }
      
      frames.push({
        frame: i,
        position,
        rotation,
        scale: new pc.Vec3(1, 1, 1),
        boneTransforms: []
      });
    }
    
    return frames;
  }

  public destroy(): void {
    this.characterAnimations.clear();
    this.animationStates.clear();
    this.animationQueue.clear();
    this.transitionCurves.clear();
  }
}