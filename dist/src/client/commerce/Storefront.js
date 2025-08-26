/**
 * Storefront - Direct pricing and transparent commerce system
 *
 * Enforces ethical monetization practices:
 * - Direct real currency pricing (no virtual currency abstraction)
 * - Transparent bundle discounts with visible individual prices
 * - Clear return window documentation
 * - No FOMO traps - all items have documented return paths
 * - Accessibility compliant UI
 *
 * Usage:
 * const storefront = new Storefront({
 *   retentionClient,
 *   apiEndpoint: 'https://api.yourgame.com',
 *   currency: 'USD',
 *   region: 'US'
 * });
 *
 * storefront.loadCatalog();
 * storefront.purchaseItem('skin_legendary_fire');
 *
 * How to extend:
 * - Add new item types by extending StoreItem interface
 * - Implement regional pricing by modifying loadCatalog()
 * - Add payment providers by extending PaymentMethod enum
 * - Customize UI by overriding render methods
 */
import { EventEmitter } from 'eventemitter3';
export class Storefront extends EventEmitter {
    constructor(config) {
        super();
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "catalog", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "bundles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "sections", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "currentImpression", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.config = config;
        this.setupEventListeners();
    }
    /**
     * Load store catalog from server
     */
    async loadCatalog() {
        try {
            const response = await fetch(`${this.config.apiEndpoint}/store/catalog`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Region': this.config.region,
                    'X-Currency': this.config.currency
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to load catalog: ${response.statusText}`);
            }
            const catalogData = await response.json();
            this.processCatalogData(catalogData);
            this.emit('catalog_loaded', { itemCount: this.catalog.size, bundleCount: this.bundles.size });
        }
        catch (error) {
            this.log('Failed to load catalog:', error);
            this.emit('catalog_error', error);
            throw error;
        }
    }
    /**
     * Get items for a specific store section
     */
    getSection(sectionId) {
        return this.sections.get(sectionId) || null;
    }
    /**
     * Get all available store sections
     */
    getSections() {
        return Array.from(this.sections.values());
    }
    /**
     * Get specific item details
     */
    getItem(itemId) {
        return this.catalog.get(itemId) || null;
    }
    /**
     * Get specific bundle details
     */
    getBundle(bundleId) {
        return this.bundles.get(bundleId) || null;
    }
    /**
     * Filter items based on criteria
     */
    filterItems(filter) {
        let items = Array.from(this.catalog.values());
        if (filter.type) {
            items = items.filter(item => item.type === filter.type);
        }
        if (filter.rarity) {
            items = items.filter(item => item.rarity === filter.rarity);
        }
        if (filter.character) {
            items = items.filter(item => item.characterId === filter.character);
        }
        if (filter.owned !== undefined) {
            items = items.filter(item => item.owned === filter.owned);
        }
        if (filter.priceRange) {
            items = items.filter(item => item.price >= filter.priceRange.min &&
                item.price <= filter.priceRange.max);
        }
        if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            items = items.filter(item => item.name.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query));
        }
        return items;
    }
    /**
     * Start tracking store impression for analytics
     */
    startStoreImpression(sectionId) {
        // End previous impression if active
        this.endStoreImpression();
        this.currentImpression = {
            section: sectionId,
            startTime: Date.now(),
            viewedItems: [],
            clickedItems: []
        };
        const section = this.getSection(sectionId);
        if (section) {
            // Track visible items
            section.items.forEach(item => {
                this.currentImpression.viewedItems.push(item.id);
            });
        }
    }
    /**
     * Track item click for analytics
     */
    trackItemClick(itemId) {
        if (this.currentImpression && !this.currentImpression.clickedItems.includes(itemId)) {
            this.currentImpression.clickedItems.push(itemId);
        }
    }
    /**
     * End store impression and send analytics
     */
    endStoreImpression() {
        if (!this.currentImpression)
            return;
        const duration = Date.now() - this.currentImpression.startTime;
        const section = this.getSection(this.currentImpression.section);
        if (section) {
            const viewedItems = this.currentImpression.viewedItems
                .map(itemId => {
                const item = this.getItem(itemId) || this.getBundle(itemId);
                if (!item)
                    return null;
                return {
                    itemId,
                    price: 'pricing' in item ? item.pricing.bundlePrice : item.price,
                    currency: item.currency,
                    onSale: this.isItemOnSale(item),
                    returnWindowDays: this.getReturnWindowDays(item)
                };
            })
                .filter(Boolean);
            this.config.retentionClient.trackStoreImpression({
                storeSection: this.currentImpression.section,
                itemsViewed: viewedItems,
                viewDurationMs: duration,
                clickedItems: this.currentImpression.clickedItems
            });
        }
        this.currentImpression = null;
    }
    /**
     * Purchase an item or bundle
     */
    async purchaseItem(itemId, paymentDetails) {
        try {
            const item = this.getItem(itemId) || this.getBundle(itemId);
            if (!item) {
                throw new Error('Item not found');
            }
            if (!item.purchasable) {
                throw new Error('Item is not purchasable');
            }
            // Validate payment method availability
            this.validatePaymentMethod(paymentDetails.paymentMethod);
            // Create purchase request
            const purchasePayload = {
                itemId,
                paymentMethod: paymentDetails.paymentMethod,
                currency: this.config.currency,
                region: this.config.region,
                billingDetails: paymentDetails.billingDetails
            };
            const response = await fetch(`${this.config.apiEndpoint}/store/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Region': this.config.region,
                    'X-Currency': this.config.currency
                },
                body: JSON.stringify(purchasePayload)
            });
            const result = await response.json();
            if (response.ok && result.success) {
                // Track successful purchase
                this.trackPurchaseSuccess(result);
                // Update item ownership
                this.updateItemOwnership(itemId);
                this.emit('purchase_completed', result);
                return result;
            }
            else {
                this.emit('purchase_failed', result);
                return { success: false, error: result.error || 'Purchase failed' };
            }
        }
        catch (error) {
            this.log('Purchase error:', error);
            const errorResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            this.emit('purchase_failed', errorResult);
            return errorResult;
        }
    }
    /**
     * Get transparent pricing breakdown for a bundle
     */
    getBundlePricing(bundleId) {
        const bundle = this.getBundle(bundleId);
        if (!bundle)
            return null;
        const individualPrices = bundle.items
            .map(itemId => {
            const item = this.getItem(itemId);
            return item ? {
                itemId,
                name: item.name,
                price: item.price
            } : null;
        })
            .filter(Boolean);
        return {
            bundlePrice: bundle.pricing.bundlePrice,
            individualPrices,
            totalIndividual: bundle.pricing.individualTotal,
            savings: bundle.pricing.savingsAmount,
            savingsPercent: bundle.pricing.savingsPercent
        };
    }
    /**
     * Get return window information for an item
     */
    getReturnInfo(itemId) {
        const item = this.getItem(itemId);
        if (!item)
            return null;
        const { availability } = item;
        let description;
        if (availability.permanent) {
            description = 'This item is permanently available in the store.';
        }
        else if (availability.returnDate) {
            const returnDate = new Date(availability.returnDate * 1000);
            description = `This item will return to the store on ${returnDate.toLocaleDateString()}.`;
        }
        else {
            description = `This item will return in ${availability.returnWindowDays} days.`;
        }
        return {
            permanent: availability.permanent,
            returnWindowDays: availability.returnWindowDays,
            returnDate: availability.returnDate ? new Date(availability.returnDate * 1000) : undefined,
            description
        };
    }
    /**
     * Check if user meets unlock conditions for an item
     */
    checkUnlockConditions(itemId, userProfile) {
        const item = this.getItem(itemId);
        if (!item || !item.availability.unlockConditions) {
            return { unlocked: true, missingConditions: [] };
        }
        const missingConditions = [];
        item.availability.unlockConditions.forEach(condition => {
            let conditionMet = false;
            switch (condition.type) {
                case 'account_level':
                    conditionMet = userProfile.accountLevel >= parseInt(condition.value);
                    if (!conditionMet) {
                        missingConditions.push(`Reach account level ${condition.value}`);
                    }
                    break;
                case 'character_mastery':
                    const [charId, level] = condition.value.split(':');
                    const charLevel = userProfile.characters?.[charId]?.level || 0;
                    conditionMet = charLevel >= parseInt(level);
                    if (!conditionMet) {
                        missingConditions.push(`Reach level ${level} with ${charId}`);
                    }
                    break;
                case 'achievement':
                    conditionMet = userProfile.achievements?.includes(condition.value);
                    if (!conditionMet) {
                        missingConditions.push(`Complete achievement: ${condition.value}`);
                    }
                    break;
                case 'event_participation':
                    conditionMet = userProfile.eventParticipation?.includes(condition.value);
                    if (!conditionMet) {
                        missingConditions.push(`Participate in event: ${condition.value}`);
                    }
                    break;
            }
        });
        return {
            unlocked: missingConditions.length === 0,
            missingConditions
        };
    }
    processCatalogData(catalogData) {
        // Process individual items
        if (catalogData.items) {
            catalogData.items.forEach((itemData) => {
                const item = {
                    ...itemData,
                    owned: false, // Will be updated based on user's owned items
                    purchasable: this.isItemPurchasable(itemData)
                };
                this.catalog.set(item.id, item);
            });
        }
        // Process bundles
        if (catalogData.bundles) {
            catalogData.bundles.forEach((bundleData) => {
                const bundle = {
                    ...bundleData,
                    purchasable: this.isBundlePurchasable(bundleData)
                };
                this.bundles.set(bundle.id, bundle);
            });
        }
        // Process store sections
        if (catalogData.sections) {
            catalogData.sections.forEach((sectionData) => {
                const section = {
                    ...sectionData,
                    items: sectionData.items.map((itemId) => this.catalog.get(itemId) || this.bundles.get(itemId)).filter(Boolean)
                };
                this.sections.set(section.id, section);
            });
        }
    }
    isItemPurchasable(item) {
        const now = Date.now() / 1000;
        // Check if item is still available
        if (!item.availability.permanent) {
            if (item.availability.endTime && now > item.availability.endTime) {
                return false;
            }
        }
        return true;
    }
    isBundlePurchasable(bundle) {
        const now = Date.now() / 1000;
        return now >= bundle.availability.startTime && now <= bundle.availability.endTime;
    }
    isItemOnSale(item) {
        // In this ethical system, sales are transparent and not manipulative
        // This would check for legitimate promotional periods
        return 'pricing' in item && item.pricing.savingsPercent > 0;
    }
    getReturnWindowDays(item) {
        if ('availability' in item && 'returnWindowDays' in item.availability) {
            return item.availability.returnWindowDays;
        }
        if ('availability' in item && 'returnDate' in item.availability && item.availability.returnDate) {
            const daysUntilReturn = Math.ceil((item.availability.returnDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
            return Math.max(0, daysUntilReturn);
        }
        return 0;
    }
    validatePaymentMethod(method) {
        // Validate payment method is available in region
        const availableMethods = this.getAvailablePaymentMethods();
        if (!availableMethods.includes(method)) {
            throw new Error(`Payment method ${method} not available in ${this.config.region}`);
        }
    }
    getAvailablePaymentMethods() {
        // Return available payment methods based on region
        const allMethods = ['card', 'paypal', 'apple_pay', 'google_pay'];
        return allMethods; // In production, filter by region
    }
    trackPurchaseSuccess(result) {
        if (!result.receipt)
            return;
        const isFirstPurchase = this.isFirstPurchase();
        this.config.retentionClient.trackPurchase({
            transactionId: result.transactionId,
            totalAmount: result.receipt.totalAmount,
            currency: result.receipt.currency,
            items: result.receipt.items.map(item => ({
                itemId: item.itemId,
                itemType: this.getItemType(item.itemId),
                price: item.price,
                quantity: 1
            })),
            taxAmount: result.receipt.taxAmount,
            firstPurchase: isFirstPurchase
        });
    }
    updateItemOwnership(itemId) {
        const item = this.catalog.get(itemId);
        if (item) {
            item.owned = true;
            item.purchasable = false;
            this.catalog.set(itemId, item);
        }
        const bundle = this.bundles.get(itemId);
        if (bundle) {
            // Mark all bundle items as owned
            bundle.items.forEach(bundledItemId => {
                const bundledItem = this.catalog.get(bundledItemId);
                if (bundledItem) {
                    bundledItem.owned = true;
                    bundledItem.purchasable = false;
                    this.catalog.set(bundledItemId, bundledItem);
                }
            });
        }
    }
    isFirstPurchase() {
        return Array.from(this.catalog.values()).every(item => !item.owned);
    }
    getItemType(itemId) {
        const item = this.catalog.get(itemId);
        if (item)
            return item.type;
        const bundle = this.bundles.get(itemId);
        if (bundle)
            return 'bundle';
        return 'skin'; // Default fallback
    }
    setupEventListeners() {
        // Listen for visibility changes to end impressions
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.endStoreImpression();
                }
            });
        }
        // Listen for page unload to end impressions
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.endStoreImpression();
            });
        }
    }
    log(message, ...args) {
        if (this.config.debugMode) {
            console.log(`[Storefront] ${message}`, ...args);
        }
    }
}
//# sourceMappingURL=Storefront.js.map