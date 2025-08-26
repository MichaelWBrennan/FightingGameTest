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
export declare class EntitlementBridge {
    private entitlements;
    private platformProviders;
    private eventEmitter;
    private updateInterval;
    private isInitialized;
    constructor();
    /**
     * Initialize the entitlement system
     */
    initialize(): Promise<void>;
    /**
     * Register available platform providers
     */
    private registerPlatformProviders;
    /**
     * Load local entitlements (dev/QA overrides)
     */
    private loadLocalEntitlements;
    /**
     * Query platform entitlements from all available providers
     */
    private queryPlatformEntitlements;
    /**
     * Setup periodic refresh of entitlements
     */
    private setupPeriodicRefresh;
    /**
     * Check if player has access to a specific character
     */
    hasCharacterAccess(characterId: string, mode?: GameMode): boolean;
    /**
     * Check training mode access (often more permissive)
     */
    private hasTrainingAccess;
    /**
     * Check story mode access (progression-based)
     */
    private hasStoryAccess;
    /**
     * Get all owned characters
     */
    getOwnedCharacters(): string[];
    /**
     * Purchase a character (initiates platform purchase flow)
     */
    purchaseCharacter(characterId: string, platform?: string): Promise<boolean>;
    /**
     * Grant temporary access (for events, trials, etc.)
     */
    grantTemporaryAccess(characterId: string, durationMs?: number): void;
    /**
     * Get subscription status
     */
    getSubscriptionStatus(): {
        active: boolean;
        tier: string;
        benefits: string[];
    };
    /**
     * Get entitlement summary for debugging
     */
    getEntitlementSummary(): any;
    /**
     * Force refresh entitlements
     */
    refresh(): Promise<void>;
    /**
     * Subscribe to entitlement change events
     */
    on(event: string, callback: Function): void;
    /**
     * Unsubscribe from entitlement change events
     */
    off(event: string, callback: Function): void;
    /**
     * Emit entitlements changed event
     */
    private emitEntitlementsChanged;
    /**
     * Cleanup resources
     */
    destroy(): void;
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
//# sourceMappingURL=EntitlementBridge.d.ts.map