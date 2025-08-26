
import { Direction, InputState, PlayerInputMappings, ButtonState } from '../../../types/input';

export class InputManager {
    private inputState: InputState = {
        p1sw_0: 0,
        p1sw_1: 0,
        p2sw_0: 0,
        p2sw_1: 0,
        direction: Direction.NEUTRAL,
        lastDirection: Direction.NEUTRAL,
        buttons: new Map<string, ButtonState>(),
        buttonPressed: new Map<string, boolean>(),
        buttonReleased: new Map<string, boolean>()
    };

    private playerMappings: Map<string, PlayerInputMappings> = new Map();
    
    constructor() {
        this.initializeDefaultMappings();
        this.setupEventListeners();
    }

    private initializeDefaultMappings(): void {
        const player1Mappings: PlayerInputMappings = {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            lightPunch: 'KeyZ',
            mediumPunch: 'KeyX',
            heavyPunch: 'KeyC',
            lightKick: 'KeyA',
            mediumKick: 'KeyS',
            heavyKick: 'KeyD',
            start: 'Enter',
            select: 'Space'
        };

        const player2Mappings: PlayerInputMappings = {
            up: 'Numpad8',
            down: 'Numpad2',
            left: 'Numpad4',
            right: 'Numpad6',
            lightPunch: 'KeyU',
            mediumPunch: 'KeyI',
            heavyPunch: 'KeyO',
            lightKick: 'KeyJ',
            mediumKick: 'KeyK',
            heavyKick: 'KeyL',
            start: 'NumpadEnter',
            select: 'Numpad0'
        };

        this.playerMappings.set('player1', player1Mappings);
        this.playerMappings.set('player2', player2Mappings);
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const buttonName = this.getButtonName(event.code);
        if (buttonName) {
            const wasPressed = this.inputState.buttons.get(buttonName)?.pressed || false;
            
            this.inputState.buttons.set(buttonName, {
                pressed: true,
                justPressed: !wasPressed,
                justReleased: false
            });

            this.updateDirection();
            event.preventDefault();
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        const buttonName = this.getButtonName(event.code);
        if (buttonName) {
            this.inputState.buttons.set(buttonName, {
                pressed: false,
                justPressed: false,
                justReleased: true
            });

            this.updateDirection();
            event.preventDefault();
        }
    }

    private getButtonName(code: string): string | null {
        for (const [player, mappings] of this.playerMappings) {
            for (const [buttonName, keyCode] of Object.entries(mappings)) {
                if (keyCode === code) {
                    return `${player}_${buttonName}`;
                }
            }
        }
        return null;
    }

    private updateDirection(): void {
        this.inputState.lastDirection = this.inputState.direction;
        
        const p1Up = this.isButtonPressed('player1_up');
        const p1Down = this.isButtonPressed('player1_down');
        const p1Left = this.isButtonPressed('player1_left');
        const p1Right = this.isButtonPressed('player1_right');

        if (p1Up && p1Left) {
            this.inputState.direction = Direction.UP_LEFT;
        } else if (p1Up && p1Right) {
            this.inputState.direction = Direction.UP_RIGHT;
        } else if (p1Down && p1Left) {
            this.inputState.direction = Direction.DOWN_LEFT;
        } else if (p1Down && p1Right) {
            this.inputState.direction = Direction.DOWN_RIGHT;
        } else if (p1Up) {
            this.inputState.direction = Direction.UP;
        } else if (p1Down) {
            this.inputState.direction = Direction.DOWN;
        } else if (p1Left) {
            this.inputState.direction = Direction.LEFT;
        } else if (p1Right) {
            this.inputState.direction = Direction.RIGHT;
        } else {
            this.inputState.direction = Direction.NEUTRAL;
        }
    }

    public isButtonPressed(buttonName: string): boolean {
        return this.inputState.buttons.get(buttonName)?.pressed || false;
    }

    public isButtonJustPressed(buttonName: string): boolean {
        return this.inputState.buttons.get(buttonName)?.justPressed || false;
    }

    public isButtonJustReleased(buttonName: string): boolean {
        return this.inputState.buttons.get(buttonName)?.justReleased || false;
    }

    public getDirection(): Direction {
        return this.inputState.direction;
    }

    public getLastDirection(): Direction {
        return this.inputState.lastDirection;
    }

    public update(): void {
        // Reset just pressed/released flags after frame
        for (const [key, buttonState] of this.inputState.buttons) {
            buttonState.justPressed = false;
            buttonState.justReleased = false;
        }
    }

    public getInputState(): InputState {
        return { ...this.inputState };
    }

    public setPlayerMapping(player: string, mappings: PlayerInputMappings): void {
        this.playerMappings.set(player, mappings);
    }
}

export function isValidDirection(direction: string): direction is Direction {
    const validDirections: Direction[] = [
        Direction.NEUTRAL, Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT,
        Direction.UP_LEFT, Direction.UP_RIGHT, Direction.DOWN_LEFT, Direction.DOWN_RIGHT
    ];
    return validDirections.includes(direction as Direction);
}
