
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { BrokerDashboard } from '@/features/broker/Dashboard';

export default function DashboardPage() {
    const { user } = useStore();
    const router = useRouter();

    useEffect(() => {
        // Simple client-side protection
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) return null;

    return <BrokerDashboard />;
}
