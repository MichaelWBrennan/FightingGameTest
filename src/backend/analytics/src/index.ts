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

import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { eventRoutes } from './routes/events';
import { experimentRoutes } from './routes/experiments';
import { churnRoutes } from './routes/churn';
import { cohortRoutes } from './routes/cohorts';
import { metricsRoutes } from './routes/metrics';
import { DatabaseManager } from './database/DatabaseManager';
import { ClickHouseManager } from './database/ClickHouseManager';
import { Logger } from './utils/Logger';
import { EventIngestionService } from './services/EventIngestionService';
import { SchemaRegistry } from './services/SchemaRegistry';
import { ExperimentManager } from './services/ExperimentManager';
import { ChurnPredictor } from './services/ChurnPredictor';
import { CohortAnalyzer } from './services/CohortAnalyzer';
import { MetricsAggregator } from './services/MetricsAggregator';
import { ConsentChecker } from './services/ConsentChecker';
import { setupCronJobs } from './jobs/scheduler';

const logger = Logger.getInstance();

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3003'),
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fighting_game_analytics',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  clickhouse: {
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: parseInt(process.env.CLICKHOUSE_PORT || '8123'),
    database: process.env.CLICKHOUSE_DB || 'fighting_game_events',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || ''
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
  kafkaConfig: {
    kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
    enabled: process.env.KAFKA_ENABLED === 'true'
  }
};

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.environment === 'production' ? 'info' : 'debug'
    },
    bodyLimit: 10485760 // 10MB for batch event ingestion
  });

  try {
    // Security middleware
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    });

    // CORS configuration
    await fastify.register(cors, {
      origin: config.environment === 'production' 
        ? ['https://yourgame.com', 'https://api.yourgame.com']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });

    // Rate limiting - higher limits for event ingestion
    await fastify.register(rateLimit, {
      max: 1000, // High limit for event streams
      timeWindow: '1 minute',
      skipOnError: true, // Don't block on rate limiter errors
      errorResponseBuilder: (request, context) => ({
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        date: Date.now(),
        expiresIn: Math.round(context.ttl / 1000)
      })
    });

    // API Documentation
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'Fighting Game Analytics Service',
          description: 'Event ingestion and churn prediction service',
          version: '1.0.0'
        },
        host: 'localhost:3003',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });

    // Initialize databases
    const db = DatabaseManager.getInstance();
    await db.initialize(config.dbConfig);

    const clickhouse = ClickHouseManager.getInstance();
    await clickhouse.initialize(config.clickhouse);

    // Initialize services
    const schemaRegistry = new SchemaRegistry();
    const consentChecker = new ConsentChecker(config.identityServiceUrl);
    const eventIngestion = new EventIngestionService(clickhouse, schemaRegistry, consentChecker);
    const experimentManager = new ExperimentManager(db);
    const churnPredictor = new ChurnPredictor(db, clickhouse);
    const cohortAnalyzer = new CohortAnalyzer(db, clickhouse);
    const metricsAggregator = new MetricsAggregator(clickhouse);

    // Attach services to fastify instance
    fastify.decorate('db', db);
    fastify.decorate('clickhouse', clickhouse);
    fastify.decorate('eventIngestion', eventIngestion);
    fastify.decorate('schemaRegistry', schemaRegistry);
    fastify.decorate('experimentManager', experimentManager);
    fastify.decorate('churnPredictor', churnPredictor);
    fastify.decorate('cohortAnalyzer', cohortAnalyzer);
    fastify.decorate('metricsAggregator', metricsAggregator);
    fastify.decorate('consentChecker', consentChecker);

    // Authentication middleware for protected routes
    fastify.addHook('preHandler', async (request, reply) => {
      // Skip auth for health check, docs, and public metrics
      const publicPaths = ['/health', '/docs', '/metrics/public'];
      if (publicPaths.some(path => request.url.startsWith(path))) {
        return;
      }

      // Events endpoint uses API key auth instead of JWT
      if (request.url.startsWith('/events')) {
        const apiKey = request.headers['x-api-key'] as string;
        if (!apiKey || !isValidApiKey(apiKey)) {
          reply.status(401).send({ error: 'Invalid API key' });
          return;
        }
        return;
      }

      // JWT auth for other endpoints
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send({ error: 'Authentication required' });
        return;
      }

      const token = authHeader.substring(7);
      try {
        // Validate token with identity service
        const response = await fetch(`${config.identityServiceUrl}/auth/validate`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          reply.status(401).send({ error: 'Invalid token' });
          return;
        }

        const user = await response.json();
        request.user = user;

      } catch (error) {
        logger.error('Auth validation failed:', error);
        reply.status(401).send({ error: 'Authentication failed' });
        return;
      }
    });

    // Health check endpoint
    fastify.get('/health', {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  clickhouse: { type: 'string' },
                  eventIngestion: { type: 'string' }
                }
              },
              version: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      const dbStatus = await db.checkHealth();
      const clickhouseStatus = await clickhouse.checkHealth();
      const ingestionStatus = await eventIngestion.checkHealth();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbStatus ? 'connected' : 'disconnected',
          clickhouse: clickhouseStatus ? 'connected' : 'disconnected',
          eventIngestion: ingestionStatus ? 'healthy' : 'unhealthy'
        },
        version: '1.0.0'
      };
    });

    // Register route modules
    await fastify.register(eventRoutes, { prefix: '/events' });
    await fastify.register(experimentRoutes, { prefix: '/experiments' });
    await fastify.register(churnRoutes, { prefix: '/churn' });
    await fastify.register(cohortRoutes, { prefix: '/cohorts' });
    await fastify.register(metricsRoutes, { prefix: '/metrics' });

    // Setup cron jobs for data processing
    setupCronJobs({
      churnPredictor,
      cohortAnalyzer,
      metricsAggregator
    });

    // Global error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      logger.error('Request error:', {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        ip: request.ip
      });

      // Don't leak error details in production
      const message = config.environment === 'production' 
        ? 'Internal server error' 
        : error.message;

      reply.status(error.statusCode || 500).send({
        error: 'Internal Server Error',
        message,
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      try {
        await fastify.close();
        await db.close();
        await clickhouse.close();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return fastify;

  } catch (error) {
    logger.error('Failed to build server:', error);
    throw error;
  }
}

async function start() {
  try {
    const server = await buildServer();
    
    await server.listen({
      port: config.port,
      host: config.host
    });

    logger.info(`Analytics service started on ${config.host}:${config.port}`);
    logger.info(`API documentation available at http://${config.host}:${config.port}/docs`);
    logger.info(`Health check available at http://${config.host}:${config.port}/health`);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function isValidApiKey(apiKey: string): boolean {
  // In production, validate against stored API keys
  const validKeys = process.env.API_KEYS?.split(',') || ['dev-api-key'];
  return validKeys.includes(apiKey);
}

// Extend Fastify types
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

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { buildServer, start };