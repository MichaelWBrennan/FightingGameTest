import * as pc from 'playcanvas';
// @ts-nocheck
/**
 * EntitlementBridge.ts - Entitlement management for character ownership
 * 
 * Single interface to ownership (dev unlocks, QA flags, platform entitlements).
 * Stubbed for now but designed for dependency injection to support platform SKUs later.
 * 
 * Usage:
 *   const bridge = new EntitlementBridge();
 *   await bridge.initialize();
 *   const hasAccess = bridge.hasCharacterAccess('vanguard', 'ranked');
 */

export type GameMode = 'training' | 'casual' | 'ranked' | 'tournament' | 'story';

interface EntitlementData {
  ownedCharacters: string[];
  platformSKUs: string[];
  devUnlocks: string[];
  qaFlags: {
    unlockAll: boolean;
    temporaryUnlocks: string[];
  };
  subscription: {
    active: boolean;
    tier: string;
    benefits: string[];
  };
}

interface PlatformProvider {
  name: string;
  isAvailable(): boolean;
  getOwnedContent(): Promise<string[]>;
  hasSubscription(): Promise<boolean>;
  validatePurchase(itemId: string): Promise<boolean>;
}

export class EntitlementBridge {
  private entitlements: EntitlementData;
  private platformProviders: Map<string, PlatformProvider> = new Map();
  private eventEmitter: pc.EventHandler;
  private updateInterval: number | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.entitlements = {
      ownedCharacters: [],
      platformSKUs: [],
      devUnlocks: [],
      qaFlags: {
        unlockAll: false,
        temporaryUnlocks: []
      },
      subscription: {
        active: false,
        tier: 'free',
        benefits: []
      }
    };

    this.eventEmitter = new pc.EventHandler();
  }

  /**
   * Initialize the entitlement system
   */
  async initialize(): Promise<void> {
    console.log('EntitlementBridge: Initializing...');

    try {
      // Register platform providers
      this.registerPlatformProviders();

      // Load local entitlements (dev/QA overrides)
      await this.loadLocalEntitlements();

      // Query platform entitlements
      await this.queryPlatformEntitlements();

      // Setup periodic refresh
      this.setupPeriodicRefresh();

      this.isInitialized = true;
      console.log('EntitlementBridge: Initialized successfully');

      // Emit initial state
      this.emitEntitlementsChanged();

    } catch (error) {
      console.error('EntitlementBridge: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Register available platform providers
   */
  private registerPlatformProviders(): void {
    // Steam provider (stubbed)
    this.platformProviders.set('steam', {
      name: 'Steam',
      isAvailable: () => typeof window !== 'undefined' && 'steamworks' in window,
      getOwnedContent: async () => {
        // Stub: In real implementation, query Steam API
        return [];
      },
      hasSubscription: async () => false,
      validatePurchase: async (itemId: string) => false
    });

    // PlayStation provider (stubbed)
    this.platformProviders.set('playstation', {
      name: 'PlayStation',
      isAvailable: () => typeof window !== 'undefined' && 'PlayStation' in window,
      getOwnedContent: async () => {
        // Stub: In real implementation, query PlayStation Store API
        return [];
      },
      hasSubscription: async () => false,
      validatePurchase: async (itemId: string) => false
    });

    // Xbox provider (stubbed)
    this.platformProviders.set('xbox', {
      name: 'Xbox',
      isAvailable: () => typeof window !== 'undefined' && 'Xbox' in window,
      getOwnedContent: async () => {
        // Stub: In real implementation, query Xbox Live API
        return [];
      },
      hasSubscription: async () => false,
      validatePurchase: async (itemId: string) => false
    });

    // Generic web provider (stubbed)
    this.platformProviders.set('web', {
      name: 'Web',
      isAvailable: () => true,
      getOwnedContent: async () => {
        // Stub: In real implementation, query web store API
        const stored = localStorage.getItem('owned_characters');
        return stored ? JSON.parse(stored) : [];
      },
      hasSubscription: async () => {
        const subscription = localStorage.getItem('subscription_active');
        return subscription === 'true';
      },
      validatePurchase: async (itemId: string) => {
        // Stub: In real implementation, validate with backend
        return false;
      }
    });

    console.log(`EntitlementBridge: Registered ${this.platformProviders.size} platform providers`);
  }

  /**
   * Load local entitlements (dev/QA overrides)
   */
  private async loadLocalEntitlements(): Promise<void> {
    try {
      // Check for dev environment
      const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      
      if (isDev) {
        // Dev unlocks from localStorage
        const devUnlocks = localStorage.getItem('dev_unlocks');
        if (devUnlocks) {
          this.entitlements.devUnlocks = JSON.parse(devUnlocks);
          console.log('EntitlementBridge: Loaded dev unlocks:', this.entitlements.devUnlocks);
        }
      }

      // Check for QA flags
      const qaFlags = localStorage.getItem('qa_flags');
      if (qaFlags) {
        const flags = JSON.parse(qaFlags);
        this.entitlements.qaFlags = { ...this.entitlements.qaFlags, ...flags };
        console.log('EntitlementBridge: Loaded QA flags:', this.entitlements.qaFlags);
      }

      // Check for URL parameters (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('unlock_all') === 'true') {
        this.entitlements.qaFlags.unlockAll = true;
        console.log('EntitlementBridge: URL override - unlock all characters');
      }

      if (urlParams.get('dev_mode') === 'true') {
        this.entitlements.devUnlocks.push('all');
        console.log('EntitlementBridge: URL override - dev mode enabled');
      }

    } catch (error) {
      console.warn('EntitlementBridge: Failed to load local entitlements:', error);
    }
  }

  /**
   * Query platform entitlements from all available providers
   */
  private async queryPlatformEntitlements(): Promise<void> {
    const ownedContent: string[] = [];
    const platformSKUs: string[] = [];

    for (const [platformName, provider] of this.platformProviders) {
      try {
        if (provider.isAvailable()) {
          console.log(`EntitlementBridge: Querying ${platformName} entitlements...`);
          
          const content = await provider.getOwnedContent();
          ownedContent.push(...content);
          
          const hasSubscription = await provider.hasSubscription();
          if (hasSubscription) {
            this.entitlements.subscription = {
              active: true,
              tier: 'premium',
              benefits: ['all_characters', 'early_access', 'exclusive_skins']
            };
          }

          platformSKUs.push(platformName);
          console.log(`EntitlementBridge: ${platformName} - ${content.length} items, subscription: ${hasSubscription}`);
        }
      } catch (error) {
        console.warn(`EntitlementBridge: Failed to query ${platformName}:`, error);
      }
    }

    // Update entitlements
    this.entitlements.ownedCharacters = [...new Set(ownedContent)];
    this.entitlements.platformSKUs = platformSKUs;

    console.log(`EntitlementBridge: Total owned characters: ${this.entitlements.ownedCharacters.length}`);
  }

  /**
   * Setup periodic refresh of entitlements
   */
  private setupPeriodicRefresh(): void {
    // Refresh every 5 minutes
    this.updateInterval = window.setInterval(async () => {
      try {
        const oldEntitlements = JSON.stringify(this.entitlements);
        await this.queryPlatformEntitlements();
        
        // Check if entitlements changed
        const newEntitlements = JSON.stringify(this.entitlements);
        if (oldEntitlements !== newEntitlements) {
          console.log('EntitlementBridge: Entitlements updated');
          this.emitEntitlementsChanged();
        }
      } catch (error) {
        console.warn('EntitlementBridge: Periodic refresh failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if player has access to a specific character
   */
  hasCharacterAccess(characterId: string, mode: GameMode = 'casual'): boolean {
    if (!this.isInitialized) {
      console.warn('EntitlementBridge: Not initialized, denying access');
      return false;
    }

    // QA unlock all override
    if (this.entitlements.qaFlags.unlockAll) {
      return true;
    }

    // Dev unlocks
    if (this.entitlements.devUnlocks.includes('all') || this.entitlements.devUnlocks.includes(characterId)) {
      return true;
    }

    // QA temporary unlocks
    if (this.entitlements.qaFlags.temporaryUnlocks.includes(characterId)) {
      return true;
    }

    // Subscription benefits
    if (this.entitlements.subscription.active && this.entitlements.subscription.benefits.includes('all_characters')) {
      return true;
    }

    // Owned characters
    if (this.entitlements.ownedCharacters.includes(characterId)) {
      return true;
    }

    // Mode-specific checks
    switch (mode) {
      case 'training':
        // Training mode might have different rules
        return this.hasTrainingAccess(characterId);
      
      case 'story':
        // Story mode might unlock characters progressively
        return this.hasStoryAccess(characterId);
      
      case 'tournament':
        // Tournament mode might require ownership
        return this.entitlements.ownedCharacters.includes(characterId);
      
      default:
        return false;
    }
  }

  /**
   * Check training mode access (often more permissive)
   */
  private hasTrainingAccess(characterId: string): boolean {
    // Training mode typically allows access to more characters
    // This could be configured per character or globally
    return true; // For now, allow all characters in training
  }

  /**
   * Check story mode access (progression-based)
   */
  private hasStoryAccess(characterId: string): boolean {
    // Story mode access based on progression
    // This would typically query save game data
    const storyProgress = localStorage.getItem('story_progress');
    if (storyProgress) {
      const progress = JSON.parse(storyProgress);
      return progress.unlockedCharacters?.includes(characterId) || false;
    }
    
    // Default to first character for story mode
    return characterId === 'vanguard';
  }

  /**
   * Get all owned characters
   */
  getOwnedCharacters(): string[] {
    const owned = [
      ...this.entitlements.ownedCharacters,
      ...this.entitlements.devUnlocks.filter(unlock => unlock !== 'all'),
      ...this.entitlements.qaFlags.temporaryUnlocks
    ];

    // Add subscription benefits
    if (this.entitlements.subscription.active && this.entitlements.subscription.benefits.includes('all_characters')) {
      // This would be populated from character registry
      owned.push('all_subscription_characters'); // Placeholder
    }

    return [...new Set(owned)];
  }

  /**
   * Purchase a character (initiates platform purchase flow)
   */
  async purchaseCharacter(characterId: string, platform: string = 'web'): Promise<boolean> {
    const provider = this.platformProviders.get(platform);
    if (!provider) {
      throw new Error(`Platform '${platform}' not available`);
    }

    try {
      console.log(`EntitlementBridge: Initiating purchase of '${characterId}' on ${platform}`);
      
      // Validate purchase with platform
      const success = await provider.validatePurchase(characterId);
      
      if (success) {
        // Add to owned characters
        if (!this.entitlements.ownedCharacters.includes(characterId)) {
          this.entitlements.ownedCharacters.push(characterId);
          
          // Persist to local storage (web platform)
          if (platform === 'web') {
            localStorage.setItem('owned_characters', JSON.stringify(this.entitlements.ownedCharacters));
          }
          
          console.log(`EntitlementBridge: Successfully purchased '${characterId}'`);
          this.emitEntitlementsChanged();
        }
      }

      return success;

    } catch (error) {
      console.error(`EntitlementBridge: Purchase failed for '${characterId}':`, error);
      return false;
    }
  }

  /**
   * Grant temporary access (for events, trials, etc.)
   */
  grantTemporaryAccess(characterId: string, durationMs: number = 24 * 60 * 60 * 1000): void {
    if (!this.entitlements.qaFlags.temporaryUnlocks.includes(characterId)) {
      this.entitlements.qaFlags.temporaryUnlocks.push(characterId);
      
      // Auto-remove after duration
      setTimeout(() => {
        const index = this.entitlements.qaFlags.temporaryUnlocks.indexOf(characterId);
        if (index > -1) {
          this.entitlements.qaFlags.temporaryUnlocks.splice(index, 1);
          console.log(`EntitlementBridge: Temporary access expired for '${characterId}'`);
          this.emitEntitlementsChanged();
        }
      }, durationMs);

      console.log(`EntitlementBridge: Granted temporary access to '${characterId}' for ${durationMs}ms`);
      this.emitEntitlementsChanged();
    }
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): { active: boolean; tier: string; benefits: string[] } {
    return { ...this.entitlements.subscription };
  }

  /**
   * Get entitlement summary for debugging
   */
  getEntitlementSummary(): any {
    return {
      ownedCharacters: this.entitlements.ownedCharacters.length,
      platformSKUs: this.entitlements.platformSKUs,
      devUnlocks: this.entitlements.devUnlocks,
      qaFlags: this.entitlements.qaFlags,
      subscription: this.entitlements.subscription,
      availablePlatforms: Array.from(this.platformProviders.keys()).filter(name =>
        this.platformProviders.get(name)!.isAvailable()
      )
    };
  }

  /**
   * Force refresh entitlements
   */
  async refresh(): Promise<void> {
    console.log('EntitlementBridge: Force refreshing entitlements...');
    await this.queryPlatformEntitlements();
    this.emitEntitlementsChanged();
  }

  /**
   * Subscribe to entitlement change events
   */
  on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from entitlement change events
   */
  off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Emit entitlements changed event
   */
  private emitEntitlementsChanged(): void {
    this.eventEmitter.fire('entitlements:changed', {
      ownedCharacters: this.getOwnedCharacters(),
      subscription: this.entitlements.subscription
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.eventEmitter.destroy();
    this.isInitialized = false;

    console.log('EntitlementBridge: Destroyed');
  }
}

/**
 * How to integrate with real platforms:
 * 
 * 1. Steam: Replace Steam provider stub with actual Steamworks.js integration
 * 2. PlayStation: Use PlayStation Store API via PlayStation SDK
 * 3. Xbox: Use Xbox Live API via Xbox Game Development Kit
 * 4. Mobile: Add iOS App Store / Google Play billing APIs
 * 5. Web: Integrate with Stripe, PayPal, or other payment processors
 * 6. Backend: Add server-side validation for all purchases
 */