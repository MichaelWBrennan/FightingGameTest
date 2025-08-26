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
import { DatabaseManager } from './database/DatabaseManager';
import { ProgressionEngine } from './services/ProgressionEngine';
import { ObjectiveManager } from './services/ObjectiveManager';
import { RewardManager } from './services/RewardManager';
declare function buildServer(): Promise<import("fastify").FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
declare function start(): Promise<void>;
declare module 'fastify' {
    interface FastifyInstance {
        db: DatabaseManager;
        progressionEngine: ProgressionEngine;
        objectiveManager: ObjectiveManager;
        rewardManager: RewardManager;
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