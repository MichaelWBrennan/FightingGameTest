import { AnalyticsService } from './analytics.service';
export class AnalyticsController {
    constructor() {
        this.ingestEvents = async (request, reply) => {
            await this.analyticsService.ingestEvents(request.body);
            reply.send({ message: 'Events ingested' });
        };
        this.getExperiment = async (request, reply) => {
            const experiment = await this.analyticsService.getExperiment(request.params.userId, request.params.experimentId);
            reply.send(experiment);
        };
        this.getChurnPrediction = async (_request, reply) => {
            const prediction = await this.analyticsService.getChurnPrediction(_request.params.userId);
            reply.send(prediction);
        };
        this.getCohorts = async (_request, reply) => {
            const cohorts = await this.analyticsService.getCohorts();
            reply.send(cohorts);
        };
        this.getKpiMetrics = async (_request, reply) => {
            const metrics = await this.analyticsService.getKpiMetrics();
            reply.send(metrics);
        };
        this.analyticsService = new AnalyticsService();
    }
}
//# sourceMappingURL=analytics.controller.js.map