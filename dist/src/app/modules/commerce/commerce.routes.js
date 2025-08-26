import { CommerceController } from './commerce.controller';
export const commerceRoutes = async (fastify) => {
    const commerceController = new CommerceController();
    fastify.get('/catalog', commerceController.getCatalog);
    fastify.post('/payments', commerceController.createPayment);
    fastify.get('/payments/:transactionId', commerceController.getPaymentStatus);
};
//# sourceMappingURL=commerce.routes.js.map