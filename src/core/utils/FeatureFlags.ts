export class FeatureFlags {
	private flags = new Map<string, boolean>();

	enable(key: string): void { this.flags.set(key, true); }
	disable(key: string): void { this.flags.set(key, false); }
	set(key: string, value: boolean): void { this.flags.set(key, value); }
	isEnabled(key: string, defaultValue = false): boolean {
		return this.flags.has(key) ? !!this.flags.get(key) : defaultValue;
	}
}