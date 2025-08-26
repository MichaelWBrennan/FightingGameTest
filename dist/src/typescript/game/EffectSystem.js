/**
 * Street Fighter III Effect System
 * Unified conversion of all EFF*.c files to TypeScript
 */
export class SF3EffectSystem {
    constructor() {
        Object.defineProperty(this, "effects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "nextId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "effectRegistry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Individual effect creators (converted from C)
        Object.defineProperty(this, "createHitSpark", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF00',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 12
            })
        });
        Object.defineProperty(this, "createBlockSpark", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF01',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 8
            })
        });
        Object.defineProperty(this, "createFireball", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF02',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 24
            })
        });
        Object.defineProperty(this, "createShockwave", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF04',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 16
            })
        });
        Object.defineProperty(this, "createLightning", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF07',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 20
            })
        });
        Object.defineProperty(this, "createIceEffect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF09',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 30
            })
        });
        Object.defineProperty(this, "createWindEffect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (params) => ({
                id: 0,
                type: 'EFF10',
                active: true,
                timer: 0,
                params,
                frameIndex: 0,
                totalFrames: 40
            })
        });
        this.registerAllEffects();
    }
    registerAllEffects() {
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
    registerEffect(name, factory) {
        this.effectRegistry.set(name, factory);
    }
    createEffect(type, params) {
        const factory = this.effectRegistry.get(type);
        if (!factory) {
            console.warn(`Unknown effect type: ${type}`);
            return -1;
        }
        const defaultParams = {
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
    update() {
        for (const [id, effect] of this.effects) {
            if (!effect.active)
                continue;
            effect.timer++;
            effect.frameIndex = Math.floor(effect.timer * effect.params.animationSpeed);
            if (effect.frameIndex >= effect.totalFrames || effect.timer >= effect.params.duration) {
                effect.active = false;
                this.effects.delete(id);
            }
        }
    }
    getActiveEffects() {
        return Array.from(this.effects.values()).filter(e => e.active);
    }
    removeEffect(id) {
        this.effects.delete(id);
    }
    clearAllEffects() {
        this.effects.clear();
    }
}
//# sourceMappingURL=EffectSystem.js.map