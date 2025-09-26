import * as pc from 'playcanvas';

export interface MovementState {
  position: pc.Vec3;
  velocity: pc.Vec3;
  acceleration: pc.Vec3;
  facing: 'left' | 'right';
  grounded: boolean;
  airborne: boolean;
  dashing: boolean;
  backdashing: boolean;
  jumping: boolean;
  doubleJumping: boolean;
  wallJumping: boolean;
  wallSliding: boolean;
  momentum: number;
  friction: number;
  gravity: number;
}

export interface MovementTechnique {
  name: string;
  type: 'dash' | 'jump' | 'special' | 'cancel' | 'momentum';
  input: string[];
  requirements: MovementRequirements;
  effects: MovementEffects;
  cooldown: number;
  stamina: number;
}

export interface MovementRequirements {
  grounded?: boolean;
  airborne?: boolean;
  momentum?: number;
  stamina?: number;
  cooldown?: number;
  facing?: 'left' | 'right' | 'any';
}

export interface MovementEffects {
  velocity: pc.Vec3;
  acceleration: pc.Vec3;
  momentum: number;
  stamina: number;
  invincibility?: number;
  superArmor?: number;
  cancelWindow?: number;
}

export class AdvancedMovementSystem {
  private app: pc.Application;
  private movementState: MovementState;
  private movementTechniques: Map<string, MovementTechnique> = new Map();
  private activeTechniques: Map<string, number> = new Map();
  private techniqueCooldowns: Map<string, number> = new Map();
  private techniqueHistory: string[] = [];
  
  // Advanced movement parameters
  private maxMomentum: number = 100;
  private momentumDecay: number = 0.95;
  private friction: number = 0.85;
  private gravity: number = 0.5;
  private jumpForce: number = 15;
  private dashForce: number = 20;
  private backdashForce: number = 18;
  private wallJumpForce: number = 12;
  private waveDashForce: number = 8;
  
  // EVO-level movement features
  private waveDashing: boolean = false;
  private karaCanceling: boolean = false;
  private momentumTransfer: boolean = false;
  private wallTeching: boolean = false;
  private airDashing: boolean = false;
  
  constructor(app: pc.Application) {
    this.app = app;
    this.initializeMovementSystem();
    this.setupMovementTechniques();
    this.setupEventListeners();
  }

  private initializeMovementSystem(): void {
    this.movementState = {
      position: new pc.Vec3(0, 0, 0),
      velocity: new pc.Vec3(0, 0, 0),
      acceleration: new pc.Vec3(0, 0, 0),
      facing: 'right',
      grounded: true,
      airborne: false,
      dashing: false,
      backdashing: false,
      jumping: false,
      doubleJumping: false,
      wallJumping: false,
      wallSliding: false,
      momentum: 0,
      friction: this.friction,
      gravity: this.gravity
    };
  }

  private setupMovementTechniques(): void {
    // Basic movement
    this.addMovementTechnique({
      name: 'forward_dash',
      type: 'dash',
      input: ['right', 'right'],
      requirements: { grounded: true, stamina: 10 },
      effects: {
        velocity: new pc.Vec3(this.dashForce, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: 20,
        stamina: -10
      },
      cooldown: 0,
      stamina: 10
    });

    this.addMovementTechnique({
      name: 'back_dash',
      type: 'dash',
      input: ['left', 'left'],
      requirements: { grounded: true, stamina: 10 },
      effects: {
        velocity: new pc.Vec3(-this.backdashForce, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: -15,
        stamina: -10,
        invincibility: 10
      },
      cooldown: 0,
      stamina: 10
    });

    // Advanced movement techniques
    this.addMovementTechnique({
      name: 'wave_dash',
      type: 'special',
      input: ['down', 'down-right', 'right'],
      requirements: { airborne: true, stamina: 15 },
      effects: {
        velocity: new pc.Vec3(this.waveDashForce, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: 25,
        stamina: -15
      },
      cooldown: 5,
      stamina: 15
    });

    this.addMovementTechnique({
      name: 'air_dash',
      type: 'special',
      input: ['right', 'right'],
      requirements: { airborne: true, stamina: 20 },
      effects: {
        velocity: new pc.Vec3(this.dashForce * 0.8, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: 30,
        stamina: -20
      },
      cooldown: 10,
      stamina: 20
    });

    this.addMovementTechnique({
      name: 'wall_jump',
      type: 'special',
      input: ['left', 'up'],
      requirements: { wallSliding: true, stamina: 12 },
      effects: {
        velocity: new pc.Vec3(this.wallJumpForce, this.jumpForce * 0.8, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: 20,
        stamina: -12
      },
      cooldown: 0,
      stamina: 12
    });

    this.addMovementTechnique({
      name: 'momentum_cancel',
      type: 'cancel',
      input: ['down', 'down'],
      requirements: { momentum: 30, stamina: 5 },
      effects: {
        velocity: new pc.Vec3(0, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: -50,
        stamina: -5
      },
      cooldown: 0,
      stamina: 5
    });

    // Kara cancel techniques
    this.addMovementTechnique({
      name: 'kara_forward_dash',
      type: 'cancel',
      input: ['light', 'right', 'right'],
      requirements: { grounded: true, stamina: 8 },
      effects: {
        velocity: new pc.Vec3(this.dashForce * 1.2, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: 25,
        stamina: -8,
        cancelWindow: 3
      },
      cooldown: 0,
      stamina: 8
    });

    this.addMovementTechnique({
      name: 'kara_back_dash',
      type: 'cancel',
      input: ['light', 'left', 'left'],
      requirements: { grounded: true, stamina: 8 },
      effects: {
        velocity: new pc.Vec3(-this.backdashForce * 1.2, 0, 0),
        acceleration: new pc.Vec3(0, 0, 0),
        momentum: -20,
        stamina: -8,
        invincibility: 12,
        cancelWindow: 3
      },
      cooldown: 0,
      stamina: 8
    });
  }

  private setupEventListeners(): void {
    this.app.on('movement:input', this.onMovementInput.bind(this));
    this.app.on('movement:update', this.updateMovement.bind(this));
    this.app.on('movement:technique_used', this.onTechniqueUsed.bind(this));
  }

  public onMovementInput(event: any): void {
    const { input, direction, pressure } = event;
    
    // Check for movement techniques
    for (const [name, technique] of this.movementTechniques) {
      if (this.checkTechniqueInput(technique, input)) {
        this.executeMovementTechnique(technique);
        break;
      }
    }
    
    // Handle basic movement
    this.handleBasicMovement(direction, pressure);
  }

  public updateMovement(): void {
    // Apply physics
    this.applyPhysics();
    
    // Update momentum
    this.updateMomentum();
    
    // Update technique cooldowns
    this.updateCooldowns();
    
    // Update active techniques
    this.updateActiveTechniques();
    
    // Fire movement update event
    this.app.fire('movement:state_updated', {
      state: { ...this.movementState },
      techniques: Array.from(this.activeTechniques.keys())
    });
  }

  private applyPhysics(): void {
    // Apply gravity
    if (!this.movementState.grounded) {
      this.movementState.velocity.y -= this.movementState.gravity;
    }
    
    // Apply friction
    if (this.movementState.grounded) {
      this.movementState.velocity.x *= this.movementState.friction;
    }
    
    // Update position
    this.movementState.position.add(this.movementState.velocity);
    
    // Check for ground collision
    if (this.movementState.position.y <= 0) {
      this.movementState.position.y = 0;
      this.movementState.velocity.y = 0;
      this.movementState.grounded = true;
      this.movementState.airborne = false;
      this.movementState.jumping = false;
      this.movementState.doubleJumping = false;
    } else {
      this.movementState.grounded = false;
      this.movementState.airborne = true;
    }
  }

  private updateMomentum(): void {
    // Decay momentum
    this.movementState.momentum *= this.momentumDecay;
    
    // Clamp momentum
    this.movementState.momentum = Math.max(-this.maxMomentum, Math.min(this.maxMomentum, this.movementState.momentum));
    
    // Apply momentum to velocity
    const momentumFactor = this.movementState.momentum / this.maxMomentum;
    this.movementState.velocity.x += momentumFactor * 0.1;
  }

  private updateCooldowns(): void {
    for (const [name, cooldown] of this.techniqueCooldowns) {
      if (cooldown > 0) {
        this.techniqueCooldowns.set(name, cooldown - 1);
      }
    }
  }

  private updateActiveTechniques(): void {
    for (const [name, duration] of this.activeTechniques) {
      if (duration > 0) {
        this.activeTechniques.set(name, duration - 1);
      } else {
        this.activeTechniques.delete(name);
      }
    }
  }

  private checkTechniqueInput(technique: MovementTechnique, input: string[]): boolean {
    if (technique.input.length > input.length) return false;
    
    const recentInputs = input.slice(-technique.input.length);
    return this.compareInputSequences(technique.input, recentInputs);
  }

  private compareInputSequences(sequence1: string[], sequence2: string[]): boolean {
    if (sequence1.length !== sequence2.length) return false;
    
    for (let i = 0; i < sequence1.length; i++) {
      if (sequence1[i] !== sequence2[i]) return false;
    }
    
    return true;
  }

  private executeMovementTechnique(technique: MovementTechnique): void {
    // Check requirements
    if (!this.checkTechniqueRequirements(technique)) {
      return;
    }
    
    // Apply technique effects
    this.applyTechniqueEffects(technique);
    
    // Set cooldown
    this.techniqueCooldowns.set(technique.name, technique.cooldown);
    
    // Add to active techniques
    this.activeTechniques.set(technique.name, 10); // 10 frame duration
    
    // Add to history
    this.techniqueHistory.push(technique.name);
    if (this.techniqueHistory.length > 10) {
      this.techniqueHistory.shift();
    }
    
    // Fire event
    this.app.fire('movement:technique_used', {
      technique: technique.name,
      effects: technique.effects,
      state: { ...this.movementState }
    });
  }

  private checkTechniqueRequirements(technique: MovementTechnique): boolean {
    const req = technique.requirements;
    
    if (req.grounded !== undefined && req.grounded !== this.movementState.grounded) return false;
    if (req.airborne !== undefined && req.airborne !== this.movementState.airborne) return false;
    if (req.momentum !== undefined && Math.abs(this.movementState.momentum) < req.momentum) return false;
    if (req.stamina !== undefined && this.getStamina() < req.stamina) return false;
    if (req.cooldown !== undefined && this.techniqueCooldowns.get(technique.name) > 0) return false;
    if (req.facing !== undefined && req.facing !== 'any' && req.facing !== this.movementState.facing) return false;
    
    return true;
  }

  private applyTechniqueEffects(technique: MovementTechnique): void {
    const effects = technique.effects;
    
    // Apply velocity
    if (effects.velocity) {
      this.movementState.velocity.add(effects.velocity);
    }
    
    // Apply acceleration
    if (effects.acceleration) {
      this.movementState.acceleration.add(effects.acceleration);
    }
    
    // Apply momentum
    if (effects.momentum) {
      this.movementState.momentum += effects.momentum;
    }
    
    // Apply stamina
    if (effects.stamina) {
      this.modifyStamina(effects.stamina);
    }
    
    // Apply special effects
    if (effects.invincibility) {
      this.app.fire('movement:invincibility', { duration: effects.invincibility });
    }
    
    if (effects.superArmor) {
      this.app.fire('movement:super_armor', { duration: effects.superArmor });
    }
    
    if (effects.cancelWindow) {
      this.app.fire('movement:cancel_window', { duration: effects.cancelWindow });
    }
  }

  private handleBasicMovement(direction: string, pressure: number): void {
    const moveForce = 5 * pressure;
    
    switch (direction) {
      case 'left':
        this.movementState.velocity.x -= moveForce;
        this.movementState.facing = 'left';
        break;
      case 'right':
        this.movementState.velocity.x += moveForce;
        this.movementState.facing = 'right';
        break;
      case 'up':
        if (this.movementState.grounded) {
          this.movementState.velocity.y = this.jumpForce;
          this.movementState.grounded = false;
          this.movementState.airborne = true;
          this.movementState.jumping = true;
        } else if (this.movementState.airborne && !this.movementState.doubleJumping) {
          this.movementState.velocity.y = this.jumpForce * 0.8;
          this.movementState.doubleJumping = true;
        }
        break;
      case 'down':
        if (this.movementState.airborne) {
          this.movementState.velocity.y = -this.jumpForce * 0.5;
        }
        break;
    }
  }

  private addMovementTechnique(technique: MovementTechnique): void {
    this.movementTechniques.set(technique.name, technique);
  }

  private getStamina(): number {
    // This would be retrieved from the character's stamina system
    return 100; // Placeholder
  }

  private modifyStamina(amount: number): void {
    // This would modify the character's stamina
    console.log(`Stamina modified by: ${amount}`);
  }

  public onTechniqueUsed(event: any): void {
    const { technique, effects, state } = event;
    console.log(`Movement technique used: ${technique}`, effects);
  }

  public getMovementState(): MovementState {
    return { ...this.movementState };
  }

  public getActiveTechniques(): string[] {
    return Array.from(this.activeTechniques.keys());
  }

  public getTechniqueHistory(): string[] {
    return [...this.techniqueHistory];
  }

  public isTechniqueOnCooldown(techniqueName: string): boolean {
    return (this.techniqueCooldowns.get(techniqueName) || 0) > 0;
  }

  public getTechniqueCooldown(techniqueName: string): number {
    return this.techniqueCooldowns.get(techniqueName) || 0;
  }

  public destroy(): void {
    this.movementTechniques.clear();
    this.activeTechniques.clear();
    this.techniqueCooldowns.clear();
    this.techniqueHistory = [];
  }
}