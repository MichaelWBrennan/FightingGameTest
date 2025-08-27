/**
 * DatabaseManager - PostgreSQL connection and query management
 */
import { PoolClient, QueryResult } from 'pg';
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}
export declare class DatabaseManager {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): DatabaseManager;
    initialize(config: DatabaseConfig): Promise<void>;
    query(text: string, params?: any[]): Promise<QueryResult>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    checkHealth(): Promise<boolean>;
    close(): Promise<void>;
}
