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
import { v4 as uuidv4 } from 'uuid';

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

// ClubEvent interface was missing, adding a placeholder based on usage
export interface ClubEvent extends IRetentionEvent {
  event: 'club_event';
  clubId: string;
  action: string;
}

class OfflineEventQueue {
  private storageKey: string;
  private maxSize: number = 1000;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  enqueue(event: IRetentionEvent): void {
    try {
      const queue = this.getQueue();
      queue.push(event);

      // Trim queue if too large
      if (queue.length > this.maxSize) {
        queue.splice(0, queue.length - this.maxSize);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(queue));
    } catch (error) {
      // Fail silently if localStorage is unavailable
      console.warn('RetentionClient: Unable to store offline event', error);
    }
  }

  dequeueAll(): IRetentionEvent[] {
    try {
      const queue = this.getQueue();
      localStorage.setItem(this.storageKey, JSON.stringify([]));
      return queue;
    } catch (error) {
      console.warn('RetentionClient: Unable to retrieve offline events', error);
      return [];
    }
  }

  private getQueue(): IRetentionEvent[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }
}

export class RetentionClient extends EventEmitter {
  private config: Required<RetentionConfig>;
  private sessionHash: string;
  private eventQueue: IRetentionEvent[] = [];
  private offlineQueue: OfflineEventQueue;
  private eventEndpoints: Record<string, string> = {
    session_start: '/analytics/events',
    match_result: '/analytics/events',
    progression_grant: '/progression/events',
    store_impression: '/commerce/events',
    purchase_completed: '/commerce/events',
    club_event: '/social/events',
  };
  private flushTimer: number | null = null;
  private isOnline: boolean = true;

  constructor(config: RetentionConfig) {
    super();

    this.config = {
      batchSize: 10,
      flushIntervalMs: 30000, // 30 seconds
      maxRetries: 3,
      offlineStorageKey: 'retention_events',
      enableDebugLogging: false,
      ...config
    };

    this.sessionHash = `s_${uuidv4().replace(/-/g, '')}`;
    this.offlineQueue = new OfflineEventQueue(this.config.offlineStorageKey);

    this.setupNetworkMonitoring();
    this.setupFlushTimer();
    this.processOfflineEvents();
  }

  /**
   * Start a new session and track session_start event
   */
  public startSession(additionalData?: Partial<SessionStartEvent>): void {
    const event: SessionStartEvent = {
      event: 'session_start',
      v: '1.0',
      ts: Math.floor(Date.now() / 1000),
      userId: this.config.userId,
      sessionHash: this.sessionHash,
      platform: this.detectPlatform(),
      clientVersion: this.getClientVersion(),
      returningPlayer: this.isReturningPlayer(),
      daysSinceLastSession: this.getDaysSinceLastSession(),
      ...additionalData
    };

    this.trackEvent(event);
    this.updateLastSessionTime();
  }

  /**
   * Track a match result
   */
  public trackMatchResult(matchData: Omit<MatchResultEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash'>): void {
    const event: MatchResultEvent = {
      event: 'match_result',
      v: '1.0',
      ts: Math.floor(Date.now() / 1000),
      userId: this.config.userId,
      sessionHash: this.sessionHash,
      ...matchData
    };

    this.trackEvent(event);
  }

  /**
   * Track club-related events
   */
  public trackClubEvent(action: string, clubId?: string): void {
    const event: ClubEvent = {
      event: 'club_event',
      v: '1.0',
      ts: Math.floor(Date.now() / 1000),
      userId: this.config.userId,
      sessionHash: this.sessionHash,
      clubId: clubId || 'unknown',
      action: action
    };

    this.trackEvent(event);
  }

  /**
   * Track progression grants (XP, unlocks, etc.)
   */
  public trackProgression(grantType: ProgressionGrantEvent['grantType'], amount: number, reason: ProgressionGrantEvent['reason'], additionalData?: Omit<ProgressionGrantEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash' | 'grantType' | 'amount' | 'reason'>): void {
    const event: ProgressionGrantEvent = {
      event: 'progression_grant',
      v: '1.0',
      ts: Math.floor(Date.now() / 1000),
      userId: this.config.userId,
      sessionHash: this.sessionHash,
      grantType: grantType,
      amount: amount,
      reason: reason,
      ...additionalData
    };

    this.trackEvent(event);
  }

  /**
   * Track store impressions
   */
  public trackStoreImpression(section: StoreImpressionEvent['storeSection'], additionalData?: Omit<StoreImpressionEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash' | 'storeSection'>): void {
    const event: StoreImpressionEvent = {
      event: 'store_impression',
      v: '1.0',
      ts: Math.floor(Date.now() / 1000),
      userId: this.config.userId,
      sessionHash: this.sessionHash,
      storeSection: section,
      ...additionalData
    };

    this.trackEvent(event);
  }

  /**
   * Track completed purchases
   */
  public trackPurchase(transactionId: string, totalAmount: number, currency: string, items: PurchaseCompletedEvent['items'], additionalData?: Omit<PurchaseCompletedEvent, 'event' | 'v' | 'ts' | 'userId' | 'sessionHash' | 'transactionId' | 'totalAmount' | 'currency' | 'items'>): void {
    const event: PurchaseCompletedEvent = {
      event: 'purchase_completed',
      v: '1.0',
      ts: Math.floor(Date.now() / 1000),
      userId: this.config.userId,
      sessionHash: this.sessionHash,
      transactionId: transactionId,
      totalAmount: totalAmount,
      currency: currency,
      items: items,
      ...additionalData
    };

    this.trackEvent(event);
  }

  /**
   * Manually flush all queued events
   */
  public flush(): Promise<void> {
    return this.flushEvents();
  }

  /**
   * End session and flush all remaining events
   */
  public endSession(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    return this.flushEvents();
  }

  private trackEvent(event: IRetentionEvent): void {
    if (!this.validateEvent(event)) {
      this.log('Invalid event data:', event);
      return;
    }

    this.eventQueue.push(event);
    this.emit('event_tracked', event);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    const eventsByEndpoint: Record<string, IRetentionEvent[]> = {};
    for (const event of eventsToSend) {
      const endpoint = this.eventEndpoints[event.event];
      if (endpoint) {
        if (!eventsByEndpoint[endpoint]) {
          eventsByEndpoint[endpoint] = [];
        }
        eventsByEndpoint[endpoint].push(event);
      }
    }

    for (const endpoint in eventsByEndpoint) {
      try {
        if (this.isOnline) {
          await this.sendEvents(endpoint, eventsByEndpoint[endpoint]);
          this.log(`Successfully sent ${eventsByEndpoint[endpoint].length} events to ${endpoint}`);
          this.emit('events_sent', { endpoint, events: eventsByEndpoint[endpoint] });
        } else {
          // Store offline for later sending
          eventsByEndpoint[endpoint].forEach(event => this.offlineQueue.enqueue(event));
          this.log(`Stored ${eventsByEndpoint[endpoint].length} events offline for ${endpoint}`);
        }
      } catch (error) {
        this.log(`Failed to send events to ${endpoint}, storing offline:`, error);
        eventsByEndpoint[endpoint].forEach(event => this.offlineQueue.enqueue(event));
        this.emit('events_failed', { endpoint, events: eventsByEndpoint[endpoint], error });
      }
    }
  }

  private async _sendWithRetry(endpoint: string, payload: IRetentionEvent[], retryCount: number = 0): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Client-Version': this.getClientVersion()
        },
        body: JSON.stringify({ events: payload })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._sendWithRetry(endpoint, payload, retryCount + 1);
      }
      throw error;
    }
  }

  private async sendEvents(endpointOrEvents: string | IRetentionEvent[], events?: IRetentionEvent[]): Promise<void> {
    let endpoint: string;
    let payload: IRetentionEvent[];

    if (typeof endpointOrEvents === 'string') {
      endpoint = endpointOrEvents;
      payload = events ?? [];
    } else {
      endpoint = '/analytics/events';
      payload = endpointOrEvents;
    }

    return this._sendWithRetry(endpoint, payload);
  }

  private validateEvent(event: IRetentionEvent): boolean {
    return !!(
      event.event &&
      event.v &&
      event.ts &&
      event.userId &&
      event.sessionHash
    );
  }

  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOfflineEvents();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    }
  }

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushIntervalMs) as unknown as number;
  }

  private async processOfflineEvents(): Promise<void> {
    if (!this.isOnline) return;

    const offlineEvents = this.offlineQueue.dequeueAll();
    if (offlineEvents.length > 0) {
      try {
        // Default to analytics endpoint for offline events
        await this.sendEvents('/analytics/events', offlineEvents);
        this.log(`Successfully sent ${offlineEvents.length} offline events`);
      } catch (error) {
        this.log('Failed to send offline events:', error);
        // Re-queue failed events
        offlineEvents.forEach(event => this.offlineQueue.enqueue(event));
      }
    }
  }

  private detectPlatform(): 'web' | 'mobile' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad/.test(userAgent)) {
      return 'mobile';
    }
    return 'web';
  }

  private getClientVersion(): string {
    // In a real implementation, this would come from your build process
    return '1.0.0';
  }

  private isReturningPlayer(): boolean {
    try {
      return localStorage.getItem('retention_last_session') !== null;
    } catch {
      return false;
    }
  }

  private getDaysSinceLastSession(): number {
    try {
      const lastSession = localStorage.getItem('retention_last_session');
      if (!lastSession) return 0;

      const lastTime = parseInt(lastSession);
      const daysDiff = Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));
      return Math.max(0, daysDiff);
    } catch {
      return 0;
    }
  }

  private updateLastSessionTime(): void {
    try {
      localStorage.setItem('retention_last_session', Date.now().toString());
    } catch {
      // Fail silently
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[RetentionClient] ${message}`, ...args);
    }
  }
}