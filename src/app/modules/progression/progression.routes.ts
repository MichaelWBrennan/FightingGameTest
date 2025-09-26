import type { FastifyInstance } from 'fastify';
import { ProgressionController } from './progression.controller';

export const progressionRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const progressionController = new ProgressionController();

  fastify.get('/mastery/:userId', progressionController.getMastery);
  fastify.post('/mastery/grant-xp', progressionController.grantXP);
  fastify.get('/objectives/:userId', progressionController.getObjectives);
  fastify.post('/objectives/complete', progressionController.completeObjective);
  fastify.post('/prestige/:userId', progressionController.prestige);
};
