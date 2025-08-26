import { Catalog, Payment } from './commerce.types';
export declare class CommerceService {
    private db;
    constructor();
    getCatalog(): Promise<Catalog>;
    createPayment(userId: string, items: {
        itemId: string;
        quantity: number;
    }[]): Promise<Payment>;
    getPaymentStatus(_transactionId: string): Promise<Payment | null>;
}
//# sourceMappingURL=commerce.service.d.ts.map