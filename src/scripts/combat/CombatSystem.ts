/**
 * CombatSystem - Fighting game combat engine
 * Handles hit detection, damage calculation, and combat state
 */

import * as pc from 'playcanvas';
import { type ISystem, type Character, type AttackData } from '../../../types/core';
import {
    type HitData,
    type ComboData,
    type MeterData,
    type CombatEvent,
    type HitEffect,
    type BlockData,
    DEFAULT_COMBAT_STATE,
    DEFAULT_COMBO_DATA,
    DEFAULT_METER_DATA
} from '../../../types/combat';
type CombatState = ReturnType<typeof createCombatState>;
function createCombatState() {
    return { ...DEFAULT_COMBAT_STATE } as any;
}

export class CombatSystem implements ISystem {
    private app: pc.Application;
    private state: CombatState;
    private comboData: ComboData;
    private meterData: MeterData;
    private hitEffects: Map<string, HitEffect>;
    private debug: boolean = false;

    private characterManager: any; // Use a more specific type

    constructor(app: pc.Application, characterManager: any) {
        this.app = app;
        this.characterManager = characterManager;
        this.state = createCombatState();
        this.comboData = { ...DEFAULT_COMBO_DATA };
        this.meterData = { ...DEFAULT_METER_DATA };
        this.hitEffects = new Map();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.app.on('character:attack', this.onCharacterAttack.bind(this));
        this.app.on('character:statechange', this.onCharacterStateChange.bind(this));
    }

    private onCharacterAttack(data: CombatEvent): void {
        const attacker = data.character;
        const opponent = this.characterManager.getOpponent(attacker);

        if (opponent && opponent.currentState === 'parrying') {
            // Parry success
            this.characterManager.setCharacterState(attacker, 'hitstun', true); // Force attacker into hitstun
            this.characterManager.setCharacterState(opponent, 'idle', true); // Return parrier to idle

            // Apply frame advantage to parrier (e.g., by setting a timer on the attacker)
            setTimeout(() => {
                if (attacker.currentState === 'hitstun') {
                    this.characterManager.setCharacterState(attacker, 'idle');
                }
            }, 200); // 200ms of stun for the attacker

            this.app.fire('combat:parry', { parrier: opponent, attacker: attacker });
            console.log(`${opponent.name} parried ${attacker.name}'s attack!`);
        } else {
            // Handle normal attack logic
            console.log(`Attack: ${data.character.name} -> ${data.attackType}`);

            // Fire frame data event for training mode
            if (this.debug) {
                this.app.fire('debug:framedata', {
                    moveName: data.attackType,
                    startup: data.attackData.startup,
                    active: data.attackData.active,
                    recovery: data.attackData.recovery,
                    onBlock: data.attackData.blockAdvantage,
                    onHit: data.attackData.hitAdvantage,
                });
            }
        }
    }

    private onCharacterStateChange(data: any): void {
        // Handle state change events
        console.log(`State change: ${data.character.name} ${data.oldState} -> ${data.newState}`);
    }

    public parry(character: any): void {
        if (this.characterManager.setCharacterState(character, 'parrying')) {
            // Set a timer to end the parry state
            setTimeout(() => {
                if (character.currentState === 'parrying') {
                    this.characterManager.setCharacterState(character, 'idle');
                }
            }, 100); // 100ms parry window
        }
    }

    public async initialize(): Promise<void> {
        console.log('Initializing Combat System...');
        // Initialize combat system
        console.log('Combat System initialized successfully');
    }

    public update(dt: number): void {
        // Update combat system
    }

    public destroy(): void {
        // Clean up combat system
        console.log('CombatSystem destroyed');
    }
}