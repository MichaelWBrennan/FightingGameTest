/**
 * AuthService - Authentication and authorization
 *
 * Handles user authentication, JWT token management, and session security.
 * Implements secure password hashing and token validation.
 */
import { DatabaseManager } from '../database/DatabaseManager';
import { User, CreateUserData, LoginCredentials } from '../types/User';
import { AuthToken } from '../types/Auth';
export declare class AuthService {
    private db;
    private jwtSecret;
    private saltRounds;
    private tokenExpiry;
    private refreshTokenExpiry;
    constructor(db: DatabaseManager, jwtSecret: string);
    /**
     * Register a new user account
     */
    register(userData: CreateUserData): Promise<{
        user: User;
        tokens: AuthToken;
    }>;
    /**
     * Authenticate user login
     */
    login(credentials: LoginCredentials): Promise<{
        user: User;
        tokens: AuthToken;
    }>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string): Promise<AuthToken>;
    /**
     * Validate access token
     */
    validateToken(token: string): Promise<User | null>;
    /**
     * Logout user (invalidate tokens)
     */
    logout(userId: string): Promise<void>;
    /**
     * Change user password
     */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Request password reset
     */
    requestPasswordReset(email: string): Promise<void>;
    /**
     * Reset password using reset token
     */
    resetPassword(resetToken: string, newPassword: string): Promise<void>;
    private generateTokens;
    private getUserById;
    private getUserByEmail;
    private getUserByUsername;
    private updateLastLogin;
}
