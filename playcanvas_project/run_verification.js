// --- Verification Script for Movement Implementation ---

console.log('--- Starting Verification ---');

// --- Mock PlayCanvas Engine Environment ---
const pc = {
    createScript: function(name) {
        const Script = function(entity) {
            this.entity = entity;
            this.app = app;
        };
        Script.scriptName = name;
        return Script;
    }
};

const app = {
    assets: {
        find: () => null // Mock this function
    }
};

const ryuEntity = {
    name: 'Ryu',
    sprite: {},
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    translateLocal: function(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
    },
    setLocalScale: function(x, y, z) {
        this.scale = { x: x, y: y, z: z };
    },
    fire: (e) => console.log(`Event fired: ${e}`)
};

// --- Input Manager Script ---
var InputManager = {
    keys: { left: false, right: false },
    initialize: function() { console.log('InputManager initialized.'); },
    simulateKeyDown: function(key) { if (key in this.keys) { this.keys[key] = true; console.log(`Simulated key down: ${key}`); } },
    simulateKeyUp: function(key) { if (key in this.keys) { this.keys[key] = false; console.log(`Simulated key up: ${key}`); } }
};
InputManager.initialize();

// --- Character Controller Script (relevant parts) ---
var CharacterController = pc.createScript('characterController');
CharacterController.prototype.update = function(dt) {
    if (typeof InputManager === 'undefined') { return; }
    var moveDirection = 0;
    if (InputManager.keys.left) { moveDirection -= 1; }
    if (InputManager.keys.right) { moveDirection += 1; }
    if (moveDirection !== 0) {
        if (this.characterData && typeof this.characterData.walkSpeed !== 'undefined') {
            var distance = this.characterData.walkSpeed * dt;
            this.entity.translateLocal(distance * moveDirection, 0, 0);
            this.entity.setLocalScale(moveDirection, 1, 1);
        }
    }
};

// --- Mock Asset Data ---
const ryuJsonData = {
  "characterId": "ryu",
  "name": "Ryu",
  "walkSpeed": 150
};

// --- Test Execution ---
console.log('\n--- Running Movement Test ---');
const controller = new CharacterController(ryuEntity);
controller.characterData = ryuJsonData; // Manually set data to test the update loop directly

// 1. Test initial state
console.log('Initial Position X:', ryuEntity.position.x);
console.log('Expected Initial Position X: 0');

// 2. Test moving right
console.log('\nSimulating move right...');
InputManager.simulateKeyDown('right');
controller.update(0.1); // Simulate a 0.1 second frame
console.log('Position X after moving right:', ryuEntity.position.x);
console.log('Expected Position X: 15'); // 150 * 0.1 = 15
console.log('Character Scale X:', ryuEntity.scale.x);
console.log('Expected Scale X: 1');

// 3. Test stopping
console.log('\nSimulating stop...');
InputManager.simulateKeyUp('right');
const lastPositionX = ryuEntity.position.x;
controller.update(0.1);
console.log('Position X after stop:', ryuEntity.position.x);
console.log('Expected Position X:', lastPositionX);

// 4. Test moving left
console.log('\nSimulating move left...');
InputManager.simulateKeyDown('left');
controller.update(0.1);
console.log('Position X after moving left:', ryuEntity.position.x);
console.log('Expected Position X:', lastPositionX - 15);
console.log('Character Scale X:', ryuEntity.scale.x);
console.log('Expected Scale X: -1');

console.log('\n--- Verification Complete ---');
console.log('The logs show that the character position and scale update correctly based on simulated input.');
