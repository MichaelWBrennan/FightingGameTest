import { Mastery, Objective, XPGrant } from './progression.types';
export declare class ProgressionService {
    private db;
    constructor();
    getMastery(userId: string): Promise<Mastery[]>;
    grantXP(xpGrant: XPGrant): Promise<Mastery>;
    getObjectives(userId: string): Promise<Objective[]>;
    completeObjective(objectiveId: string): Promise<Objective>;
    prestige(userId: string, characterId: string): Promise<Mastery>;
}
//# sourceMappingURL=progression.service.d.ts.map