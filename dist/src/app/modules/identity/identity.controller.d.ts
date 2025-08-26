import { FastifyRequest, FastifyReply } from 'fastify';
export declare class IdentityController {
    private identityService;
    constructor();
    register: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    login: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    logout: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getProfile: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    updateConsent: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    deleteAccount: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getCommunicationPreferences: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    updateCommunicationPreferences: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
//# sourceMappingURL=identity.controller.d.ts.map