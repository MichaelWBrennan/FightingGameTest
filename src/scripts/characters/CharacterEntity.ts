import {
    type CharacterData,
    type CharacterState,
    type PlayerId,
    type AttackData,
} from '../../../types/character';

export class CharacterEntity extends pc.Entity {
    public characterData!: CharacterData;
    public playerId!: PlayerId;
    public currentState: CharacterState = 'idle';
    public previousState: CharacterState = 'idle';
    public stateTimer: number = 0;
    public frameCount: number = 0;

    public health!: number;
    public maxHealth!: number;
    public meter: number = 0;
    public maxMeter: number = 100;

    public facing: number = 1;
    public velocity: pc.Vec3 = new pc.Vec3();
    public grounded: boolean = true;

    public hitboxes: pc.Entity[] = [];
    public hurtboxes: pc.Entity[] = [];
    public invulnerable: boolean = false;
    public comboCount: number = 0;
    public comboDamage: number = 0;

    public currentAnimation: string = 'idle';
    public animationFrame: number = 0;
    public animationTimer: number = 0;
    public animationSpeed: number = 1.0;
    public animationFrameCount?: number;
    public animationDuration?: number;
    public animationLoop?: boolean;

    public currentAttackData?: AttackData;
    public hitstunDuration?: number;
    public blockstunDuration?: number;

    public inputPrefix!: string;
    public uiSide!: 'left' | 'right';

    constructor(name: string) {
        super(name);
    }
}
