import * as pc from 'playcanvas';
export class CharacterEntity extends pc.Entity {
    constructor(name) {
        super(name);
        this.currentState = 'idle';
        this.previousState = 'idle';
        this.stateTimer = 0;
        this.frameCount = 0;
        this.meter = 0;
        this.maxMeter = 100;
        this.facing = 1;
        this.velocity = new pc.Vec3();
        this.grounded = true;
        this.hitboxes = [];
        this.hurtboxes = [];
        this.invulnerable = false;
        this.comboCount = 0;
        this.comboDamage = 0;
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 1.0;
    }
}
//# sourceMappingURL=CharacterEntity.js.map