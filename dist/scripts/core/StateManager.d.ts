/**
 * Modern State Management with Reactive Patterns
 * Replaces old imperative state handling
 */
export type StateListener<T> = (newState: T, oldState: T) => void;
export type StateSelector<T, R> = (state: T) => R;
export declare class ReactiveState<T> {
    private _state;
    private listeners;
    private selectors;
    constructor(initialState: T);
    get state(): Readonly<T>;
    setState(updater: Partial<T> | ((current: T) => Partial<T>)): void;
    subscribe(listener: StateListener<T>): () => void;
    select<R>(key: string, selector: StateSelector<T, R>, listener: (value: R) => void): () => void;
}
export interface GameState {
    phase: 'menu' | 'character_select' | 'battle' | 'result';
    battle: {
        timeRemaining: number;
        round: number;
        paused: boolean;
    };
    players: {
        [playerId: string]: {
            character: string;
            health: number;
            meter: number;
            wins: number;
        };
    };
    input: {
        [playerId: string]: {
            current: InputState;
            buffer: InputBuffer;
        };
    };
    ui: {
        visible: boolean;
        overlays: string[];
        notifications: Notification[];
    };
}
export interface InputState {
    directions: Set<string>;
    buttons: Set<string>;
    timestamp: number;
}
export interface InputBuffer {
    entries: Array<{
        input: string;
        timestamp: number;
        duration: number;
    }>;
    maxSize: number;
}
export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    duration: number;
    timestamp: number;
}
export declare class GameStateManager {
    private static instance;
    private state;
    private constructor();
    static getInstance(): GameStateManager;
    getState(): ReactiveState<GameState>;
    dispatch: {
        setPhase: (phase: GameState["phase"]) => void;
        updateBattle: (updates: Partial<GameState["battle"]>) => void;
        updatePlayer: (playerId: string, updates: Partial<GameState["players"][string]>) => void;
        addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
        removeNotification: (id: string) => void;
    };
    private setupStateReactions;
}
