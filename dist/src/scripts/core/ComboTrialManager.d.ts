import { ISystem } from '../../../types/core';
import { ComboTrial } from '../../../types/combo';
export declare class ComboTrialManager implements ISystem {
    private app;
    private trials;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private loadTrials;
    getTrialsForCharacter(characterId: string): ComboTrial[];
    startTrial(trialId: string): void;
    update(dt: number): void;
}
