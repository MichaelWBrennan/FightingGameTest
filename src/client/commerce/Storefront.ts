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
    returnDate?: number; // Unix timestamp
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
  items: string[]; // Item IDs
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
  priceRange?: { min: number; max: number };
  searchQuery?: string;
};

export class Storefront extends EventEmitter {
  private config: StorefrontConfig;
  private catalog: Map<string, StoreItem> = new Map();
  private bundles: Map<string, StoreBundle> = new Map();
  private sections: Map<string, StoreSection> = new Map();
  private currentImpression: {
    section: string;
    startTime: number;
    viewedItems: string[];
    clickedItems: string[];
  } | null = null;

  constructor(config: StorefrontConfig) {
    super();
    this.config = config;
    this.setupEventListeners();
  }

  /**
   * Load store catalog from server
   */
  public async loadCatalog(): Promise<void> {
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

    } catch (error) {
      this.log('Failed to load catalog:', error);
      this.emit('catalog_error', error);
      throw error;
    }
  }

  /**
   * Get items for a specific store section
   */
  public getSection(sectionId: string): StoreSection | null {
    return this.sections.get(sectionId) || null;
  }

  /**
   * Get all available store sections
   */
  public getSections(): StoreSection[] {
    return Array.from(this.sections.values());
  }

  /**
   * Get specific item details
   */
  public getItem(itemId: string): StoreItem | null {
    return this.catalog.get(itemId) || null;
  }

  /**
   * Get specific bundle details
   */
  public getBundle(bundleId: string): StoreBundle | null {
    return this.bundles.get(bundleId) || null;
  }

  /**
   * Filter items based on criteria
   */
  public filterItems(filter: StoreFilter): StoreItem[] {
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
      items = items.filter(item => 
        item.price >= filter.priceRange!.min && 
        item.price <= filter.priceRange!.max
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }

  /**
   * Start tracking store impression for analytics
   */
  public startStoreImpression(sectionId: string): void {
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
        this.currentImpression!.viewedItems.push(item.id);
      });
    }
  }

  /**
   * Track item click for analytics
   */
  public trackItemClick(itemId: string): void {
    if (this.currentImpression && !this.currentImpression.clickedItems.includes(itemId)) {
      this.currentImpression.clickedItems.push(itemId);
    }
  }

  /**
   * End store impression and send analytics
   */
  public endStoreImpression(): void {
    if (!this.currentImpression) return;

    const duration = Date.now() - this.currentImpression.startTime;
    const section = this.getSection(this.currentImpression.section);

    if (section) {
      const viewedItems = this.currentImpression.viewedItems
        .map(itemId => {
          const item = this.getItem(itemId) || this.getBundle(itemId);
          if (!item) return null;

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
        storeSection: this.currentImpression.section as any,
        itemsViewed: viewedItems as any,
        viewDurationMs: duration,
        clickedItems: this.currentImpression.clickedItems
      });
    }

    this.currentImpression = null;
  }

  /**
   * Purchase an item or bundle
   */
  public async purchaseItem(itemId: string, paymentDetails: PurchaseRequest): Promise<PurchaseResult> {
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
      } else {
        this.emit('purchase_failed', result);
        return { success: false, error: result.error || 'Purchase failed' };
      }

    } catch (error) {
      this.log('Purchase error:', error);
      const errorResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      this.emit('purchase_failed', errorResult);
      return errorResult;
    }
  }

  /**
   * Get transparent pricing breakdown for a bundle
   */
  public getBundlePricing(bundleId: string): {
    bundlePrice: number;
    individualPrices: Array<{ itemId: string; name: string; price: number }>;
    totalIndividual: number;
    savings: number;
    savingsPercent: number;
  } | null {
    const bundle = this.getBundle(bundleId);
    if (!bundle) return null;

    const individualPrices = bundle.items
      .map(itemId => {
        const item = this.getItem(itemId);
        return item ? {
          itemId,
          name: item.name,
          price: item.price
        } : null;
      })
      .filter(Boolean) as Array<{ itemId: string; name: string; price: number }>;

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
  public getReturnInfo(itemId: string): {
    permanent: boolean;
    returnWindowDays: number;
    returnDate?: Date;
    description: string;
  } | null {
    const item = this.getItem(itemId);
    if (!item) return null;

    const { availability } = item;
    let description: string;

    if (availability.permanent) {
      description = 'This item is permanently available in the store.';
    } else if (availability.returnDate) {
      const returnDate = new Date(availability.returnDate * 1000);
      description = `This item will return to the store on ${returnDate.toLocaleDateString()}.`;
    } else {
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
  public checkUnlockConditions(itemId: string, userProfile: any): {
    unlocked: boolean;
    missingConditions: string[];
  } {
    const item = this.getItem(itemId);
    if (!item || !item.availability.unlockConditions) {
      return { unlocked: true, missingConditions: [] };
    }

    const missingConditions: string[] = [];

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

  private processCatalogData(catalogData: any): void {
    // Process individual items
    if (catalogData.items) {
      catalogData.items.forEach((itemData: any) => {
        const item: StoreItem = {
          ...itemData,
          owned: false, // Will be updated based on user's owned items
          purchasable: this.isItemPurchasable(itemData)
        };
        this.catalog.set(item.id, item);
      });
    }

    // Process bundles
    if (catalogData.bundles) {
      catalogData.bundles.forEach((bundleData: any) => {
        const bundle: StoreBundle = {
          ...bundleData,
          purchasable: this.isBundlePurchasable(bundleData)
        };
        this.bundles.set(bundle.id, bundle);
      });
    }

    // Process store sections
    if (catalogData.sections) {
      catalogData.sections.forEach((sectionData: any) => {
        const section: StoreSection = {
          ...sectionData,
          items: sectionData.items.map((itemId: string) => 
            this.catalog.get(itemId) || this.bundles.get(itemId)
          ).filter(Boolean)
        };
        this.sections.set(section.id, section);
      });
    }
  }

  private isItemPurchasable(item: any): boolean {
    const now = Date.now() / 1000;

    // Check if item is still available
    if (!item.availability.permanent) {
      if (item.availability.endTime && now > item.availability.endTime) {
        return false;
      }
    }

    return true;
  }

  private isBundlePurchasable(bundle: any): boolean {
    const now = Date.now() / 1000;
    return now >= bundle.availability.startTime && now <= bundle.availability.endTime;
  }

  private isItemOnSale(item: StoreItem | StoreBundle): boolean {
    // In this ethical system, sales are transparent and not manipulative
    // This would check for legitimate promotional periods
    return 'pricing' in item && item.pricing.savingsPercent > 0;
  }

  private getReturnWindowDays(item: StoreItem | StoreBundle): number {
    if ('availability' in item && 'returnWindowDays' in item.availability) {
      return item.availability.returnWindowDays;
    }
    if ('availability' in item && 'returnDate' in item.availability && item.availability.returnDate) {
      const daysUntilReturn = Math.ceil((item.availability.returnDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
      return Math.max(0, daysUntilReturn);
    }
    return 0;
  }

  private validatePaymentMethod(method: PaymentMethod): void {
    // Validate payment method is available in region
    const availableMethods = this.getAvailablePaymentMethods();
    if (!availableMethods.includes(method)) {
      throw new Error(`Payment method ${method} not available in ${this.config.region}`);
    }
  }

  private getAvailablePaymentMethods(): PaymentMethod[] {
    // Return available payment methods based on region
    const allMethods: PaymentMethod[] = ['card', 'paypal', 'apple_pay', 'google_pay'];
    return allMethods; // In production, filter by region
  }

  private trackPurchaseSuccess(result: PurchaseResult): void {
    if (!result.receipt) return;

    const isFirstPurchase = this.isFirstPurchase();

    this.config.retentionClient.trackPurchase({
      transactionId: result.transactionId!,
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

  private updateItemOwnership(itemId: string): void {
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

  private isFirstPurchase(): boolean {
    return Array.from(this.catalog.values()).every(item => !item.owned);
  }

  private getItemType(itemId: string): 'skin' | 'title' | 'banner' | 'announcer' | 'vfx_palette' | 'bundle' | 'stage_variant' {
    const item = this.catalog.get(itemId);
    if (item) return item.type;

    const bundle = this.bundles.get(itemId);
    if (bundle) return 'bundle';

    return 'skin'; // Default fallback
  }

  private setupEventListeners(): void {
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

  private log(message: string, ...args: any[]): void {
    if (this.config.debugMode) {
      console.log(`[Storefront] ${message}`, ...args);
    }
  }
}