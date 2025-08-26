import { FastifyRequest, FastifyReply } from 'fastify';
export declare class AnalyticsController {
    private analyticsService;
    constructor();
    ingestEvents: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getExperiment: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getChurnPrediction: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getCohorts: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getKpiMetrics: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
//# sourceMappingURL=analytics.controller.d.ts.map