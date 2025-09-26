import * as pc from 'playcanvas';

export interface ComboHit {
  moveId: string;
  damage: number;
  hitstun: number;
  blockstun: number;
  proration: number;
  scaling: number;
  properties: HitProperties;
  frame: number;
}

export interface HitProperties {
  overhead: boolean;
  low: boolean;
  mid: boolean;
  unblockable: boolean;
  armor: boolean;
  invincible: boolean;
  projectile: boolean;
  grab: boolean;
  launcher: boolean;
  wallbounce: boolean;
  groundbounce: boolean;
  crumple: boolean;
  dizzy: boolean;
}

export interface ComboState {
  hits: ComboHit[];
  totalDamage: number;
  totalScaling: number;
  currentProration: number;
  isActive: boolean;
  startFrame: number;
  lastHitFrame: number;
  resetCount: number;
  maxHits: number;
}

export interface ComboRule {
  name: string;
  condition: (combo: ComboState) => boolean;
  effect: (combo: ComboState) => ComboState;
  priority: number;
}

export interface ComboReset {
  type: 'damage' | 'scaling' | 'proration' | 'full';
  condition: (combo: ComboState) => boolean;
  resetValue: number;
}

export class ComboSystem {
  private app: pc.Application;
  private comboState: ComboState;
  private comboRules: ComboRule[] = [];
  private comboResets: ComboReset[] = [];
  private frameData: Map<string, any> = new Map();
  private comboHistory: ComboState[] = [];
  
  // Combo system parameters
  private maxComboHits: number = 50;
  private damageScalingStart: number = 5; // Hit when scaling starts
  private damageScalingRate: number = 0.1; // 10% reduction per hit
  private maxDamageScaling: number = 0.2; // Minimum 20% damage
  private prorationDecay: number = 0.05; // 5% proration decay per hit
  private maxProration: number = 0.3; // Maximum 30% proration
  
  constructor(app: pc.Application) {
    this.app = app;
    this.initializeComboSystem();
    this.setupComboRules();
    this.setupEventListeners();
  }

  private initializeComboSystem(): void {
    this.comboState = {
      hits: [],
      totalDamage: 0,
      totalScaling: 1.0,
      currentProration: 1.0,
      isActive: false,
      startFrame: 0,
      lastHitFrame: 0,
      resetCount: 0,
      maxHits: this.maxComboHits
    };
  }

  private setupComboRules(): void {
    // Damage scaling rule
    this.addComboRule({
      name: 'damage_scaling',
      condition: (combo) => combo.hits.length >= this.damageScalingStart,
      effect: (combo) => {
        const scalingHits = combo.hits.length - this.damageScalingStart;
        const scaling = Math.max(
          this.maxDamageScaling,
          1.0 - (scalingHits * this.damageScalingRate)
        );
        combo.totalScaling = scaling;
        return combo;
      },
      priority: 1
    });

    // Proration decay rule
    this.addComboRule({
      name: 'proration_decay',
      condition: (combo) => combo.hits.length > 0,
      effect: (combo) => {
        const prorationHits = combo.hits.length;
        const proration = Math.max(
          this.maxProration,
          1.0 - (prorationHits * this.prorationDecay)
        );
        combo.currentProration = proration;
        return combo;
      },
      priority: 2
    });

    // Combo length limit rule
    this.addComboRule({
      name: 'combo_length_limit',
      condition: (combo) => combo.hits.length >= this.maxComboHits,
      effect: (combo) => {
        combo.isActive = false;
        this.endCombo();
        return combo;
      },
      priority: 3
    });

    // Reset detection rule
    this.addComboRule({
      name: 'reset_detection',
      condition: (combo) => combo.hits.length > 0,
      effect: (combo) => {
        for (const reset of this.comboResets) {
          if (reset.condition(combo)) {
            this.applyComboReset(combo, reset);
          }
        }
        return combo;
      },
      priority: 4
    });
  }

  private setupEventListeners(): void {
    this.app.on('combo:sequence_input', this.onSequenceInput.bind(this));
    this.app.on('combo:hit_landed', this.onHitLanded.bind(this));
    this.app.on('combo:combo_ended', this.onComboEnded.bind(this));
    this.app.on('combo:reset_detected', this.onResetDetected.bind(this));
  }

  public onSequenceInput(event: any): void {
    const { sequence, inputs, difficulty, precision, consistency } = event;
    
    // Calculate combo potential based on input quality
    const comboPotential = this.calculateComboPotential(sequence, difficulty, precision, consistency);
    
    this.app.fire('combo:sequence_ready', {
      sequence,
      potential: comboPotential,
      inputs,
      difficulty
    });
  }

  public onHitLanded(event: any): void {
    const { moveId, damage, hitstun, blockstun, properties, frame } = event;
    
    const comboHit: ComboHit = {
      moveId,
      damage,
      hitstun,
      blockstun,
      proration: this.calculateProration(moveId, properties),
      scaling: this.calculateScaling(moveId, properties),
      properties,
      frame
    };
    
    this.addHitToCombo(comboHit);
  }

  private addHitToCombo(hit: ComboHit): void {
    if (!this.comboState.isActive) {
      this.startCombo();
    }
    
    // Apply proration and scaling
    const proratedDamage = hit.damage * hit.proration * this.comboState.currentProration;
    const scaledDamage = proratedDamage * this.comboState.totalScaling;
    
    hit.damage = scaledDamage;
    hit.proration = this.comboState.currentProration;
    hit.scaling = this.comboState.totalScaling;
    
    this.comboState.hits.push(hit);
    this.comboState.totalDamage += scaledDamage;
    this.comboState.lastHitFrame = hit.frame;
    
    // Apply combo rules
    this.applyComboRules();
    
    // Fire combo update event
    this.app.fire('combo:updated', {
      combo: { ...this.comboState },
      newHit: hit
    });
    
    // Check for combo end conditions
    if (this.shouldEndCombo()) {
      this.endCombo();
    }
  }

  private startCombo(): void {
    this.comboState = {
      hits: [],
      totalDamage: 0,
      totalScaling: 1.0,
      currentProration: 1.0,
      isActive: true,
      startFrame: this.app.getTime(),
      lastHitFrame: 0,
      resetCount: 0,
      maxHits: this.maxComboHits
    };
    
    this.app.fire('combo:started', { combo: { ...this.comboState } });
  }

  private endCombo(): void {
    if (this.comboState.isActive) {
      this.comboState.isActive = false;
      this.comboHistory.push({ ...this.comboState });
      
      this.app.fire('combo:ended', {
        combo: { ...this.comboState },
        totalDamage: this.comboState.totalDamage,
        hitCount: this.comboState.hits.length,
        duration: this.comboState.lastHitFrame - this.comboState.startFrame
      });
      
      this.resetComboState();
    }
  }

  private resetComboState(): void {
    this.comboState = {
      hits: [],
      totalDamage: 0,
      totalScaling: 1.0,
      currentProration: 1.0,
      isActive: false,
      startFrame: 0,
      lastHitFrame: 0,
      resetCount: 0,
      maxHits: this.maxComboHits
    };
  }

  private applyComboRules(): void {
    for (const rule of this.comboRules.sort((a, b) => a.priority - b.priority)) {
      if (rule.condition(this.comboState)) {
        this.comboState = rule.effect(this.comboState);
      }
    }
  }

  private calculateComboPotential(sequence: string, difficulty: number, precision: number, consistency: number): number {
    const basePotential = 1.0;
    const difficultyMultiplier = 1.0 + (difficulty * 0.1);
    const precisionMultiplier = 0.5 + (precision * 0.5);
    const consistencyMultiplier = 0.5 + (consistency * 0.5);
    
    return basePotential * difficultyMultiplier * precisionMultiplier * consistencyMultiplier;
  }

  private calculateProration(moveId: string, properties: HitProperties): number {
    let proration = 1.0;
    
    // Heavy attacks have higher proration
    if (moveId.includes('heavy')) proration *= 0.8;
    if (moveId.includes('special')) proration *= 0.9;
    
    // Special properties affect proration
    if (properties.overhead) proration *= 0.95;
    if (properties.low) proration *= 0.95;
    if (properties.unblockable) proration *= 0.85;
    if (properties.grab) proration *= 0.9;
    
    return Math.max(0.1, proration);
  }

  private calculateScaling(moveId: string, properties: HitProperties): number {
    let scaling = 1.0;
    
    // Launchers have higher scaling
    if (properties.launcher) scaling *= 0.9;
    if (properties.wallbounce) scaling *= 0.85;
    if (properties.groundbounce) scaling *= 0.85;
    
    return Math.max(0.1, scaling);
  }

  private shouldEndCombo(): boolean {
    // End combo if too many hits
    if (this.comboState.hits.length >= this.maxComboHits) {
      return true;
    }
    
    // End combo if too much time has passed since last hit
    const currentFrame = this.app.getTime();
    const timeSinceLastHit = currentFrame - this.comboState.lastHitFrame;
    if (timeSinceLastHit > 60) { // 1 second at 60fps
      return true;
    }
    
    // End combo if opponent is in a state that breaks combos
    // This would be checked against opponent state
    
    return false;
  }

  private applyComboReset(combo: ComboState, reset: ComboReset): void {
    switch (reset.type) {
      case 'damage':
        combo.totalDamage *= reset.resetValue;
        break;
      case 'scaling':
        combo.totalScaling *= reset.resetValue;
        break;
      case 'proration':
        combo.currentProration *= reset.resetValue;
        break;
      case 'full':
        combo.totalScaling = reset.resetValue;
        combo.currentProration = reset.resetValue;
        break;
    }
    
    combo.resetCount++;
    
    this.app.fire('combo:reset_applied', {
      resetType: reset.type,
      resetValue: reset.resetValue,
      combo: { ...combo }
    });
  }

  public addComboRule(rule: ComboRule): void {
    this.comboRules.push(rule);
  }

  public addComboReset(reset: ComboReset): void {
    this.comboResets.push(reset);
  }

  public getCurrentCombo(): ComboState {
    return { ...this.comboState };
  }

  public getComboHistory(): ComboState[] {
    return [...this.comboHistory];
  }

  public getComboDamage(): number {
    return this.comboState.totalDamage;
  }

  public getComboHitCount(): number {
    return this.comboState.hits.length;
  }

  public isComboActive(): boolean {
    return this.comboState.isActive;
  }

  public getComboEfficiency(): number {
    if (this.comboState.hits.length === 0) return 0;
    
    const baseDamage = this.comboState.hits.reduce((sum, hit) => sum + hit.damage, 0);
    const actualDamage = this.comboState.totalDamage;
    
    return actualDamage / baseDamage;
  }

  public onComboEnded(event: any): void {
    const { combo, totalDamage, hitCount, duration } = event;
    console.log(`Combo ended: ${hitCount} hits, ${totalDamage} damage, ${duration} frames`);
  }

  public onResetDetected(event: any): void {
    const { resetType, resetValue } = event;
    console.log(`Combo reset detected: ${resetType} with value ${resetValue}`);
  }

  public destroy(): void {
    this.comboRules = [];
    this.comboResets = [];
    this.comboHistory = [];
    this.frameData.clear();
  }
}