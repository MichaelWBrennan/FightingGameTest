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
import { RetentionClient } from '../retention/RetentionClient';
export interface StorefrontConfig {
    retentionClient: RetentionClient;
    apiEndpoint: string;
    currency: string;
    region: string;
    accessibilityMode?: boolean;
    debugMode?: boolean;
}
export interface StoreItem {
    id: string;
    name: string;
    description: string;
    type: 'skin' | 'title' | 'banner' | 'announcer' | 'vfx_palette' | 'stage_variant';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    price: number;
    currency: string;
    taxInclusive: boolean;
    characterId?: string;
    previewAssets: {
        thumbnail?: string;
        preview?: string;
        video?: string;
    };
    availability: {
        permanent: boolean;
        returnWindowDays: number;
        returnDate?: number;
        seasonalEvent?: string;
        unlockConditions?: Array<{
            type: 'account_level' | 'character_mastery' | 'achievement' | 'event_participation';
            value: string;
        }>;
    };
    owned: boolean;
    purchasable: boolean;
}
export interface StoreBundle {
    id: string;
    name: string;
    description: string;
    items: string[];
    pricing: {
        bundlePrice: number;
        individualTotal: number;
        savingsAmount: number;
        savingsPercent: number;
    };
    currency: string;
    taxInclusive: boolean;
    availability: {
        startTime: number;
        endTime: number;
        returnDate?: number;
    };
    previewAssets: {
        thumbnail?: string;
        preview?: string;
    };
    purchasable: boolean;
}
export interface StoreSection {
    id: string;
    name: string;
    items: (StoreItem | StoreBundle)[];
    rotationDays: number;
    lastRotation: number;
}
export interface PurchaseRequest {
    itemId: string;
    paymentMethod: PaymentMethod;
    billingDetails?: {
        name: string;
        email: string;
        address?: {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
    };
}
export interface PurchaseResult {
    success: boolean;
    transactionId?: string;
    error?: string;
    receipt?: {
        items: Array<{
            itemId: string;
            name: string;
            price: number;
        }>;
        totalAmount: number;
        taxAmount: number;
        currency: string;
        timestamp: number;
    };
}
export type PaymentMethod = 'card' | 'paypal' | 'apple_pay' | 'google_pay';
export type StoreFilter = {
    type?: StoreItem['type'];
    rarity?: StoreItem['rarity'];
    character?: string;
    owned?: boolean;
    priceRange?: {
        min: number;
        max: number;
    };
    searchQuery?: string;
};
export declare class Storefront extends EventEmitter {
    private config;
    private catalog;
    private bundles;
    private sections;
    private currentImpression;
    constructor(config: StorefrontConfig);
    /**
     * Load store catalog from server
     */
    loadCatalog(): Promise<void>;
    /**
     * Get items for a specific store section
     */
    getSection(sectionId: string): StoreSection | null;
    /**
     * Get all available store sections
     */
    getSections(): StoreSection[];
    /**
     * Get specific item details
     */
    getItem(itemId: string): StoreItem | null;
    /**
     * Get specific bundle details
     */
    getBundle(bundleId: string): StoreBundle | null;
    /**
     * Filter items based on criteria
     */
    filterItems(filter: StoreFilter): StoreItem[];
    /**
     * Start tracking store impression for analytics
     */
    startStoreImpression(sectionId: string): void;
    /**
     * Track item click for analytics
     */
    trackItemClick(itemId: string): void;
    /**
     * End store impression and send analytics
     */
    endStoreImpression(): void;
    /**
     * Purchase an item or bundle
     */
    purchaseItem(itemId: string, paymentDetails: PurchaseRequest): Promise<PurchaseResult>;
    /**
     * Get transparent pricing breakdown for a bundle
     */
    getBundlePricing(bundleId: string): {
        bundlePrice: number;
        individualPrices: Array<{
            itemId: string;
            name: string;
            price: number;
        }>;
        totalIndividual: number;
        savings: number;
        savingsPercent: number;
    } | null;
    /**
     * Get return window information for an item
     */
    getReturnInfo(itemId: string): {
        permanent: boolean;
        returnWindowDays: number;
        returnDate?: Date;
        description: string;
    } | null;
    /**
     * Check if user meets unlock conditions for an item
     */
    checkUnlockConditions(itemId: string, userProfile: any): {
        unlocked: boolean;
        missingConditions: string[];
    };
    private processCatalogData;
    private isItemPurchasable;
    private isBundlePurchasable;
    private isItemOnSale;
    private getReturnWindowDays;
    private validatePaymentMethod;
    private getAvailablePaymentMethods;
    private trackPurchaseSuccess;
    private updateItemOwnership;
    private isFirstPurchase;
    private getItemType;
    private setupEventListeners;
    private log;
}
