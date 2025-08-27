import * as pc from 'playcanvas';
/**
 * RotationService.ts - LoL-like fighter rotation system for PlayCanvas
 *
 * Manages character availability pools, rotation cadence, and entitlements.
 * Supports hot-swapping, regional overrides, and event-based rotations.
 *
 * Usage:
 *   const rotation = new RotationService(app);
 *   await rotation.initialize();
 *   const available = rotation.isCharacterAvailable('vanguard', 'ranked');
 */
import { CharacterManager } from './characters/CharacterManager';
interface RotationState {
    currentWeek: number;
    nextRotation: Date;
    activePool: string[];
    region: string;
    eventActive: boolean;
    eventDescription?: string;
}
export type GameMode = 'training' | 'casual' | 'ranked' | 'tournament' | 'story';
export declare class RotationService {
    private app;
    private characterManager;
    private entitlementBridge;
    private config;
    private state;
    private configUrl;
    private region;
    private updateTimer;
    private eventEmitter;
    constructor(app: pc.Application, characterManager: CharacterManager, region?: string);
    /**
     * Initialize the rotation service
     */
    initialize(): Promise<void>;
    /**
     * Load rotation configuration from JSON
     */
    private loadConfiguration;
    /**
     * Update the current rotation state based on time and configuration
     */
    private updateRotationState;
    /**
     * Calculate current week number based on rollover schedule
     */
    private calculateCurrentWeek;
    /**
     * Calculate next rotation time
     */
    private calculateNextRotation;
    /**
     * Calculate currently active character pool
     */
    private calculateActivePool;
    /**
     * Check for active event overrides
     */
    private checkActiveEvent;
    /**
     * Get active event override for a given date
     */
    private getActiveEventOverride;
    /**
     * Get day of week number (0 = Sunday, 1 = Monday, etc.)
     */
    private getDayOfWeekNumber;
    /**
     * Get start of week for rollover calculations
     */
    private getWeekStart;
    /**
     * Setup automatic rotation updates
     */
    private setupRotationTimer;
    /**
     * Setup event listeners for external triggers
     */
    private setupEventListeners;
    /**
     * Check if rotation state has meaningfully changed
     */
    private hasRotationChanged;
    /**
     * Check if two arrays are equal
     */
    private arraysEqual;
    /**
     * Emit state change event
     */
    private emitStateChange;
    /**
     * Emit rotation notification
     */
    private emitRotationNotification;
    /**
     * Check if a character is available for a specific game mode
     */
    isCharacterAvailable(characterId: string, mode?: GameMode): boolean;
    /**
     * Get all available characters for a game mode
     */
    getAvailableCharacters(mode?: GameMode): string[];
    /**
     * Get current rotation state
     */
    getCurrentState(): RotationState | null;
    /**
     * Get time until next rotation
     */
    getTimeUntilRotation(): number;
    /**
     * Get featured characters for UI
     */
    getFeaturedCharacters(): string[];
    /**
     * Force refresh rotation state (useful for testing)
     */
    forceRefresh(): Promise<void>;
    /**
     * Subscribe to rotation events
     */
    on(event: string, callback: Function): void;
    /**
     * Unsubscribe from rotation events
     */
    off(event: string, callback: Function): void;
    /**
     * Get analytics data for current rotation
     */
    getAnalyticsData(): any;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export {};
/**
 * How to extend this system:
 *
 * 1. Adding new game modes: Update GameMode type and entitlement logic
 * 2. Adding new event types: Extend EventOverride interface and processing logic
 * 3. Adding new regions: Add region configs and timezone handling
 * 4. Adding complex rotation patterns: Extend calculateActivePool with new logic
 * 5. Adding analytics: Extend getAnalyticsData and add tracking calls
 */ 
