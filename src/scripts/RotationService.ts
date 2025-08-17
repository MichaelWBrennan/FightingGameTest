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

import { EntitlementBridge } from './EntitlementBridge';

interface RotationConfig {
  schemaVersion: string;
  cadenceDays: number;
  rolloverUtc: string;
  regions: Record<string, RegionConfig>;
  pools: RotationPools;
  flags: RotationFlags;
  analytics: AnalyticsConfig;
  entitlements: EntitlementConfig;
  ui: UIConfig;
}

interface RegionConfig {
  cadenceDays: number;
  rolloverUtc: string;
}

interface RotationPools {
  freeRotation: string[];
  starter: string[];
  owned: string[];
  eventOverrides: Record<string, EventOverride>;
}

interface EventOverride {
  add: string[];
  remove: string[];
  description?: string;
}

interface RotationFlags {
  trainingAlwaysUnlocked: boolean;
  allowHotSwap: boolean;
  enableEventRotations: boolean;
  enableRegionalOverrides: boolean;
  debugMode: boolean;
}

interface AnalyticsConfig {
  trackPickRate: boolean;
  trackWinRate: boolean;
  trackVariationUsage: boolean;
  trackRegionalDifferences: boolean;
}

interface EntitlementConfig {
  devUnlocks: {
    enabled: boolean;
    characters: string[];
  };
  qaFlags: {
    unlockAll: boolean;
    forceRotation: string[] | null;
  };
  platformSKUs: Record<string, {
    characters: string[];
    enabled: boolean;
  }>;
}

interface UIConfig {
  showCountdown: boolean;
  showFeatured: boolean;
  featuredCharacters: string[];
  lockIconStyle: string;
  rotationNotification: boolean;
}

interface RotationState {
  currentWeek: number;
  nextRotation: Date;
  activePool: string[];
  region: string;
  eventActive: boolean;
  eventDescription?: string;
}

export type GameMode = 'training' | 'casual' | 'ranked' | 'tournament' | 'story';

export class RotationService {
  private app: pc.Application;
  private entitlementBridge: EntitlementBridge;
  private config: RotationConfig | null = null;
  private state: RotationState | null = null;
  private configUrl: string = 'assets/data/rotation.config.json';
  private region: string = 'default';
  private updateTimer: number | null = null;
  private eventEmitter: pc.EventHandler;

  constructor(app: pc.Application, region: string = 'default') {
    this.app = app;
    this.region = region;
    this.entitlementBridge = new EntitlementBridge();
    this.eventEmitter = new pc.EventHandler();
  }

  /**
   * Initialize the rotation service
   */
  async initialize(): Promise<void> {
    console.log('RotationService: Initializing...');
    
    try {
      // Load rotation configuration
      await this.loadConfiguration();
      
      // Initialize entitlement bridge
      await this.entitlementBridge.initialize();
      
      // Calculate current rotation state
      this.updateRotationState();
      
      // Setup automatic updates
      this.setupRotationTimer();
      
      // Listen for external events
      this.setupEventListeners();
      
      console.log('RotationService: Initialized successfully');
      this.emitStateChange();
      
    } catch (error) {
      console.error('RotationService: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load rotation configuration from JSON
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const response = await fetch(this.configUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.config = await response.json();
      
      // Validate schema version
      if (this.config!.schemaVersion !== '2.0') {
        console.warn(`RotationService: Schema version mismatch. Expected 2.0, got ${this.config!.schemaVersion}`);
      }

      // Validate region exists
      if (this.region !== 'default' && !this.config!.regions[this.region]) {
        console.warn(`RotationService: Region '${this.region}' not found, using default`);
        this.region = 'default';
      }

      console.log(`RotationService: Configuration loaded for region '${this.region}'`);
      
    } catch (error) {
      throw new Error(`Failed to load rotation configuration: ${error.message}`);
    }
  }

  /**
   * Update the current rotation state based on time and configuration
   */
  private updateRotationState(): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const now = new Date();
    const regionConfig = this.config.regions[this.region] || this.config.regions.default;
    
    // Calculate current week number
    const currentWeek = this.calculateCurrentWeek(now, regionConfig);
    
    // Calculate next rotation time
    const nextRotation = this.calculateNextRotation(now, regionConfig);
    
    // Determine active pool
    const activePool = this.calculateActivePool(now);
    
    // Check for active events
    const eventInfo = this.checkActiveEvent(now);
    
    this.state = {
      currentWeek,
      nextRotation,
      activePool,
      region: this.region,
      eventActive: eventInfo.active,
      eventDescription: eventInfo.description
    };

    console.log('RotationService: State updated', {
      week: currentWeek,
      nextRotation: nextRotation.toISOString(),
      poolSize: activePool.length,
      eventActive: eventInfo.active
    });
  }

  /**
   * Calculate current week number based on rollover schedule
   */
  private calculateCurrentWeek(now: Date, regionConfig: RegionConfig): number {
    // Parse rollover time (e.g., "Monday 09:00")
    const [dayName, timeStr] = regionConfig.rolloverUtc.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const dayOfWeek = this.getDayOfWeekNumber(dayName);
    
    // Calculate milliseconds since epoch
    const epochStart = new Date('1970-01-01T00:00:00Z');
    const msSinceEpoch = now.getTime() - epochStart.getTime();
    
    // Calculate milliseconds since last rollover
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeekStart = this.getWeekStart(now, dayOfWeek, hours, minutes);
    const msSinceWeekStart = now.getTime() - currentWeekStart.getTime();
    
    // Calculate week number
    return Math.floor(msSinceEpoch / msPerWeek);
  }

  /**
   * Calculate next rotation time
   */
  private calculateNextRotation(now: Date, regionConfig: RegionConfig): Date {
    const [dayName, timeStr] = regionConfig.rolloverUtc.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dayOfWeek = this.getDayOfWeekNumber(dayName);
    
    const nextRotation = new Date(now);
    
    // Find next occurrence of rollover day/time
    const daysUntilRollover = (dayOfWeek - now.getUTCDay() + 7) % 7;
    nextRotation.setUTCDate(now.getUTCDate() + daysUntilRollover);
    nextRotation.setUTCHours(hours, minutes, 0, 0);
    
    // If we've already passed this week's rollover, move to next week
    if (nextRotation <= now) {
      nextRotation.setUTCDate(nextRotation.getUTCDate() + 7);
    }
    
    return nextRotation;
  }

  /**
   * Calculate currently active character pool
   */
  private calculateActivePool(now: Date): string[] {
    if (!this.config) return [];

    let pool = [...this.config.pools.freeRotation];
    
    // Add starter characters (always available)
    pool.push(...this.config.pools.starter);
    
    // Add owned characters from entitlements
    const ownedCharacters = this.entitlementBridge.getOwnedCharacters();
    pool.push(...ownedCharacters);
    
    // Apply event overrides
    if (this.config.flags.enableEventRotations) {
      const eventOverride = this.getActiveEventOverride(now);
      if (eventOverride) {
        // Add event characters
        pool.push(...eventOverride.add);
        
        // Remove specified characters
        pool = pool.filter(char => !eventOverride.remove.includes(char));
      }
    }

    // Apply dev/QA overrides
    if (this.config.entitlements.devUnlocks.enabled) {
      if (this.config.entitlements.devUnlocks.characters.includes('all')) {
        // Dev unlock all - this would be populated from all available characters
        pool.push('all_dev_characters'); // Placeholder
      } else {
        pool.push(...this.config.entitlements.devUnlocks.characters);
      }
    }

    if (this.config.entitlements.qaFlags.unlockAll) {
      pool.push('all_qa_characters'); // Placeholder
    }

    if (this.config.entitlements.qaFlags.forceRotation) {
      pool = [...this.config.entitlements.qaFlags.forceRotation];
    }

    // Remove duplicates and return
    return [...new Set(pool)];
  }

  /**
   * Check for active event overrides
   */
  private checkActiveEvent(now: Date): { active: boolean; description?: string } {
    if (!this.config?.flags.enableEventRotations) {
      return { active: false };
    }

    const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const eventOverride = this.config.pools.eventOverrides[todayKey];
    
    if (eventOverride) {
      return {
        active: true,
        description: eventOverride.description
      };
    }

    return { active: false };
  }

  /**
   * Get active event override for a given date
   */
  private getActiveEventOverride(now: Date): EventOverride | null {
    if (!this.config?.flags.enableEventRotations) {
      return null;
    }

    const todayKey = now.toISOString().split('T')[0];
    return this.config.pools.eventOverrides[todayKey] || null;
  }

  /**
   * Get day of week number (0 = Sunday, 1 = Monday, etc.)
   */
  private getDayOfWeekNumber(dayName: string): number {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(dayName.toLowerCase());
  }

  /**
   * Get start of week for rollover calculations
   */
  private getWeekStart(date: Date, rolloverDay: number, rolloverHour: number, rolloverMinute: number): Date {
    const weekStart = new Date(date);
    const currentDay = date.getUTCDay();
    
    // Calculate days back to rollover day
    let daysBack = (currentDay - rolloverDay + 7) % 7;
    
    weekStart.setUTCDate(date.getUTCDate() - daysBack);
    weekStart.setUTCHours(rolloverHour, rolloverMinute, 0, 0);
    
    // If the calculated start is in the future, go back one week
    if (weekStart > date) {
      weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    }
    
    return weekStart;
  }

  /**
   * Setup automatic rotation updates
   */
  private setupRotationTimer(): void {
    if (!this.config || !this.state) return;

    const checkInterval = 60000; // Check every minute
    
    this.updateTimer = window.setInterval(() => {
      const oldState = { ...this.state! };
      this.updateRotationState();
      
      // Check if rotation changed
      if (this.hasRotationChanged(oldState, this.state!)) {
        console.log('RotationService: Rotation changed, emitting update');
        this.emitStateChange();
        
        if (this.config!.ui.rotationNotification) {
          this.emitRotationNotification();
        }
      }
    }, checkInterval);
  }

  /**
   * Setup event listeners for external triggers
   */
  private setupEventListeners(): void {
    // Listen for hot-swap configuration updates
    this.app.on('rotation:hotswap', async (newConfigUrl?: string) => {
      if (this.config?.flags.allowHotSwap) {
        try {
          if (newConfigUrl) {
            this.configUrl = newConfigUrl;
          }
          await this.loadConfiguration();
          this.updateRotationState();
          this.emitStateChange();
          console.log('RotationService: Hot-swapped configuration');
        } catch (error) {
          console.error('RotationService: Hot-swap failed:', error);
        }
      }
    });

    // Listen for entitlement changes
    this.entitlementBridge.on('entitlements:changed', () => {
      this.updateRotationState();
      this.emitStateChange();
    });
  }

  /**
   * Check if rotation state has meaningfully changed
   */
  private hasRotationChanged(oldState: RotationState, newState: RotationState): boolean {
    return (
      oldState.currentWeek !== newState.currentWeek ||
      oldState.activePool.length !== newState.activePool.length ||
      !this.arraysEqual(oldState.activePool, newState.activePool) ||
      oldState.eventActive !== newState.eventActive
    );
  }

  /**
   * Check if two arrays are equal
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  /**
   * Emit state change event
   */
  private emitStateChange(): void {
    this.app.fire('rotation:statechange', {
      state: this.state,
      config: this.config
    });
    
    this.eventEmitter.fire('statechange', this.state);
  }

  /**
   * Emit rotation notification
   */
  private emitRotationNotification(): void {
    this.app.fire('rotation:notification', {
      type: 'rotation_changed',
      newCharacters: this.state?.activePool || [],
      nextRotation: this.state?.nextRotation
    });
  }

  // Public API

  /**
   * Check if a character is available for a specific game mode
   */
  isCharacterAvailable(characterId: string, mode: GameMode = 'casual'): boolean {
    if (!this.state || !this.config) {
      console.warn('RotationService: Not initialized');
      return false;
    }

    // Training mode special case
    if (mode === 'training' && this.config.flags.trainingAlwaysUnlocked) {
      return true;
    }

    // Check if character is in active pool
    if (this.state.activePool.includes(characterId)) {
      return true;
    }

    // Check entitlements
    return this.entitlementBridge.hasCharacterAccess(characterId, mode);
  }

  /**
   * Get all available characters for a game mode
   */
  getAvailableCharacters(mode: GameMode = 'casual'): string[] {
    if (!this.state || !this.config) {
      return [];
    }

    if (mode === 'training' && this.config.flags.trainingAlwaysUnlocked) {
      // Return all characters for training mode
      // This would be populated from character registry
      return ['all_characters']; // Placeholder
    }

    // Filter active pool by entitlements
    return this.state.activePool.filter(characterId =>
      this.entitlementBridge.hasCharacterAccess(characterId, mode)
    );
  }

  /**
   * Get current rotation state
   */
  getCurrentState(): RotationState | null {
    return this.state;
  }

  /**
   * Get time until next rotation
   */
  getTimeUntilRotation(): number {
    if (!this.state) return 0;
    return Math.max(0, this.state.nextRotation.getTime() - Date.now());
  }

  /**
   * Get featured characters for UI
   */
  getFeaturedCharacters(): string[] {
    if (!this.config?.ui.showFeatured) {
      return [];
    }
    
    return this.config.ui.featuredCharacters.filter(characterId =>
      this.isCharacterAvailable(characterId)
    );
  }

  /**
   * Force refresh rotation state (useful for testing)
   */
  async forceRefresh(): Promise<void> {
    if (this.config?.flags.debugMode) {
      await this.loadConfiguration();
      this.updateRotationState();
      this.emitStateChange();
      console.log('RotationService: Force refreshed');
    }
  }

  /**
   * Subscribe to rotation events
   */
  on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from rotation events
   */
  off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Get analytics data for current rotation
   */
  getAnalyticsData(): any {
    if (!this.config?.analytics) {
      return null;
    }

    return {
      currentWeek: this.state?.currentWeek,
      activePoolSize: this.state?.activePool.length || 0,
      region: this.region,
      eventActive: this.state?.eventActive || false,
      timeUntilRotation: this.getTimeUntilRotation()
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.eventEmitter.destroy();
    this.entitlementBridge.destroy();
    
    console.log('RotationService: Destroyed');
  }
}

/**
 * How to extend this system:
 * 
 * 1. Adding new game modes: Update GameMode type and entitlement logic
 * 2. Adding new event types: Extend EventOverride interface and processing logic
 * 3. Adding new regions: Add region configs and timezone handling
 * 4. Adding complex rotation patterns: Extend calculateActivePool with new logic
 * 5. Adding analytics: Extend getAnalyticsData and add tracking calls
 */