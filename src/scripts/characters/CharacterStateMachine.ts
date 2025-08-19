import { CharacterEntity } from './CharacterEntity';
import { CharacterState, CharacterStates } from '../../../types/character';

export class CharacterStateMachine {
  private character: CharacterEntity;
  private states: CharacterStates;

  constructor(character: CharacterEntity, states: CharacterStates) {
    this.character = character;
    this.states = states;
  }

  public setState(newState: CharacterState, force: boolean = false): boolean {
    if (!this.states[newState]) return false;

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

  public update(dt: number): void {
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
