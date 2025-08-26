/**
 * VariationOverlay.ts - Pure merge engine for MKX-style character variations
 *
 * Handles adds/mods/removes operations on character data.
 * Enforces guardrails and produces deterministic results.
 *
 * Usage:
 *   const overlay = new VariationOverlay();
 *   const modified = overlay.applyVariation(baseCharacter, variation);
 */
interface Variation {
    id: string;
    name: string;
    description: string;
    adds: Record<string, any>;
    mods: Record<string, any>;
    removes: string[];
}
interface VariationDiff {
    added: string[];
    modified: string[];
    removed: string[];
    errors: string[];
    warnings: string[];
}
export declare class VariationOverlay {
    private readonly PROTECTED_FIELDS;
    private readonly NUMERIC_FIELDS;
    /**
     * Apply variation to base character data
     * @param base Base character data
     * @param variation Variation to apply
     * @returns Modified character data
     */
    applyVariation(base: any, variation: Variation): any;
    /**
     * Apply remove operations
     */
    private applyRemoves;
    /**
     * Apply modification operations
     */
    private applyMods;
    /**
     * Apply add operations
     */
    private applyAdds;
    /**
     * Check if a field is protected from modification/removal
     */
    private isProtectedField;
    /**
     * Check if a path exists in the object
     */
    private hasPath;
    /**
     * Get value at path
     */
    private getPath;
    /**
     * Set value at path, creating intermediate objects as needed
     */
    private setPath;
    /**
     * Delete value at path
     */
    private deletePath;
    /**
     * Check if field accepts numeric modifications
     */
    private isNumericField;
    /**
     * Apply numeric modifications (supports relative changes)
     */
    private applyNumericModification;
    /**
     * Deep clone object to avoid mutations
     */
    private deepClone;
    /**
     * Validate the final result meets basic requirements
     */
    private validateResult;
    /**
     * Log variation diff for debugging and analytics
     */
    private logVariationDiff;
    /**
     * Generate a diff report for UI/analytics consumption
     */
    generateDiffReport(base: any, variation: Variation): VariationDiff;
    /**
     * Check if two character objects are functionally equivalent
     * Useful for testing variation idempotence
     */
    isEquivalent(obj1: any, obj2: any): boolean;
    /**
     * Sort object keys recursively for deterministic comparison
     */
    private sortObjectKeys;
    /**
     * Test variation overlay idempotence
     * Applying the same variation twice should yield identical results
     */
    testIdempotence(base: any, variation: Variation): boolean;
}
export {};
/**
 * How to extend this system:
 *
 * 1. Adding new operation types: Extend applyAdds/applyMods/applyRemoves methods
 * 2. Adding new field types: Update NUMERIC_FIELDS and add type-specific logic
 * 3. Adding validation rules: Extend validateResult method
 * 4. Adding transformation logic: Create new apply* methods and call from applyVariation
 * 5. Adding complex merging: Extend setPath with type-specific merge strategies
 */ 
//# sourceMappingURL=VariationOverlay.d.ts.map