export class ClickHouseManager {
  private static instance: ClickHouseManager;

  private constructor() {
    // private constructor for singleton
  }

  public static getInstance(): ClickHouseManager {
    if (!ClickHouseManager.instance) {
      ClickHouseManager.instance = new ClickHouseManager();
    }
    return ClickHouseManager.instance;
  }

  public async initialize(_config: any): Promise<void> {
    // Placeholder
  }

  public async checkHealth(): Promise<boolean> {
    return true;
  }

  public async close(): Promise<void> {
    // Placeholder
  }
}
