export class EffectManager {
    constructor() {
        this.effects = new Map();
        this.effectCounter = 0;
        this.initializeEffectSystem();
    }
    initializeEffectSystem() {
        // Initialize effect pools and resources
    }
    createEffect(type, x, y, properties) {
        const id = `effect_${this.effectCounter++}`;
        const effect = {
            id,
            type,
            x,
            y,
            active: true,
            lifetime: properties?.get('lifetime') || 60, // Default 60 frames
            currentTime: 0,
            properties: properties || new Map()
        };
        this.effects.set(id, effect);
        return id;
    }
    updateEffects() {
        for (const [id, effect] of this.effects) {
            if (!effect.active)
                continue;
            effect.currentTime++;
            // Update effect based on type
            this.updateEffectByType(effect);
            // Remove if lifetime exceeded
            if (effect.currentTime >= effect.lifetime) {
                this.removeEffect(id);
            }
        }
    }
    updateEffectByType(effect) {
        switch (effect.type) {
            case 'explosion':
                this.updateExplosionEffect(effect);
                break;
            case 'particle':
                this.updateParticleEffect(effect);
                break;
            case 'flash':
                this.updateFlashEffect(effect);
                break;
            case 'hit_spark':
                this.updateHitSparkEffect(effect);
                break;
            default:
                this.updateGenericEffect(effect);
                break;
        }
    }
    updateExplosionEffect(effect) {
        const scale = effect.currentTime / effect.lifetime;
        effect.properties.set('scale', scale);
        effect.properties.set('alpha', 1 - scale);
    }
    updateParticleEffect(effect) {
        const velocityX = effect.properties.get('velocityX') || 0;
        const velocityY = effect.properties.get('velocityY') || 0;
        const gravity = effect.properties.get('gravity') || 0;
        effect.x += velocityX;
        effect.y += velocityY;
        effect.properties.set('velocityY', velocityY + gravity);
    }
    updateFlashEffect(effect) {
        const intensity = Math.sin((effect.currentTime / effect.lifetime) * Math.PI);
        effect.properties.set('intensity', intensity);
    }
    updateHitSparkEffect(effect) {
        const fadeOut = 1 - (effect.currentTime / effect.lifetime);
        effect.properties.set('alpha', fadeOut);
        // Add some random movement
        const randomX = (Math.random() - 0.5) * 2;
        const randomY = (Math.random() - 0.5) * 2;
        effect.x += randomX;
        effect.y += randomY;
    }
    updateGenericEffect(effect) {
        // Default behavior for unknown effect types
        const alpha = 1 - (effect.currentTime / effect.lifetime);
        effect.properties.set('alpha', alpha);
    }
    removeEffect(id) {
        this.effects.delete(id);
    }
    removeAllEffects() {
        this.effects.clear();
    }
    getEffect(id) {
        return this.effects.get(id);
    }
    getAllEffects() {
        return Array.from(this.effects.values());
    }
    getActiveEffectCount() {
        return Array.from(this.effects.values()).filter(e => e.active).length;
    }
    // Specific effect creation methods
    createExplosion(x, y, size = 32) {
        const properties = new Map([
            ['size', size],
            ['scale', 0],
            ['alpha', 1],
            ['lifetime', 30]
        ]);
        return this.createEffect('explosion', x, y, properties);
    }
    createHitSpark(x, y, color = '#ffffff') {
        const properties = new Map([
            ['color', color],
            ['alpha', 1],
            ['lifetime', 15]
        ]);
        return this.createEffect('hit_spark', x, y, properties);
    }
    createParticle(x, y, velocityX, velocityY) {
        const properties = new Map([
            ['velocityX', velocityX],
            ['velocityY', velocityY],
            ['gravity', 0.1],
            ['lifetime', 120]
        ]);
        return this.createEffect('particle', x, y, properties);
    }
    createFlash(x, y, duration = 10) {
        const properties = new Map([
            ['intensity', 1],
            ['lifetime', duration]
        ]);
        return this.createEffect('flash', x, y, properties);
    }
    // Effect work functions (converting from original C functions)
    effectWorkInit() {
        this.removeAllEffects();
    }
    effectWorkQuickInit() {
        // Quick initialization without full cleanup
        for (const effect of this.effects.values()) {
            if (effect.type !== 'persistent') {
                effect.active = false;
            }
        }
    }
    moveEffectWork(layer) {
        // Move effects on specific layer
        for (const effect of this.effects.values()) {
            if (effect.properties.get('layer') === layer) {
                this.updateEffectByType(effect);
            }
        }
    }
}
//# sourceMappingURL=EffectManager.js.map