import { ProgressionService } from './progression.service';
export class ProgressionController {
    constructor() {
        Object.defineProperty(this, "progressionService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "getMastery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const mastery = await this.progressionService.getMastery(request.params.userId);
                reply.send(mastery);
            }
        });
        Object.defineProperty(this, "grantXP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const mastery = await this.progressionService.grantXP(request.body);
                reply.send(mastery);
            }
        });
        Object.defineProperty(this, "getObjectives", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const objectives = await this.progressionService.getObjectives(request.params.userId);
                reply.send(objectives);
            }
        });
        Object.defineProperty(this, "completeObjective", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const objective = await this.progressionService.completeObjective(request.body.objectiveId);
                reply.send(objective);
            }
        });
        Object.defineProperty(this, "prestige", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (request, reply) => {
                const mastery = await this.progressionService.prestige(request.params.userId, request.body.characterId);
                reply.send(mastery);
            }
        });
        this.progressionService = new ProgressionService();
    }
}
//# sourceMappingURL=progression.controller.js.map