
import { Broker } from './types';

/**
 * Maps a database profile and user role to the Broker interface used by the application.
 */
export function mapProfileToBroker(profile: any, userRole: any, authUserEmail: string): Broker {
    const assignedRole = userRole?.role || 'broker';
    return {
        id: profile.id,
        role: assignedRole as 'broker' | 'manager' | 'supervisor',
        name: profile.name || 'Unknown',
        email: profile.email || authUserEmail || '',
        phone: profile.phone || '',
        broker_code: profile.broker_code || '',
        status: profile.status || 'pending',
        registeredAt: profile.registered_at || new Date().toISOString(),
        subscriptionExpiry: profile.subscription_expiry || new Date().toISOString(),
        referralCode: profile.referral_code || '',
        referredBy: profile.referred_by,
        referralCount: profile.referral_count || 0,
        referralEarnings: profile.referral_earnings || 0,
        uniqueBrokerId: profile.unique_broker_id || `PD-UNASSIGNED-${profile.id.substring(0, 4)}`,
        whatsappNumber: profile.whatsapp_number,
        companyName: profile.company_name,
        designation: profile.designation,
        reraNumber: profile.rera_number,
        districts: Array.isArray(profile.districts) ? profile.districts : [],
        city: profile.city,
        village: profile.village,
        avatarUrl: profile.avatar_url,
        userPermissions: userRole ? {
            can_view_leads: userRole.can_view_leads,
            can_reply_chats: userRole.can_reply_chats,
            can_change_logo: userRole.can_change_logo,
            can_edit_footer: userRole.can_edit_footer,
            can_approve_brokers: userRole.can_approve_brokers,
        } : undefined,
    };
}
