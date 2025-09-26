import type * as pc from 'playcanvas';

export interface BurstData {
  type: 'blue' | 'gold' | 'red' | 'purple';
  cost: number;
  duration: number;
  effects: BurstEffects;
  requirements: BurstRequirements;
  cooldown: number;
}

export interface BurstEffects {
  knockback: number;
  hitstun: number;
  blockstun: number;
  invincibility: number;
  superArmor: number;
  meterGain: number;
  frameAdvantage: number;
  comboBreak: boolean;
  momentumReset: boolean;
  screenFreeze: number;
}

export interface BurstRequirements {
  meter: number;
  health: number;
  comboCount: number;
  hitstun: number;
  blockstun: number;
  state: string[];
}

export interface BurstState {
  isActive: boolean;
  type: string;
  startFrame: number;
  duration: number;
  effects: BurstEffects;
  cooldown: number;
  uses: number;
  maxUses: number;
}

export class BurstSystem {
  private app: pc.Application;
  private burstData: Map<string, BurstData> = new Map();
  private burstState: BurstState | null = null;
  private burstHistory: string[] = [];
  private burstCooldowns: Map<string, number> = new Map();
  
  // Burst system parameters
  private blueBurstCost: number = 25;
  private goldBurstCost: number = 50;
  private redBurstCost: number = 75;
  private purpleBurstCost: number = 100;
  
  // Advanced burst features
  private burstChaining: boolean = true;
  private burstScaling: boolean = true;
  private burstRefund: boolean = true;
  private burstPunishment: boolean = true;
  
  constructor(app: pc.Application) {
    this.app = app;
    this.initializeBurstSystem();
    this.setupBurstData();
    this.setupEventListeners();
  }

  private initializeBurstSystem(): void {
    this.burstState = {
      isActive: false,
      type: '',
      startFrame: 0,
      duration: 0,
      effects: this.createEmptyBurstEffects(),
      cooldown: 0,
      uses: 0,
      maxUses: 3
    };
  }

  private createEmptyBurstEffects(): BurstEffects {
    return {
      knockback: 0,
      hitstun: 0,
      blockstun: 0,
      invincibility: 0,
      superArmor: 0,
      meterGain: 0,
      frameAdvantage: 0,
      comboBreak: false,
      momentumReset: false,
      screenFreeze: 0
    };
  }

  private setupBurstData(): void {
    // Blue Burst - Basic escape
    this.addBurstData({
      type: 'blue',
      cost: this.blueBurstCost,
      duration: 20,
      effects: {
        knockback: 5,
        hitstun: 10,
        blockstun: 5,
        invincibility: 15,
        superArmor: 0,
        meterGain: 5,
        frameAdvantage: 0,
        comboBreak: true,
        momentumReset: true,
        screenFreeze: 5
      },
      requirements: {
        meter: 25,
        health: 0,
        comboCount: 0,
        hitstun: 0,
        blockstun: 0,
        state: ['hitstun', 'blockstun', 'knockdown']
      },
      cooldown: 60
    });

    // Gold Burst - Combo breaker
    this.addBurstData({
      type: 'gold',
      cost: this.goldBurstCost,
      duration: 30,
      effects: {
        knockback: 8,
        hitstun: 15,
        blockstun: 8,
        invincibility: 20,
        superArmor: 0,
        meterGain: 10,
        frameAdvantage: 5,
        comboBreak: true,
        momentumReset: true,
        screenFreeze: 8
      },
      requirements: {
        meter: 50,
        health: 0,
        comboCount: 3,
        hitstun: 0,
        blockstun: 0,
        state: ['hitstun', 'blockstun', 'knockdown']
      },
      cooldown: 120
    });

    // Red Burst - Counter attack
    this.addBurstData({
      type: 'red',
      cost: this.redBurstCost,
      duration: 25,
      effects: {
        knockback: 12,
        hitstun: 20,
        blockstun: 10,
        invincibility: 10,
        superArmor: 15,
        meterGain: 15,
        frameAdvantage: 10,
        comboBreak: true,
        momentumReset: true,
        screenFreeze: 10
      },
      requirements: {
        meter: 75,
        health: 0,
        comboCount: 5,
        hitstun: 0,
        blockstun: 0,
        state: ['hitstun', 'blockstun', 'knockdown']
      },
      cooldown: 180
    });

    // Purple Burst - Ultimate escape
    this.addBurstData({
      type: 'purple',
      cost: this.purpleBurstCost,
      duration: 40,
      effects: {
        knockback: 15,
        hitstun: 25,
        blockstun: 15,
        invincibility: 30,
        superArmor: 20,
        meterGain: 25,
        frameAdvantage: 15,
        comboBreak: true,
        momentumReset: true,
        screenFreeze: 15
      },
      requirements: {
        meter: 100,
        health: 0,
        comboCount: 8,
        hitstun: 0,
        blockstun: 0,
        state: ['hitstun', 'blockstun', 'knockdown']
      },
      cooldown: 300
    });
  }

  private setupEventListeners(): void {
    this.app.on('burst:input', this.onBurstInput.bind(this));
    this.app.on('burst:execute', this.executeBurst.bind(this));
    this.app.on('burst:update', this.updateBurst.bind(this));
    this.app.on('burst:end', this.endBurst.bind(this));
    this.app.on('burst:punish', this.onBurstPunish.bind(this));
  }

  public onBurstInput(event: any): void {
    const { type, meter, health, comboCount, hitstun, blockstun, state } = event;
    
    // Check if burst is available
    if (!this.canBurst(type, meter, health, comboCount, hitstun, blockstun, state)) {
      return;
    }
    
    // Execute burst
    this.executeBurst(type);
  }

  public executeBurst(type: string): void {
    const burstData = this.burstData.get(type);
    if (!burstData) return;
    
    // Check if already active
    if (this.burstState?.isActive) {
      return;
    }
    
    // Check cooldown
    if (this.burstCooldowns.get(type) > 0) {
      return;
    }
    
    // Check uses
    if (this.burstState && this.burstState.uses >= this.burstState.maxUses) {
      return;
    }
    
    // Create burst state
    this.burstState = {
      isActive: true,
      type,
      startFrame: this.app.getTime(),
      duration: burstData.duration,
      effects: { ...burstData.effects },
      cooldown: burstData.cooldown,
      uses: (this.burstState?.uses || 0) + 1,
      maxUses: this.burstState?.maxUses || 3
    };
    
    // Apply burst effects
    this.applyBurstEffects(burstData.effects);
    
    // Set cooldown
    this.burstCooldowns.set(type, burstData.cooldown);
    
    // Add to history
    this.burstHistory.push(type);
    if (this.burstHistory.length > 10) {
      this.burstHistory.shift();
    }
    
    // Fire events
    this.app.fire('burst:started', {
      type,
      effects: burstData.effects,
      cost: burstData.cost,
      uses: this.burstState.uses,
      maxUses: this.burstState.maxUses
    });
    
    this.app.fire('meter:consume', {
      amount: burstData.cost,
      type: 'burst',
      burstType: type
    });
  }

  public updateBurst(): void {
    if (!this.burstState?.isActive) return;
    
    const currentFrame = this.app.getTime();
    const elapsed = currentFrame - this.burstState.startFrame;
    
    // Check if burst should end
    if (elapsed >= this.burstState.duration) {
      this.endBurst();
    }
    
    // Fire update event
    this.app.fire('burst:updated', {
      state: { ...this.burstState },
      elapsed,
      remaining: this.burstState.duration - elapsed
    });
  }

  public endBurst(): void {
    if (!this.burstState?.isActive) return;
    
    const type = this.burstState.type;
    const effects = this.burstState.effects;
    
    // Remove burst effects
    this.removeBurstEffects(effects);
    
    // Reset active state
    this.burstState.isActive = false;
    this.burstState.type = '';
    this.burstState.startFrame = 0;
    this.burstState.duration = 0;
    this.burstState.effects = this.createEmptyBurstEffects();
    
    // Fire end event
    this.app.fire('burst:ended', {
      type,
      effects
    });
  }

  public onBurstPunish(event: any): void {
    const { type, damage, hitstun, blockstun } = event;
    
    // Apply burst punishment
    this.applyBurstPunishment(type, damage, hitstun, blockstun);
    
    // Fire punishment event
    this.app.fire('burst:punished', {
      type,
      damage,
      hitstun,
      blockstun
    });
  }

  private canBurst(type: string, meter: number, health: number, comboCount: number, hitstun: number, blockstun: number, state: string): boolean {
    const burstData = this.burstData.get(type);
    if (!burstData) return false;
    
    const req = burstData.requirements;
    
    // Check meter requirement
    if (meter < req.meter) return false;
    
    // Check health requirement
    if (health < req.health) return false;
    
    // Check combo count requirement
    if (comboCount < req.comboCount) return false;
    
    // Check hitstun requirement
    if (hitstun < req.hitstun) return false;
    
    // Check blockstun requirement
    if (blockstun < req.blockstun) return false;
    
    // Check state requirement
    if (!req.state.includes(state)) return false;
    
    // Check cooldown
    if (this.burstCooldowns.get(type) > 0) return false;
    
    // Check if already active
    if (this.burstState?.isActive) return false;
    
    // Check uses
    if (this.burstState && this.burstState.uses >= this.burstState.maxUses) return false;
    
    return true;
  }

  private applyBurstEffects(effects: BurstEffects): void {
    // Apply knockback
    if (effects.knockback > 0) {
      this.app.fire('knockback:apply', { amount: effects.knockback });
    }
    
    // Apply hitstun
    if (effects.hitstun > 0) {
      this.app.fire('hitstun:apply', { duration: effects.hitstun });
    }
    
    // Apply blockstun
    if (effects.blockstun > 0) {
      this.app.fire('blockstun:apply', { duration: effects.blockstun });
    }
    
    // Apply invincibility
    if (effects.invincibility > 0) {
      this.app.fire('invincibility:apply', { duration: effects.invincibility });
    }
    
    // Apply super armor
    if (effects.superArmor > 0) {
      this.app.fire('super_armor:apply', { duration: effects.superArmor });
    }
    
    // Apply meter gain
    if (effects.meterGain > 0) {
      this.app.fire('meter:gain', { amount: effects.meterGain, type: 'burst' });
    }
    
    // Apply frame advantage
    if (effects.frameAdvantage > 0) {
      this.app.fire('frame:advantage', { frames: effects.frameAdvantage });
    }
    
    // Apply combo break
    if (effects.comboBreak) {
      this.app.fire('combo:break');
    }
    
    // Apply momentum reset
    if (effects.momentumReset) {
      this.app.fire('momentum:reset');
    }
    
    // Apply screen freeze
    if (effects.screenFreeze > 0) {
      this.app.fire('screen:freeze', { duration: effects.screenFreeze });
    }
  }

  private removeBurstEffects(effects: BurstEffects): void {
    // Remove invincibility
    if (effects.invincibility > 0) {
      this.app.fire('invincibility:remove');
    }
    
    // Remove super armor
    if (effects.superArmor > 0) {
      this.app.fire('super_armor:remove');
    }
    
    // Remove screen freeze
    if (effects.screenFreeze > 0) {
      this.app.fire('screen:unfreeze');
    }
  }

  private applyBurstPunishment(type: string, damage: number, hitstun: number, blockstun: number): void {
    // Apply punishment based on burst type
    const punishmentMultiplier = this.getBurstPunishmentMultiplier(type);
    
    const punishmentDamage = damage * punishmentMultiplier;
    const punishmentHitstun = hitstun * punishmentMultiplier;
    const punishmentBlockstun = blockstun * punishmentMultiplier;
    
    this.app.fire('damage:apply', { amount: punishmentDamage, type: 'burst_punishment' });
    this.app.fire('hitstun:apply', { duration: punishmentHitstun });
    this.app.fire('blockstun:apply', { duration: punishmentBlockstun });
  }

  private getBurstPunishmentMultiplier(type: string): number {
    const multipliers = {
      'blue': 1.2,
      'gold': 1.5,
      'red': 1.8,
      'purple': 2.0
    };
    
    return multipliers[type] || 1.0;
  }

  private addBurstData(burstData: BurstData): void {
    this.burstData.set(burstData.type, burstData);
  }

  public getBurstState(): BurstState | null {
    return this.burstState ? { ...this.burstState } : null;
  }

  public getBurstHistory(): string[] {
    return [...this.burstHistory];
  }

  public getBurstCooldown(type: string): number {
    return this.burstCooldowns.get(type) || 0;
  }

  public isBurstActive(): boolean {
    return this.burstState?.isActive || false;
  }

  public getActiveBurstType(): string | null {
    return this.burstState?.type || null;
  }

  public getBurstUses(): number {
    return this.burstState?.uses || 0;
  }

  public getMaxBurstUses(): number {
    return this.burstState?.maxUses || 3;
  }

  public canBurstEscape(): boolean {
    if (!this.burstState) return false;
    return this.burstState.uses < this.burstState.maxUses;
  }

  public getBurstCost(type: string): number {
    const burstData = this.burstData.get(type);
    return burstData?.cost || 0;
  }

  public getBurstMeterRefund(type: string): number {
    if (!this.burstRefund) return 0;
    
    const baseCost = this.getBurstCost(type);
    return Math.floor(baseCost * 0.15); // 15% refund
  }

  public destroy(): void {
    this.burstData.clear();
    this.burstHistory = [];
    this.burstCooldowns.clear();
    this.burstState = null;
  }
}