/**
 * ConsentManager - Privacy consent and communication preferences
 *
 * Manages GDPR/CCPA compliance with explicit consent tracking.
 * Implements data minimization and opt-in telemetry by design.
 */
import { DatabaseManager } from '../database/DatabaseManager';
import { ConsentRecord, ConsentType, ConsentStatus } from '../types/Consent';
import { CommunicationPreferences } from '../types/User';
export declare class ConsentManager {
    private db;
    constructor(db: DatabaseManager);
    /**
     * Record user consent for specific data processing
     */
    recordConsent(userId: string, consentType: ConsentType, status: ConsentStatus, context?: string): Promise<void>;
    /**
     * Get current consent status for user
     */
    getConsentStatus(userId: string, consentType?: ConsentType): Promise<ConsentRecord[]>;
    /**
     * Check if user has given consent for specific processing
     */
    hasConsent(userId: string, consentType: ConsentType): Promise<boolean>;
    /**
     * Revoke consent for specific data processing
     */
    revokeConsent(userId: string, consentType: ConsentType, context?: string): Promise<void>;
    /**
     * Update communication preferences
     */
    updateCommunicationPreferences(userId: string, preferences: CommunicationPreferences): Promise<void>;
    /**
     * Get user's communication preferences
     */
    getCommunicationPreferences(userId: string): Promise<CommunicationPreferences | null>;
    /**
     * Export all user data for GDPR compliance
     */
    exportUserData(userId: string): Promise<any>;
    /**
     * Delete all user data (right to be forgotten)
     */
    deleteUserData(userId: string): Promise<void>;
    /**
     * Initialize default consent settings for new user
     */
    initializeDefaultConsents(userId: string): Promise<void>;
    /**
     * Check if data processing is allowed based on consent
     */
    canProcessData(userId: string, purpose: string): Promise<boolean>;
}
//# sourceMappingURL=ConsentManager.d.ts.map