// @ts-nocheck
import * as pc from 'playcanvas';
export class CharacterSelectUI {
    constructor(app, rotationService, characterLoader) {
        // UI State
        this.isInitialized = false;
        this.currentMode = 'casual';
        this.playerSelections = new Map();
        this.characterSlots = new Map();
        this.slotOrder = [];
        this.playerCursorIndex = new Map();
        this.uiRoot = null;
        // UI Elements
        this.characterGrid = null;
        this.variationPanel = null;
        this.countdownDisplay = null;
        this.lockIndicators = null;
        this.featuredBanner = null;
        // Input handling
        this.inputDevices = new Map();
        this.selectionTimeouts = new Map();
        // Constants
        this.SELECTION_TIMEOUT = 30000; // 30 seconds
        this.GRID_COLUMNS = 6;
        this.VARIATION_SLOTS = 3;
        this.INCLUDE_RANDOM_SLOT = true;
        this.app = app;
        this.rotationService = rotationService;
        this.characterLoader = characterLoader;
        // Initialize player selections
        this.playerSelections.set('player1', { characterId: null, variationId: null, confirmed: false });
        this.playerSelections.set('player2', { characterId: null, variationId: null, confirmed: false });
    }
    /**
     * Initialize the character select UI
     */
    async initialize() {
        console.log('CharacterSelectUI: Initializing...');
        try {
            // Create UI root
            this.createUIRoot();
            // Load available characters
            await this.loadCharacterData();
            // Create UI elements
            this.createCharacterGrid();
            this.createVariationPanel();
            this.createCountdownDisplay();
            this.createLockIndicators();
            this.createFeaturedBanner();
            if (this.INCLUDE_RANDOM_SLOT) {
                // Ensure cursor defaults
                this.playerCursorIndex.set('player1', 0);
                this.playerCursorIndex.set('player2', 0);
            }
            // Setup input handling
            this.setupInputHandling();
            // Setup event listeners
            this.setupEventListeners();
            // Initial update
            this.updateUI();
            this.isInitialized = true;
            console.log('CharacterSelectUI: Initialized successfully');
        }
        catch (error) {
            console.error('CharacterSelectUI: Failed to initialize:', error);
            throw error;
        }
    }
    /**
     * Create the root UI entity
     */
    createUIRoot() {
        this.uiRoot = new pc.Entity('CharacterSelectUI');
        // Add screen component for 2D UI
        this.uiRoot.addComponent('screen', {
            referenceResolution: new pc.Vec2(1920, 1080),
            scaleBlend: 0.5,
            scaleMode: pc.SCALEMODE_BLEND,
            screenSpace: true
        });
        this.app.root.addChild(this.uiRoot);
    }
    /**
     * Load character data from CharacterLoader
     */
    async loadCharacterData() {
        const availableCharacters = this.rotationService.getAvailableCharacters(this.currentMode);
        for (const characterId of availableCharacters) {
            try {
                // Load base character data
                const character = await this.characterLoader.loadCharacter(characterId);
                // Load variations
                const variations = await this.characterLoader.getCharacterVariations(characterId);
                // Create character slot
                const slot = {
                    id: characterId,
                    name: character.base.displayName,
                    archetype: character.base.archetype,
                    locked: !this.rotationService.isCharacterAvailable(characterId, this.currentMode),
                    featured: this.rotationService.getFeaturedCharacters().includes(characterId),
                    variations: variations.map(v => ({
                        id: v.id,
                        name: v.name,
                        description: v.description,
                        selected: false,
                        uiElement: null
                    })),
                    uiElement: null
                };
                this.characterSlots.set(characterId, slot);
            }
            catch (error) {
                console.warn(`CharacterSelectUI: Failed to load character '${characterId}':`, error);
            }
        }
        console.log(`CharacterSelectUI: Loaded ${this.characterSlots.size} characters`);
    }
    /**
     * Create the main character grid
     */
    createCharacterGrid() {
        this.characterGrid = new pc.Entity('CharacterGrid');
        this.characterGrid.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.1, 0.2, 0.9, 0.8],
            pivot: [0, 1],
            margin: [0, 0, 0, 0]
        });
        // Add layout group for automatic positioning
        this.characterGrid.addComponent('layoutgroup', {
            orientation: pc.ORIENTATION_HORIZONTAL,
            spacing: new pc.Vec2(20, 20),
            widthFitting: pc.FITTING_NONE,
            heightFitting: pc.FITTING_NONE,
            wrap: true
        });
        // Create character slots
        let index = 0;
        this.slotOrder = [];
        for (const [characterId, slot] of this.characterSlots) {
            slot.uiElement = this.createCharacterSlot(slot, index);
            this.characterGrid.addChild(slot.uiElement);
            this.slotOrder.push(characterId);
            index++;
        }
        // Append Random Select slot
        if (this.INCLUDE_RANDOM_SLOT) {
            const randomId = '__random__';
            const randomSlot = this.createRandomSlot(index);
            this.characterGrid.addChild(randomSlot);
            this.slotOrder.push(randomId);
        }
        this.uiRoot.addChild(this.characterGrid);
    }
    /**
     * Create a single character slot UI element
     */
    createCharacterSlot(slot, index) {
        const slotElement = new pc.Entity(`Character_${slot.id}`);
        // Main slot background
        slotElement.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            color: slot.locked ? new pc.Color(0.3, 0.3, 0.3) : new pc.Color(0.8, 0.8, 0.8),
            opacity: slot.locked ? 0.5 : 1.0
        });
        // Character portrait
        const portrait = new pc.Entity('Portrait');
        portrait.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0.1, 0.3, 0.9, 0.9],
            textureAsset: this.getCharacterPortrait(slot.id) // Would load actual portrait
        });
        slotElement.addChild(portrait);
        // Character name
        const nameLabel = new pc.Entity('NameLabel');
        nameLabel.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 0.25],
            fontSize: 24,
            color: new pc.Color(1, 1, 1),
            text: slot.name,
            alignment: new pc.Vec2(0.5, 0.5)
        });
        slotElement.addChild(nameLabel);
        // Archetype badge
        const archetypeBadge = new pc.Entity('ArchetypeBadge');
        archetypeBadge.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.7, 0.7, 1, 0.9],
            fontSize: 14,
            color: this.getArchetypeColor(slot.archetype),
            text: slot.archetype.toUpperCase(),
            alignment: new pc.Vec2(0.5, 0.5)
        });
        slotElement.addChild(archetypeBadge);
        // Lock indicator
        if (slot.locked) {
            const lockIcon = new pc.Entity('LockIcon');
            lockIcon.addComponent('element', {
                type: pc.ELEMENTTYPE_IMAGE,
                anchor: [0.75, 0.75, 0.95, 0.95],
                color: new pc.Color(1, 0.2, 0.2),
                opacity: 0.8
            });
            slotElement.addChild(lockIcon);
        }
        // Featured indicator
        if (slot.featured) {
            const featuredIcon = new pc.Entity('FeaturedIcon');
            featuredIcon.addComponent('element', {
                type: pc.ELEMENTTYPE_IMAGE,
                anchor: [0.05, 0.75, 0.25, 0.95],
                color: new pc.Color(1, 0.8, 0),
                opacity: 0.9
            });
            slotElement.addChild(featuredIcon);
        }
        // Add button component for interaction
        if (!slot.locked) {
            slotElement.addComponent('button', {
                imageEntity: slotElement
            });
            // Setup click handler
            slotElement.button.on('click', () => {
                this.selectCharacter('player1', slot.id); // Default to player 1, would be determined by input device
            });
            slotElement.button.on('hoverstart', () => {
                this.applyFocusVisual(slotElement, true);
            });
            slotElement.button.on('hoverend', () => {
                this.applyFocusVisual(slotElement, false);
            });
        }
        return slotElement;
    }
    /**
     * Create a Random Select slot
     */
    createRandomSlot(index) {
        const slotElement = new pc.Entity('Character_RANDOM');
        slotElement.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            color: new pc.Color(0.2, 0.25, 0.3),
            opacity: 1.0
        });
        const question = new pc.Entity('Question');
        question.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.25, 1, 0.85],
            fontSize: 64,
            color: new pc.Color(1, 1, 1),
            text: '?',
            alignment: new pc.Vec2(0.5, 0.5)
        });
        slotElement.addChild(question);
        const label = new pc.Entity('Label');
        label.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 0.25],
            fontSize: 20,
            color: new pc.Color(0.9, 0.9, 1),
            text: 'RANDOM',
            alignment: new pc.Vec2(0.5, 0.5)
        });
        slotElement.addChild(label);
        slotElement.addComponent('button', { imageEntity: slotElement });
        slotElement.button.on('click', () => {
            // Pick a random available, unlocked character id
            const candidates = [...this.characterSlots.values()].filter(s => !s.locked).map(s => s.id);
            if (candidates.length === 0)
                return;
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            this.selectCharacter('player1', chosen);
        });
        slotElement.button.on('hoverstart', () => this.applyFocusVisual(slotElement, true));
        slotElement.button.on('hoverend', () => this.applyFocusVisual(slotElement, false));
        return slotElement;
    }
    /**
     * Subtle focus visuals to aid navigation (historic fighting game UX cue)
     */
    applyFocusVisual(slotEntity, focused) {
        if (!slotEntity.element)
            return;
        slotEntity.element.color = focused ? new pc.Color(1, 1, 0.9) : slotEntity.element.color;
    }
    /**
     * Create variation selection panel
     */
    createVariationPanel() {
        this.variationPanel = new pc.Entity('VariationPanel');
        this.variationPanel.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.1, 0.02, 0.9, 0.18],
            color: new pc.Color(0.1, 0.1, 0.2, 0.9)
        });
        // Panel background
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            color: new pc.Color(0.1, 0.1, 0.2, 0.9)
        });
        this.variationPanel.addChild(background);
        // Title
        const title = new pc.Entity('Title');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.7, 1, 1],
            fontSize: 28,
            color: new pc.Color(1, 1, 1),
            text: 'SELECT VARIATION',
            alignment: new pc.Vec2(0.5, 0.5)
        });
        this.variationPanel.addChild(title);
        // Variation slots (will be populated dynamically)
        this.createVariationSlots();
        // Initially hidden
        this.variationPanel.enabled = false;
        this.uiRoot.addChild(this.variationPanel);
    }
    /**
     * Create variation slot elements
     */
    createVariationSlots() {
        for (let i = 0; i < this.VARIATION_SLOTS; i++) {
            const slot = new pc.Entity(`VariationSlot_${i}`);
            slot.addComponent('element', {
                type: pc.ELEMENTTYPE_GROUP,
                anchor: [0.1 + (i * 0.27), 0.1, 0.35 + (i * 0.27), 0.65]
            });
            // Slot background
            const background = new pc.Entity('Background');
            background.addComponent('element', {
                type: pc.ELEMENTTYPE_IMAGE,
                anchor: [0, 0, 1, 1],
                color: new pc.Color(0.3, 0.3, 0.3, 0.8)
            });
            slot.addChild(background);
            // Variation name
            const nameLabel = new pc.Entity('Name');
            nameLabel.addComponent('element', {
                type: pc.ELEMENTTYPE_TEXT,
                anchor: [0, 0.7, 1, 1],
                fontSize: 20,
                color: new pc.Color(1, 1, 1),
                alignment: new pc.Vec2(0.5, 0.5)
            });
            slot.addChild(nameLabel);
            // Variation description
            const descLabel = new pc.Entity('Description');
            descLabel.addComponent('element', {
                type: pc.ELEMENTTYPE_TEXT,
                anchor: [0.05, 0.1, 0.95, 0.65],
                fontSize: 14,
                color: new pc.Color(0.8, 0.8, 0.8),
                alignment: new pc.Vec2(0.5, 0.5),
                wrapLines: true
            });
            slot.addChild(descLabel);
            // Add button for interaction
            slot.addComponent('button', {
                imageEntity: background
            });
            this.variationPanel.addChild(slot);
        }
    }
    /**
     * Create countdown display for rotation timer
     */
    createCountdownDisplay() {
        this.countdownDisplay = new pc.Entity('CountdownDisplay');
        this.countdownDisplay.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.7, 0.85, 1, 1]
        });
        // Background
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            color: new pc.Color(0.2, 0.2, 0.3, 0.8)
        });
        this.countdownDisplay.addChild(background);
        // Title
        const title = new pc.Entity('Title');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.6, 1, 1],
            fontSize: 16,
            color: new pc.Color(0.8, 0.8, 0.8),
            text: 'NEXT ROTATION',
            alignment: new pc.Vec2(0.5, 0.5)
        });
        this.countdownDisplay.addChild(title);
        // Timer
        const timer = new pc.Entity('Timer');
        timer.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 0.6],
            fontSize: 24,
            color: new pc.Color(1, 1, 1),
            text: '00:00:00',
            alignment: new pc.Vec2(0.5, 0.5)
        });
        this.countdownDisplay.addChild(timer);
        this.uiRoot.addChild(this.countdownDisplay);
    }
    /**
     * Create lock indicators overlay
     */
    createLockIndicators() {
        this.lockIndicators = new pc.Entity('LockIndicators');
        this.lockIndicators.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0, 1, 1]
        });
        // This will be populated with dynamic lock overlays
        this.uiRoot.addChild(this.lockIndicators);
    }
    /**
     * Create featured characters banner
     */
    createFeaturedBanner() {
        this.featuredBanner = new pc.Entity('FeaturedBanner');
        this.featuredBanner.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0.85, 0.3, 1]
        });
        // Background
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            color: new pc.Color(0.8, 0.6, 0, 0.8)
        });
        this.featuredBanner.addChild(background);
        // Text
        const text = new pc.Entity('Text');
        text.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.1, 0, 0.9, 1],
            fontSize: 18,
            color: new pc.Color(1, 1, 1),
            text: 'FEATURED THIS WEEK',
            alignment: new pc.Vec2(0.5, 0.5)
        });
        this.featuredBanner.addChild(text);
        this.uiRoot.addChild(this.featuredBanner);
    }
    /**
     * Setup input device handling
     */
    setupInputHandling() {
        // Setup keyboard input for Player 1
        this.inputDevices.set('player1', {
            type: 'keyboard',
            selectKey: pc.KEY_ENTER,
            backKey: pc.KEY_ESCAPE,
            upKey: pc.KEY_W,
            downKey: pc.KEY_S,
            leftKey: pc.KEY_A,
            rightKey: pc.KEY_D
        });
        // Setup keyboard input for Player 2 (numpad)
        this.inputDevices.set('player2', {
            type: 'keyboard',
            selectKey: pc.KEY_NUMPAD_0,
            backKey: pc.KEY_NUMPAD_0,
            upKey: pc.KEY_NUMPAD_8,
            downKey: pc.KEY_NUMPAD_2,
            leftKey: pc.KEY_NUMPAD_4,
            rightKey: pc.KEY_NUMPAD_6
        });
        // Listen for input events
        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown.bind(this));
    }
    /**
     * Handle keyboard input
     */
    onKeyDown(event) {
        for (const [playerId, device] of this.inputDevices) {
            if (event.key === device.selectKey) {
                const selection = this.playerSelections.get(playerId);
                if (selection && !selection.characterId) {
                    this.selectFocusedCharacter(playerId);
                }
                else {
                    this.confirmSelection(playerId);
                }
            }
            else if (event.key === device.backKey) {
                this.cancelSelection(playerId);
            }
            else if (event.key === device.leftKey) {
                this.moveCursor(playerId, -1, 0);
            }
            else if (event.key === device.rightKey) {
                this.moveCursor(playerId, 1, 0);
            }
            else if (event.key === device.upKey) {
                this.moveCursor(playerId, 0, -1);
            }
            else if (event.key === device.downKey) {
                this.moveCursor(playerId, 0, 1);
            }
        }
    }
    /**
     * Select the currently focused grid item for player
     */
    selectFocusedCharacter(playerId) {
        const idx = this.playerCursorIndex.get(playerId) ?? 0;
        const id = this.slotOrder[idx];
        if (!id)
            return;
        if (id === '__random__') {
            const candidates = [...this.characterSlots.values()].filter(s => !s.locked).map(s => s.id);
            if (candidates.length === 0)
                return;
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            this.selectCharacter(playerId, chosen);
        }
        else {
            this.selectCharacter(playerId, id);
        }
    }
    /**
     * Grid navigation for character focus
     */
    moveCursor(playerId, dx, dy) {
        if (!this.characterGrid || this.slotOrder.length === 0)
            return;
        const cols = this.GRID_COLUMNS;
        const total = this.slotOrder.length;
        const current = this.playerCursorIndex.get(playerId) ?? 0;
        const row = Math.floor(current / cols);
        const col = current % cols;
        let newRow = Math.max(0, Math.min(Math.floor((current + dy * cols) / cols), Math.ceil(total / cols)));
        let newCol = Math.max(0, Math.min(cols - 1, col + dx));
        let next = row * cols + newCol + dy * cols;
        if (dy !== 0)
            next = (row + dy) * cols + newCol;
        // Clamp and wrap to nearest valid index
        next = Math.max(0, Math.min(total - 1, next));
        this.playerCursorIndex.set(playerId, next);
        this.updateFocusHighlight(playerId);
        const targetId = this.slotOrder[next];
        if (targetId && targetId !== '__random__') {
            const slot = this.characterSlots.get(targetId);
            if (slot && !slot.locked) {
                // Hover-like feedback
                this.applyFocusVisual(slot.uiElement, true);
            }
        }
    }
    updateFocusHighlight(playerId) {
        // Clear previous highlights by resetting colors on all slots (subtle)
        for (const [, slot] of this.characterSlots) {
            if (slot.uiElement?.element) {
                slot.uiElement.element.color = slot.locked ? new pc.Color(0.3, 0.3, 0.3) : new pc.Color(0.8, 0.8, 0.8);
            }
        }
        // Highlight current focus
        const idx = this.playerCursorIndex.get(playerId) ?? 0;
        const id = this.slotOrder[idx];
        if (!id)
            return;
        if (id === '__random__') {
            const randomEntity = this.characterGrid.findByName('Character_RANDOM');
            if (randomEntity?.element)
                randomEntity.element.color = new pc.Color(1, 1, 0.9);
            return;
        }
        const slot = this.characterSlots.get(id);
        if (slot?.uiElement?.element) {
            slot.uiElement.element.color = new pc.Color(1, 1, 0.9);
        }
    }
    /**
     * Setup event listeners for rotation service
     */
    setupEventListeners() {
        // Listen for rotation changes
        this.rotationService.on('statechange', () => {
            this.updateCharacterAvailability();
        });
        // Listen for entitlement changes
        this.app.on('entitlements:changed', () => {
            this.updateCharacterAvailability();
        });
    }
    /**
     * Select a character for a player
     */
    selectCharacter(playerId, characterId) {
        const selection = this.playerSelections.get(playerId);
        if (!selection || selection.confirmed)
            return;
        // Check if character is available
        if (!this.rotationService.isCharacterAvailable(characterId, this.currentMode)) {
            console.warn(`CharacterSelectUI: Character '${characterId}' not available for ${playerId}`);
            return;
        }
        // Update selection
        selection.characterId = characterId;
        selection.variationId = null; // Reset variation
        // Show variation panel
        this.showVariationPanel(characterId);
        // Start selection timeout
        this.startSelectionTimeout(playerId);
        console.log(`CharacterSelectUI: ${playerId} selected ${characterId}`);
        // Emit event
        this.app.fire('characterselect:character', {
            playerId,
            characterId,
            selection: { ...selection }
        });
    }
    /**
     * Select a variation for the current character
     */
    selectVariation(playerId, variationId) {
        const selection = this.playerSelections.get(playerId);
        if (!selection || !selection.characterId)
            return;
        selection.variationId = variationId;
        console.log(`CharacterSelectUI: ${playerId} selected variation ${variationId}`);
        // Emit event
        this.app.fire('characterselect:variation', {
            playerId,
            variationId,
            selection: { ...selection }
        });
    }
    /**
     * Confirm selection for a player
     */
    confirmSelection(playerId) {
        const selection = this.playerSelections.get(playerId);
        if (!selection || !selection.characterId)
            return;
        selection.confirmed = true;
        // Clear timeout
        this.clearSelectionTimeout(playerId);
        console.log(`CharacterSelectUI: ${playerId} confirmed selection`);
        // Emit event
        this.app.fire('characterselect:confirm', {
            playerId,
            selection: { ...selection }
        });
        // Check if all players ready
        if (this.allPlayersReady()) {
            this.onAllPlayersReady();
        }
    }
    /**
     * Cancel selection for a player
     */
    cancelSelection(playerId) {
        const selection = this.playerSelections.get(playerId);
        if (!selection)
            return;
        selection.characterId = null;
        selection.variationId = null;
        selection.confirmed = false;
        // Clear timeout
        this.clearSelectionTimeout(playerId);
        // Hide variation panel
        this.hideVariationPanel();
        console.log(`CharacterSelectUI: ${playerId} cancelled selection`);
        // Emit event
        this.app.fire('characterselect:cancel', { playerId });
    }
    /**
     * Show variation panel for selected character
     */
    showVariationPanel(characterId) {
        const slot = this.characterSlots.get(characterId);
        if (!slot || !this.variationPanel)
            return;
        // Update variation slots
        const variationSlots = this.variationPanel.findByTag('variationslot');
        for (let i = 0; i < Math.min(slot.variations.length, this.VARIATION_SLOTS); i++) {
            const variation = slot.variations[i];
            const slotElement = this.variationPanel.children[i + 2]; // Skip background and title
            if (slotElement) {
                // Update text
                const nameLabel = slotElement.findByName('Name');
                const descLabel = slotElement.findByName('Description');
                if (nameLabel?.element) {
                    nameLabel.element.text = variation.name;
                }
                if (descLabel?.element) {
                    descLabel.element.text = variation.description;
                }
                // Setup click handler
                if (slotElement.button) {
                    slotElement.button.off('click');
                    slotElement.button.on('click', () => {
                        this.selectVariation('player1', variation.id); // Default to player 1
                    });
                }
                slotElement.enabled = true;
            }
        }
        // Hide unused slots
        for (let i = slot.variations.length; i < this.VARIATION_SLOTS; i++) {
            const slotElement = this.variationPanel.children[i + 2];
            if (slotElement) {
                slotElement.enabled = false;
            }
        }
        this.variationPanel.enabled = true;
    }
    /**
     * Hide variation panel
     */
    hideVariationPanel() {
        if (this.variationPanel) {
            this.variationPanel.enabled = false;
        }
    }
    /**
     * Start selection timeout for a player
     */
    startSelectionTimeout(playerId) {
        this.clearSelectionTimeout(playerId);
        const timeoutId = window.setTimeout(() => {
            console.log(`CharacterSelectUI: Selection timeout for ${playerId}`);
            this.cancelSelection(playerId);
        }, this.SELECTION_TIMEOUT);
        this.selectionTimeouts.set(playerId, timeoutId);
    }
    /**
     * Clear selection timeout for a player
     */
    clearSelectionTimeout(playerId) {
        const timeoutId = this.selectionTimeouts.get(playerId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.selectionTimeouts.delete(playerId);
        }
    }
    /**
     * Check if all players are ready
     */
    allPlayersReady() {
        for (const selection of this.playerSelections.values()) {
            if (!selection.confirmed) {
                return false;
            }
        }
        return true;
    }
    /**
     * Handle all players ready state
     */
    onAllPlayersReady() {
        console.log('CharacterSelectUI: All players ready, proceeding to match');
        // Emit final selections
        const selections = Object.fromEntries(this.playerSelections);
        this.app.fire('characterselect:ready', { selections });
    }
    /**
     * Update character availability based on rotation/entitlements
     */
    updateCharacterAvailability() {
        for (const [characterId, slot] of this.characterSlots) {
            const wasLocked = slot.locked;
            slot.locked = !this.rotationService.isCharacterAvailable(characterId, this.currentMode);
            // Update UI if lock status changed
            if (wasLocked !== slot.locked && slot.uiElement) {
                this.updateCharacterSlotLock(slot);
            }
        }
    }
    /**
     * Update character slot lock visual
     */
    updateCharacterSlotLock(slot) {
        if (!slot.uiElement)
            return;
        // Update opacity and color
        slot.uiElement.element.opacity = slot.locked ? 0.5 : 1.0;
        slot.uiElement.element.color = slot.locked ? new pc.Color(0.3, 0.3, 0.3) : new pc.Color(0.8, 0.8, 0.8);
        // Toggle lock icon
        const lockIcon = slot.uiElement.findByName('LockIcon');
        if (lockIcon) {
            lockIcon.enabled = slot.locked;
        }
        // Update button state
        if (slot.uiElement.button) {
            slot.uiElement.button.enabled = !slot.locked;
        }
    }
    /**
     * Update the entire UI
     */
    updateUI() {
        this.updateCharacterAvailability();
        this.updateCountdown();
        this.updateFeaturedBanner();
    }
    /**
     * Update countdown display
     */
    updateCountdown() {
        if (!this.countdownDisplay)
            return;
        const timeUntilRotation = this.rotationService.getTimeUntilRotation();
        const timer = this.countdownDisplay.findByName('Timer');
        if (timer?.element) {
            const hours = Math.floor(timeUntilRotation / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilRotation % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeUntilRotation % (1000 * 60)) / 1000);
            timer.element.text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    /**
     * Update featured banner
     */
    updateFeaturedBanner() {
        const featuredCharacters = this.rotationService.getFeaturedCharacters();
        if (this.featuredBanner && featuredCharacters.length > 0) {
            this.featuredBanner.enabled = true;
        }
        else if (this.featuredBanner) {
            this.featuredBanner.enabled = false;
        }
    }
    /**
     * Get character portrait texture (placeholder)
     */
    getCharacterPortrait(characterId) {
        // This would load the actual portrait texture
        return null;
    }
    /**
     * Get color for archetype badge
     */
    getArchetypeColor(archetype) {
        const colors = {
            'shoto': new pc.Color(0.2, 0.6, 1.0),
            'rushdown': new pc.Color(1.0, 0.2, 0.2),
            'grappler': new pc.Color(0.6, 0.2, 1.0),
            'zoner': new pc.Color(0.2, 1.0, 0.2),
            'technical': new pc.Color(1.0, 0.8, 0.2)
        };
        return colors[archetype] || new pc.Color(0.8, 0.8, 0.8);
    }
    /**
     * Set game mode and refresh UI
     */
    setGameMode(mode) {
        this.currentMode = mode;
        this.updateCharacterAvailability();
    }
    /**
     * Get current selections
     */
    getSelections() {
        return new Map(this.playerSelections);
    }
    /**
     * Reset all selections
     */
    resetSelections() {
        for (const [playerId, selection] of this.playerSelections) {
            selection.characterId = null;
            selection.variationId = null;
            selection.confirmed = false;
            this.clearSelectionTimeout(playerId);
        }
        this.hideVariationPanel();
    }
    /**
     * Start regular updates
     */
    startUpdates() {
        this.app.on('update', this.updateCountdown.bind(this));
    }
    /**
     * Stop regular updates
     */
    stopUpdates() {
        this.app.off('update', this.updateCountdown.bind(this));
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopUpdates();
        // Clear all timeouts
        for (const timeoutId of this.selectionTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.selectionTimeouts.clear();
        // Remove UI
        if (this.uiRoot?.parent) {
            this.uiRoot.destroy();
        }
        console.log('CharacterSelectUI: Destroyed');
    }
}
/**
 * How to extend this system:
 *
 * 1. Adding gamepad support: Extend setupInputHandling with gamepad APIs
 * 2. Adding animations: Use PlayCanvas Tween for smooth transitions
 * 3. Adding audio: Integrate with audio system for selection sounds
 * 4. Adding custom UI themes: Create theme system with color/style variants
 * 5. Adding accessibility: Add screen reader support and keyboard navigation
 */ 
//# sourceMappingURL=CharacterSelectUI.js.map