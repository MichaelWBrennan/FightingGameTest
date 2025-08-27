import { FastifyRequest, FastifyReply } from 'fastify';
export declare class CommerceController {
    private commerceService;
    constructor();
    getCatalog: (_request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    createPayment: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getPaymentStatus: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
