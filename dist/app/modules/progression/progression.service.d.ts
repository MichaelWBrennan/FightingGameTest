import { Mastery, Objective, XPGrant } from './progression.types';
export declare class ProgressionService {
    private _db;
    constructor();
    getMastery(_userId: string): Promise<Mastery[]>;
    grantXP(xpGrant: XPGrant): Promise<Mastery>;
    getObjectives(_userId: string): Promise<Objective[]>;
    completeObjective(objectiveId: string): Promise<Objective>;
    prestige(_userId: string, _characterId: string): Promise<Mastery>;
}
