import * as pc from 'playcanvas';

export interface Particle {
  position: pc.Vec3;
  velocity: pc.Vec3;
  acceleration: pc.Vec3;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: pc.Color;
  alpha: number;
  scale: number;
  texture?: pc.Texture;
  uvOffset: pc.Vec2;
  uvScale: pc.Vec2;
}

export interface ParticleEmitter {
  id: string;
  position: pc.Vec3;
  enabled: boolean;
  emissionRate: number;
  maxParticles: number;
  particleLife: { min: number; max: number };
  particleSize: { min: number; max: number };
  particleSpeed: { min: number; max: number };
  particleDirection: { min: pc.Vec3; max: pc.Vec3 };
  particleColor: { start: pc.Color; end: pc.Color };
  particleAlpha: { start: number; end: number };
  particleScale: { start: number; end: number };
  texture?: pc.Texture;
  uvAnimation?: {
    enabled: boolean;
    frameCount: number;
    frameRate: number;
    loop: boolean;
  };
  gravity: pc.Vec3;
  wind: pc.Vec3;
  drag: number;
  burst?: {
    count: number;
    delay: number;
    lastBurst: number;
  };
  shape: 'point' | 'sphere' | 'box' | 'cone' | 'circle';
  shapeParams: {
    radius?: number;
    width?: number;
    height?: number;
    depth?: number;
    angle?: number;
  };
}

export class ParticleSystem {
  private app: pc.Application;
  private particles: Particle[] = [];
  private emitters: Map<string, ParticleEmitter> = new Map();
  private material: pc.Material | null = null;
  private mesh: pc.Mesh | null = null;
  private entity: pc.Entity | null = null;
  private isInitialized = false;
  private lastUpdateTime = 0;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public initialize(): void {
    if (this.isInitialized) return;

    // Create particle material
    this.material = new pc.Material();
    this.material.blendType = pc.BLEND_ADDITIVE;
    this.material.depthWrite = false;
    this.material.cull = pc.CULLFACE_NONE;
    this.material.alphaTest = 0.1;

    // Create particle mesh (quad)
    this.mesh = pc.createPlane(this.app.graphicsDevice, 1, 1);
    
    // Create entity
    this.entity = new pc.Entity('ParticleSystem');
    this.entity.addComponent('render', {
      mesh: this.mesh,
      material: this.material
    });
    this.app.root.addChild(this.entity);

    this.isInitialized = true;
  }

  public createEmitter(config: Partial<ParticleEmitter>): string {
    const id = config.id || `emitter_${Date.now()}_${Math.random()}`;
    
    const emitter: ParticleEmitter = {
      id,
      position: config.position || new pc.Vec3(0, 0, 0),
      enabled: config.enabled !== false,
      emissionRate: config.emissionRate || 10,
      maxParticles: config.maxParticles || 100,
      particleLife: config.particleLife || { min: 1, max: 3 },
      particleSize: config.particleSize || { min: 0.1, max: 0.5 },
      particleSpeed: config.particleSpeed || { min: 1, max: 5 },
      particleDirection: config.particleDirection || {
        min: new pc.Vec3(-1, -1, -1),
        max: new pc.Vec3(1, 1, 1)
      },
      particleColor: config.particleColor || {
        start: new pc.Color(1, 1, 1, 1),
        end: new pc.Color(1, 1, 1, 0)
      },
      particleAlpha: config.particleAlpha || { start: 1, end: 0 },
      particleScale: config.particleScale || { start: 1, end: 0 },
      texture: config.texture,
      uvAnimation: config.uvAnimation,
      gravity: config.gravity || new pc.Vec3(0, -9.81, 0),
      wind: config.wind || new pc.Vec3(0, 0, 0),
      drag: config.drag || 0.98,
      burst: config.burst,
      shape: config.shape || 'point',
      shapeParams: config.shapeParams || {}
    };

    this.emitters.set(id, emitter);
    return id;
  }

  public removeEmitter(id: string): void {
    this.emitters.delete(id);
  }

  public setEmitterEnabled(id: string, enabled: boolean): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.enabled = enabled;
    }
  }

  public setEmitterPosition(id: string, position: pc.Vec3): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.position = position.clone();
    }
  }

  public emitBurst(id: string, count?: number): void {
    const emitter = this.emitters.get(id);
    if (!emitter || !emitter.enabled) return;

    const burstCount = count || emitter.burst?.count || 10;
    for (let i = 0; i < burstCount; i++) {
      this.createParticle(emitter);
    }
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized) return;

    const currentTime = this.app.getTime();
    const dt = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Update emitters
    for (const emitter of this.emitters.values()) {
      if (!emitter.enabled) continue;

      // Continuous emission
      if (emitter.emissionRate > 0) {
        const particlesToEmit = emitter.emissionRate * dt;
        const fractionalPart = particlesToEmit - Math.floor(particlesToEmit);
        
        for (let i = 0; i < Math.floor(particlesToEmit); i++) {
          if (this.particles.length < emitter.maxParticles) {
            this.createParticle(emitter);
          }
        }

        // Handle fractional emission
        if (Math.random() < fractionalPart && this.particles.length < emitter.maxParticles) {
          this.createParticle(emitter);
        }
      }

      // Burst emission
      if (emitter.burst) {
        const timeSinceLastBurst = currentTime - emitter.lastBurst;
        if (timeSinceLastBurst >= emitter.burst.delay) {
          this.emitBurst(emitter.id, emitter.burst.count);
          emitter.lastBurst = currentTime;
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update physics
      particle.velocity.add(particle.acceleration.scale(dt));
      particle.velocity.add(emitter.gravity.scale(dt));
      particle.velocity.add(emitter.wind.scale(dt));
      particle.velocity.scale(emitter.drag);
      
      particle.position.add(particle.velocity.scale(dt));
      particle.rotation += particle.rotationSpeed * dt;
      
      // Update life
      particle.life -= dt;
      
      // Update visual properties
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      
      // Interpolate color
      particle.color.lerp(emitter.particleColor.start, emitter.particleColor.end, lifeRatio);
      
      // Interpolate alpha
      particle.alpha = pc.math.lerp(emitter.particleAlpha.start, emitter.particleAlpha.end, lifeRatio);
      
      // Interpolate scale
      particle.scale = pc.math.lerp(emitter.particleScale.start, emitter.particleScale.end, lifeRatio);
      
      // Update size
      particle.size = particle.scale * pc.math.lerp(emitter.particleSize.min, emitter.particleSize.max, lifeRatio);
      
      // Update UV animation
      if (emitter.uvAnimation?.enabled) {
        const frame = Math.floor(lifeRatio * emitter.uvAnimation.frameCount * emitter.uvAnimation.frameRate);
        const frameX = frame % emitter.uvAnimation.frameCount;
        const frameY = Math.floor(frame / emitter.uvAnimation.frameCount);
        
        particle.uvOffset.x = frameX / emitter.uvAnimation.frameCount;
        particle.uvOffset.y = frameY / emitter.uvAnimation.frameCount;
        particle.uvScale.x = 1 / emitter.uvAnimation.frameCount;
        particle.uvScale.y = 1 / emitter.uvAnimation.frameCount;
      }
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update render
    this.updateRender();
  }

  private createParticle(emitter: ParticleEmitter): void {
    const particle: Particle = {
      position: this.getEmissionPosition(emitter),
      velocity: this.getEmissionVelocity(emitter),
      acceleration: new pc.Vec3(0, 0, 0),
      life: pc.math.random(emitter.particleLife.min, emitter.particleLife.max),
      maxLife: pc.math.random(emitter.particleLife.min, emitter.particleLife.max),
      size: pc.math.random(emitter.particleSize.min, emitter.particleSize.max),
      rotation: pc.math.random(0, Math.PI * 2),
      rotationSpeed: pc.math.random(-2, 2),
      color: emitter.particleColor.start.clone(),
      alpha: emitter.particleAlpha.start,
      scale: emitter.particleScale.start,
      texture: emitter.texture,
      uvOffset: new pc.Vec2(0, 0),
      uvScale: new pc.Vec2(1, 1)
    };

    this.particles.push(particle);
  }

  private getEmissionPosition(emitter: ParticleEmitter): pc.Vec3 {
    const pos = emitter.position.clone();

    switch (emitter.shape) {
      case 'point':
        return pos;

      case 'sphere':
        const radius = emitter.shapeParams.radius || 1;
        const spherePos = pc.math.randomSpherePoint();
        return pos.add(spherePos.scale(radius));

      case 'box':
        const width = emitter.shapeParams.width || 1;
        const height = emitter.shapeParams.height || 1;
        const depth = emitter.shapeParams.depth || 1;
        return pos.add(new pc.Vec3(
          pc.math.random(-width / 2, width / 2),
          pc.math.random(-height / 2, height / 2),
          pc.math.random(-depth / 2, depth / 2)
        ));

      case 'cone':
        const angle = emitter.shapeParams.angle || Math.PI / 4;
        const coneRadius = Math.tan(angle) * pc.math.random(0, 1);
        const coneAngle = pc.math.random(0, Math.PI * 2);
        return pos.add(new pc.Vec3(
          Math.cos(coneAngle) * coneRadius,
          pc.math.random(0, 1),
          Math.sin(coneAngle) * coneRadius
        ));

      case 'circle':
        const circleRadius = emitter.shapeParams.radius || 1;
        const circleAngle = pc.math.random(0, Math.PI * 2);
        return pos.add(new pc.Vec3(
          Math.cos(circleAngle) * circleRadius,
          0,
          Math.sin(circleAngle) * circleRadius
        ));

      default:
        return pos;
    }
  }

  private getEmissionVelocity(emitter: ParticleEmitter): pc.Vec3 {
    const speed = pc.math.random(emitter.particleSpeed.min, emitter.particleSpeed.max);
    const direction = new pc.Vec3(
      pc.math.random(emitter.particleDirection.min.x, emitter.particleDirection.max.x),
      pc.math.random(emitter.particleDirection.min.y, emitter.particleDirection.max.y),
      pc.math.random(emitter.particleDirection.min.z, emitter.particleDirection.max.z)
    );
    
    return direction.normalize().scale(speed);
  }

  private updateRender(): void {
    if (!this.entity || !this.material || this.particles.length === 0) return;

    // Update material properties
    this.material.diffuse = this.particles[0].color;
    this.material.opacity = this.particles[0].alpha;

    // Update entity position to follow camera or stay in world space
    // This would need to be implemented based on your camera system
  }

  public clearParticles(): void {
    this.particles.length = 0;
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public getEmitterCount(): number {
    return this.emitters.size;
  }

  public destroy(): void {
    this.particles.length = 0;
    this.emitters.clear();
    
    if (this.entity) {
      this.entity.destroy();
      this.entity = null;
    }
    
    if (this.material) {
      this.material.destroy();
      this.material = null;
    }
    
    if (this.mesh) {
      this.mesh.destroy();
      this.mesh = null;
    }
  }
}