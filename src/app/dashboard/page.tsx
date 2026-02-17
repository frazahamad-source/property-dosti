
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { BrokerDashboard } from '@/features/broker/Dashboard';

export default function DashboardPage() {
    const { user, hasHydrated } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (hasHydrated && !user) {
            router.push('/login');
        }
    }, [user, hasHydrated, router]);

    if (!hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return <BrokerDashboard />;
}
