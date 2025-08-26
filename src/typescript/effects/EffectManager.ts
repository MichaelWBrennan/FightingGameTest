
export interface Effect {
    id: string;
    type: string;
    x: number;
    y: number;
    active: boolean;
    lifetime: number;
    currentTime: number;
    properties: Map<string, any>;
}

export class EffectManager {
    private effects: Map<string, Effect> = new Map();
    private effectCounter: number = 0;

    constructor() {
        this.initializeEffectSystem();
    }

    private initializeEffectSystem(): void {
        // Initialize effect pools and resources
    }

    public createEffect(type: string, x: number, y: number, properties?: Map<string, any>): string {
        const id = `effect_${this.effectCounter++}`;
        const effect: Effect = {
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

    public updateEffects(): void {
        for (const [id, effect] of this.effects) {
            if (!effect.active) continue;

            effect.currentTime++;
            
            // Update effect based on type
            this.updateEffectByType(effect);

            // Remove if lifetime exceeded
            if (effect.currentTime >= effect.lifetime) {
                this.removeEffect(id);
            }
        }
    }

    private updateEffectByType(effect: Effect): void {
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

    private updateExplosionEffect(effect: Effect): void {
        const scale = effect.currentTime / effect.lifetime;
        effect.properties.set('scale', scale);
        effect.properties.set('alpha', 1 - scale);
    }

    private updateParticleEffect(effect: Effect): void {
        const velocityX = effect.properties.get('velocityX') || 0;
        const velocityY = effect.properties.get('velocityY') || 0;
        const gravity = effect.properties.get('gravity') || 0;

        effect.x += velocityX;
        effect.y += velocityY;
        effect.properties.set('velocityY', velocityY + gravity);
    }

    private updateFlashEffect(effect: Effect): void {
        const intensity = Math.sin((effect.currentTime / effect.lifetime) * Math.PI);
        effect.properties.set('intensity', intensity);
    }

    private updateHitSparkEffect(effect: Effect): void {
        const fadeOut = 1 - (effect.currentTime / effect.lifetime);
        effect.properties.set('alpha', fadeOut);
        
        // Add some random movement
        const randomX = (Math.random() - 0.5) * 2;
        const randomY = (Math.random() - 0.5) * 2;
        effect.x += randomX;
        effect.y += randomY;
    }

    private updateGenericEffect(effect: Effect): void {
        // Default behavior for unknown effect types
        const alpha = 1 - (effect.currentTime / effect.lifetime);
        effect.properties.set('alpha', alpha);
    }

    public removeEffect(id: string): void {
        this.effects.delete(id);
    }

    public removeAllEffects(): void {
        this.effects.clear();
    }

    public getEffect(id: string): Effect | undefined {
        return this.effects.get(id);
    }

    public getAllEffects(): Effect[] {
        return Array.from(this.effects.values());
    }

    public getActiveEffectCount(): number {
        return Array.from(this.effects.values()).filter(e => e.active).length;
    }

    // Specific effect creation methods
    public createExplosion(x: number, y: number, size: number = 32): string {
        const properties = new Map([
            ['size', size],
            ['scale', 0],
            ['alpha', 1],
            ['lifetime', 30]
        ]);
        return this.createEffect('explosion', x, y, properties);
    }

    public createHitSpark(x: number, y: number, color: string = '#ffffff'): string {
        const properties = new Map([
            ['color', color],
            ['alpha', 1],
            ['lifetime', 15]
        ]);
        return this.createEffect('hit_spark', x, y, properties);
    }

    public createParticle(x: number, y: number, velocityX: number, velocityY: number): string {
        const properties = new Map([
            ['velocityX', velocityX],
            ['velocityY', velocityY],
            ['gravity', 0.1],
            ['lifetime', 120]
        ]);
        return this.createEffect('particle', x, y, properties);
    }

    public createFlash(x: number, y: number, duration: number = 10): string {
        const properties = new Map([
            ['intensity', 1],
            ['lifetime', duration]
        ]);
        return this.createEffect('flash', x, y, properties);
    }

    // Effect work functions (converting from original C functions)
    public effectWorkInit(): void {
        this.removeAllEffects();
    }

    public effectWorkQuickInit(): void {
        // Quick initialization without full cleanup
        for (const effect of this.effects.values()) {
            if (effect.type !== 'persistent') {
                effect.active = false;
            }
        }
    }

    public moveEffectWork(layer: number): void {
        // Move effects on specific layer
        for (const effect of this.effects.values()) {
            if (effect.properties.get('layer') === layer) {
                this.updateEffectByType(effect);
            }
        }
    }
}
