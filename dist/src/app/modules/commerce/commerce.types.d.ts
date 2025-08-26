export interface CatalogItem {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: 'USD' | 'EUR' | 'JPY';
    tags: string[];
    imageUrl: string;
}
export interface Catalog {
    items: CatalogItem[];
    featuredItems: string[];
}
export interface Payment {
    transactionId: string;
    userId: string;
    items: {
        itemId: string;
        quantity: number;
    }[];
    totalAmount: number;
    currency: 'USD' | 'EUR' | 'JPY';
    paymentProvider: 'stripe' | 'paypal';
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
}
//# sourceMappingURL=commerce.types.d.ts.map