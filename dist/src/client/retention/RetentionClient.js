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
class OfflineEventQueue {
    constructor(storageKey) {
        Object.defineProperty(this, "storageKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        this.storageKey = storageKey;
    }
    enqueue(event) {
        try {
            const queue = this.getQueue();
            queue.push(event);
            // Trim queue if too large
            if (queue.length > this.maxSize) {
                queue.splice(0, queue.length - this.maxSize);
            }
            localStorage.setItem(this.storageKey, JSON.stringify(queue));
        }
        catch (error) {
            // Fail silently if localStorage is unavailable
            console.warn('RetentionClient: Unable to store offline event', error);
        }
    }
    dequeueAll() {
        try {
            const queue = this.getQueue();
            localStorage.setItem(this.storageKey, JSON.stringify([]));
            return queue;
        }
        catch (error) {
            console.warn('RetentionClient: Unable to retrieve offline events', error);
            return [];
        }
    }
    getQueue() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        }
        catch (error) {
            return [];
        }
    }
}
export class RetentionClient extends EventEmitter {
    constructor(config) {
        super();
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionHash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "eventQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "offlineQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "eventEndpoints", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                session_start: '/analytics/events',
                match_result: '/analytics/events',
                progression_grant: '/progression/events',
                store_impression: '/commerce/events',
                purchase_completed: '/commerce/events',
                club_event: '/social/events',
            }
        });
        Object.defineProperty(this, "flushTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "isOnline", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
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
    startSession(additionalData) {
        const event = {
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
    trackMatchResult(matchData) {
        const event = {
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
    trackClubEvent(clubData) {
        const event = {
            event: 'club_event',
            v: '1.0',
            ts: Math.floor(Date.now() / 1000),
            userId: this.config.userId,
            sessionHash: this.sessionHash,
            ...clubData
        };
        this.trackEvent(event);
    }
    /**
     * Track progression grants (XP, unlocks, etc.)
     */
    trackProgression(progressionData) {
        const event = {
            event: 'progression_grant',
            v: '1.0',
            ts: Math.floor(Date.now() / 1000),
            userId: this.config.userId,
            sessionHash: this.sessionHash,
            ...progressionData
        };
        this.trackEvent(event);
    }
    /**
     * Track store impressions
     */
    trackStoreImpression(storeData) {
        const event = {
            event: 'store_impression',
            v: '1.0',
            ts: Math.floor(Date.now() / 1000),
            userId: this.config.userId,
            sessionHash: this.sessionHash,
            ...storeData
        };
        this.trackEvent(event);
    }
    /**
     * Track completed purchases
     */
    trackPurchase(purchaseData) {
        const event = {
            event: 'purchase_completed',
            v: '1.0',
            ts: Math.floor(Date.now() / 1000),
            userId: this.config.userId,
            sessionHash: this.sessionHash,
            ...purchaseData
        };
        this.trackEvent(event);
    }
    /**
     * Manually flush all queued events
     */
    flush() {
        return this.flushEvents();
    }
    /**
     * End session and flush all remaining events
     */
    endSession() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        return this.flushEvents();
    }
    trackEvent(event) {
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
    async flushEvents() {
        if (this.eventQueue.length === 0) {
            return;
        }
        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];
        const eventsByEndpoint = {};
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
                }
                else {
                    // Store offline for later sending
                    eventsByEndpoint[endpoint].forEach(event => this.offlineQueue.enqueue(event));
                    this.log(`Stored ${eventsByEndpoint[endpoint].length} events offline for ${endpoint}`);
                }
            }
            catch (error) {
                this.log(`Failed to send events to ${endpoint}, storing offline:`, error);
                eventsByEndpoint[endpoint].forEach(event => this.offlineQueue.enqueue(event));
                this.emit('events_failed', { endpoint, events: eventsByEndpoint[endpoint], error });
            }
        }
    }
    async _sendWithRetry(endpoint, payload, retryCount = 0) {
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
        }
        catch (error) {
            if (retryCount < this.config.maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return this._sendWithRetry(endpoint, payload, retryCount + 1);
            }
            throw error;
        }
    }
    async sendEvents(endpointOrEvents, events) {
        let endpoint;
        let payload;
        if (typeof endpointOrEvents === 'string') {
            endpoint = endpointOrEvents;
            payload = events ?? [];
        }
        else {
            endpoint = '/analytics/events';
            payload = endpointOrEvents;
        }
        return this._sendWithRetry(endpoint, payload);
    }
    validateEvent(event) {
        return !!(event.event &&
            event.v &&
            event.ts &&
            event.userId &&
            event.sessionHash);
    }
    setupNetworkMonitoring() {
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
    setupFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flushEvents();
        }, this.config.flushIntervalMs);
    }
    async processOfflineEvents() {
        if (!this.isOnline)
            return;
        const offlineEvents = this.offlineQueue.dequeueAll();
        if (offlineEvents.length > 0) {
            try {
                // Default to analytics endpoint for offline events
                await this.sendEvents('/analytics/events', offlineEvents);
                this.log(`Successfully sent ${offlineEvents.length} offline events`);
            }
            catch (error) {
                this.log('Failed to send offline events:', error);
                // Re-queue failed events
                offlineEvents.forEach(event => this.offlineQueue.enqueue(event));
            }
        }
    }
    detectPlatform() {
        if (typeof window === 'undefined')
            return 'desktop';
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad/.test(userAgent)) {
            return 'mobile';
        }
        return 'web';
    }
    getClientVersion() {
        // In a real implementation, this would come from your build process
        return '1.0.0';
    }
    isReturningPlayer() {
        try {
            return localStorage.getItem('retention_last_session') !== null;
        }
        catch {
            return false;
        }
    }
    getDaysSinceLastSession() {
        try {
            const lastSession = localStorage.getItem('retention_last_session');
            if (!lastSession)
                return 0;
            const lastTime = parseInt(lastSession);
            const daysDiff = Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));
            return Math.max(0, daysDiff);
        }
        catch {
            return 0;
        }
    }
    updateLastSessionTime() {
        try {
            localStorage.setItem('retention_last_session', Date.now().toString());
        }
        catch {
            // Fail silently
        }
    }
    log(message, ...args) {
        if (this.config.enableDebugLogging) {
            console.log(`[RetentionClient] ${message}`, ...args);
        }
    }
}
//# sourceMappingURL=RetentionClient.js.map