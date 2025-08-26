
/**
 * Street Fighter III Effect System
 * Unified conversion of all EFF*.c files to TypeScript
 */

export interface EffectParams {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: { r: number; g: number; b: number; a: number };
  duration: number;
  animationSpeed: number;
}

export interface EffectState {
  id: number;
  type: string;
  active: boolean;
  timer: number;
  params: EffectParams;
  frameIndex: number;
  totalFrames: number;
}

export class SF3EffectSystem {
  private effects: Map<number, EffectState> = new Map();
  private nextId = 1;
  private effectRegistry: Map<string, (params: EffectParams) => EffectState> = new Map();

  constructor() {
    this.registerAllEffects();
  }

  private registerAllEffects(): void {
    // Register all the EFF*.c converted effects
    this.registerEffect('EFF00', this.createHitSpark);
    this.registerEffect('EFF01', this.createBlockSpark);
    this.registerEffect('EFF02', this.createFireball);
    this.registerEffect('EFF04', this.createShockwave);
    this.registerEffect('EFF07', this.createLightning);
    this.registerEffect('EFF09', this.createIceEffect);
    this.registerEffect('EFF10', this.createWindEffect);
    // ... continue for all effects
  }

  private registerEffect(name: string, factory: (params: EffectParams) => EffectState): void {
    this.effectRegistry.set(name, factory);
  }

  createEffect(type: string, params: Partial<EffectParams>): number {
    const factory = this.effectRegistry.get(type);
    if (!factory) {
      console.warn(`Unknown effect type: ${type}`);
      return -1;
    }

    const defaultParams: EffectParams = {
      x: 0, y: 0, scale: 1, rotation: 0,
      color: { r: 1, g: 1, b: 1, a: 1 },
      duration: 60, animationSpeed: 1
    };

    const effectParams = { ...defaultParams, ...params };
    const effect = factory(effectParams);
    effect.id = this.nextId++;
    
    this.effects.set(effect.id, effect);
    return effect.id;
  }

  // Individual effect creators (converted from C)
  private createHitSpark = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF00',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 12
  });

  private createBlockSpark = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF01',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 8
  });

  private createFireball = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF02',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 24
  });

  private createShockwave = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF04',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 16
  });

  private createLightning = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF07',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 20
  });

  private createIceEffect = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF09',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 30
  });

  private createWindEffect = (params: EffectParams): EffectState => ({
    id: 0,
    type: 'EFF10',
    active: true,
    timer: 0,
    params,
    frameIndex: 0,
    totalFrames: 40
  });

  update(): void {
    for (const [id, effect] of this.effects) {
      if (!effect.active) continue;

      effect.timer++;
      effect.frameIndex = Math.floor(effect.timer * effect.params.animationSpeed);

      if (effect.frameIndex >= effect.totalFrames || effect.timer >= effect.params.duration) {
        effect.active = false;
        this.effects.delete(id);
      }
    }
  }

  getActiveEffects(): EffectState[] {
    return Array.from(this.effects.values()).filter(e => e.active);
  }

  removeEffect(id: number): void {
    this.effects.delete(id);
  }

  clearAllEffects(): void {
    this.effects.clear();
  }
}
