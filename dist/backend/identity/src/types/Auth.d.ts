/**
 * Authentication types and interfaces
 */
export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
}
export interface TokenPayload {
    userId: string;
    username: string;
    type: 'access' | 'refresh' | 'password_reset' | 'email_verification';
    iat?: number;
    exp?: number;
}
export interface AuthRequest {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface ResetPasswordRequest {
    resetToken: string;
    newPassword: string;
}
