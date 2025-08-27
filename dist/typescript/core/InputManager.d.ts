import { Direction, InputState, PlayerInputMappings } from '../../../types/input';
export declare class InputManager {
    private inputState;
    private playerMappings;
    constructor();
    private initializeDefaultMappings;
    private setupEventListeners;
    private handleKeyDown;
    private handleKeyUp;
    private getButtonName;
    private updateDirection;
    isButtonPressed(buttonName: string): boolean;
    isButtonJustPressed(buttonName: string): boolean;
    isButtonJustReleased(buttonName: string): boolean;
    getDirection(): Direction;
    getLastDirection(): Direction;
    update(): void;
    getInputState(): InputState;
    setPlayerMapping(player: string, mappings: PlayerInputMappings): void;
}
export declare function isValidDirection(direction: string): direction is Direction;
