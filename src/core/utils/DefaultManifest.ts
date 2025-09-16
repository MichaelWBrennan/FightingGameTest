export type DefaultManifest = {
    assets: Array<{ path: string; type: 'json' | 'image' | 'audio' | 'other'; }>;
};

// Minimal manifest to guarantee boot on iOS/Safari if static fetch fails
export function getDefaultManifest(): DefaultManifest {
    return {
        assets: [
            // Core JSON configs that are small and safe to preload
            { path: '/data/rotation.config.json', type: 'json' },
            { path: '/data/store/catalog.json', type: 'json' },
            // Minimal characters for instant play
            { path: '/data/characters/ryu.json', type: 'json' },
            { path: '/data/characters/ken.json', type: 'json' },
            // A few small stages (procedural/parallax uses these as seeds)
            { path: '/data/stages/castle.json', type: 'json' },
            { path: '/data/stages/cathedral.json', type: 'json' },
            { path: '/data/stages/crypt.json', type: 'json' }
        ]
    };
}

