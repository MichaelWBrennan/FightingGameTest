/**
 * PlayCanvas RetentionClient SDK
 *
 * Drop-in SDK for tracking session starts/ends, objectives, mastery XP,
 * store impressions, and purchases. All operations are non-blocking and fail-safe.
 *
 * Usage:
 * const retention = new RetentionClient({
 *   apiEndpoint: 'https://api.yourgame.com',
 *   userId: 'u_123',
 *   apiKey: 'your-api-key'
 * });
 *
 * retention.startSession();
 * retention.trackMatchResult({ ... });
 *
 * How to extend:
 * - Add new event types by implementing IRetentionEvent interface
 * - Override event validation in validateEvent() method
 * - Extend offline storage by modifying OfflineEventQueue class
 */
import { EventEmitter } from 'eventemitter3';
export interface RetentionConfig {
    apiEndpoint: string;
    userId: string;
    apiKey: string;
    batchSize?: number;
    flushIntervalMs?: number;
    maxRetries?: number;
    offlineStorageKey?: string;
    enableDebugLogging?: boolean;
}
export interface IRetentionEvent {
    event: string;
    v: string;
    ts: number;
    userId: string;
    sessionHash: string;
    [key: string]: any;
}
export interface SessionStartEvent extends IRetentionEvent {
    event: 'session_start';
    platform?: 'web' | 'mobile' | 'desktop';
    clientVersion?: string;
    returningPlayer?: boolean;
    daysSinceLastSession?: number;
}
export interface MatchResultEvent extends IRetentionEvent {
    event: 'match_result';
    matchId: string;
    ranked: boolean;
    mmrDelta?: number;
    characterId: string;
    opponentId: string;
    roundsWon: number;
    roundsLost: number;
    disconnect: boolean;
    matchDurationMs?: number;
    winStreak?: number;
}
export interface ProgressionGrantEvent extends IRetentionEvent {
    event: 'progression_grant';
    grantType: 'account_xp' | 'character_xp' | 'mastery_points' | 'cosmetic_unlock' | 'title_unlock' | 'achievement';
    amount: number;
    reason: 'match_victory' | 'match_participation' | 'daily_objective' | 'weekly_objective' | 'lab_completion' | 'prestige' | 'mentor_activity';
    itemId?: string;
    characterId?: string;
    previousLevel?: number;
    newLevel?: number;
    prestigeLevel?: number;
}
export interface StoreImpressionEvent extends IRetentionEvent {
    event: 'store_impression';
    storeSection: 'featured' | 'cosmetics' | 'characters' | 'bundles' | 'seasonal';
    itemsViewed?: Array<{
        itemId: string;
        price: number;
        currency: string;
        onSale?: boolean;
        returnWindowDays?: number;
    }>;
    viewDurationMs?: number;
    clickedItems?: string[];
}
export interface PurchaseCompletedEvent extends IRetentionEvent {
    event: 'purchase_completed';
    transactionId: string;
    totalAmount: number;
    currency: string;
    items: Array<{
        itemId: string;
        itemType: 'skin' | 'title' | 'banner' | 'announcer' | 'vfx_palette' | 'bundle' | 'stage_variant';
        price: number;
        quantity: number;
    }>;
    paymentMethod?: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    bundleDiscount?: number;
    taxAmount?: number;
    firstPurchase?: boolean;
}
export declare class RetentionClient extends EventEmitter {
    private config;
    private sessionHash;
    private eventQueue;
    private offlineQueue;
    private eventEndpoints;
    private flushTimer;
    private isOnline;
    constructor(config: RetentionConfig);
    /**
     * Start a new session and track session_start event
     */
    startSession(additionalData?: Partial<SessionStartEvent>): void;
    /**
     * Track a match result
     */
    trackMatchResult(matchData: Omit<MatchResultEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash'>): void;
    /**
     * Track club-related events
     */
    trackClubEvent(clubData: Omit<ClubEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash'>): void;
    /**
     * Track progression grants (XP, unlocks, etc.)
     */
    trackProgression(progressionData: Omit<ProgressionGrantEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash'>): void;
    /**
     * Track store impressions
     */
    trackStoreImpression(storeData: Omit<StoreImpressionEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash'>): void;
    /**
     * Track completed purchases
     */
    trackPurchase(purchaseData: Omit<PurchaseCompletedEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash'>): void;
    /**
     * Manually flush all queued events
     */
    flush(): Promise<void>;
    /**
     * End session and flush all remaining events
     */
    endSession(): Promise<void>;
    private trackEvent;
    private flushEvents;
    private _sendWithRetry;
    private sendEvents;
    private validateEvent;
    private setupNetworkMonitoring;
    private setupFlushTimer;
    private processOfflineEvents;
    private detectPlatform;
    private getClientVersion;
    private isReturningPlayer;
    private getDaysSinceLastSession;
    private updateLastSessionTime;
    private log;
}
//# sourceMappingURL=RetentionClient.d.ts.map