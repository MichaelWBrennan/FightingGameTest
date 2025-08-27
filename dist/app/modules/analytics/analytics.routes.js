import { AnalyticsController } from './analytics.controller';
export const analyticsRoutes = async (fastify) => {
    const analyticsController = new AnalyticsController();
    fastify.post('/events', analyticsController.ingestEvents);
    fastify.post('/events/stream', analyticsController.ingestEvents); // Using same handler for stream for now
    fastify.get('/experiments/:userId', analyticsController.getExperiment);
    fastify.get('/churn/:userId', analyticsController.getChurnPrediction);
    fastify.get('/cohorts', analyticsController.getCohorts);
    fastify.get('/metrics', analyticsController.getKpiMetrics);
};
//# sourceMappingURL=analytics.routes.js.map