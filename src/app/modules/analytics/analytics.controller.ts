import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './analytics.types';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  public ingestEvents = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.analyticsService.ingestEvents(request.body as AnalyticsEvent[]);
    reply.send({ message: 'Events ingested' });
  }

  public getExperiment = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const experiment = await this.analyticsService.getExperiment((request.params as any).userId, (request.params as any).experimentId);
    reply.send(experiment);
  }

  public getChurnPrediction = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const prediction = await this.analyticsService.getChurnPrediction((_request.params as any).userId);
    reply.send(prediction);
  }

  public getCohorts = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const cohorts = await this.analyticsService.getCohorts();
    reply.send(cohorts);
  }

  public getKpiMetrics = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const metrics = await this.analyticsService.getKpiMetrics();
    reply.send(metrics);
  }
}
