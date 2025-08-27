import * as pc from 'playcanvas';
/**
 * CharacterSelectUI.ts - Character selection interface with variation support
 *
 * Displays roster, lock states, countdown, and variation picker.
 * Integrates with RotationService and CharacterLoader for complete functionality.
 *
 * Usage:
 *   const ui = new CharacterSelectUI(app, rotationService, characterLoader);
 *   ui.initialize();
 */
import { RotationService, GameMode } from './RotationService';
import { CharacterLoader } from './CharacterLoader';
interface PlayerSelection {
    characterId: string | null;
    variationId: string | null;
    confirmed: boolean;
}
export declare class CharacterSelectUI {
    private app;
    private rotationService;
    private characterLoader;
    private isInitialized;
    private currentMode;
    private playerSelections;
    private characterSlots;
    private slotOrder;
    private playerCursorIndex;
    private uiRoot;
    private characterGrid;
    private variationPanel;
    private countdownDisplay;
    private lockIndicators;
    private featuredBanner;
    private inputDevices;
    private selectionTimeouts;
    private readonly SELECTION_TIMEOUT;
    private readonly GRID_COLUMNS;
    private readonly VARIATION_SLOTS;
    private readonly INCLUDE_RANDOM_SLOT;
    constructor(app: pc.Application, rotationService: RotationService, characterLoader: CharacterLoader);
    /**
     * Initialize the character select UI
     */
    initialize(): Promise<void>;
    /**
     * Create the root UI entity
     */
    private createUIRoot;
    /**
     * Load character data from CharacterLoader
     */
    private loadCharacterData;
    /**
     * Create the main character grid
     */
    private createCharacterGrid;
    /**
     * Create a single character slot UI element
     */
    private createCharacterSlot;
    /**
     * Create a Random Select slot
     */
    private createRandomSlot;
    /**
     * Subtle focus visuals to aid navigation (historic fighting game UX cue)
     */
    private applyFocusVisual;
    /**
     * Create variation selection panel
     */
    private createVariationPanel;
    /**
     * Create variation slot elements
     */
    private createVariationSlots;
    /**
     * Create countdown display for rotation timer
     */
    private createCountdownDisplay;
    /**
     * Create lock indicators overlay
     */
    private createLockIndicators;
    /**
     * Create featured characters banner
     */
    private createFeaturedBanner;
    /**
     * Setup input device handling
     */
    private setupInputHandling;
    /**
     * Handle keyboard input
     */
    private onKeyDown;
    /**
     * Select the currently focused grid item for player
     */
    private selectFocusedCharacter;
    /**
     * Grid navigation for character focus
     */
    private moveCursor;
    private updateFocusHighlight;
    /**
     * Setup event listeners for rotation service
     */
    private setupEventListeners;
    /**
     * Select a character for a player
     */
    private selectCharacter;
    /**
     * Select a variation for the current character
     */
    private selectVariation;
    /**
     * Confirm selection for a player
     */
    private confirmSelection;
    /**
     * Cancel selection for a player
     */
    private cancelSelection;
    /**
     * Show variation panel for selected character
     */
    private showVariationPanel;
    /**
     * Hide variation panel
     */
    private hideVariationPanel;
    /**
     * Start selection timeout for a player
     */
    private startSelectionTimeout;
    /**
     * Clear selection timeout for a player
     */
    private clearSelectionTimeout;
    /**
     * Check if all players are ready
     */
    private allPlayersReady;
    /**
     * Handle all players ready state
     */
    private onAllPlayersReady;
    /**
     * Update character availability based on rotation/entitlements
     */
    private updateCharacterAvailability;
    /**
     * Update character slot lock visual
     */
    private updateCharacterSlotLock;
    /**
     * Update the entire UI
     */
    private updateUI;
    /**
     * Update countdown display
     */
    private updateCountdown;
    /**
     * Update featured banner
     */
    private updateFeaturedBanner;
    /**
     * Get character portrait texture (placeholder)
     */
    private getCharacterPortrait;
    /**
     * Get color for archetype badge
     */
    private getArchetypeColor;
    /**
     * Set game mode and refresh UI
     */
    setGameMode(mode: GameMode): void;
    /**
     * Get current selections
     */
    getSelections(): Map<string, PlayerSelection>;
    /**
     * Reset all selections
     */
    resetSelections(): void;
    /**
     * Start regular updates
     */
    startUpdates(): void;
    /**
     * Stop regular updates
     */
    stopUpdates(): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export {};
/**
 * How to extend this system:
 *
 * 1. Adding gamepad support: Extend setupInputHandling with gamepad APIs
 * 2. Adding animations: Use PlayCanvas Tween for smooth transitions
 * 3. Adding audio: Integrate with audio system for selection sounds
 * 4. Adding custom UI themes: Create theme system with color/style variants
 * 5. Adding accessibility: Add screen reader support and keyboard navigation
 */ 
