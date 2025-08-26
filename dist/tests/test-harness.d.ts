/**
 * test-harness.ts - Unit test harness for schema and overlay logic
 *
 * Node.js-based testing system for validating character data schemas,
 * variation overlay logic, and system integrity.
 *
 * Usage:
 *   npx ts-node tests/test-harness.ts
 *   npm test (if added to package.json)
 */
/**
 * Simple test framework
 */
declare function test(name: string, testFn: () => void): void;
declare function assert(condition: boolean, message?: string): void;
declare function assertEqual<T>(actual: T, expected: T, message?: string): void;
declare function assertGreaterThan(actual: number, expected: number, message?: string): void;
/**
 * Mock VariationOverlay for testing
 */
declare class MockVariationOverlay {
    applyVariation(base: any, variation: any): any;
    setPath(obj: any, path: string, value: any): void;
    deletePath(obj: any, path: string): void;
    isEquivalent(obj1: any, obj2: any): boolean;
    sortObjectKeys(obj: any): any;
}
/**
 * Main test runner
 */
declare function runAllTests(): void;
export { test, assert, assertEqual, assertGreaterThan, MockVariationOverlay, runAllTests };
//# sourceMappingURL=test-harness.d.ts.map