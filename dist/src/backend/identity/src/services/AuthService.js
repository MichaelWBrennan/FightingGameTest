/**
 * AuthService - Authentication and authorization
 *
 * Handles user authentication, JWT token management, and session security.
 * Implements secure password hashing and token validation.
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/Logger';
const logger = Logger.getInstance();
export class AuthService {
    constructor(db, jwtSecret) {
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "jwtSecret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "saltRounds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 12
        });
        Object.defineProperty(this, "tokenExpiry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '24h'
        });
        Object.defineProperty(this, "refreshTokenExpiry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '7d'
        });
        this.db = db;
        this.jwtSecret = jwtSecret;
    }
    /**
     * Register a new user account
     */
    async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await this.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('User already exists with this email');
            }
            // Check username availability
            const existingUsername = await this.getUserByUsername(userData.username);
            if (existingUsername) {
                throw new Error('Username is already taken');
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
            // Create user record
            const userId = await this.db.query(`INSERT INTO users (
          username, email, password_hash, display_name, 
          created_at, updated_at, email_verified, status
        ) VALUES ($1, $2, $3, $4, NOW(), NOW(), false, 'active') 
        RETURNING id`, [userData.username, userData.email, hashedPassword, userData.displayName || userData.username]);
            const user = await this.getUserById(userId.rows[0].id);
            if (!user) {
                throw new Error('Failed to create user');
            }
            // Generate tokens
            const tokens = await this.generateTokens(user);
            // Log registration
            logger.info('User registered successfully', {
                userId: user.id,
                username: user.username,
                email: user.email
            });
            return { user, tokens };
        }
        catch (error) {
            logger.error('Registration failed:', error);
            throw error;
        }
    }
    /**
     * Authenticate user login
     */
    async login(credentials) {
        try {
            // Get user by email or username
            const user = credentials.email
                ? await this.getUserByEmail(credentials.email)
                : await this.getUserByUsername(credentials.username);
            if (!user) {
                throw new Error('Invalid credentials');
            }
            // Check if account is active
            if (user.status !== 'active') {
                throw new Error('Account is not active');
            }
            // Verify password
            const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }
            // Update last login
            await this.updateLastLogin(user.id);
            // Generate tokens
            const tokens = await this.generateTokens(user);
            logger.info('User logged in successfully', {
                userId: user.id,
                username: user.username
            });
            return { user, tokens };
        }
        catch (error) {
            logger.error('Login failed:', error);
            throw error;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const payload = jwt.verify(refreshToken, this.jwtSecret);
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            // Get user
            const user = await this.getUserById(payload.userId);
            if (!user || user.status !== 'active') {
                throw new Error('User not found or inactive');
            }
            // Generate new tokens
            return await this.generateTokens(user);
        }
        catch (error) {
            logger.error('Token refresh failed:', error);
            throw error;
        }
    }
    /**
     * Validate access token
     */
    async validateToken(token) {
        try {
            const payload = jwt.verify(token, this.jwtSecret);
            if (payload.type !== 'access') {
                return null;
            }
            const user = await this.getUserById(payload.userId);
            return user && user.status === 'active' ? user : null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Logout user (invalidate tokens)
     */
    async logout(userId) {
        try {
            // In a more complex implementation, we would maintain a token blacklist
            // For now, we just log the logout event
            logger.info('User logged out', { userId });
        }
        catch (error) {
            logger.error('Logout failed:', error);
            throw error;
        }
    }
    /**
     * Change user password
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
            // Update password
            await this.db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
            logger.info('Password changed successfully', { userId });
        }
        catch (error) {
            logger.error('Password change failed:', error);
            throw error;
        }
    }
    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                // Don't reveal if email exists or not
                logger.info('Password reset requested for non-existent email', { email });
                return;
            }
            // Generate reset token
            const resetToken = jwt.sign({ userId: user.id, type: 'password_reset' }, this.jwtSecret, { expiresIn: '1h' });
            // Store reset token (in production, this would be stored in database)
            // For now, just log it
            logger.info('Password reset token generated', {
                userId: user.id,
                email: user.email,
                resetToken // In production, don't log the actual token
            });
            // In production, send email with reset link containing the token
        }
        catch (error) {
            logger.error('Password reset request failed:', error);
            throw error;
        }
    }
    /**
     * Reset password using reset token
     */
    async resetPassword(resetToken, newPassword) {
        try {
            // Verify reset token
            const payload = jwt.verify(resetToken, this.jwtSecret);
            if (payload.type !== 'password_reset') {
                throw new Error('Invalid token type');
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
            // Update password
            await this.db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, payload.userId]);
            logger.info('Password reset completed', { userId: payload.userId });
        }
        catch (error) {
            logger.error('Password reset failed:', error);
            throw error;
        }
    }
    async generateTokens(user) {
        const accessTokenPayload = {
            userId: user.id,
            username: user.username,
            type: 'access'
        };
        const refreshTokenPayload = {
            userId: user.id,
            username: user.username,
            type: 'refresh'
        };
        const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, {
            expiresIn: this.tokenExpiry
        });
        const refreshToken = jwt.sign(refreshTokenPayload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiry
        });
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
        };
    }
    async getUserById(id) {
        try {
            const result = await this.db.query(`SELECT id, username, email, password_hash, display_name, 
         created_at, updated_at, last_login_at, email_verified, status
         FROM users WHERE id = $1`, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                username: row.username,
                email: row.email,
                passwordHash: row.password_hash,
                displayName: row.display_name,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                lastLoginAt: row.last_login_at,
                emailVerified: row.email_verified,
                status: row.status
            };
        }
        catch (error) {
            logger.error('Failed to get user by ID:', error);
            return null;
        }
    }
    async getUserByEmail(email) {
        try {
            const result = await this.db.query(`SELECT id, username, email, password_hash, display_name, 
         created_at, updated_at, last_login_at, email_verified, status
         FROM users WHERE email = $1`, [email.toLowerCase()]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                username: row.username,
                email: row.email,
                passwordHash: row.password_hash,
                displayName: row.display_name,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                lastLoginAt: row.last_login_at,
                emailVerified: row.email_verified,
                status: row.status
            };
        }
        catch (error) {
            logger.error('Failed to get user by email:', error);
            return null;
        }
    }
    async getUserByUsername(username) {
        try {
            const result = await this.db.query(`SELECT id, username, email, password_hash, display_name, 
         created_at, updated_at, last_login_at, email_verified, status
         FROM users WHERE username = $1`, [username]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                username: row.username,
                email: row.email,
                passwordHash: row.password_hash,
                displayName: row.display_name,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                lastLoginAt: row.last_login_at,
                emailVerified: row.email_verified,
                status: row.status
            };
        }
        catch (error) {
            logger.error('Failed to get user by username:', error);
            return null;
        }
    }
    async updateLastLogin(userId) {
        try {
            await this.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
        }
        catch (error) {
            logger.error('Failed to update last login:', error);
            // Don't throw here as it's not critical
        }
    }
}
//# sourceMappingURL=AuthService.js.map