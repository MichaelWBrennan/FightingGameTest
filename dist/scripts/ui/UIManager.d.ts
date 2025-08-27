/**
 * UIManager - Fighting game UI and HUD management
 * Handles health bars, combo counters, and game state UI
 */
import * as pc from 'playcanvas';
import { ISystem } from '../../../types/core';
declare class UIManager implements ISystem {
    private app;
    private state;
    private uiRoot;
    private announcerText;
    private roundTimerText;
    private roundPipsP1;
    private roundPipsP2;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private createGameUI;
    private createHealthBar;
    private createMeterBar;
    private createRoundPips;
    private createComboDisplay;
    private setupEventListeners;
    private onCombo;
    private sequenceRoundStart;
    private showAnnouncer;
    private hideAnnouncer;
    private setHealth;
    private setMeter;
    private setTimer;
    private setRoundWins;
    update(dt: number): void;
    destroy(): void;
}
export default UIManager;
