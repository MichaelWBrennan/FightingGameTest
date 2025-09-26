import type * as pc from 'playcanvas';

export interface RomanCancel {
  type: 'red' | 'blue' | 'yellow' | 'purple';
  cost: number;
  duration: number;
  effects: RomanCancelEffects;
  requirements: RomanCancelRequirements;
}

export interface RomanCancelEffects {
  timeSlow: number;
  hitstop: number;
  meterGain: number;
  frameAdvantage: number;
  invincibility: number;
  superArmor: number;
  cancelWindow: number;
  momentumReset: boolean;
  comboExtension: boolean;
}

export interface RomanCancelRequirements {
  meter: number;
  health: number;
  comboCount: number;
  moveType: string[];
  timing: 'startup' | 'active' | 'recovery' | 'any';
}

export interface RomanCancelState {
  isActive: boolean;
  type: string;
  startFrame: number;
  duration: number;
  effects: RomanCancelEffects;
  cancelWindow: number;
  meterCost: number;
}

export class RomanCancelSystem {
  private app: pc.Application;
  private romanCancels: Map<string, RomanCancel> = new Map();
  private romanCancelState: RomanCancelState | null = null;
  private cancelHistory: string[] = [];
  private meterCosts: Map<string, number> = new Map();
  
  // Roman cancel parameters
  private redCancelCost: number = 50;
  private blueCancelCost: number = 25;
  private yellowCancelCost: number = 25;
  private purpleCancelCost: number = 50;
  
  // Advanced cancel features
  private redRomanEnabled: boolean = true;
  private blueRomanEnabled: boolean = true;
  private yellowRomanEnabled: boolean = true;
  private purpleRomanEnabled: boolean = true;
  private cancelChaining: boolean = true;
  private meterRefund: boolean = true;
  
  constructor(app: pc.Application) {
    this.app = app;
    this.initializeRomanCancelSystem();
    this.setupRomanCancels();
    this.setupEventListeners();
  }

  private initializeRomanCancelSystem(): void {
    this.meterCosts.set('red', this.redCancelCost);
    this.meterCosts.set('blue', this.blueCancelCost);
    this.meterCosts.set('yellow', this.yellowCancelCost);
    this.meterCosts.set('purple', this.purpleCancelCost);
  }

  private setupRomanCancels(): void {
    // Red Roman Cancel - Combo extension
    this.addRomanCancel({
      type: 'red',
      cost: this.redCancelCost,
      duration: 30,
      effects: {
        timeSlow: 0.3,
        hitstop: 10,
        meterGain: 0,
        frameAdvantage: 5,
        invincibility: 0,
        superArmor: 0,
        cancelWindow: 15,
        momentumReset: false,
        comboExtension: true
      },
      requirements: {
        meter: 50,
        health: 0,
        comboCount: 0,
        moveType: ['normal', 'special', 'super'],
        timing: 'any'
      }
    });

    // Blue Roman Cancel - Defensive
    this.addRomanCancel({
      type: 'blue',
      cost: this.blueCancelCost,
      duration: 20,
      effects: {
        timeSlow: 0.2,
        hitstop: 5,
        meterGain: 10,
        frameAdvantage: 0,
        invincibility: 15,
        superArmor: 0,
        cancelWindow: 10,
        momentumReset: true,
        comboExtension: false
      },
      requirements: {
        meter: 25,
        health: 0,
        comboCount: 0,
        moveType: ['normal', 'special'],
        timing: 'startup'
      }
    });

    // Yellow Roman Cancel - Offensive
    this.addRomanCancel({
      type: 'yellow',
      cost: this.yellowCancelCost,
      duration: 25,
      effects: {
        timeSlow: 0.25,
        hitstop: 7,
        meterGain: 5,
        frameAdvantage: 8,
        invincibility: 0,
        superArmor: 10,
        cancelWindow: 12,
        momentumReset: false,
        comboExtension: true
      },
      requirements: {
        meter: 25,
        health: 0,
        comboCount: 0,
        moveType: ['normal', 'special'],
        timing: 'active'
      }
    });

    // Purple Roman Cancel - Ultimate
    this.addRomanCancel({
      type: 'purple',
      cost: this.purpleCancelCost,
      duration: 40,
      effects: {
        timeSlow: 0.5,
        hitstop: 15,
        meterGain: 20,
        frameAdvantage: 10,
        invincibility: 20,
        superArmor: 15,
        cancelWindow: 20,
        momentumReset: true,
        comboExtension: true
      },
      requirements: {
        meter: 50,
        health: 0,
        comboCount: 0,
        moveType: ['normal', 'special', 'super'],
        timing: 'any'
      }
    });
  }

  private setupEventListeners(): void {
    this.app.on('roman_cancel:input', this.onRomanCancelInput.bind(this));
    this.app.on('roman_cancel:execute', this.executeRomanCancel.bind(this));
    this.app.on('roman_cancel:update', this.updateRomanCancel.bind(this));
    this.app.on('roman_cancel:end', this.endRomanCancel.bind(this));
  }

  public onRomanCancelInput(event: any): void {
    const { type, moveId, moveType, timing, meter, health, comboCount } = event;
    
    // Check if roman cancel is available
    if (!this.canRomanCancel(type, moveType, timing, meter, health, comboCount)) {
      return;
    }
    
    // Execute roman cancel
    this.executeRomanCancel(type, moveId, moveType, timing);
  }

  public executeRomanCancel(type: string, moveId: string, moveType: string, timing: string): void {
    const romanCancel = this.romanCancels.get(type);
    if (!romanCancel) return;
    
    // Check if already active
    if (this.romanCancelState?.isActive) {
      return;
    }
    
    // Create roman cancel state
    this.romanCancelState = {
      isActive: true,
      type,
      startFrame: this.app.getTime(),
      duration: romanCancel.duration,
      effects: { ...romanCancel.effects },
      cancelWindow: romanCancel.effects.cancelWindow,
      meterCost: romanCancel.cost
    };
    
    // Apply roman cancel effects
    this.applyRomanCancelEffects(romanCancel.effects);
    
    // Add to history
    this.cancelHistory.push(type);
    if (this.cancelHistory.length > 10) {
      this.cancelHistory.shift();
    }
    
    // Fire events
    this.app.fire('roman_cancel:started', {
      type,
      moveId,
      moveType,
      timing,
      effects: romanCancel.effects,
      meterCost: romanCancel.cost
    });
    
    this.app.fire('meter:consume', {
      amount: romanCancel.cost,
      type: 'roman_cancel',
      cancelType: type
    });
  }

  public updateRomanCancel(): void {
    if (!this.romanCancelState?.isActive) return;
    
    const currentFrame = this.app.getTime();
    const elapsed = currentFrame - this.romanCancelState.startFrame;
    
    // Update cancel window
    if (this.romanCancelState.cancelWindow > 0) {
      this.romanCancelState.cancelWindow--;
    }
    
    // Check if roman cancel should end
    if (elapsed >= this.romanCancelState.duration) {
      this.endRomanCancel();
    }
    
    // Fire update event
    this.app.fire('roman_cancel:updated', {
      state: { ...this.romanCancelState },
      elapsed,
      remaining: this.romanCancelState.duration - elapsed
    });
  }

  public endRomanCancel(): void {
    if (!this.romanCancelState?.isActive) return;
    
    const type = this.romanCancelState.type;
    const effects = this.romanCancelState.effects;
    
    // Remove roman cancel effects
    this.removeRomanCancelEffects(effects);
    
    // Reset state
    this.romanCancelState = null;
    
    // Fire end event
    this.app.fire('roman_cancel:ended', {
      type,
      effects
    });
  }

  private canRomanCancel(type: string, moveType: string, timing: string, meter: number, health: number, comboCount: number): boolean {
    const romanCancel = this.romanCancels.get(type);
    if (!romanCancel) return false;
    
    const req = romanCancel.requirements;
    
    // Check meter requirement
    if (meter < req.meter) return false;
    
    // Check health requirement
    if (health < req.health) return false;
    
    // Check combo count requirement
    if (comboCount < req.comboCount) return false;
    
    // Check move type requirement
    if (!req.moveType.includes(moveType)) return false;
    
    // Check timing requirement
    if (req.timing !== 'any' && req.timing !== timing) return false;
    
    // Check if already active
    if (this.romanCancelState?.isActive) return false;
    
    return true;
  }

  private applyRomanCancelEffects(effects: RomanCancelEffects): void {
    // Apply time slow
    if (effects.timeSlow > 0) {
      this.app.fire('time:slow', { factor: effects.timeSlow, duration: effects.duration });
    }
    
    // Apply hitstop
    if (effects.hitstop > 0) {
      this.app.fire('hitstop:apply', { duration: effects.hitstop });
    }
    
    // Apply meter gain
    if (effects.meterGain > 0) {
      this.app.fire('meter:gain', { amount: effects.meterGain, type: 'roman_cancel' });
    }
    
    // Apply frame advantage
    if (effects.frameAdvantage > 0) {
      this.app.fire('frame:advantage', { frames: effects.frameAdvantage });
    }
    
    // Apply invincibility
    if (effects.invincibility > 0) {
      this.app.fire('invincibility:apply', { duration: effects.invincibility });
    }
    
    // Apply super armor
    if (effects.superArmor > 0) {
      this.app.fire('super_armor:apply', { duration: effects.superArmor });
    }
    
    // Apply momentum reset
    if (effects.momentumReset) {
      this.app.fire('momentum:reset');
    }
    
    // Apply combo extension
    if (effects.comboExtension) {
      this.app.fire('combo:extend', { frames: effects.cancelWindow });
    }
  }

  private removeRomanCancelEffects(effects: RomanCancelEffects): void {
    // Remove time slow
    if (effects.timeSlow > 0) {
      this.app.fire('time:normalize');
    }
    
    // Remove hitstop
    if (effects.hitstop > 0) {
      this.app.fire('hitstop:remove');
    }
    
    // Remove invincibility
    if (effects.invincibility > 0) {
      this.app.fire('invincibility:remove');
    }
    
    // Remove super armor
    if (effects.superArmor > 0) {
      this.app.fire('super_armor:remove');
    }
  }

  private addRomanCancel(romanCancel: RomanCancel): void {
    this.romanCancels.set(romanCancel.type, romanCancel);
  }

  public getRomanCancelState(): RomanCancelState | null {
    return this.romanCancelState ? { ...this.romanCancelState } : null;
  }

  public getRomanCancelHistory(): string[] {
    return [...this.cancelHistory];
  }

  public getRomanCancelCost(type: string): number {
    return this.meterCosts.get(type) || 0;
  }

  public isRomanCancelActive(): boolean {
    return this.romanCancelState?.isActive || false;
  }

  public getActiveRomanCancelType(): string | null {
    return this.romanCancelState?.type || null;
  }

  public getRomanCancelCancelWindow(): number {
    return this.romanCancelState?.cancelWindow || 0;
  }

  public canCancelMove(moveId: string, moveType: string): boolean {
    if (!this.romanCancelState?.isActive) return false;
    if (this.romanCancelState.cancelWindow <= 0) return false;
    
    const romanCancel = this.romanCancels.get(this.romanCancelState.type);
    if (!romanCancel) return false;
    
    return romanCancel.requirements.moveType.includes(moveType);
  }

  public getRomanCancelMeterRefund(type: string): number {
    if (!this.meterRefund) return 0;
    
    const baseCost = this.meterCosts.get(type) || 0;
    return Math.floor(baseCost * 0.1); // 10% refund
  }

  public destroy(): void {
    this.romanCancels.clear();
    this.cancelHistory = [];
    this.meterCosts.clear();
    this.romanCancelState = null;
  }
}