import { CommerceService } from './commerce.service';
export class CommerceController {
    constructor() {
        Object.defineProperty(this, "commerceService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "getCatalog", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (_request, reply) => {
                const catalog = await this.commerceService.getCatalog();
                reply.send(catalog);
            }
        });
        Object.defineProperty(this, "createPayment", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const payment = await this.commerceService.createPayment(request.body.userId, request.body.items);
                reply.send(payment);
            }
        });
        Object.defineProperty(this, "getPaymentStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const payment = await this.commerceService.getPaymentStatus(request.params.transactionId);
                reply.send(payment);
            }
        });
        this.commerceService = new CommerceService();
    }
}
//# sourceMappingURL=commerce.controller.js.map