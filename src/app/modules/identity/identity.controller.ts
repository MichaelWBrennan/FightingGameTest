import { FastifyRequest, FastifyReply } from 'fastify';
import { IdentityService } from './identity.service';

export class IdentityController {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  public register = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = await this.identityService.register(request.body as any);
    reply.send(user);
  }

  public login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const token = await this.identityService.login(request.body as any);
    reply.send(token);
  }

  public logout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.identityService.logout(request.headers.authorization as string);
    reply.send({ message: 'Logged out' });
  }

  public getProfile = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = await this.identityService.getProfile((request.params as any).userId);
    reply.send(user);
  }

  public updateConsent = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const consent = await this.identityService.updateConsent(request.body as any);
    reply.send(consent);
  }

  public deleteAccount = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.identityService.deleteAccount((request.params as any).userId);
    reply.send({ message: 'Account deleted' });
  }

  public getCommunicationPreferences = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const preferences = await this.identityService.getCommunicationPreferences((request.params as any).userId);
    reply.send(preferences);
  }

  public updateCommunicationPreferences = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const preferences = await this.identityService.updateCommunicationPreferences(request.body as any);
    reply.send(preferences);
  }
}
