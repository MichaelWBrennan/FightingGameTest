export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Consent {
    userId: string;
    email_marketing: boolean;
    push_notifications: boolean;
    analytics_tracking: boolean;
    updatedAt: Date;
}
export interface CommunicationPreferences {
    userId: string;
    email_updates: boolean;
    email_promotions: boolean;
    push_new_content: boolean;
    push_events: boolean;
    updatedAt: Date;
}
