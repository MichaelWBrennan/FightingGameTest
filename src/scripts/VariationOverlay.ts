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

export class VariationOverlay {
  private readonly PROTECTED_FIELDS = [
    'id',
    'schemaVersion',
    'displayName',
    'archetype',
    'normals.lp',
    'normals.mp', 
    'normals.hp',
    'normals.lk',
    'normals.mk',
    'normals.hk'
  ];

  private readonly NUMERIC_FIELDS = [
    'damage',
    'startup',
    'active', 
    'recovery',
    'onBlock',
    'onHit',
    'meterCost',
    'health',
    'defense',
    'meterGain',
    'weight',
    'stun',
    'walkF',
    'walkB',
    'dashF',
    'dashB'
  ];

  /**
   * Apply variation to base character data
   * @param base Base character data
   * @param variation Variation to apply
   * @returns Modified character data
   */
  applyVariation(base: any, variation: Variation): any {
    // Deep clone base to avoid mutation
    const result = this.deepClone(base);
    const diff: VariationDiff = {
      added: [],
      modified: [],
      removed: [],
      errors: [],
      warnings: []
    };

    try {
      // Apply operations in order: removes -> mods -> adds
      this.applyRemoves(result, variation.removes, diff);
      this.applyMods(result, variation.mods, diff);
      this.applyAdds(result, variation.adds, diff);

      // Log the diff for debugging/analytics
      this.logVariationDiff(variation.id, diff);

      // Validate final result
      this.validateResult(result, diff);

      return result;

    } catch (error) {
      diff.errors.push(`Variation application failed: ${error.message}`);
      throw new Error(`VariationOverlay: Failed to apply variation '${variation.id}': ${error.message}`);
    }
  }

  /**
   * Apply remove operations
   */
  private applyRemoves(target: any, removes: string[], diff: VariationDiff): void {
    for (const path of removes) {
      try {
        // Check if path is protected
        if (this.isProtectedField(path)) {
          diff.errors.push(`Cannot remove protected field: ${path}`);
          continue;
        }

        // Check if path exists
        if (!this.hasPath(target, path)) {
          diff.warnings.push(`Remove target not found: ${path}`);
          continue;
        }

        // Remove the field
        this.deletePath(target, path);
        diff.removed.push(path);

      } catch (error) {
        diff.errors.push(`Failed to remove '${path}': ${error.message}`);
      }
    }
  }

  /**
   * Apply modification operations
   */
  private applyMods(target: any, mods: Record<string, any>, diff: VariationDiff): void {
    for (const [path, value] of Object.entries(mods)) {
      try {
        // Check if path is protected from modification
        if (this.isProtectedField(path)) {
          diff.warnings.push(`Modifying protected field: ${path}`);
        }

        // Check if target path exists
        if (!this.hasPath(target, path)) {
          diff.warnings.push(`Mod target not found, treating as add: ${path}`);
        }

        // Apply modification
        this.setPath(target, path, value);
        diff.modified.push(path);

      } catch (error) {
        diff.errors.push(`Failed to modify '${path}': ${error.message}`);
      }
    }
  }

  /**
   * Apply add operations
   */
  private applyAdds(target: any, adds: Record<string, any>, diff: VariationDiff): void {
    for (const [section, data] of Object.entries(adds)) {
      try {
        if (typeof data === 'object' && data !== null) {
          // Ensure parent section exists
          if (!target[section]) {
            target[section] = {};
          }

          // Add all entries in this section
          for (const [key, value] of Object.entries(data)) {
            const fullPath = `${section}.${key}`;

            if (this.hasPath(target, fullPath)) {
              diff.warnings.push(`Add target already exists, overwriting: ${fullPath}`);
            }

            this.setPath(target, fullPath, value);
            diff.added.push(fullPath);
          }
        } else {
          // Direct value add
          if (this.hasPath(target, section)) {
            diff.warnings.push(`Add target already exists, overwriting: ${section}`);
          }

          target[section] = data;
          diff.added.push(section);
        }

      } catch (error) {
        diff.errors.push(`Failed to add '${section}': ${error.message}`);
      }
    }
  }

  /**
   * Check if a field is protected from modification/removal
   */
  private isProtectedField(path: string): boolean {
    return this.PROTECTED_FIELDS.some(protectedPath => 
      path === protectedPath || path.startsWith(protectedPath + '.')
    );
  }

  /**
   * Check if a path exists in the object
   */
  private hasPath(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * Get value at path
   */
  private getPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set value at path, creating intermediate objects as needed
   */
  private setPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    // Navigate/create path
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    // Handle numeric field modifications with special logic
    if (this.isNumericField(lastKey) && typeof value === 'object' && value !== null) {
      current[lastKey] = this.applyNumericModification(current[lastKey], value);
    } else {
      current[lastKey] = value;
    }
  }

  /**
   * Delete value at path
   */
  private deletePath(obj: any, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    // Navigate to parent
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return; // Path doesn't exist
      }
      current = current[key];
    }

    // Delete the final key
    delete current[lastKey];
  }

  /**
   * Check if field accepts numeric modifications
   */
  private isNumericField(field: string): boolean {
    return this.NUMERIC_FIELDS.includes(field);
  }

  /**
   * Apply numeric modifications (supports relative changes)
   */
  private applyNumericModification(currentValue: number, modification: any): number {
    if (typeof modification === 'number') {
      return modification; // Direct replacement
    }

    if (typeof modification === 'object' && modification !== null) {
      let result = currentValue || 0;

      // Support for relative modifications
      if ('add' in modification) {
        result += modification.add;
      }

      if ('multiply' in modification) {
        result *= modification.multiply;
      }

      if ('set' in modification) {
        result = modification.set;
      }

      // Apply min/max constraints
      if ('min' in modification && result < modification.min) {
        result = modification.min;
      }

      if ('max' in modification && result > modification.max) {
        result = modification.max;
      }

      return result;
    }

    return modification; // Fallback to direct assignment
  }

  /**
   * Deep clone object to avoid mutations
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deepClone(value);
    }

    return cloned;
  }

  /**
   * Validate the final result meets basic requirements
   */
  private validateResult(result: any, diff: VariationDiff): void {
    // Check that required normals still exist
    const requiredNormals = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'];
    for (const normal of requiredNormals) {
      if (!this.hasPath(result, `normals.${normal}`)) {
        diff.errors.push(`Variation removed required normal: ${normal}`);
      }
    }

    // Check that stats are still valid
    const stats = result.stats || {};
    if (stats.health <= 0) {
      diff.errors.push('Character health must be greater than 0');
    }

    if (stats.defense <= 0) {
      diff.errors.push('Character defense must be greater than 0');
    }

    // Throw if there are critical errors
    if (diff.errors.length > 0) {
      throw new Error(`Validation failed: ${diff.errors.join(', ')}`);
    }
  }

  /**
   * Log variation diff for debugging and analytics
   */
  private logVariationDiff(variationId: string, diff: VariationDiff): void {
    const summary = {
      variation: variationId,
      changes: {
        added: diff.added.length,
        modified: diff.modified.length,
        removed: diff.removed.length
      },
      issues: {
        errors: diff.errors.length,
        warnings: diff.warnings.length
      }
    };

    console.log(`VariationOverlay: Applied ${variationId}`, summary);

    // Log warnings
    if (diff.warnings.length > 0) {
      console.warn(`VariationOverlay: Warnings for ${variationId}:`, diff.warnings);
    }

    // Log errors (will throw after this)
    if (diff.errors.length > 0) {
      console.error(`VariationOverlay: Errors for ${variationId}:`, diff.errors);
    }
  }

  /**
   * Generate a diff report for UI/analytics consumption
   */
  generateDiffReport(base: any, variation: Variation): VariationDiff {
    const testResult = this.deepClone(base);
    const diff: VariationDiff = {
      added: [],
      modified: [],
      removed: [],
      errors: [],
      warnings: []
    };

    try {
      // Dry run to generate diff without applying
      this.applyRemoves(testResult, variation.removes, diff);
      this.applyMods(testResult, variation.mods, diff);
      this.applyAdds(testResult, variation.adds, diff);

    } catch (error) {
      diff.errors.push(error.message);
    }

    return diff;
  }

  /**
   * Check if two character objects are functionally equivalent
   * Useful for testing variation idempotence
   */
  isEquivalent(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.sortObjectKeys(obj1)) === JSON.stringify(this.sortObjectKeys(obj2));
  }

  /**
   * Sort object keys recursively for deterministic comparison
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObjectKeys(obj[key]);
    });

    return sorted;
  }

  /**
   * Test variation overlay idempotence
   * Applying the same variation twice should yield identical results
   */
  testIdempotence(base: any, variation: Variation): boolean {
    const first = this.applyVariation(base, variation);
    const second = this.applyVariation(first, variation);
    return this.isEquivalent(first, second);
  }
}

/**
 * How to extend this system:
 * 
 * 1. Adding new operation types: Extend applyAdds/applyMods/applyRemoves methods
 * 2. Adding new field types: Update NUMERIC_FIELDS and add type-specific logic
 * 3. Adding validation rules: Extend validateResult method
 * 4. Adding transformation logic: Create new apply* methods and call from applyVariation
 * 5. Adding complex merging: Extend setPath with type-specific merge strategies
 */