/**
 * Consent and privacy types
 */
export type ConsentType = 'essential' | 'functionality' | 'analytics' | 'marketing' | 'personalization' | 'social' | 'third_party';
export type ConsentStatus = 'granted' | 'revoked' | 'expired';
export interface ConsentRecord {
    userId: string;
    consentType: ConsentType;
    status: ConsentStatus;
    context?: string;
    grantedAt: Date;
    revokedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
}
export interface ConsentRequest {
    consentType: ConsentType;
    status: ConsentStatus;
    context?: string;
}
export interface ConsentSummary {
    essential: boolean;
    functionality: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    social: boolean;
    thirdParty: boolean;
}
export interface DataExportRequest {
    format: 'json' | 'csv';
    includeDeleted?: boolean;
}
export interface PrivacySettings {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    allowClubInvites: boolean;
    dataRetentionDays: number;
}
