import { FastifyRequest, FastifyReply } from 'fastify';
export declare class AnalyticsController {
    private analyticsService;
    constructor();
    ingestEvents: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getExperiment: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getChurnPrediction: (_request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getCohorts: (_request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getKpiMetrics: (_request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
