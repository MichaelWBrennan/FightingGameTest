import { ProgressionService } from './progression.service';
export class ProgressionController {
    constructor() {
        this.getMastery = async (request, reply) => {
            const mastery = await this.progressionService.getMastery(request.params.userId);
            reply.send(mastery);
        };
        this.grantXP = async (request, reply) => {
            const mastery = await this.progressionService.grantXP(request.body);
            reply.send(mastery);
        };
        this.getObjectives = async (request, reply) => {
            const objectives = await this.progressionService.getObjectives(request.params.userId);
            reply.send(objectives);
        };
        this.completeObjective = async (request, reply) => {
            const objective = await this.progressionService.completeObjective(request.body.objectiveId);
            reply.send(objective);
        };
        this.prestige = async (request, reply) => {
            const mastery = await this.progressionService.prestige(request.params.userId, request.body.characterId);
            reply.send(mastery);
        };
        this.progressionService = new ProgressionService();
    }
}
//# sourceMappingURL=progression.controller.js.map