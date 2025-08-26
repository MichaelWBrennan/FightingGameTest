export declare class ClickHouseManager {
    private static instance;
    private constructor();
    static getInstance(): ClickHouseManager;
    initialize(_config: any): Promise<void>;
    checkHealth(): Promise<boolean>;
    close(): Promise<void>;
}
//# sourceMappingURL=ClickHouseManager.d.ts.map