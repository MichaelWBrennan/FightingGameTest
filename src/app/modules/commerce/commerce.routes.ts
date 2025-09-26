import type { FastifyInstance } from 'fastify';
import { CommerceController } from './commerce.controller';

export const commerceRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const commerceController = new CommerceController();

  fastify.get('/catalog', commerceController.getCatalog);
  fastify.post('/payments', commerceController.createPayment);
  fastify.get('/payments/:transactionId', commerceController.getPaymentStatus);
};
