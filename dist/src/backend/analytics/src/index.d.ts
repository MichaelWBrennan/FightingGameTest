/**
 * Analytics Service - Event ingestion and churn prediction
 *
 * Handles high-throughput event ingestion, schema validation, A/B testing,
 * churn prediction, and cohort analysis. Built with privacy-first design
 * and consent-aware data processing.
 *
 * Features:
 * - Event ingestion (batch/stream)
 * - Schema registry and validation
 * - A/B test assignment and tracking
 * - Churn prediction models
 * - Cohort analysis and segmentation
 * - KPI dashboard data generation
 * - Privacy-compliant data processing
 *
 * Usage:
 * bun run dev  # Start development server
 *
 * API Endpoints:
 * POST /events - Ingest events (batch)
 * POST /events/stream - Ingest events (stream)
 * GET /experiments/:userId - Get A/B assignments
 * GET /churn/:userId - Get churn risk score
 * GET /cohorts - Get cohort definitions
 * GET /metrics - Get KPI dashboard data
 *
 * How to extend:
 * - Add new event schemas in schemas/events/
 * - Extend churn models in services/ChurnPredictor
 * - Add new experiments in services/ExperimentManager
 * - Customize cohort definitions in services/CohortAnalyzer
 */
import { DatabaseManager } from './database/DatabaseManager';
import { ClickHouseManager } from './database/ClickHouseManager';
import { EventIngestionService } from './services/EventIngestionService';
import { SchemaRegistry } from './services/SchemaRegistry';
import { ExperimentManager } from './services/ExperimentManager';
import { ChurnPredictor } from './services/ChurnPredictor';
import { CohortAnalyzer } from './services/CohortAnalyzer';
import { MetricsAggregator } from './services/MetricsAggregator';
import { ConsentChecker } from './services/ConsentChecker';
declare function buildServer(): Promise<import("fastify").FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
declare function start(): Promise<void>;
declare module 'fastify' {
    interface FastifyInstance {
        db: DatabaseManager;
        clickhouse: ClickHouseManager;
        eventIngestion: EventIngestionService;
        schemaRegistry: SchemaRegistry;
        experimentManager: ExperimentManager;
        churnPredictor: ChurnPredictor;
        cohortAnalyzer: CohortAnalyzer;
        metricsAggregator: MetricsAggregator;
        consentChecker: ConsentChecker;
    }
    interface FastifyRequest {
        user?: {
            id: string;
            username: string;
            email: string;
        };
    }
}
export { buildServer, start };
//# sourceMappingURL=index.d.ts.map