'use client';

import { Sidebar } from '@/components/admin/Sidebar';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Broker } from '@/lib/types';
import { Suspense } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAdmin, hasHydrated, setBrokers, setProperties } = useStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (hasHydrated && mounted) {
            if (!isAdmin) {
                // router.push('/login');
            }
        }
    }, [isAdmin, router, hasHydrated, mounted]);

    // Fetch data centrally for all admin sub-pages
    useEffect(() => {
        if (!isAdmin || !mounted || !hasHydrated) return;

        const fetchData = async () => {
            try {
                // Fetch Brokers
                const { data: brokerData, error: brokerError } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('registered_at', { ascending: false });

                if (brokerError) {
                    console.error('Error fetching brokers:', brokerError);
                } else if (brokerData) {
                    const mappedBrokers: Broker[] = brokerData.map((b: any) => ({
                        id: b.id,
                        name: b.name || 'Unknown',
                        email: b.email || '',
                        phone: b.phone || '',
                        broker_code: b.broker_code || '',
                        role: 'broker',
                        reraNumber: b.rera_number,
                        districts: b.districts || [],
                        city: b.city,
                        village: b.village,
                        status: b.status || 'pending',
                        registeredAt: b.registered_at || new Date().toISOString(),
                        subscriptionExpiry: b.subscription_expiry || new Date().toISOString(),
                        referralCode: b.referral_code || '',
                        referredBy: b.referred_by,
                        referralsCount: b.referrals_count || 0,
                        companyName: b.company_name,
                        designation: b.designation,
                    }));
                    setBrokers(mappedBrokers);
                }

                // Fetch Properties
                const { data: propertyData, error: propertyError } = await supabase
                    .from('properties')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (propertyError) {
                    console.error('Error fetching properties:', propertyError);
                } else if (propertyData) {
                    const mappedProperties: any[] = propertyData.map((p: any) => ({
                        id: p.id,
                        brokerId: p.broker_id,
                        title: p.title || 'No Title',
                        description: p.description || '',
                        price: p.price || 0,
                        district: p.district || 'Unknown',
                        location: p.location || 'Unknown',
                        type: p.type || 'sale',
                        category: p.category || 'residential',
                        images: p.images || [],
                        createdAt: p.created_at,
                        updatedAt: p.updated_at,
                        expiresAt: p.expires_at,
                        isActive: p.is_active ?? true,
                        likes: p.likes || 0,
                        leadsCount: p.leads_count || 0,
                        amenities: p.amenities || [],
                    }));
                    setProperties(mappedProperties);
                }
            } catch (err) {
                console.error("Critical error fetching admin data:", err);
            }
        };

        fetchData();
    }, [isAdmin, mounted, hasHydrated, setBrokers, setProperties]);

    if (!mounted || !hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
            <Suspense fallback={<div className="w-64 bg-gray-900" />}>
                <Sidebar />
            </Suspense>
            <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                <Suspense fallback={<div className="flex items-center justify-center h-full animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />}>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}
