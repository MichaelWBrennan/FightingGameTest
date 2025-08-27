export declare class EventIngestionService {
    constructor(clickhouse: any, schemaRegistry: any, consentChecker: any);
    checkHealth(): Promise<boolean>;
}
