/**
 * Modern State Management with Reactive Patterns
 * Replaces old imperative state handling
 */
export class ReactiveState {
    constructor(initialState) {
        this.listeners = new Set();
        this.selectors = new Map();
        this._state = { ...initialState };
    }
    get state() {
        return this._state;
    }
    setState(updater) {
        const oldState = { ...this._state };
        if (typeof updater === 'function') {
            const updates = updater(this._state);
            this._state = { ...this._state, ...updates };
        }
        else {
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
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    select(key, selector, listener) {
        if (!this.selectors.has(key)) {
            this.selectors.set(key, {
                selector,
                lastValue: selector(this._state),
                listeners: new Set()
            });
        }
        const selectorData = this.selectors.get(key);
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
export class GameStateManager {
    constructor() {
        // Modern action dispatchers
        this.dispatch = {
            setPhase: (phase) => {
                this.state.setState({ phase });
            },
            updateBattle: (updates) => {
                this.state.setState(current => ({
                    battle: { ...current.battle, ...updates }
                }));
            },
            updatePlayer: (playerId, updates) => {
                this.state.setState(current => ({
                    players: {
                        ...current.players,
                        [playerId]: { ...current.players[playerId], ...updates }
                    }
                }));
            },
            addNotification: (notification) => {
                const fullNotification = {
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
            removeNotification: (id) => {
                this.state.setState(current => ({
                    ui: {
                        ...current.ui,
                        notifications: current.ui.notifications.filter(n => n.id !== id)
                    }
                }));
            }
        };
        this.state = new ReactiveState({
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
    static getInstance() {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }
    getState() {
        return this.state;
    }
    setupStateReactions() {
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
//# sourceMappingURL=StateManager.js.map