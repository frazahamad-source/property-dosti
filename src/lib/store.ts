import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Broker, Property, Admin, ChatMessage, BannerSlide, PropertyLead, SiteConfig } from './types';
import { MOCK_BROKERS, MOCK_PROPERTIES } from './mockData';

interface AppState {
    user: Broker | Admin | null;
    isAdmin: boolean;
    properties: Property[];
    brokers: Broker[];
    bannerSlides: BannerSlide[];
    siteConfig: SiteConfig;
    propertyLeads: PropertyLead[];
    setProperties: (properties: Property[]) => void;
    setBrokers: (brokers: Broker[]) => void;
    login: (user: Broker | Admin, isAdmin: boolean) => void;
    logout: () => void;
    addProperty: (property: Property) => void;
    updateProperty: (id: string, updates: Partial<Property>) => void;
    likeProperty: (id: string) => void;
    addPropertyLead: (lead: PropertyLead) => void;
    approveBroker: (brokerId: string) => void;
    rejectBroker: (brokerId: string) => void;
    deleteBroker: (brokerId: string) => void;
    registerBroker: (broker: Broker) => void;
    updateBroker: (id: string, updates: Partial<Broker>) => void;
    updateBrokerPassword: (email: string, newPassword: string) => void;
    updateBannerSlides: (slides: BannerSlide[]) => Promise<void>;
    fetchBannerSlides: () => Promise<void>;
    updateSiteConfig: (config: SiteConfig) => Promise<void>;
    fetchSiteConfig: () => Promise<void>;
    chatMessages: ChatMessage[];
    addChatMessage: (msg: ChatMessage) => void;
    applyReferral: (code: string, newBrokerId: string) => void;
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            isAdmin: false,
            properties: [],
            brokers: [],
            propertyLeads: [],
            bannerSlides: [
                {
                    id: '1',
                    title: "Grow Your Business with Property Dosti",
                    description: "Join 500+ verified brokers. Get exclusive leads and premium listing visibility across Karnataka districts.",
                    buttonText: "Join Premium Network",
                    buttonLink: "/signup",
                    backgroundImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920',
                    backgroundPosition: '50% 50%',
                },
                {
                    id: '2',
                    title: "Find Your Dream Home",
                    description: "Browse thousands of properties verified by our trusted network.",
                    buttonText: "Browse Properties",
                    buttonLink: "/properties",
                    backgroundImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1920',
                    backgroundPosition: '50% 50%',
                },
                {
                    id: '3',
                    title: "Connect with Verified Brokers",
                    description: "Get direct access to property owners and certified agents.",
                    buttonText: "Contact Us",
                    buttonLink: "/contact",
                    backgroundImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920',
                    backgroundPosition: '50% 50%',
                }
            ],
            siteConfig: {
                heroTitle: 'Empowering Real Estate Brokers\nin Karnataka',
                heroDescription: 'We are the first and most trusted network of verified brokers in all districts and villages in the state of Karnataka.',
                heroBackgroundImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920',
                footerText: '© 2024 Property Dosti. All rights reserved.',
                socialLinks: {
                    facebook: '#',
                    twitter: '#',
                    instagram: '#',
                    linkedin: '#'
                },
                contactPhone: '+91 7760704400',
                contactEmail: 'support@propertydosti.com'
            },
            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),

            setProperties: (properties) => set({ properties }),
            setBrokers: (brokers) => set({ brokers }),
            login: (user, isAdmin) => set({ user, isAdmin }),
            logout: () => set({ user: null, isAdmin: false }),

            fetchBannerSlides: async () => {
                const module = await import('@/lib/supabaseClient');
                const supabase = module.supabase;

                const { data, error } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'banner_slides')
                    .single();

                if (error) {
                    console.error('Error fetching banner slides:', error);
                } else if (data && data.value) {
                    set({ bannerSlides: data.value });
                }
            },

            updateBannerSlides: async (slides) => {
                // Optimistic update
                set({ bannerSlides: slides });

                // Persist to DB
                const module = await import('@/lib/supabaseClient');
                const supabase = module.supabase;

                const { error } = await supabase
                    .from('site_settings')
                    .upsert({
                        key: 'banner_slides',
                        value: slides
                    }, { onConflict: 'key' });

                if (error) {
                    console.error('Failed to save banner slides to DB:', error);
                }
            },

            fetchSiteConfig: async () => {
                const module = await import('@/lib/supabaseClient');
                const supabase = module.supabase;

                const { data, error } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'site_config')
                    .single();

                if (error) {
                    console.error('Error fetching site config:', error);
                } else if (data && data.value) {
                    set({ siteConfig: data.value });
                }
            },

            updateSiteConfig: async (config) => {
                set({ siteConfig: config });
                const module = await import('@/lib/supabaseClient');
                const supabase = module.supabase;

                const { error } = await supabase
                    .from('site_settings')
                    .upsert({
                        key: 'site_config',
                        value: config
                    }, { onConflict: 'key' });

                if (error) {
                    console.error('Failed to save site config to DB:', error);
                }
            },

            addProperty: (property) =>
                set((state) => ({
                    properties: [{ ...property, likes: 0, leadsCount: 0, amenities: property.amenities || [] }, ...state.properties]
                })),

            updateProperty: (id, updates) =>
                set((state) => ({
                    properties: state.properties.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                })),

            likeProperty: (id) =>
                set((state) => ({
                    properties: state.properties.map((p) =>
                        p.id === id ? { ...p, likes: p.likes + 1 } : p
                    ),
                })),

            addPropertyLead: async (lead) => {
                // Optimistic update
                set((state) => ({
                    propertyLeads: [lead, ...state.propertyLeads],
                    properties: state.properties.map((p) =>
                        p.id === lead.propertyId ? { ...p, leadsCount: p.leadsCount + 1 } : p
                    ),
                }));

                // Persist to DB
                const module = await import('@/lib/supabaseClient');
                const supabase = module.supabase;

                const { error } = await supabase
                    .from('property_leads')
                    .insert({
                        property_id: lead.propertyId,
                        broker_id: lead.brokerId,
                        name: lead.name,
                        phone: lead.phone,
                        message: lead.message,
                        timestamp: lead.timestamp
                    });

                if (error) {
                    console.error('Failed to save property lead:', error);
                } else {
                    // Update leads_count on property
                    await supabase.rpc('increment_leads', { row_id: lead.propertyId });
                }
            },

            approveBroker: (brokerId) =>
                set((state) => ({
                    brokers: state.brokers.map((b) =>
                        b.id === brokerId ? { ...b, status: 'approved' } : b
                    ),
                })),

            rejectBroker: (brokerId) =>
                set((state) => ({
                    brokers: state.brokers.map((b) =>
                        b.id === brokerId ? { ...b, status: 'rejected' } : b
                    ),
                })),

            deleteBroker: (brokerId) =>
                set((state) => ({
                    brokers: state.brokers.filter((b) => b.id !== brokerId),
                })),

            registerBroker: (broker) =>
                set((state) => {
                    const now = new Date();
                    const trialExpiry = new Date(now);
                    trialExpiry.setDate(trialExpiry.getDate() + 45);

                    const newBroker: Broker = {
                        ...broker,
                        status: 'pending',
                        registeredAt: now.toISOString(),
                        subscriptionExpiry: trialExpiry.toISOString(),
                        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                        referralsCount: 0,
                    };
                    return { brokers: [...state.brokers, newBroker] };
                }),

            updateBroker: (id, updates) =>
                set((state) => ({
                    brokers: state.brokers.map((b) =>
                        b.id === id ? { ...b, ...updates } : b
                    ),
                })),

            updateBrokerPassword: (email, newPassword) =>
                set((state) => ({
                    brokers: state.brokers.map((b) =>
                        b.email === email ? { ...b, password: newPassword } : b
                    ),
                })),

            // Chat Actions
            chatMessages: [] as ChatMessage[],
            addChatMessage: (msg: ChatMessage) =>
                set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

            // Referral Action
            applyReferral: (code: string, newBrokerId: string) =>
                set((state) => {
                    const referrer = state.brokers.find(b => b.referralCode === code);
                    if (!referrer) return state;

                    return {
                        brokers: state.brokers.map(b => {
                            if (b.id === referrer.id) {
                                // Extend subscription by 30 days
                                const expiry = new Date(b.subscriptionExpiry);
                                expiry.setDate(expiry.getDate() + 30);
                                return {
                                    ...b,
                                    referralsCount: b.referralsCount + 1,
                                    subscriptionExpiry: expiry.toISOString()
                                };
                            }
                            if (b.id === newBrokerId) {
                                return { ...b, referredBy: referrer.id };
                            }
                            return b;
                        })
                    };
                }),
        }),
        {
            name: 'property-dosti-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
