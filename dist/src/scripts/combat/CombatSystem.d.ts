/**
 * CombatSystem - Fighting game combat engine
 * Handles hit detection, damage calculation, and combat state
 */
import * as pc from 'playcanvas';
import { type ISystem } from '../../../types/core';
export declare class CombatSystem implements ISystem {
    private app;
    private state;
    private comboData;
    private meterData;
    private hitEffects;
    private debug;
    private characterManager;
    constructor(app: pc.Application, characterManager: any);
    private setupEventListeners;
    private onCharacterAttack;
    private onCharacterStateChange;
    parry(character: any): void;
    initialize(): Promise<void>;
    update(dt: number): void;
    destroy(): void;
}
//# sourceMappingURL=CombatSystem.d.ts.map