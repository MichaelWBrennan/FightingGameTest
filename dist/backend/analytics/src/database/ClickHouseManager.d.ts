export declare class ClickHouseManager {
    private static instance;
    private constructor();
    static getInstance(): ClickHouseManager;
    initialize(_config: any): Promise<void>;
    checkHealth(): Promise<boolean>;
    close(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any[]>;
}
