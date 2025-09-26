/**
 * ConsentManager - Privacy consent and communication preferences
 * 
 * Manages GDPR/CCPA compliance with explicit consent tracking.
 * Implements data minimization and opt-in telemetry by design.
 */

import type { DatabaseManager } from '../database/DatabaseManager';
import { Logger } from '../utils/Logger';
import type { ConsentRecord, ConsentType, ConsentStatus } from '../types/Consent';
import type { CommunicationPreferences } from '../types/User';

const logger = Logger.getInstance();

export class ConsentManager {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Record user consent for specific data processing
   */
  async recordConsent(
    userId: string, 
    consentType: ConsentType, 
    status: ConsentStatus,
    context?: string
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO user_consents (
          user_id, consent_type, status, context, 
          granted_at, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
        [
          userId, 
          consentType, 
          status, 
          context || null,
          null, // IP would be passed from request context
          null  // User agent would be passed from request context
        ]
      );

      logger.info('Consent recorded', {
        userId,
        consentType,
        status,
        context
      });

    } catch (error) {
      logger.error('Failed to record consent:', error);
      throw error;
    }
  }

  /**
   * Get current consent status for user
   */
  async getConsentStatus(userId: string, consentType?: ConsentType): Promise<ConsentRecord[]> {
    try {
      let query = `
        SELECT user_id, consent_type, status, context, granted_at, 
               revoked_at, ip_address, user_agent
        FROM user_consents 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (consentType) {
        query += ' AND consent_type = $2';
        params.push(consentType);
      }

      query += ' ORDER BY granted_at DESC';

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        userId: row.user_id,
        consentType: row.consent_type,
        status: row.status,
        context: row.context,
        grantedAt: row.granted_at,
        revokedAt: row.revoked_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }));

    } catch (error) {
      logger.error('Failed to get consent status:', error);
      throw error;
    }
  }

  /**
   * Check if user has given consent for specific processing
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const result = await this.db.query(
        `SELECT status FROM user_consents 
         WHERE user_id = $1 AND consent_type = $2 
         ORDER BY granted_at DESC LIMIT 1`,
        [userId, consentType]
      );

      if (result.rows.length === 0) {
        return false; // No consent record means no consent
      }

      return result.rows[0].status === 'granted';

    } catch (error) {
      logger.error('Failed to check consent:', error);
      return false; // Fail closed - assume no consent
    }
  }

  /**
   * Revoke consent for specific data processing
   */
  async revokeConsent(
    userId: string, 
    consentType: ConsentType,
    context?: string
  ): Promise<void> {
    try {
      // Record the revocation
      await this.recordConsent(userId, consentType, 'revoked', context);

      // Mark the previous consent as revoked
      await this.db.query(
        `UPDATE user_consents 
         SET revoked_at = NOW() 
         WHERE user_id = $1 AND consent_type = $2 AND status = 'granted' AND revoked_at IS NULL`,
        [userId, consentType]
      );

      logger.info('Consent revoked', {
        userId,
        consentType,
        context
      });

    } catch (error) {
      logger.error('Failed to revoke consent:', error);
      throw error;
    }
  }

  /**
   * Update communication preferences
   */
  async updateCommunicationPreferences(
    userId: string, 
    preferences: CommunicationPreferences
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO communication_preferences (
          user_id, email_marketing, email_updates, email_security,
          push_notifications, sms_notifications, in_game_notifications,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          email_marketing = EXCLUDED.email_marketing,
          email_updates = EXCLUDED.email_updates,
          email_security = EXCLUDED.email_security,
          push_notifications = EXCLUDED.push_notifications,
          sms_notifications = EXCLUDED.sms_notifications,
          in_game_notifications = EXCLUDED.in_game_notifications,
          updated_at = NOW()`,
        [
          userId,
          preferences.emailMarketing,
          preferences.emailUpdates,
          preferences.emailSecurity,
          preferences.pushNotifications,
          preferences.smsNotifications,
          preferences.inGameNotifications
        ]
      );

      logger.info('Communication preferences updated', {
        userId,
        preferences
      });

    } catch (error) {
      logger.error('Failed to update communication preferences:', error);
      throw error;
    }
  }

  /**
   * Get user's communication preferences
   */
  async getCommunicationPreferences(userId: string): Promise<CommunicationPreferences | null> {
    try {
      const result = await this.db.query(
        `SELECT email_marketing, email_updates, email_security,
         push_notifications, sms_notifications, in_game_notifications
         FROM communication_preferences WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        emailMarketing: row.email_marketing,
        emailUpdates: row.email_updates,
        emailSecurity: row.email_security,
        pushNotifications: row.push_notifications,
        smsNotifications: row.sms_notifications,
        inGameNotifications: row.in_game_notifications
      };

    } catch (error) {
      logger.error('Failed to get communication preferences:', error);
      return null;
    }
  }

  /**
   * Export all user data for GDPR compliance
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      // Get user profile
      const userResult = await this.db.query(
        `SELECT username, email, display_name, created_at, 
         last_login_at, email_verified FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Get consent records
      const consentRecords = await this.getConsentStatus(userId);

      // Get communication preferences
      const commPrefs = await this.getCommunicationPreferences(userId);

      // Compile export data
      const exportData = {
        profile: userResult.rows[0],
        consents: consentRecords,
        communicationPreferences: commPrefs,
        exportedAt: new Date().toISOString(),
        format: 'JSON'
      };

      logger.info('User data exported', { userId });

      return exportData;

    } catch (error) {
      logger.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (right to be forgotten)
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Start transaction
      await this.db.query('BEGIN');

      // Delete communication preferences
      await this.db.query(
        'DELETE FROM communication_preferences WHERE user_id = $1',
        [userId]
      );

      // Delete consent records (retain for legal compliance)
      // In some jurisdictions, consent records must be retained
      // await this.db.query(
      //   'DELETE FROM user_consents WHERE user_id = $1',
      //   [userId]
      // );

      // Anonymize user record instead of deletion to maintain referential integrity
      await this.db.query(
        `UPDATE users SET 
         username = 'deleted_user_' || id,
         email = 'deleted_' || id || '@example.com',
         display_name = 'Deleted User',
         password_hash = 'deleted',
         status = 'deleted',
         updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      await this.db.query('COMMIT');

      logger.info('User data deleted/anonymized', { userId });

    } catch (error) {
      await this.db.query('ROLLBACK');
      logger.error('Failed to delete user data:', error);
      throw error;
    }
  }

  /**
   * Initialize default consent settings for new user
   */
  async initializeDefaultConsents(userId: string): Promise<void> {
    try {
      // Grant essential consents by default
      await this.recordConsent(userId, 'essential', 'granted', 'Account creation');
      await this.recordConsent(userId, 'functionality', 'granted', 'Account creation');

      // Set default communication preferences (all opt-out except security)
      const defaultPrefs: CommunicationPreferences = {
        emailMarketing: false,
        emailUpdates: false,
        emailSecurity: true, // Security emails are always enabled
        pushNotifications: false,
        smsNotifications: false,
        inGameNotifications: true
      };

      await this.updateCommunicationPreferences(userId, defaultPrefs);

      logger.info('Default consents initialized', { userId });

    } catch (error) {
      logger.error('Failed to initialize default consents:', error);
      throw error;
    }
  }

  /**
   * Check if data processing is allowed based on consent
   */
  async canProcessData(userId: string, purpose: string): Promise<boolean> {
    try {
      // Map purposes to consent types
      const consentMapping: Record<string, ConsentType> = {
        'analytics': 'analytics',
        'marketing': 'marketing',
        'personalization': 'personalization',
        'essential': 'essential',
        'functionality': 'functionality'
      };

      const consentType = consentMapping[purpose];
      if (!consentType) {
        logger.warn('Unknown data processing purpose', { purpose });
        return false;
      }

      return await this.hasConsent(userId, consentType);

    } catch (error) {
      logger.error('Failed to check data processing consent:', error);
      return false;
    }
  }
}