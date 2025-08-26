export class ClickHouseManager {
    constructor() {
        // private constructor for singleton
    }
    static getInstance() {
        if (!ClickHouseManager.instance) {
            ClickHouseManager.instance = new ClickHouseManager();
        }
        return ClickHouseManager.instance;
    }
    async initialize(_config) {
        // Placeholder
    }
    async checkHealth() {
        return true;
    }
    async close() {
        // Placeholder
    }
}
//# sourceMappingURL=ClickHouseManager.js.map