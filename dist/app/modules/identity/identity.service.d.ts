import { User, Consent, CommunicationPreferences } from './identity.types';
export declare class IdentityService {
    private _db;
    constructor();
    register(userData: Pick<User, 'username' | 'email' | 'passwordHash'>): Promise<User>;
    login(_credentials: Pick<User, 'email' | 'passwordHash'>): Promise<{
        token: string;
    }>;
    logout(_token: string): Promise<void>;
    getProfile(_userId: string): Promise<User | null>;
    updateConsent(consentData: Consent): Promise<Consent>;
    deleteAccount(_userId: string): Promise<void>;
    getCommunicationPreferences(_userId: string): Promise<CommunicationPreferences | null>;
    updateCommunicationPreferences(preferencesData: CommunicationPreferences): Promise<CommunicationPreferences>;
}
