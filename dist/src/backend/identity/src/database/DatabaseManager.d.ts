export declare class DatabaseManager {
    private static instance;
    private constructor();
    static getInstance(): DatabaseManager;
    initialize(config: any): Promise<void>;
    checkHealth(): Promise<boolean>;
    close(): Promise<void>;
}
//# sourceMappingURL=DatabaseManager.d.ts.map