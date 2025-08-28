export type EventHandler<T = any> = (payload: T) => void;

export class EventBus {
	private handlers: Map<string, Set<EventHandler>> = new Map();

	on<T = any>(event: string, handler: EventHandler<T>): void {
		if (!this.handlers.has(event)) this.handlers.set(event, new Set());
		this.handlers.get(event)!.add(handler as EventHandler);
	}

	off<T = any>(event: string, handler: EventHandler<T>): void {
		this.handlers.get(event)?.delete(handler as EventHandler);
	}

	emit<T = any>(event: string, payload: T): void {
		this.handlers.get(event)?.forEach(h => h(payload));
	}

	clear(): void {
		this.handlers.clear();
	}
}