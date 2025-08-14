var CharacterController = pc.createScript('characterController');

// --- STATICS ---
CharacterController.STATES = {
    IDLE: 'idle',
    WALKING: 'walking',
    ATTACKING: 'attacking'
};

// Add asset attribute for the character JSON data
CharacterController.attributes.add('characterJson', {
    type: 'asset',
    assetType: 'json',
    title: 'Character JSON'
});

// initialize code called once per entity
CharacterController.prototype.initialize = function() {
    console.log('Character controller initialized.');

    // In a real PlayCanvas app, the engine handles loading the JSON asset
    // and makes the parsed data available in the .resource property.
    if (this.characterJson && this.characterJson.resource) {
        this.setup(this.characterJson.resource);
    } else {
        // This is a fallback for testing or if the asset isn't loaded yet.
        // We can listen for the asset to be loaded.
        this.characterJson.on('load', function (asset) {
            this.setup(asset.resource);
        }, this);
        this.app.assets.load(this.characterJson);
    }
};

/**
 * Sets up the character using the parsed JSON data.
 * @param {object} jsonData The parsed character data.
 */
CharacterController.prototype.setup = function(jsonData) {
    this.characterData = jsonData;
    this.state = CharacterController.STATES.IDLE; // Initialize state
    this.attackTimer = 0; // Timer for attack duration

    console.log(`Successfully set up character: ${this.characterData.name}`);
    console.log(`Archetype: ${this.characterData.archetype}`);
    console.log(`Health: ${this.characterData.health}`);

    // The character is now ready to have its visual representation and other components set up.
    this.setupVisuals();
};

/**
 * Sets up the character's visual representation (sprite).
 */
CharacterController.prototype.setupVisuals = function() {
    if (!this.entity.sprite) {
        console.error('Sprite component not found on character entity.');
        return;
    }

    // In a real PlayCanvas app, we would find the preloaded sprite asset
    // and assign it to the sprite component. This is simulated here.
    // The 'spriteAsset' attribute would be linked in the editor.
    var spriteAsset = this.app.assets.find('ryu_idle_enhanced.png');
    if (spriteAsset && spriteAsset.resource) {
        this.entity.sprite.sprite = spriteAsset.resource;
        console.log('Character sprite has been set.');
    } else {
        console.log('Character sprite asset not loaded yet, or not found. It will be set once loaded.');
    }

    // For the vertical slice, the "animation" is just showing the static sprite.
    // A full implementation would involve a sprite animation component or a custom animation system.
    console.log('Visuals setup complete. Character is displaying idle sprite.');
};

// update code called every frame
CharacterController.prototype.update = function(dt) {
    // Check for the InputManager singleton.
    if (typeof InputManager === 'undefined') {
        return; // InputManager not available, do nothing.
    }

    // --- State-based logic ---

    // If attacking, we decrement the timer and return to IDLE when it's done
    if (this.state === CharacterController.STATES.ATTACKING) {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.setState(CharacterController.STATES.IDLE);
        }
        return; // No other actions while attacking
    }

    // --- Input Processing ---

    // Check for attack input first
    if (InputManager.keys.lightPunch) {
        this.performAttack('lightPunch');
        return; // Don't process movement on the same frame as an attack
    }

    // Process movement if no attack was initiated
    var moveDirection = 0;
    if (InputManager.keys.left) {
        moveDirection -= 1;
    }
    if (InputManager.keys.right) {
        moveDirection += 1;
    }

    // If there is movement input, update the entity's position
    if (moveDirection !== 0) {
        this.setState(CharacterController.STATES.WALKING);
        // Ensure character data is loaded and has the walkSpeed property
        if (this.characterData && typeof this.characterData.walkSpeed !== 'undefined') {
            // Calculate the distance to move based on walkSpeed and delta time
            var distance = this.characterData.walkSpeed * dt;

            // Apply the movement to the entity's local position
            this.entity.translateLocal(distance * moveDirection, 0, 0);

            // Flip the character sprite based on direction.
            // Note: In a 2D setup, flipping the X scale is a common way to change facing direction.
            this.entity.setLocalScale(moveDirection, 1, 1);
        }
    } else {
        this.setState(CharacterController.STATES.IDLE);
    }
};

/**
 * Changes the character's state and logs the change.
 * @param {string} newState The new state to transition to.
 */
CharacterController.prototype.setState = function(newState) {
    if (this.state === newState) return;

    console.log(`State changed from '${this.state}' to '${newState}'`);
    this.state = newState;
};

/**
 * Initiates an attack based on the move name.
 * @param {string} moveName The name of the move to perform (e.g., 'lightPunch').
 */
CharacterController.prototype.performAttack = function(moveName) {
    if (!this.characterData || !this.characterData.moves || !this.characterData.moves.normals) {
        console.error('Character data or moves not loaded.');
        return;
    }

    const moveData = this.characterData.moves.normals[moveName];
    if (!moveData) {
        console.error(`Move data for '${moveName}' not found.`);
        return;
    }

    // Set the state to attacking
    this.setState(CharacterController.STATES.ATTACKING);

    // Calculate attack duration from frame data (assuming 60 FPS)
    const totalFrames = moveData.startupFrames + moveData.activeFrames + moveData.recoveryFrames;
    this.attackTimer = totalFrames / 60;

    // Log the attack details
    console.log(`--- Performing Attack: ${moveData.name} ---`);
    console.log(`Damage: ${moveData.damage}, Total Duration: ${this.attackTimer.toFixed(2)}s`);
};
