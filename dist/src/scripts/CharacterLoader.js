/**
 * CharacterLoader.ts - Data-driven character loading with MKX-style variations
 *
 * Loads character.base.json and applies selected variation overlay at runtime.
 * Ensures deterministic loading for replay/netcode integrity.
 *
 * Usage:
 *   const loader = new CharacterLoader(app);
 *   const character = await loader.loadCharacter('vanguard', 'discipline');
 */
import { VariationOverlay } from './VariationOverlay';
import crypto from 'crypto';
export class CharacterLoader {
    constructor(app) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "variationOverlay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "variationCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "compiledCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.app = app;
        this.variationOverlay = new VariationOverlay();
    }
    /**
     * Load a character with optional variation
     * @param characterId Character base ID
     * @param variationId Optional variation ID (defaults to first variation)
     * @returns Promise<LoadedCharacter>
     */
    async loadCharacter(characterId, variationId) {
        const startTime = performance.now();
        try {
            // Generate cache key
            const cacheKey = `${characterId}:${variationId || 'base'}`;
            // Check compiled cache first
            if (this.compiledCache.has(cacheKey)) {
                const cached = this.compiledCache.get(cacheKey);
                console.log(`CharacterLoader: Using cached character ${cacheKey}`);
                return cached;
            }
            // Load base character data
            const baseCharacter = await this.loadCharacterBase(characterId);
            // Load variation data if specified
            let variation = null;
            if (variationId) {
                const variations = await this.loadCharacterVariations(characterId);
                variation = variations.variations.find(v => v.id === variationId) || null;
                if (!variation) {
                    console.warn(`CharacterLoader: Variation '${variationId}' not found for '${characterId}', using base`);
                }
            }
            // Compile character with variation overlay
            const compiled = await this.compileCharacter(baseCharacter, variation);
            // Generate deterministic hash for netcode
            const hash = this.generateCharacterHash(compiled, variation);
            // Create loaded character object
            const loadedCharacter = {
                base: baseCharacter,
                variation,
                compiled,
                hash,
                metadata: {
                    loadTime: performance.now() - startTime,
                    schemaVersion: baseCharacter.schemaVersion,
                    variationId: variation?.id || null
                }
            };
            // Cache the result
            this.compiledCache.set(cacheKey, loadedCharacter);
            console.log(`CharacterLoader: Loaded ${characterId}${variation ? ` (${variation.name})` : ''} in ${loadedCharacter.metadata.loadTime.toFixed(2)}ms`);
            // Emit analytics event
            this.app.fire('character:loaded', {
                characterId,
                variationId: variation?.id,
                loadTime: loadedCharacter.metadata.loadTime,
                hash
            });
            return loadedCharacter;
        }
        catch (error) {
            console.error(`CharacterLoader: Failed to load character '${characterId}'${variationId ? ` with variation '${variationId}'` : ''}:`, error);
            throw error;
        }
    }
    /**
     * Load character base data from JSON
     */
    async loadCharacterBase(characterId) {
        // Check cache first
        if (this.cache.has(characterId)) {
            return this.cache.get(characterId);
        }
        try {
            const response = await fetch(`assets/data/characters/${characterId}.base.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            // Validate schema version
            if (!this.validateSchemaVersion(data.schemaVersion)) {
                console.warn(`CharacterLoader: Schema version mismatch for '${characterId}'. Expected 1.0, got ${data.schemaVersion}`);
            }
            // Validate required fields
            this.validateCharacterBase(data);
            // Cache the result
            this.cache.set(characterId, data);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to load character base '${characterId}': ${error.message}`);
        }
    }
    /**
     * Load character variation data from JSON
     */
    async loadCharacterVariations(characterId) {
        // Check cache first
        if (this.variationCache.has(characterId)) {
            return this.variationCache.get(characterId);
        }
        try {
            const response = await fetch(`assets/data/characters/${characterId}.variations.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            // Validate schema version
            if (!this.validateSchemaVersion(data.schemaVersion)) {
                console.warn(`CharacterLoader: Schema version mismatch for variations '${characterId}'. Expected 1.0, got ${data.schemaVersion}`);
            }
            // Validate character ID matches
            if (data.characterId !== characterId) {
                throw new Error(`Character ID mismatch: expected '${characterId}', got '${data.characterId}'`);
            }
            // Cache the result
            this.variationCache.set(characterId, data);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to load character variations '${characterId}': ${error.message}`);
        }
    }
    /**
     * Compile character by applying variation overlay
     */
    async compileCharacter(base, variation) {
        if (!variation) {
            // Return deep copy of base character
            return JSON.parse(JSON.stringify(base));
        }
        try {
            // Apply variation overlay using VariationOverlay engine
            const compiled = this.variationOverlay.applyVariation(base, variation);
            // Validate the compiled result
            this.validateCharacterBase(compiled);
            return compiled;
        }
        catch (error) {
            throw new Error(`Failed to compile character with variation '${variation.id}': ${error.message}`);
        }
    }
    /**
     * Generate deterministic hash for replay/netcode integrity
     */
    generateCharacterHash(character, variation) {
        // Create deterministic object for hashing
        const hashObject = {
            character: {
                id: character.id,
                schemaVersion: character.schemaVersion,
                normals: character.normals,
                specials: character.specials,
                supers: character.supers,
                movement: character.movement,
                stats: character.stats,
                trait: character.trait
            },
            variation: variation ? {
                id: variation.id,
                adds: variation.adds,
                mods: variation.mods,
                removes: variation.removes
            } : null
        };
        // Sort keys for deterministic output
        const sortedData = this.sortObjectKeys(hashObject);
        const dataString = JSON.stringify(sortedData);
        // Generate SHA-256 hash
        return crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 16);
    }
    /**
     * Recursively sort object keys for deterministic hashing
     */
    sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = this.sortObjectKeys(obj[key]);
        });
        return sorted;
    }
    /**
     * Validate schema version compatibility
     */
    validateSchemaVersion(version) {
        const supportedVersions = ['1.0'];
        return supportedVersions.includes(version);
    }
    /**
     * Validate character base data structure
     */
    validateCharacterBase(data) {
        const required = ['id', 'displayName', 'archetype', 'normals', 'specials', 'movement', 'stats'];
        for (const field of required) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        // Validate normals have required buttons
        const requiredNormals = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'];
        for (const normal of requiredNormals) {
            if (!(normal in data.normals)) {
                throw new Error(`Missing required normal: ${normal}`);
            }
        }
        // Validate move data structure
        for (const [moveId, moveData] of Object.entries(data.normals)) {
            this.validateMoveData(moveId, moveData);
        }
        for (const [moveId, moveData] of Object.entries(data.specials)) {
            this.validateMoveData(moveId, moveData);
        }
        for (const [moveId, moveData] of Object.entries(data.supers)) {
            this.validateMoveData(moveId, moveData);
        }
    }
    /**
     * Validate individual move data
     */
    validateMoveData(moveId, moveData) {
        const required = ['name', 'damage', 'startup', 'recovery', 'onBlock', 'tags'];
        for (const field of required) {
            if (!(field in moveData)) {
                throw new Error(`Move '${moveId}' missing required field: ${field}`);
            }
        }
        // Validate frame data is positive
        if (moveData.startup < 1) {
            throw new Error(`Move '${moveId}' has invalid startup frames: ${moveData.startup}`);
        }
        if (moveData.recovery < 1) {
            throw new Error(`Move '${moveId}' has invalid recovery frames: ${moveData.recovery}`);
        }
        // Validate tags is array
        if (!Array.isArray(moveData.tags)) {
            throw new Error(`Move '${moveId}' tags must be an array`);
        }
    }
    /**
     * Get available characters from loaded cache
     */
    getAvailableCharacters() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get available variations for a character
     */
    async getCharacterVariations(characterId) {
        try {
            const variations = await this.loadCharacterVariations(characterId);
            return variations.variations;
        }
        catch (error) {
            console.warn(`CharacterLoader: No variations found for '${characterId}'`);
            return [];
        }
    }
    /**
     * Clear all caches (useful for hot-reloading in development)
     */
    clearCache() {
        this.cache.clear();
        this.variationCache.clear();
        this.compiledCache.clear();
        console.log('CharacterLoader: All caches cleared');
    }
    /**
     * Preload character data for faster access
     */
    async preloadCharacter(characterId) {
        try {
            await this.loadCharacterBase(characterId);
            await this.loadCharacterVariations(characterId).catch(() => {
                // Variations are optional, ignore errors
            });
            console.log(`CharacterLoader: Preloaded '${characterId}'`);
        }
        catch (error) {
            console.error(`CharacterLoader: Failed to preload '${characterId}':`, error);
        }
    }
    /**
     * Get character hash for a specific character/variation combo
     * Useful for netcode validation
     */
    async getCharacterHash(characterId, variationId) {
        const loaded = await this.loadCharacter(characterId, variationId);
        return loaded.hash;
    }
}
/**
 * How to extend this system:
 *
 * 1. Adding new character: Create {id}.base.json and optional {id}.variations.json
 * 2. Adding new archetype: Update archetype validation and add to character base
 * 3. Adding new move properties: Update MoveData interface and validation
 * 4. Adding new variation types: Update Variation interface and VariationOverlay
 * 5. Schema evolution: Increment schemaVersion and add migration logic
 */ 
//# sourceMappingURL=CharacterLoader.js.map