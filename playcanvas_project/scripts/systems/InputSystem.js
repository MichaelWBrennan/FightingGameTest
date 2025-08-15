// Input system for fighting game controls and combo detection
class InputSystem {
    constructor(app) {
        this.app = app;
        this.keyboard = app.keyboard;
        this.mouse = app.mouse;
        
        // Input buffers for each player (stores recent inputs for combo detection)
        this.inputBuffers = {
            player1: [],
            player2: []
        };
        
        // Maximum buffer size (frames)
        this.bufferSize = 60; // 1 second at 60 FPS
        
        // Current frame inputs
        this.currentInputs = {
            player1: new Set(),
            player2: new Set()
        };
        
        // Key mappings for each player
        this.keyMappings = {
            player1: {
                // Movement
                'KeyA': 'left',
                'KeyD': 'right',
                'KeyW': 'up',
                'KeyS': 'down',
                
                // Attacks
                'KeyJ': 'lightPunch',     // LP
                'KeyK': 'mediumPunch',    // MP
                'KeyL': 'heavyPunch',     // HP
                'KeyU': 'lightKick',      // LK
                'KeyI': 'mediumKick',     // MK
                'KeyO': 'heavyKick',      // HK
                
                // Special buttons
                'KeyY': 'block',
                'KeyH': 'grab',
                'Space': 'dash'
            },
            player2: {
                // Movement (Arrow keys)
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                
                // Attacks (Numpad)
                'Numpad1': 'lightPunch',
                'Numpad2': 'mediumPunch',
                'Numpad3': 'heavyPunch',
                'Numpad4': 'lightKick',
                'Numpad5': 'mediumKick',
                'Numpad6': 'heavyKick',
                
                // Special buttons
                'Numpad0': 'block',
                'NumpadEnter': 'grab',
                'Numpad7': 'dash'
            }
        };
        
        // Special move patterns (using fighting game notation)
        this.specialMovePatterns = {
            // Quarter circle forward: 236 (down, down-forward, forward)
            '236': ['down', 'downForward', 'forward'],
            // Quarter circle back: 214 (down, down-back, back)
            '214': ['down', 'downBack', 'back'],
            // Dragon punch: 623 (forward, down, down-forward)
            '623': ['forward', 'down', 'downForward'],
            // Half circle forward: 41236 (back, down-back, down, down-forward, forward)
            '41236': ['back', 'downBack', 'down', 'downForward', 'forward'],
            // Half circle back: 63214 (forward, down-forward, down, down-back, back)
            '63214': ['forward', 'downForward', 'down', 'downBack', 'back']
        };
        
        this.setupEventListeners();
        
        console.log('Input System initialized');
    }
    
    setupEventListeners() {
        // Key down events
        this.keyboard.on(pc.EVENT_KEYDOWN, (event) => {
            this.handleKeyDown(event.key);
        });
        
        // Key up events
        this.keyboard.on(pc.EVENT_KEYUP, (event) => {
            this.handleKeyUp(event.key);
        });
    }
    
    handleKeyDown(key) {
        // Check which player this key belongs to
        for (const [playerKey, mappings] of Object.entries(this.keyMappings)) {
            if (mappings[key]) {
                const action = mappings[key];
                this.currentInputs[playerKey].add(action);
                
                // Add to input buffer with timestamp
                this.addToBuffer(playerKey, action, 'press');
                break;
            }
        }
    }
    
    handleKeyUp(key) {
        // Remove from current inputs when key is released
        for (const [playerKey, mappings] of Object.entries(this.keyMappings)) {
            if (mappings[key]) {
                const action = mappings[key];
                this.currentInputs[playerKey].delete(action);
                
                // Add release to buffer for precise timing
                this.addToBuffer(playerKey, action, 'release');
                break;
            }
        }
    }
    
    addToBuffer(playerKey, action, type) {
        const buffer = this.inputBuffers[playerKey];
        const timestamp = Date.now();
        
        // Add input to buffer
        buffer.push({
            action: action,
            type: type,
            timestamp: timestamp,
            frame: this.getCurrentFrame()
        });
        
        // Maintain buffer size
        if (buffer.length > this.bufferSize) {
            buffer.shift();
        }
    }
    
    getCurrentFrame() {
        // Approximate frame count (assuming 60 FPS)
        return Math.floor(Date.now() / (1000 / 60));
    }
    
    // Get current directional input as fighting game notation
    getDirectionalInput(playerKey) {
        const inputs = this.currentInputs[playerKey];
        
        let horizontal = '';
        let vertical = '';
        
        if (inputs.has('left')) horizontal = 'left';
        if (inputs.has('right')) horizontal = 'right';
        if (inputs.has('up')) vertical = 'up';
        if (inputs.has('down')) vertical = 'down';
        
        // Convert to numpad notation
        if (vertical === 'up') {
            if (horizontal === 'left') return 'upBack';      // 7
            if (horizontal === 'right') return 'upForward';   // 9
            return 'up';                                      // 8
        } else if (vertical === 'down') {
            if (horizontal === 'left') return 'downBack';     // 1
            if (horizontal === 'right') return 'downForward'; // 3
            return 'down';                                    // 2
        } else {
            if (horizontal === 'left') return 'back';         // 4
            if (horizontal === 'right') return 'forward';     // 6
            return 'neutral';                                 // 5
        }
    }
    
    // Check if a specific button is currently pressed
    isButtonPressed(playerKey, button) {
        return this.currentInputs[playerKey].has(button);
    }
    
    // Check if a specific button was just pressed this frame
    isButtonJustPressed(playerKey, button) {
        const buffer = this.inputBuffers[playerKey];
        const currentFrame = this.getCurrentFrame();
        
        // Check last few entries for a press event
        for (let i = buffer.length - 1; i >= 0; i--) {
            const entry = buffer[i];
            if (entry.frame < currentFrame - 2) break; // Only check recent frames
            
            if (entry.action === button && entry.type === 'press') {
                return true;
            }
        }
        
        return false;
    }
    
    // Detect special move patterns
    detectSpecialMove(playerKey, pattern) {
        const buffer = this.inputBuffers[playerKey];
        const currentFrame = this.getCurrentFrame();
        const motionWindow = 30; // frames to complete motion
        
        if (!this.specialMovePatterns[pattern]) {
            return false;
        }
        
        const requiredInputs = this.specialMovePatterns[pattern];
        let matchIndex = 0;
        
        // Search through buffer backwards (most recent first)
        for (let i = buffer.length - 1; i >= 0; i--) {
            const entry = buffer[i];
            
            // Check if entry is within the motion window
            if (entry.frame < currentFrame - motionWindow) {
                break;
            }
            
            // Check if this entry matches the current required input
            if (entry.type === 'press' && 
                this.isDirectionalMatch(entry.action, requiredInputs[matchIndex])) {
                matchIndex++;
                
                // If we've matched all required inputs
                if (matchIndex >= requiredInputs.length) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    isDirectionalMatch(inputAction, requiredDirection) {
        // Map action names to directional inputs
        const directionMap = {
            'left': 'back',
            'right': 'forward',
            'up': 'up',
            'down': 'down'
        };
        
        return directionMap[inputAction] === requiredDirection ||
               this.getDirectionalInput('player1') === requiredDirection ||
               this.getDirectionalInput('player2') === requiredDirection;
    }
    
    // Get input for combo detection
    getComboInput(playerKey, comboPattern) {
        // This would check for specific combo sequences
        // For now, return simple button combinations
        const inputs = this.currentInputs[playerKey];
        
        // Example: Check for simple punch combinations
        if (comboPattern === 'lightPunch_mediumPunch') {
            return this.isButtonJustPressed(playerKey, 'lightPunch') &&
                   this.isButtonPressed(playerKey, 'mediumPunch');
        }
        
        return false;
    }
    
    // Clear input buffer (useful for round resets)
    clearBuffer(playerKey) {
        this.inputBuffers[playerKey] = [];
        this.currentInputs[playerKey].clear();
    }
    
    // Get all current inputs for a player (for debugging)
    getCurrentInputs(playerKey) {
        return Array.from(this.currentInputs[playerKey]);
    }
    
    // Update method called each frame
    update() {
        // Process any frame-based input logic
        // This could include input buffering cleanup, combo window management, etc.
    }
}

// Make InputSystem globally available
window.InputSystem = InputSystem;