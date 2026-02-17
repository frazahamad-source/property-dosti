
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AdminDashboard } from '@/features/admin/AdminDashboard';

export default function AdminPage() {
    const { isAdmin, hasHydrated } = useStore();
    const router = useRouter();

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

    return <AdminDashboard />;
}
