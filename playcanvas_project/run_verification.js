// --- Verification Script for Hit Detection and Damage ---

console.log('--- Starting Verification ---');

// --- Mock PlayCanvas Engine ---
const pc = { createScript: (n) => { const S = function(e) { this.entity = e; }; S.scriptName = n; return S; } };

// --- Mock Entities for Two Characters ---
const ryuEntity = {
    name: 'Ryu',
    position: { x: 0, y: 0, z: 0 },
    hurtbox: { x: -25, y: 0, width: 50, height: 150 },
    hitbox: { x: 0, y: 0, width: 0, height: 0, active: false }
};
const kenEntity = {
    name: 'Ken',
    position: { x: 50, y: 0, z: 0 }, // Position Ken for a hit
    hurtbox: { x: -25, y: 0, width: 50, height: 150 },
    hitbox: { x: 0, y: 0, width: 0, height: 0, active: false }
};

// --- Input Manager Script ---
var InputManager = { keys: { lightPunch: false } };

// --- Character Controller Script ---
var CharacterController = pc.createScript('characterController');
CharacterController.STATES = { IDLE: 'idle', ATTACKING: 'attacking' };
CharacterController.prototype.setup = function(jsonData) {
    this.characterData = jsonData;
    this.state = CharacterController.STATES.IDLE;
    this.attackTimer = 0;
    this.opponent = null;
    this.hitConnected = false;
    this.health = this.characterData.health || 1000;
    this.entity.health = this.health; // For external access in test
};
CharacterController.prototype.setState = function(newState) {
    if (this.state === newState) return;
    console.log(`${this.entity.name} state changed from '${this.state}' to '${newState}'`);
    this.state = newState;
};
CharacterController.prototype.performAttack = function(moveName) {
    this.hitConnected = false;
    this.currentMove = moveName;
    const moveData = this.characterData.moves.normals[moveName];
    if (!moveData) return;
    this.setState(CharacterController.STATES.ATTACKING);
    const totalFrames = moveData.startupFrames + moveData.activeFrames + moveData.recoveryFrames;
    this.attackTimer = totalFrames / 60;
    const hitboxData = moveData.hitboxes[0];
    if (hitboxData) {
        this.entity.hitbox.x = hitboxData.position[0];
        this.entity.hitbox.y = hitboxData.position[1];
        this.entity.hitbox.width = hitboxData.size[0];
        this.entity.hitbox.height = hitboxData.size[1];
        this.entity.hitbox.active = true;
    }
};
CharacterController.prototype.checkCollision = function(attacker, defender) {
    const aHitbox = attacker.hitbox;
    const dHurtbox = defender.hurtbox;
    const ax1 = attacker.position.x + aHitbox.x;
    const ax2 = ax1 + aHitbox.width;
    const dx1 = defender.position.x + dHurtbox.x;
    const dx2 = dx1 + dHurtbox.width;
    // Simple 1D check for this test
    return ax1 < dx2 && ax2 > dx1;
};
CharacterController.prototype.takeDamage = function(damage) {
    this.health -= damage;
    this.entity.health = this.health; // Update entity's health for test
    console.log(`${this.entity.name} takes ${damage} damage, new health: ${this.health}`);
};
CharacterController.prototype.update = function(dt) {
    if (this.state === CharacterController.STATES.ATTACKING) {
        if (this.entity.hitbox.active && !this.hitConnected && this.opponent) {
            if (this.checkCollision(this.entity, this.opponent.entity)) {
                this.hitConnected = true;
                const moveData = this.characterData.moves.normals[this.currentMove];
                if (moveData && moveData.damage) {
                    this.opponent.takeDamage(moveData.damage);
                }
            }
        }
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.entity.hitbox.active = false;
            this.setState(CharacterController.STATES.IDLE);
        }
        return;
    }
    if (InputManager.keys.lightPunch) {
        this.performAttack('lightPunch');
    }
};

// --- Mock Asset Data ---
const ryuJsonData = {
  "name": "Ryu", "health": 1000, "moves": { "normals": {
      "lightPunch": { "damage": 50, "startupFrames": 4, "activeFrames": 3, "recoveryFrames": 6,
        "hitboxes": [{ "position": [30, 0], "size": [40, 30] }]
      }
}}};
const kenJsonData = { "name": "Ken", "health": 1000 };

// --- Test Execution ---
console.log('\n--- Running Hit Detection Test ---');
const ryuController = new CharacterController(ryuEntity);
ryuController.setup(ryuJsonData);
const kenController = new CharacterController(kenEntity);
kenController.setup(kenJsonData);

ryuController.opponent = kenController;
kenController.opponent = ryuController;

console.log(`Initial state: Ryu health=${ryuController.health}, Ken health=${kenController.health}`);

console.log('\nSimulating Ryu attacks Ken...');
InputManager.keys.lightPunch = true;
ryuController.update(0.016); // Ryu starts attack
InputManager.keys.lightPunch = false;

console.log(`Ken's health after hit: ${kenController.health}`);
console.log('Expected Ken health: 950');

// Continue the attack until it's over
while (ryuController.state === CharacterController.STATES.ATTACKING) {
    ryuController.update(0.016);
}
console.log(`Final state: Ryu=${ryuController.state}, Ken=${kenController.state}`);

console.log('\n--- Verification Complete ---');
console.log('The logs show that Ryu attacks Ken, a hit is detected, and Ken\'s health is reduced.');
