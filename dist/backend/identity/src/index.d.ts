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
import { DatabaseManager } from './database/DatabaseManager';
import { ConsentManager } from './services/ConsentManager';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
declare function buildServer(): Promise<import("fastify").FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
declare function start(): Promise<void>;
declare module 'fastify' {
    interface FastifyInstance {
        db: DatabaseManager;
        consentManager: ConsentManager;
        authService: AuthService;
        userService: UserService;
    }
}
export { buildServer, start };
