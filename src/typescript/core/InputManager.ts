// @ts-nocheck

import { type Direction, type InputState, type PlayerInputMappings, type ButtonState } from '../../../types/input';

export class InputManager {
    private inputState: InputState = {
        p1sw_0: 0,
        p1sw_1: 0,
        p2sw_0: 0,
        p2sw_1: 0,
        direction: 'neutral' as Direction,
        lastDirection: 'neutral' as Direction,
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
            this.inputState.direction = 'upBack' as Direction;
        } else if (p1Up && p1Right) {
            this.inputState.direction = 'upForward' as Direction;
        } else if (p1Down && p1Left) {
            this.inputState.direction = 'downBack' as Direction;
        } else if (p1Down && p1Right) {
            this.inputState.direction = 'downForward' as Direction;
        } else if (p1Up) {
            this.inputState.direction = 'up' as Direction;
        } else if (p1Down) {
            this.inputState.direction = 'down' as Direction;
        } else if (p1Left) {
            this.inputState.direction = 'left' as Direction;
        } else if (p1Right) {
            this.inputState.direction = 'right' as Direction;
        } else {
            this.inputState.direction = 'neutral' as Direction;
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
        'neutral','up','down','left','right','upBack','upForward','downBack','downForward'
    ] as unknown as Direction[];
    return validDirections.includes(direction as Direction);
}
