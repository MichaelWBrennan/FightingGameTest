/**
 * InputManager - Frame-Accurate Fighting Game Input System
 * Handles precise input timing, buffering, and command recognition for SF3:3S style gameplay
 * Features: Input buffering, command recognition, rollback-ready input tracking
 */
class InputManager {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        
        // Frame-accurate timing
        this.frameCount = 0;
        this.inputHistory = new Map(); // Player ID -> frame history
        this.maxHistoryFrames = 180; // 3 seconds at 60fps
        
        // Input configuration for fighting games
        this.inputConfig = {
            // Input buffer windows (in frames)
            bufferWindow: 3, // Frames to buffer inputs
            commandWindow: 20, // Frames to recognize motion commands
            negativeEdge: true, // Allow button release commands
            
            // Input priorities for simultaneous presses
            buttonPriority: {
                'heavy': 3,
                'medium': 2, 
                'light': 1
            },
            
            // Polling rate
            pollRate: 60, // Hz
            maxInputDelay: 1 // Maximum frames of input delay
        };
        
        // Player input mappings
        this.playerMappings = new Map();
        this.setupDefaultMappings();
        
        // Command recognition system
        this.commandSystem = {
            motionCommands: new Map(),
            activeCommands: new Map(),
            commandHistory: new Map()
        };
        
        this.setupMotionCommands();
        
        // Input state tracking
        this.inputStates = new Map();
        this.previousStates = new Map();
        
        // Input devices
        this.devices = {
            keyboard: null,
            gamepads: new Map(),
            mouse: null
        };
        
        // Performance tracking
        this.performanceStats = {
            inputLatency: 0,
            averageLatency: 0,
            maxLatency: 0,
            droppedInputs: 0
        };
    }

    async initialize() {
        console.log('Initializing Input Manager...');
        
        try {
            // Setup input devices
            this.setupInputDevices();
            
            // Initialize player input states
            this.initializePlayerStates();
            
            // Setup input polling
            this.setupInputPolling();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize command recognition
            this.initializeCommandRecognition();
            
            this.initialized = true;
            console.log('Input Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Input Manager:', error);
            throw error;
        }
    }

    setupDefaultMappings() {
        // Player 1 (Keyboard WASD + JKLUIO)
        this.playerMappings.set('player1', {
            // Movement
            'up': { type: 'keyboard', code: 'KeyW' },
            'down': { type: 'keyboard', code: 'KeyS' },
            'left': { type: 'keyboard', code: 'KeyA' },
            'right': { type: 'keyboard', code: 'KeyD' },
            
            // Punches
            'lightPunch': { type: 'keyboard', code: 'KeyJ' },
            'mediumPunch': { type: 'keyboard', code: 'KeyK' },
            'heavyPunch': { type: 'keyboard', code: 'KeyL' },
            
            // Kicks
            'lightKick': { type: 'keyboard', code: 'KeyU' },
            'mediumKick': { type: 'keyboard', code: 'KeyI' },
            'heavyKick': { type: 'keyboard', code: 'KeyO' }
        });
        
        // Player 2 (Arrow Keys + Numpad)
        this.playerMappings.set('player2', {
            // Movement
            'up': { type: 'keyboard', code: 'ArrowUp' },
            'down': { type: 'keyboard', code: 'ArrowDown' },
            'left': { type: 'keyboard', code: 'ArrowLeft' },
            'right': { type: 'keyboard', code: 'ArrowRight' },
            
            // Punches
            'lightPunch': { type: 'keyboard', code: 'Numpad1' },
            'mediumPunch': { type: 'keyboard', code: 'Numpad2' },
            'heavyPunch': { type: 'keyboard', code: 'Numpad3' },
            
            // Kicks
            'lightKick': { type: 'keyboard', code: 'Numpad4' },
            'mediumKick': { type: 'keyboard', code: 'Numpad5' },
            'heavyKick': { type: 'keyboard', code: 'Numpad6' }
        });
        
        console.log('Default input mappings configured');
    }

    setupMotionCommands() {
        // Quarter circle forward (Hadoken motion)
        this.commandSystem.motionCommands.set('qcf', {
            name: 'quarterCircleForward',
            pattern: ['down', 'downForward', 'forward'],
            frames: 20,
            description: 'Quarter Circle Forward (236)'
        });
        
        // Quarter circle back (Tatsu motion)  
        this.commandSystem.motionCommands.set('qcb', {
            name: 'quarterCircleBack',
            pattern: ['down', 'downBack', 'back'],
            frames: 20,
            description: 'Quarter Circle Back (214)'
        });
        
        // Dragon punch motion (Shoryuken)
        this.commandSystem.motionCommands.set('dp', {
            name: 'dragonPunch',
            pattern: ['forward', 'down', 'downForward'],
            frames: 15,
            description: 'Dragon Punch (623)'
        });
        
        // Half circle back (Gief motion)
        this.commandSystem.motionCommands.set('hcb', {
            name: 'halfCircleBack',
            pattern: ['forward', 'downForward', 'down', 'downBack', 'back'],
            frames: 30,
            description: 'Half Circle Back (41236)'
        });
        
        // Charge back-forward
        this.commandSystem.motionCommands.set('charge_bf', {
            name: 'chargeBackForward',
            pattern: ['chargeBack', 'forward'],
            frames: 60, // Charge time
            chargeTime: 45,
            description: 'Charge Back-Forward'
        });
        
        // Charge down-up
        this.commandSystem.motionCommands.set('charge_du', {
            name: 'chargeDownUp',
            pattern: ['chargeDown', 'up'],
            frames: 60,
            chargeTime: 45,
            description: 'Charge Down-Up'
        });
        
        console.log('Motion commands configured');
    }

    setupInputDevices() {
        // Keyboard setup
        this.devices.keyboard = this.app.keyboard;
        
        // Mouse setup
        this.devices.mouse = this.app.mouse;
        
        // Gamepad setup
        if (navigator.getGamepads) {
            this.pollGamepads();
            setInterval(() => this.pollGamepads(), 16); // ~60fps polling
        }
        
        console.log('Input devices configured');
    }

    pollGamepads() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.devices.gamepads.set(i, gamepads[i]);
            }
        }
    }

    initializePlayerStates() {
        // Initialize input states for each player
        ['player1', 'player2'].forEach(playerId => {
            this.inputStates.set(playerId, {
                // Digital inputs
                up: false, down: false, left: false, right: false,
                lightPunch: false, mediumPunch: false, heavyPunch: false,
                lightKick: false, mediumKick: false, heavyKick: false,
                
                // Processed directional state
                direction: 'neutral',
                lastDirection: 'neutral',
                directionFrames: 0,
                
                // Button states with frame data
                buttons: new Map(),
                
                // Charge state tracking
                chargeStates: new Map(),
                
                // Frame timing
                lastInputFrame: 0
            });
            
            this.previousStates.set(playerId, this.cloneInputState(this.inputStates.get(playerId)));
            this.inputHistory.set(playerId, []);
            this.commandSystem.activeCommands.set(playerId, new Map());
            this.commandSystem.commandHistory.set(playerId, []);
        });
    }

    setupInputPolling() {
        // Frame-synchronized input polling
        this.app.on('update', this.pollInputs.bind(this));
        this.app.on('postUpdate', this.processInputs.bind(this));
    }

    setupEventListeners() {
        // Keyboard events for immediate response
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Prevent default behavior for mapped keys
        window.addEventListener('keydown', (event) => {
            if (this.isGameKey(event.code)) {
                event.preventDefault();
            }
        });
        
        // Gamepad events
        window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
        
        console.log('Input event listeners configured');
    }

    initializeCommandRecognition() {
        // Setup command buffers
        this.commandSystem.activeCommands.forEach((commands, playerId) => {
            this.commandSystem.motionCommands.forEach((command, commandId) => {
                commands.set(commandId, {
                    pattern: command.pattern.slice(),
                    position: 0,
                    startFrame: 0,
                    completed: false
                });
            });
        });
    }

    // Event handlers
    onKeyDown(event) {
        const playerId = this.getPlayerForKey(event.code);
        if (playerId) {
            const inputName = this.getInputNameForKey(playerId, event.code);
            if (inputName) {
                this.setInput(playerId, inputName, true);
            }
        }
    }

    onKeyUp(event) {
        const playerId = this.getPlayerForKey(event.code);
        if (playerId) {
            const inputName = this.getInputNameForKey(playerId, event.code);
            if (inputName) {
                this.setInput(playerId, inputName, false);
                
                // Handle negative edge commands if enabled
                if (this.inputConfig.negativeEdge) {
                    this.handleNegativeEdge(playerId, inputName);
                }
            }
        }
    }

    onGamepadConnected(event) {
        console.log('Gamepad connected:', event.gamepad.id);
        this.devices.gamepads.set(event.gamepad.index, event.gamepad);
    }

    onGamepadDisconnected(event) {
        console.log('Gamepad disconnected:', event.gamepad.id);
        this.devices.gamepads.delete(event.gamepad.index);
    }

    // Input processing
    pollInputs(dt) {
        if (!this.initialized) return;
        
        this.frameCount++;
        
        // Poll all input sources
        this.pollKeyboard();
        this.pollGamepads();
        
        // Store previous states
        this.inputStates.forEach((state, playerId) => {
            this.previousStates.set(playerId, this.cloneInputState(state));
        });
    }

    processInputs(dt) {
        if (!this.initialized) return;
        
        // Process each player's inputs
        this.inputStates.forEach((state, playerId) => {
            // Update directional state
            this.updateDirectionalState(playerId);
            
            // Update button states with frame data
            this.updateButtonStates(playerId);
            
            // Update charge states
            this.updateChargeStates(playerId);
            
            // Recognize motion commands
            this.recognizeMotionCommands(playerId);
            
            // Store input history
            this.storeInputHistory(playerId);
            
            // Process input buffer
            this.processInputBuffer(playerId);
        });
        
        // Update performance statistics
        this.updatePerformanceStats();
    }

    pollKeyboard() {
        // Direct keyboard polling for lowest latency
        this.inputStates.forEach((state, playerId) => {
            const mapping = this.playerMappings.get(playerId);
            if (!mapping) return;
            
            Object.entries(mapping).forEach(([inputName, keyConfig]) => {
                if (keyConfig.type === 'keyboard') {
                    const isPressed = this.devices.keyboard.isPressed(keyConfig.code);
                    this.setInput(playerId, inputName, isPressed);
                }
            });
        });
    }

    setInput(playerId, inputName, pressed) {
        const state = this.inputStates.get(playerId);
        if (!state) return;
        
        const previousValue = state[inputName];
        state[inputName] = pressed;
        state.lastInputFrame = this.frameCount;
        
        // Update button state with frame information
        if (!state.buttons.has(inputName)) {
            state.buttons.set(inputName, {
                pressed: false,
                justPressed: false,
                justReleased: false,
                pressFrame: 0,
                releaseFrame: 0,
                holdFrames: 0
            });
        }
        
        const buttonState = state.buttons.get(inputName);
        buttonState.justPressed = !previousValue && pressed;
        buttonState.justReleased = previousValue && !pressed;
        buttonState.pressed = pressed;
        
        if (buttonState.justPressed) {
            buttonState.pressFrame = this.frameCount;
            buttonState.holdFrames = 0;
        } else if (buttonState.justReleased) {
            buttonState.releaseFrame = this.frameCount;
        } else if (pressed) {
            buttonState.holdFrames++;
        }
        
        // Fire input events
        if (buttonState.justPressed) {
            this.app.fire('input:pressed', { playerId, inputName, frame: this.frameCount });
        } else if (buttonState.justReleased) {
            this.app.fire('input:released', { playerId, inputName, frame: this.frameCount });
        }
    }

    updateDirectionalState(playerId) {
        const state = this.inputStates.get(playerId);
        if (!state) return;
        
        // Calculate direction from input state
        let direction = 'neutral';
        
        if (state.up && state.left) direction = 'upBack';
        else if (state.up && state.right) direction = 'upForward';
        else if (state.down && state.left) direction = 'downBack';
        else if (state.down && state.right) direction = 'downForward';
        else if (state.up) direction = 'up';
        else if (state.down) direction = 'down';
        else if (state.left) direction = 'back';
        else if (state.right) direction = 'forward';
        
        // Update direction state
        if (direction !== state.direction) {
            state.lastDirection = state.direction;
            state.direction = direction;
            state.directionFrames = 0;
            
            // Fire direction change event
            this.app.fire('input:direction', { 
                playerId, 
                direction, 
                lastDirection: state.lastDirection,
                frame: this.frameCount 
            });
        } else {
            state.directionFrames++;
        }
    }

    updateButtonStates(playerId) {
        const state = this.inputStates.get(playerId);
        if (!state) return;
        
        // Update hold frame counters
        state.buttons.forEach((buttonState, inputName) => {
            if (buttonState.pressed) {
                buttonState.holdFrames++;
            }
        });
    }

    updateChargeStates(playerId) {
        const state = this.inputStates.get(playerId);
        if (!state) return;
        
        // Track charge directions
        const chargeDirections = ['back', 'down'];
        
        chargeDirections.forEach(chargeDir => {
            if (!state.chargeStates.has(chargeDir)) {
                state.chargeStates.set(chargeDir, {
                    charging: false,
                    chargeFrames: 0,
                    chargeComplete: false
                });
            }
            
            const chargeState = state.chargeStates.get(chargeDir);
            const isCharging = (chargeDir === 'back' && state.left) || 
                             (chargeDir === 'down' && state.down);
            
            if (isCharging) {
                if (!chargeState.charging) {
                    chargeState.charging = true;
                    chargeState.chargeFrames = 0;
                }
                chargeState.chargeFrames++;
                
                // Check if charge is complete (45 frames = 0.75 seconds)
                if (chargeState.chargeFrames >= 45) {
                    chargeState.chargeComplete = true;
                }
            } else {
                chargeState.charging = false;
                if (chargeState.chargeFrames < 45) {
                    chargeState.chargeFrames = 0;
                    chargeState.chargeComplete = false;
                }
            }
        });
    }

    recognizeMotionCommands(playerId) {
        const state = this.inputStates.get(playerId);
        const activeCommands = this.commandSystem.activeCommands.get(playerId);
        if (!state || !activeCommands) return;
        
        // Check each motion command
        this.commandSystem.motionCommands.forEach((command, commandId) => {
            const commandState = activeCommands.get(commandId);
            if (!commandState) return;
            
            // Check if we're within the time window
            const framesSinceStart = this.frameCount - commandState.startFrame;
            if (framesSinceStart > command.frames) {
                // Reset command tracking
                commandState.position = 0;
                commandState.startFrame = this.frameCount;
                commandState.completed = false;
            }
            
            // Check current pattern position
            const expectedInput = command.pattern[commandState.position];
            
            if (this.checkDirectionInput(state, expectedInput)) {
                commandState.position++;
                
                if (commandState.position === 1) {
                    commandState.startFrame = this.frameCount;
                }
                
                // Command completed
                if (commandState.position >= command.pattern.length) {
                    commandState.completed = true;
                    
                    // Fire command recognition event
                    this.app.fire('input:command', {
                        playerId,
                        command: commandId,
                        commandName: command.name,
                        frame: this.frameCount,
                        frames: framesSinceStart
                    });
                    
                    // Store in command history
                    const commandHistory = this.commandSystem.commandHistory.get(playerId);
                    commandHistory.push({
                        command: commandId,
                        frame: this.frameCount,
                        frames: framesSinceStart
                    });
                    
                    // Keep history limited
                    if (commandHistory.length > 10) {
                        commandHistory.shift();
                    }
                    
                    // Reset for next recognition
                    commandState.position = 0;
                    commandState.startFrame = this.frameCount;
                    commandState.completed = false;
                }
            }
        });
    }

    checkDirectionInput(state, expectedDirection) {
        // Handle charge commands
        if (expectedDirection.startsWith('charge')) {
            const chargeDir = expectedDirection.split('charge')[1].toLowerCase();
            const chargeState = state.chargeStates.get(chargeDir);
            return chargeState && chargeState.chargeComplete;
        }
        
        // Handle regular directions
        return state.direction === expectedDirection || 
               (state.lastDirection === expectedDirection && state.directionFrames <= 2);
    }

    storeInputHistory(playerId) {
        const state = this.inputStates.get(playerId);
        const history = this.inputHistory.get(playerId);
        if (!state || !history) return;
        
        // Create input snapshot
        const inputSnapshot = {
            frame: this.frameCount,
            direction: state.direction,
            buttons: new Map(),
            timestamp: Date.now()
        };
        
        // Copy button states
        state.buttons.forEach((buttonState, inputName) => {
            inputSnapshot.buttons.set(inputName, {
                pressed: buttonState.pressed,
                justPressed: buttonState.justPressed,
                justReleased: buttonState.justReleased
            });
        });
        
        history.push(inputSnapshot);
        
        // Limit history size
        if (history.length > this.maxHistoryFrames) {
            history.shift();
        }
    }

    processInputBuffer(playerId) {
        // Process buffered inputs within the buffer window
        const bufferFrames = this.inputConfig.bufferWindow;
        const history = this.inputHistory.get(playerId);
        if (!history) return;
        
        // Check for buffered button presses
        for (let i = history.length - 1; i >= Math.max(0, history.length - bufferFrames); i--) {
            const snapshot = history[i];
            
            snapshot.buttons.forEach((buttonState, inputName) => {
                if (buttonState.justPressed) {
                    // Fire buffered input event
                    this.app.fire('input:buffered', {
                        playerId,
                        inputName,
                        originalFrame: snapshot.frame,
                        currentFrame: this.frameCount,
                        bufferFrames: this.frameCount - snapshot.frame
                    });
                }
            });
        }
    }

    handleNegativeEdge(playerId, inputName) {
        // Handle button release commands (negative edge)
        this.app.fire('input:negativeEdge', { playerId, inputName, frame: this.frameCount });
    }

    updatePerformanceStats() {
        // Calculate input latency and performance metrics
        const currentTime = performance.now();
        
        // This is a simplified version - real implementation would measure
        // actual input-to-processing latency
        this.performanceStats.inputLatency = 1; // Placeholder
    }

    // Utility functions
    getPlayerForKey(keyCode) {
        for (const [playerId, mapping] of this.playerMappings) {
            for (const [inputName, keyConfig] of Object.entries(mapping)) {
                if (keyConfig.type === 'keyboard' && keyConfig.code === keyCode) {
                    return playerId;
                }
            }
        }
        return null;
    }

    getInputNameForKey(playerId, keyCode) {
        const mapping = this.playerMappings.get(playerId);
        if (!mapping) return null;
        
        for (const [inputName, keyConfig] of Object.entries(mapping)) {
            if (keyConfig.type === 'keyboard' && keyConfig.code === keyCode) {
                return inputName;
            }
        }
        return null;
    }

    isGameKey(keyCode) {
        return this.getPlayerForKey(keyCode) !== null;
    }

    cloneInputState(state) {
        return {
            up: state.up,
            down: state.down,
            left: state.left,
            right: state.right,
            lightPunch: state.lightPunch,
            mediumPunch: state.mediumPunch,
            heavyPunch: state.heavyPunch,
            lightKick: state.lightKick,
            mediumKick: state.mediumKick,
            heavyKick: state.heavyKick,
            direction: state.direction,
            lastDirection: state.lastDirection,
            directionFrames: state.directionFrames,
            lastInputFrame: state.lastInputFrame
        };
    }

    // Public API
    getInput(playerId, inputName) {
        const state = this.inputStates.get(playerId);
        return state ? state[inputName] : false;
    }

    getInputHistory(playerId, frames = 10) {
        const history = this.inputHistory.get(playerId);
        if (!history) return [];
        
        return history.slice(-frames);
    }

    isInputJustPressed(playerId, inputName) {
        const state = this.inputStates.get(playerId);
        if (!state || !state.buttons.has(inputName)) return false;
        
        return state.buttons.get(inputName).justPressed;
    }

    isInputJustReleased(playerId, inputName) {
        const state = this.inputStates.get(playerId);
        if (!state || !state.buttons.has(inputName)) return false;
        
        return state.buttons.get(inputName).justReleased;
    }

    getInputHoldFrames(playerId, inputName) {
        const state = this.inputStates.get(playerId);
        if (!state || !state.buttons.has(inputName)) return 0;
        
        return state.buttons.get(inputName).holdFrames;
    }

    getDirection(playerId) {
        const state = this.inputStates.get(playerId);
        return state ? state.direction : 'neutral';
    }

    isChargeComplete(playerId, direction) {
        const state = this.inputStates.get(playerId);
        if (!state) return false;
        
        const chargeState = state.chargeStates.get(direction);
        return chargeState ? chargeState.chargeComplete : false;
    }

    getCommandHistory(playerId, count = 5) {
        const history = this.commandSystem.commandHistory.get(playerId);
        return history ? history.slice(-count) : [];
    }

    // Debug methods
    getPerformanceStats() {
        return { ...this.performanceStats };
    }

    getInputStateDebug(playerId) {
        const state = this.inputStates.get(playerId);
        if (!state) return null;
        
        return {
            direction: state.direction,
            lastDirection: state.lastDirection,
            directionFrames: state.directionFrames,
            buttons: Array.from(state.buttons.entries()),
            charges: Array.from(state.chargeStates.entries()),
            lastInputFrame: state.lastInputFrame,
            frameCount: this.frameCount
        };
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}