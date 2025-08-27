import { IdentityService } from './identity.service';
export class IdentityController {
    constructor() {
        this.register = async (request, reply) => {
            const user = await this.identityService.register(request.body);
            reply.send(user);
        };
        this.login = async (request, reply) => {
            const token = await this.identityService.login(request.body);
            reply.send(token);
        };
        this.logout = async (request, reply) => {
            await this.identityService.logout(request.headers.authorization);
            reply.send({ message: 'Logged out' });
        };
        this.getProfile = async (request, reply) => {
            const user = await this.identityService.getProfile(request.params.userId);
            reply.send(user);
        };
        this.updateConsent = async (request, reply) => {
            const consent = await this.identityService.updateConsent(request.body);
            reply.send(consent);
        };
        this.deleteAccount = async (request, reply) => {
            await this.identityService.deleteAccount(request.params.userId);
            reply.send({ message: 'Account deleted' });
        };
        this.getCommunicationPreferences = async (request, reply) => {
            const preferences = await this.identityService.getCommunicationPreferences(request.params.userId);
            reply.send(preferences);
        };
        this.updateCommunicationPreferences = async (request, reply) => {
            const preferences = await this.identityService.updateCommunicationPreferences(request.body);
            reply.send(preferences);
        };
        this.identityService = new IdentityService();
    }
}
//# sourceMappingURL=identity.controller.js.map