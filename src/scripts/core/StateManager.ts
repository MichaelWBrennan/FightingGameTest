
/**
 * Modern State Management with Reactive Patterns
 * Replaces old imperative state handling
 */

export type StateListener<T> = (newState: T, oldState: T) => void;
export type StateSelector<T, R> = (state: T) => R;

export class ReactiveState<T> {
  private _state: T;
  private listeners = new Set<StateListener<T>>();
  private selectors = new Map<string, { selector: StateSelector<T, any>, lastValue: any, listeners: Set<Function> }>();

  constructor(initialState: T) {
    this._state = { ...initialState };
  }

  get state(): Readonly<T> {
    return this._state;
  }

  setState(updater: Partial<T> | ((current: T) => Partial<T>)): void {
    const oldState = { ...this._state };
    
    if (typeof updater === 'function') {
      const updates = updater(this._state);
      this._state = { ...this._state, ...updates };
    } else {
      this._state = { ...this._state, ...updater };
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(this._state, oldState);
    }

    // Update selectors
    for (const [key, selectorData] of this.selectors.entries()) {
      const newValue = selectorData.selector(this._state);
      if (newValue !== selectorData.lastValue) {
        selectorData.lastValue = newValue;
        for (const listener of selectorData.listeners) {
          listener(newValue);
        }
      }
    }
  }

  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  select<R>(key: string, selector: StateSelector<T, R>, listener: (value: R) => void): () => void {
    if (!this.selectors.has(key)) {
      this.selectors.set(key, {
        selector,
        lastValue: selector(this._state),
        listeners: new Set()
      });
    }

    const selectorData = this.selectors.get(key)!;
    selectorData.listeners.add(listener);

    // Call immediately with current value
    listener(selectorData.lastValue);

    return () => {
      selectorData.listeners.delete(listener);
      if (selectorData.listeners.size === 0) {
        this.selectors.delete(key);
      }
    };
  }
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

export class GameStateManager {
  private static instance: GameStateManager;
  private state: ReactiveState<GameState>;

  private constructor() {
    this.state = new ReactiveState<GameState>({
      phase: 'menu',
      battle: {
        timeRemaining: 99 * 60,
        round: 1,
        paused: false
      },
      players: {},
      input: {},
      ui: {
        visible: true,
        overlays: [],
        notifications: []
      }
    });

    this.setupStateReactions();
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  getState(): ReactiveState<GameState> {
    return this.state;
  }

  // Modern action dispatchers
  dispatch = {
    setPhase: (phase: GameState['phase']) => {
      this.state.setState({ phase });
    },

    updateBattle: (updates: Partial<GameState['battle']>) => {
      this.state.setState(current => ({
        battle: { ...current.battle, ...updates }
      }));
    },

    updatePlayer: (playerId: string, updates: Partial<GameState['players'][string]>) => {
      this.state.setState(current => ({
        players: {
          ...current.players,
          [playerId]: { ...current.players[playerId], ...updates }
        }
      }));
    },

    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const fullNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };

      this.state.setState(current => ({
        ui: {
          ...current.ui,
          notifications: [...current.ui.notifications, fullNotification]
        }
      }));

      // Auto-remove notification
      setTimeout(() => {
        this.dispatch.removeNotification(fullNotification.id);
      }, notification.duration);
    },

    removeNotification: (id: string) => {
      this.state.setState(current => ({
        ui: {
          ...current.ui,
          notifications: current.ui.notifications.filter(n => n.id !== id)
        }
      }));
    }
  };

  private setupStateReactions(): void {
    // Automatic pause when switching phases
    this.state.select('phase-watcher', state => state.phase, (phase) => {
      if (phase !== 'battle') {
        this.dispatch.updateBattle({ paused: true });
      }
    });

    // Battle timer management
    this.state.select('battle-timer', state => state.battle, (battle) => {
      if (battle.timeRemaining <= 0 && !battle.paused) {
        this.dispatch.setPhase('result');
      }
    });
  }
}
