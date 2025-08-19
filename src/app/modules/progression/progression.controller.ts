import { FastifyRequest, FastifyReply } from 'fastify';
import { ProgressionService } from './progression.service';
import { XPGrant } from './progression.types';

export class ProgressionController {
  private progressionService: ProgressionService;

  constructor() {
    this.progressionService = new ProgressionService();
  }

  public getMastery = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const mastery = await this.progressionService.getMastery((request.params as any).userId);
    reply.send(mastery);
  }

  public grantXP = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const mastery = await this.progressionService.grantXP(request.body as XPGrant);
    reply.send(mastery);
  }

  public getObjectives = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const objectives = await this.progressionService.getObjectives((request.params as any).userId);
    reply.send(objectives);
  }

  public completeObjective = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const objective = await this.progressionService.completeObjective((request.body as any).objectiveId);
    reply.send(objective);
  }

  public prestige = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const mastery = await this.progressionService.prestige((request.params as any).userId, (request.body as any).characterId);
    reply.send(mastery);
  }
}
