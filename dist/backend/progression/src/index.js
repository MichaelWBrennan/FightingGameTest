/**
 * Progression Service - Mastery tracking and objectives
 *
 * Handles server-side progression state, objective assignment, XP grants,
 * and cosmetic reward validation. All operations are idempotent and
 * maintain competitive integrity (no power advantages from purchases).
 *
 * Features:
 * - Account and character mastery tracking
 * - Daily/weekly objective assignment
 * - XP grant validation and level calculation
 * - Prestige system management
 * - Cosmetic unlock tracking
 *
 * Usage:
 * bun run dev  # Start development server
 *
 * API Endpoints:
 * GET /mastery/:userId - Get user's mastery state
 * POST /mastery/grant-xp - Grant XP with validation
 * GET /objectives/:userId - Get user's active objectives
 * POST /objectives/complete - Complete objective
 * POST /prestige/:userId - Trigger prestige
 *
 * How to extend:
 * - Add new XP sources in XPGrantRequest schema
 * - Extend objective types in ObjectiveType enum
 * - Add new reward types in RewardType enum
 * - Customize XP calculations in ProgressionEngine
 */
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { masteryRoutes } from './routes/mastery';
import { objectiveRoutes } from './routes/objectives';
import { rewardRoutes } from './routes/rewards';
import { DatabaseManager } from './database/DatabaseManager';
import { Logger } from './utils/Logger';
import { ProgressionEngine } from './services/ProgressionEngine';
import { ObjectiveManager } from './services/ObjectiveManager';
import { RewardManager } from './services/RewardManager';
const logger = Logger.getInstance();
// Environment configuration
const config = {
    port: parseInt(process.env.PORT || '3002'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'fighting_game_progression',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    },
    identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001'
};
async function buildServer() {
    const fastify = Fastify({
        logger: {
            level: config.environment === 'production' ? 'info' : 'debug'
        }
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
        // Rate limiting with higher limits for progression events
        await fastify.register(rateLimit, {
            max: 500, // Higher limit for game events
            timeWindow: '1 minute',
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
                    title: 'Fighting Game Progression Service',
                    description: 'Mastery tracking and objectives service',
                    version: '1.0.0'
                },
                host: 'localhost:3002',
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
        // Initialize database
        const db = DatabaseManager.getInstance();
        await db.initialize(config.dbConfig);
        // Initialize services
        const progressionEngine = new ProgressionEngine(db);
        const objectiveManager = new ObjectiveManager(db);
        const rewardManager = new RewardManager(db);
        // Attach services to fastify instance
        fastify.decorate('db', db);
        fastify.decorate('progressionEngine', progressionEngine);
        fastify.decorate('objectiveManager', objectiveManager);
        fastify.decorate('rewardManager', rewardManager);
        // Authentication middleware
        fastify.addHook('preHandler', async (request, reply) => {
            // Skip auth for health check and docs
            if (request.url === '/health' || request.url.startsWith('/docs')) {
                return;
            }
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
            }
            catch (error) {
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
                            database: { type: 'string' },
                            version: { type: 'string' }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            const dbStatus = await db.checkHealth();
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: dbStatus ? 'connected' : 'disconnected',
                version: '1.0.0'
            };
        });
        // Register route modules
        await fastify.register(masteryRoutes, { prefix: '/mastery' });
        await fastify.register(objectiveRoutes, { prefix: '/objectives' });
        await fastify.register(rewardRoutes, { prefix: '/rewards' });
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
        const gracefulShutdown = async (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully`);
            try {
                await fastify.close();
                await db.close();
                logger.info('Server closed successfully');
                process.exit(0);
            }
            catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return fastify;
    }
    catch (error) {
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
        logger.info(`Progression service started on ${config.host}:${config.port}`);
        logger.info(`API documentation available at http://${config.host}:${config.port}/docs`);
        logger.info(`Health check available at http://${config.host}:${config.port}/health`);
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start server if this file is run directly
if (require.main === module) {
    start();
}
export { buildServer, start };
//# sourceMappingURL=index.js.map