import { IdentityService } from './identity.service';
export class IdentityController {
    constructor() {
        Object.defineProperty(this, "identityService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "register", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const user = await this.identityService.register(request.body);
                reply.send(user);
            }
        });
        Object.defineProperty(this, "login", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const token = await this.identityService.login(request.body);
                reply.send(token);
            }
        });
        Object.defineProperty(this, "logout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                await this.identityService.logout(request.headers.authorization);
                reply.send({ message: 'Logged out' });
            }
        });
        Object.defineProperty(this, "getProfile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const user = await this.identityService.getProfile(request.params.userId);
                reply.send(user);
            }
        });
        Object.defineProperty(this, "updateConsent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const consent = await this.identityService.updateConsent(request.body);
                reply.send(consent);
            }
        });
        Object.defineProperty(this, "deleteAccount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                await this.identityService.deleteAccount(request.params.userId);
                reply.send({ message: 'Account deleted' });
            }
        });
        Object.defineProperty(this, "getCommunicationPreferences", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const preferences = await this.identityService.getCommunicationPreferences(request.params.userId);
                reply.send(preferences);
            }
        });
        Object.defineProperty(this, "updateCommunicationPreferences", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const preferences = await this.identityService.updateCommunicationPreferences(request.body);
                reply.send(preferences);
            }
        });
        this.identityService = new IdentityService();
    }
}
//# sourceMappingURL=identity.controller.js.map