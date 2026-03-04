'use client';
import { Suspense, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminDashboard } from '@/features/admin/AdminDashboard';

function AdminContent() {
    const { isAdmin, hasHydrated } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = (searchParams.get('view') as 'properties' | 'brokers' | 'amenities' | 'overview' | null) || 'overview';

    useEffect(() => {
        if (hasHydrated && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, hasHydrated, router]);

    if (!hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return <AdminDashboard view={view} />;
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading admin panel...</div>}>
            <AdminContent />
        </Suspense>
    );
}
