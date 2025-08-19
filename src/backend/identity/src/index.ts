/**
 * Identity Service - Account management and consent
 * 
 * Handles user accounts, authentication, and privacy consent.
 * Built with GDPR/CCPA compliance and opt-in telemetry by design.
 * 
 * Features:
 * - User registration and authentication
 * - Privacy consent management
 * - Communication preferences
 * - Account deletion and data export
 * - Session management
 * 
 * Usage:
 * bun run dev  # Start development server
 * 
 * API Endpoints:
 * POST /auth/register - Create new account
 * POST /auth/login - Authenticate user
 * POST /auth/logout - End session
 * GET /users/profile - Get user profile
 * PUT /users/consent - Update consent preferences
 * DELETE /users/account - Delete account and data
 * 
 * How to extend:
 * - Add OAuth providers in auth/providers/
 * - Extend user schema in models/User.ts
 * - Add new consent types in types/Consent.ts
 */

import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { consentRoutes } from './routes/consent';
import { DatabaseManager } from './database/DatabaseManager';
import { Logger } from './utils/Logger';
import { ConsentManager } from './services/ConsentManager';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';

const logger = Logger.getInstance();

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fighting_game_identity',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
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

    // Rate limiting
    await fastify.register(rateLimit, {
      max: 100,
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
          title: 'Fighting Game Identity Service',
          description: 'Account management and consent service',
          version: '1.0.0'
        },
        host: 'localhost:3001',
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
    const consentManager = new ConsentManager(db);
    const authService = new AuthService(db, config.jwtSecret);
    const userService = new UserService(db, consentManager);

    // Attach services to fastify instance
    fastify.decorate('db', db);
    fastify.decorate('consentManager', consentManager);
    fastify.decorate('authService', authService);
    fastify.decorate('userService', userService);

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
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(userRoutes, { prefix: '/users' });
    await fastify.register(consentRoutes, { prefix: '/consent' });

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

    logger.info(`Identity service started on ${config.host}:${config.port}`);
    logger.info(`API documentation available at http://${config.host}:${config.port}/docs`);
    logger.info(`Health check available at http://${config.host}:${config.port}/health`);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseManager;
    consentManager: ConsentManager;
    authService: AuthService;
    userService: UserService;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { buildServer, start };