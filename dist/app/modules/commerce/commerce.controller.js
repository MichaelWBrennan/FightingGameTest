import { CommerceService } from './commerce.service';
export class CommerceController {
    constructor() {
        this.getCatalog = async (_request, reply) => {
            const catalog = await this.commerceService.getCatalog();
            reply.send(catalog);
        };
        this.createPayment = async (request, reply) => {
            const payment = await this.commerceService.createPayment(request.body.userId, request.body.items);
            reply.send(payment);
        };
        this.getPaymentStatus = async (request, reply) => {
            const payment = await this.commerceService.getPaymentStatus(request.params.transactionId);
            reply.send(payment);
        };
        this.commerceService = new CommerceService();
    }
}
//# sourceMappingURL=commerce.controller.js.map