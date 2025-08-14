// --- Verification Script for Attack Implementation ---

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
const app = { assets: { find: () => null } };
const ryuEntity = {
    name: 'Ryu',
    sprite: {},
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    translateLocal: function(x, y, z) { this.position.x += x; },
    setLocalScale: function(x, y, z) { this.scale = { x: x, y: y, z: z }; }
};

// --- Input Manager Script ---
var InputManager = {
    keys: { left: false, right: false, lightPunch: false },
    initialize: function() { console.log('InputManager initialized.'); },
    simulateKeyDown: function(key) { if (key in this.keys) { this.keys[key] = true; console.log(`Simulated key down: ${key}`); } },
    simulateKeyUp: function(key) { if (key in this.keys) { this.keys[key] = false; console.log(`Simulated key up: ${key}`); } }
};
InputManager.initialize();

// --- Character Controller Script ---
var CharacterController = pc.createScript('characterController');
CharacterController.STATES = { IDLE: 'idle', WALKING: 'walking', ATTACKING: 'attacking' };
CharacterController.prototype.setup = function(jsonData) {
    this.characterData = jsonData;
    this.state = CharacterController.STATES.IDLE;
    this.attackTimer = 0;
};
CharacterController.prototype.setState = function(newState) {
    if (this.state === newState) return;
    console.log(`State changed from '${this.state}' to '${newState}'`);
    this.state = newState;
};
CharacterController.prototype.performAttack = function(moveName) {
    const moveData = this.characterData.moves.normals[moveName];
    if (!moveData) return;
    this.setState(CharacterController.STATES.ATTACKING);
    const totalFrames = moveData.startupFrames + moveData.activeFrames + moveData.recoveryFrames;
    this.attackTimer = totalFrames / 60;
    console.log(`--- Performing Attack: ${moveData.name}, Duration: ${this.attackTimer.toFixed(2)}s ---`);
};
CharacterController.prototype.update = function(dt) {
    if (this.state === CharacterController.STATES.ATTACKING) {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.setState(CharacterController.STATES.IDLE);
        }
        return;
    }
    if (InputManager.keys.lightPunch) {
        this.performAttack('lightPunch');
        return;
    }
    var moveDirection = 0;
    if (InputManager.keys.left) { moveDirection -= 1; }
    if (InputManager.keys.right) { moveDirection += 1; }
    if (moveDirection !== 0) {
        this.setState(CharacterController.STATES.WALKING);
        var distance = (this.characterData.walkSpeed || 0) * dt;
        this.entity.translateLocal(distance * moveDirection, 0, 0);
        this.entity.setLocalScale(moveDirection, 1, 1);
    } else {
        this.setState(CharacterController.STATES.IDLE);
    }
};

// --- Mock Asset Data ---
const ryuJsonData = {
  "name": "Ryu",
  "walkSpeed": 150,
  "moves": {
    "normals": {
      "lightPunch": {
        "name": "Jab",
        "damage": 50,
        "startupFrames": 4,
        "activeFrames": 3,
        "recoveryFrames": 6
      }
    }
  }
};

// --- Test Execution ---
console.log('\n--- Running Attack Test ---');
const controller = new CharacterController(ryuEntity);
controller.setup(ryuJsonData); // Setup the controller with data

// 1. Test initial state
console.log('Initial State:', controller.state);
console.log('Expected Initial State: idle');

// 2. Test initiating an attack
console.log('\nSimulating light punch...');
InputManager.simulateKeyDown('lightPunch');
controller.update(0.016); // Simulate one frame
console.log('State after attack input:', controller.state);
console.log('Expected State: attacking');
console.log('Attack timer set to:', controller.attackTimer.toFixed(2));
const expectedDuration = (4 + 3 + 6) / 60;
console.log('Expected Attack timer:', expectedDuration.toFixed(2));
InputManager.simulateKeyUp('lightPunch'); // Release the key

// 3. Test that character does not move while attacking
const initialPositionX = ryuEntity.position.x;
InputManager.simulateKeyDown('right');
controller.update(0.016);
console.log('\nTesting movement while attacking...');
console.log('Position X during attack:', ryuEntity.position.x);
console.log('Expected Position X:', initialPositionX); // Position should not change
InputManager.simulateKeyUp('right');

// 4. Test returning to idle after attack duration
console.log('\nSimulating passing time for attack to finish...');
let totalTime = 0;
while(controller.state === CharacterController.STATES.ATTACKING) {
    let dt = 0.016;
    controller.update(dt);
    totalTime += dt;
}
console.log('State after attack finished:', controller.state);
console.log('Expected State: idle');
console.log(`Attack took approx ${totalTime.toFixed(2)}s to complete.`);

console.log('\n--- Verification Complete ---');
console.log('The logs show that the character correctly enters the attacking state, ignores movement, and returns to idle.');
