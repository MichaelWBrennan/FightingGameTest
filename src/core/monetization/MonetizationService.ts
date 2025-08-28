import { RetentionClient } from '../../client/retention/RetentionClient';
import { Storefront, StorefrontConfig } from '../../client/commerce/Storefront';

export class MonetizationService {
  public retention: RetentionClient;
  public storefront: Storefront;

  constructor(opts?: { retention?: Partial<ConstructorParameters<typeof RetentionClient>[0]>; storefront?: Partial<StorefrontConfig> }) {
    this.retention = new RetentionClient({
      apiEndpoint: opts?.retention?.apiEndpoint || '/api',
      userId: opts?.retention?.userId || 'guest',
      apiKey: opts?.retention?.apiKey || 'public',
      enableDebugLogging: false,
      batchSize: 5,
      flushIntervalMs: 15000
    });

    this.storefront = new Storefront({
      retentionClient: this.retention,
      apiEndpoint: opts?.storefront?.apiEndpoint || '/data',
      currency: opts?.storefront?.currency || 'USD',
      region: opts?.storefront?.region || 'US',
      accessibilityMode: true,
      debugMode: false
    } as any);
  }

  public async initialize(): Promise<void> {
    try {
      this.retention.startSession();
      await this.storefront.loadCatalog().catch(() => undefined);
    } catch {}
  }
}

