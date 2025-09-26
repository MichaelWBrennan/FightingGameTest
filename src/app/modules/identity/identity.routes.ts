import type { FastifyInstance } from 'fastify';
import { IdentityController } from './identity.controller';

export const identityRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const identityController = new IdentityController();

  fastify.post('/register', identityController.register);
  fastify.post('/login', identityController.login);
  fastify.post('/logout', identityController.logout);
  fastify.get('/profile/:userId', identityController.getProfile);
  fastify.put('/consent', identityController.updateConsent);
  fastify.delete('/account/:userId', identityController.deleteAccount);
  fastify.get('/preferences/:userId', identityController.getCommunicationPreferences);
  fastify.put('/preferences', identityController.updateCommunicationPreferences);
};