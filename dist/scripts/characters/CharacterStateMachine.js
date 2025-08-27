export class CharacterStateMachine {
    constructor(character, states) {
        this.character = character;
        this.states = states;
    }
    setState(newState, force = false) {
        if (!this.states[newState])
            return false;
        const currentStateData = this.states[this.character.currentState];
        const newStateData = this.states[newState];
        if (!force && newStateData.priority < currentStateData.priority) {
            return false;
        }
        if (!force && !currentStateData.cancellable) {
            return false;
        }
        this.character.previousState = this.character.currentState;
        this.character.currentState = newState;
        this.character.stateTimer = 0;
        // In a real implementation, you would fire an event here
        // this.app.fire('character:statechange', event);
        console.log(`${this.character.name} state: ${this.character.previousState} -> ${newState}`);
        return true;
    }
    update(dt) {
        this.character.stateTimer += dt;
        switch (this.character.currentState) {
            case 'hitstun':
                if (this.character.stateTimer > (this.character.hitstunDuration || 0.2)) {
                    this.setState('idle');
                }
                break;
            case 'blockstun':
                if (this.character.stateTimer > (this.character.blockstunDuration || 0.1)) {
                    this.setState('idle');
                }
                break;
            case 'attacking':
                const attackData = this.character.currentAttackData;
                if (attackData && this.character.stateTimer > (attackData.recovery / 60)) {
                    this.setState('idle');
                }
                break;
        }
    }
}
//# sourceMappingURL=CharacterStateMachine.js.map