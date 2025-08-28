export class ServiceContainer {
	private services = new Map<string, unknown>();

	register<T>(key: string, instance: T): void {
		this.services.set(key, instance as unknown);
	}

	resolve<T>(key: string): T {
		if (!this.services.has(key)) {
			throw new Error(`Service not registered: ${key}`);
		}
		return this.services.get(key) as T;
	}

	has(key: string): boolean {
		return this.services.has(key);
	}

	clear(): void {
		this.services.clear();
	}
}