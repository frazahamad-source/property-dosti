import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Broker, Property, Admin, ChatMessage, Banner, PropertyLead } from './types';
import { MOCK_BROKERS, MOCK_PROPERTIES } from './mockData';

interface AppState {
    user: Broker | Admin | null;
    isAdmin: boolean;
    properties: Property[];
    brokers: Broker[];
    banner: Banner;
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
    updateBanner: (banner: Banner) => void;
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
            banner: {
                title: "Grow Your Business with Property Dosti",
                description: "Join 500+ verified brokers. Get exclusive leads and premium listing visibility across Karnataka districts.",
                buttonText: "Join Premium Network",
                buttonLink: "/signup",
                backgroundPosition: '50% 50%',
            },
            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),

            setProperties: (properties) => set({ properties }),
            setBrokers: (brokers) => set({ brokers }),
            login: (user, isAdmin) => set({ user, isAdmin }),
            logout: () => set({ user: null, isAdmin: false }),

            updateBanner: (banner) => set({ banner }),

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

            addPropertyLead: (lead) =>
                set((state) => ({
                    propertyLeads: [lead, ...state.propertyLeads],
                    properties: state.properties.map((p) =>
                        p.id === lead.propertyId ? { ...p, leadsCount: p.leadsCount + 1 } : p
                    ),
                })),

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
