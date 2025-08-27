import { FastifyRequest, FastifyReply } from 'fastify';
export declare class ProgressionController {
    private progressionService;
    constructor();
    getMastery: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    grantXP: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getObjectives: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    completeObjective: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    prestige: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
