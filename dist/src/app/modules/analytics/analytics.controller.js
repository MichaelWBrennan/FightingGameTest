import { AnalyticsService } from './analytics.service';
export class AnalyticsController {
    constructor() {
        Object.defineProperty(this, "analyticsService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ingestEvents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                await this.analyticsService.ingestEvents(request.body);
                reply.send({ message: 'Events ingested' });
            }
        });
        Object.defineProperty(this, "getExperiment", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const experiment = await this.analyticsService.getExperiment(request.params.userId, request.params.experimentId);
                reply.send(experiment);
            }
        });
        Object.defineProperty(this, "getChurnPrediction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const prediction = await this.analyticsService.getChurnPrediction(request.params.userId);
                reply.send(prediction);
            }
        });
        Object.defineProperty(this, "getCohorts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const cohorts = await this.analyticsService.getCohorts();
                reply.send(cohorts);
            }
        });
        Object.defineProperty(this, "getKpiMetrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const metrics = await this.analyticsService.getKpiMetrics();
                reply.send(metrics);
            }
        });
        this.analyticsService = new AnalyticsService();
    }
}
//# sourceMappingURL=analytics.controller.js.map