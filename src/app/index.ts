import Fastify from 'fastify';
import { identityRoutes } from './modules/identity/identity.routes';
import { progressionRoutes } from './modules/progression/progression.routes';
import { commerceRoutes } from './modules/commerce/commerce.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';

const server = Fastify({
  logger: true
});

server.get('/health', async (_request, _reply) => {
  return { status: 'ok' };
});

server.register(identityRoutes, { prefix: '/identity' });
server.register(progressionRoutes, { prefix: '/progression' });
server.register(commerceRoutes, { prefix: '/commerce' });
server.register(analyticsRoutes, { prefix: '/analytics' });

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
