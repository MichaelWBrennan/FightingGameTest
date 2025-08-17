/**
 * test-harness.js - Unit test harness for schema and overlay logic
 * 
 * Node.js-based testing system for validating character data schemas,
 * variation overlay logic, and system integrity.
 * 
 * Usage:
 *   node tests/test-harness.js
 *   npm test (if added to package.json)
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  charactersPath: path.join(__dirname, '../assets/data/characters'),
  rotationPath: path.join(__dirname, '../assets/data/rotation.config.json'),
  verbose: process.argv.includes('--verbose'),
  stopOnError: process.argv.includes('--stop-on-error')
};

// Test state
let testCount = 0;
let passCount = 0;
let failCount = 0;
const failures = [];

/**
 * Simple test framework
 */
function test(name, testFn) {
  testCount++;
  try {
    testFn();
    passCount++;
    if (TEST_CONFIG.verbose) {
      console.log(`✅ ${name}`);
    }
  } catch (error) {
    failCount++;
    const failure = { name, error: error.message };
    failures.push(failure);
    console.error(`❌ ${name}: ${error.message}`);
    
    if (TEST_CONFIG.stopOnError) {
      process.exit(1);
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(message || `Expected ${actual} > ${expected}`);
  }
}

/**
 * Schema validation tests
 */
function validateCharacterBaseSchema(characterData) {
  // Required fields
  const requiredFields = ['schemaVersion', 'id', 'displayName', 'archetype', 'normals', 'specials', 'movement', 'stats'];
  requiredFields.forEach(field => {
    assert(field in characterData, `Missing required field: ${field}`);
  });

  // Schema version
  assertEqual(characterData.schemaVersion, '1.0', 'Schema version must be 1.0');

  // Required normals
  const requiredNormals = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'];
  requiredNormals.forEach(normal => {
    assert(normal in characterData.normals, `Missing required normal: ${normal}`);
  });

  // Validate move data structure
  Object.entries(characterData.normals).forEach(([moveId, moveData]) => {
    validateMoveData(moveId, moveData);
  });

  Object.entries(characterData.specials).forEach(([moveId, moveData]) => {
    validateMoveData(moveId, moveData);
  });

  // Validate stats
  const requiredStats = ['health', 'defense', 'meterGain', 'weight', 'stun'];
  requiredStats.forEach(stat => {
    assert(stat in characterData.stats, `Missing required stat: ${stat}`);
    assert(typeof characterData.stats[stat] === 'number', `Stat ${stat} must be a number`);
    assert(characterData.stats[stat] > 0, `Stat ${stat} must be positive`);
  });

  // Validate movement
  const requiredMovement = ['walkF', 'walkB', 'dashF', 'dashB', 'jumpArc'];
  requiredMovement.forEach(move => {
    assert(move in characterData.movement, `Missing required movement: ${move}`);
  });
}

function validateMoveData(moveId, moveData) {
  const requiredFields = ['name', 'damage', 'startup', 'recovery', 'tags'];
  requiredFields.forEach(field => {
    assert(field in moveData, `Move ${moveId} missing required field: ${field}`);
  });

  // Frame data validation
  assert(moveData.startup >= 1, `Move ${moveId} startup must be >= 1`);
  assert(moveData.recovery >= 1, `Move ${moveId} recovery must be >= 1`);
  assert(moveData.damage >= 0, `Move ${moveId} damage must be >= 0`);

  // Tags must be array
  assert(Array.isArray(moveData.tags), `Move ${moveId} tags must be an array`);
}

function validateVariationSchema(variationData, characterId) {
  // Required fields
  assertEqual(variationData.schemaVersion, '1.0', 'Variation schema version must be 1.0');
  assertEqual(variationData.characterId, characterId, 'Character ID must match');
  assert(Array.isArray(variationData.variations), 'Variations must be an array');
  assertEqual(variationData.variations.length, 3, 'Must have exactly 3 variations');

  // Validate each variation
  variationData.variations.forEach((variation, index) => {
    const requiredFields = ['id', 'name', 'description', 'adds', 'mods', 'removes'];
    requiredFields.forEach(field => {
      assert(field in variation, `Variation ${index} missing required field: ${field}`);
    });

    assert(typeof variation.adds === 'object', `Variation ${variation.id} adds must be an object`);
    assert(typeof variation.mods === 'object', `Variation ${variation.id} mods must be an object`);
    assert(Array.isArray(variation.removes), `Variation ${variation.id} removes must be an array`);
  });
}

/**
 * Mock VariationOverlay for testing
 */
class MockVariationOverlay {
  applyVariation(base, variation) {
    const result = JSON.parse(JSON.stringify(base)); // Deep clone

    // Apply removes
    variation.removes.forEach(path => {
      this.deletePath(result, path);
    });

    // Apply mods
    Object.entries(variation.mods).forEach(([path, value]) => {
      this.setPath(result, path, value);
    });

    // Apply adds
    Object.entries(variation.adds).forEach(([section, data]) => {
      if (typeof data === 'object' && data !== null) {
        if (!result[section]) {
          result[section] = {};
        }
        Object.assign(result[section], data);
      } else {
        result[section] = data;
      }
    });

    return result;
  }

  setPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  deletePath(obj, path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return;
      }
      current = current[key];
    }

    delete current[lastKey];
  }

  isEquivalent(obj1, obj2) {
    return JSON.stringify(this.sortObjectKeys(obj1)) === JSON.stringify(this.sortObjectKeys(obj2));
  }

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
}

/**
 * Test cases
 */
function runSchemaValidationTests() {
  console.log('\n🧪 Running Schema Validation Tests...');

  // Get all character files
  const characterFiles = fs.readdirSync(TEST_CONFIG.charactersPath)
    .filter(file => file.endsWith('.base.json'));

  characterFiles.forEach(filename => {
    const characterId = filename.replace('.base.json', '');
    
    test(`Schema validation: ${characterId} base`, () => {
      const filePath = path.join(TEST_CONFIG.charactersPath, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const characterData = JSON.parse(content);
      validateCharacterBaseSchema(characterData);
    });

    // Test corresponding variations file
    const variationFile = filename.replace('.base.json', '.variations.json');
    const variationPath = path.join(TEST_CONFIG.charactersPath, variationFile);
    
    if (fs.existsSync(variationPath)) {
      test(`Schema validation: ${characterId} variations`, () => {
        const content = fs.readFileSync(variationPath, 'utf8');
        const variationData = JSON.parse(content);
        validateVariationSchema(variationData, characterId);
      });
    }
  });

  // Test rotation config
  test('Schema validation: rotation config', () => {
    const content = fs.readFileSync(TEST_CONFIG.rotationPath, 'utf8');
    const rotationData = JSON.parse(content);
    
    assertEqual(rotationData.schemaVersion, '2.0', 'Rotation schema version must be 2.0');
    assert('pools' in rotationData, 'Rotation config missing pools');
    assert('flags' in rotationData, 'Rotation config missing flags');
    assert(Array.isArray(rotationData.pools.freeRotation), 'Free rotation must be array');
  });
}

function runOverlayLogicTests() {
  console.log('\n🔄 Running Overlay Logic Tests...');

  const overlay = new MockVariationOverlay();

  // Test basic overlay operations
  test('Overlay: Basic modification', () => {
    const base = { stats: { health: 1000, damage: 100 } };
    const variation = {
      id: 'test',
      name: 'Test',
      description: 'Test variation',
      adds: {},
      mods: { 'stats.health': 1100 },
      removes: []
    };

    const result = overlay.applyVariation(base, variation);
    assertEqual(result.stats.health, 1100, 'Health should be modified');
    assertEqual(result.stats.damage, 100, 'Damage should remain unchanged');
  });

  test('Overlay: Add new properties', () => {
    const base = { specials: { fireball: { damage: 100 } } };
    const variation = {
      id: 'test',
      name: 'Test',
      description: 'Test variation',
      adds: { specials: { lightning: { damage: 120 } } },
      mods: {},
      removes: []
    };

    const result = overlay.applyVariation(base, variation);
    assert('lightning' in result.specials, 'Lightning should be added');
    assertEqual(result.specials.lightning.damage, 120, 'Lightning damage should be 120');
    assert('fireball' in result.specials, 'Fireball should remain');
  });

  test('Overlay: Remove properties', () => {
    const base = { 
      specials: { 
        fireball: { damage: 100 },
        lightning: { damage: 120 }
      }
    };
    const variation = {
      id: 'test',
      name: 'Test',
      description: 'Test variation',
      adds: {},
      mods: {},
      removes: ['specials.lightning']
    };

    const result = overlay.applyVariation(base, variation);
    assert(!('lightning' in result.specials), 'Lightning should be removed');
    assert('fireball' in result.specials, 'Fireball should remain');
  });

  test('Overlay: Idempotence test', () => {
    const base = { stats: { health: 1000 } };
    const variation = {
      id: 'test',
      name: 'Test',
      description: 'Test variation',
      adds: {},
      mods: { 'stats.health': 1100 },
      removes: []
    };

    const first = overlay.applyVariation(base, variation);
    const second = overlay.applyVariation(first, variation);
    
    assert(overlay.isEquivalent(first, second), 'Multiple applications should be idempotent');
  });
}

function runArchetypeTests() {
  console.log('\n🎯 Running Archetype Coverage Tests...');

  const expectedArchetypes = [
    'shoto', 'zoner', 'grappler', 'rushdown', 'charge', 'footsies',
    'setplay', 'puppet', 'stance', 'rekka', 'powerhouse', 'aerial'
  ];

  const characterFiles = fs.readdirSync(TEST_CONFIG.charactersPath)
    .filter(file => file.endsWith('.base.json'));

  const foundArchetypes = new Set();

  characterFiles.forEach(filename => {
    const filePath = path.join(TEST_CONFIG.charactersPath, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const characterData = JSON.parse(content);
    foundArchetypes.add(characterData.archetype);
  });

  test('Archetype coverage: All archetypes present', () => {
    expectedArchetypes.forEach(archetype => {
      assert(foundArchetypes.has(archetype), `Missing archetype: ${archetype}`);
    });
  });

  test('Archetype coverage: Character count', () => {
    assertGreaterThan(characterFiles.length, 11, 'Should have at least 12 characters');
    assertEqual(foundArchetypes.size, expectedArchetypes.length, 'Should have all 12 archetypes');
  });
}

function runVariationTests() {
  console.log('\n🔀 Running Variation System Tests...');

  const characterFiles = fs.readdirSync(TEST_CONFIG.charactersPath)
    .filter(file => file.endsWith('.base.json'));

  characterFiles.forEach(filename => {
    const characterId = filename.replace('.base.json', '');
    const variationFile = filename.replace('.base.json', '.variations.json');
    const variationPath = path.join(TEST_CONFIG.charactersPath, variationFile);

    if (fs.existsSync(variationPath)) {
      test(`Variation test: ${characterId} has 3 variations`, () => {
        const content = fs.readFileSync(variationPath, 'utf8');
        const variationData = JSON.parse(content);
        assertEqual(variationData.variations.length, 3, 'Must have exactly 3 variations');
        
        // Check variation IDs are unique
        const ids = variationData.variations.map(v => v.id);
        const uniqueIds = new Set(ids);
        assertEqual(ids.length, uniqueIds.size, 'Variation IDs must be unique');
      });

      test(`Variation test: ${characterId} overlay application`, () => {
        // Load base character
        const basePath = path.join(TEST_CONFIG.charactersPath, filename);
        const baseContent = fs.readFileSync(basePath, 'utf8');
        const baseCharacter = JSON.parse(baseContent);

        // Load variations
        const variationContent = fs.readFileSync(variationPath, 'utf8');
        const variationData = JSON.parse(variationContent);

        const overlay = new MockVariationOverlay();

        // Test each variation applies without error
        variationData.variations.forEach(variation => {
          const result = overlay.applyVariation(baseCharacter, variation);
          assert(result.id === baseCharacter.id, 'Character ID should remain unchanged');
          assert(result.normals, 'Normals should exist after variation');
          assert(result.stats, 'Stats should exist after variation');
        });
      });
    }
  });
}

function runDeterminismTests() {
  console.log('\n🎲 Running Determinism Tests...');

  test('Determinism: Object key sorting', () => {
    const overlay = new MockVariationOverlay();
    const obj1 = { b: 2, a: 1, c: { z: 3, y: 2 } };
    const obj2 = { a: 1, c: { y: 2, z: 3 }, b: 2 };
    
    assert(overlay.isEquivalent(obj1, obj2), 'Objects with same content should be equivalent');
  });

  test('Determinism: Variation application order', () => {
    const base = { stats: { health: 1000, damage: 100 } };
    const variation = {
      id: 'test',
      name: 'Test',
      description: 'Test variation',
      adds: { specials: { new_move: { damage: 50 } } },
      mods: { 'stats.health': 1100 },
      removes: []
    };

    const overlay = new MockVariationOverlay();
    
    // Apply multiple times and check consistency
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(overlay.applyVariation(base, variation));
    }

    // All results should be equivalent
    for (let i = 1; i < results.length; i++) {
      assert(overlay.isEquivalent(results[0], results[i]), 'Multiple applications should yield identical results');
    }
  });
}

/**
 * Main test runner
 */
function runAllTests() {
  console.log('🚀 Starting Character System Test Harness\n');
  console.log(`Testing directory: ${TEST_CONFIG.charactersPath}`);
  console.log(`Verbose mode: ${TEST_CONFIG.verbose}`);
  console.log(`Stop on error: ${TEST_CONFIG.stopOnError}\n`);

  const startTime = Date.now();

  try {
    runSchemaValidationTests();
    runOverlayLogicTests();
    runArchetypeTests();
    runVariationTests();
    runDeterminismTests();
  } catch (error) {
    console.error('Test suite failed with error:', error);
    process.exit(1);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Total tests: ${testCount}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${failCount} ❌`);
  console.log(`Duration: ${duration}ms`);

  if (failCount > 0) {
    console.log('\n💥 Failures:');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.name}: ${failure.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  test,
  assert,
  assertEqual,
  assertGreaterThan,
  MockVariationOverlay,
  runAllTests
};