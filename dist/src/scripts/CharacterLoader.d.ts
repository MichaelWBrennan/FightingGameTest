import * as pc from 'playcanvas';
interface CharacterBase {
    schemaVersion: string;
    id: string;
    displayName: string;
    archetype: string;
    trait: {
        id: string;
        name: string;
        description: string;
        params: Record<string, any>;
    };
    normals: Record<string, MoveData>;
    specials: Record<string, MoveData>;
    supers: Record<string, MoveData>;
    movement: MovementData;
    stats: StatsData;
}
interface MoveData {
    name: string;
    input?: string;
    damage: number;
    startup: number;
    active?: number;
    recovery: number;
    onBlock: number;
    onHit?: number;
    invulnFrames?: [number, number];
    tags: string[];
    hitbox?: HitboxData;
    projectile?: ProjectileData;
    meterCost?: number;
    stanceRequired?: string;
    armor?: ArmorData;
}
interface HitboxData {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface ProjectileData {
    speed: number;
    lifetime: number;
    size: {
        width: number;
        height: number;
    };
}
interface ArmorData {
    hits: number;
    type: string;
}
interface MovementData {
    walkF: number;
    walkB: number;
    dashF: number;
    dashB: number;
    jumpArc: string;
    airDash: boolean;
    doubleJump: boolean;
}
interface StatsData {
    health: number;
    defense: number;
    meterGain: number;
    weight: number;
    stun: number;
}
interface Variation {
    id: string;
    name: string;
    description: string;
    adds: Record<string, any>;
    mods: Record<string, any>;
    removes: string[];
}
interface LoadedCharacter {
    base: CharacterBase;
    variation: Variation | null;
    compiled: CharacterBase;
    hash: string;
    metadata: {
        loadTime: number;
        schemaVersion: string;
        variationId: string | null;
    };
}
export declare class CharacterLoader {
    private app;
    private variationOverlay;
    private cache;
    private variationCache;
    private compiledCache;
    constructor(app: pc.Application);
    /**
     * Load a character with optional variation
     * @param characterId Character base ID
     * @param variationId Optional variation ID (defaults to first variation)
     * @returns Promise<LoadedCharacter>
     */
    loadCharacter(characterId: string, variationId?: string): Promise<LoadedCharacter>;
    /**
     * Load character base data from JSON
     */
    private loadCharacterBase;
    /**
     * Load character variation data from JSON
     */
    private loadCharacterVariations;
    /**
     * Compile character by applying variation overlay
     */
    private compileCharacter;
    /**
     * Generate deterministic hash for replay/netcode integrity
     */
    private generateCharacterHash;
    /**
     * Recursively sort object keys for deterministic hashing
     */
    private sortObjectKeys;
    /**
     * Validate schema version compatibility
     */
    private validateSchemaVersion;
    /**
     * Validate character base data structure
     */
    private validateCharacterBase;
    /**
     * Validate individual move data
     */
    private validateMoveData;
    /**
     * Get available characters from loaded cache
     */
    getAvailableCharacters(): string[];
    /**
     * Get available variations for a character
     */
    getCharacterVariations(characterId: string): Promise<Variation[]>;
    /**
     * Clear all caches (useful for hot-reloading in development)
     */
    clearCache(): void;
    /**
     * Preload character data for faster access
     */
    preloadCharacter(characterId: string): Promise<void>;
    /**
     * Get character hash for a specific character/variation combo
     * Useful for netcode validation
     */
    getCharacterHash(characterId: string, variationId?: string): Promise<string>;
}
export {};
/**
 * How to extend this system:
 *
 * 1. Adding new character: Create {id}.base.json and optional {id}.variations.json
 * 2. Adding new archetype: Update archetype validation and add to character base
 * 3. Adding new move properties: Update MoveData interface and validation
 * 4. Adding new variation types: Update Variation interface and VariationOverlay
 * 5. Schema evolution: Increment schemaVersion and add migration logic
 */ 
//# sourceMappingURL=CharacterLoader.d.ts.map