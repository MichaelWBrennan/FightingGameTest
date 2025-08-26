/**
 * User types and interfaces
 */
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    emailVerified: boolean;
    status: 'active' | 'inactive' | 'suspended' | 'deleted';
}
export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}
export interface LoginCredentials {
    email?: string;
    username?: string;
    password: string;
}
export interface UserProfile {
    id: string;
    username: string;
    email: string;
    displayName: string;
    createdAt: Date;
    lastLoginAt?: Date;
    emailVerified: boolean;
    communicationPreferences?: CommunicationPreferences;
}
export interface CommunicationPreferences {
    emailMarketing: boolean;
    emailUpdates: boolean;
    emailSecurity: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    inGameNotifications: boolean;
}
//# sourceMappingURL=User.d.ts.map