
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AdminDashboard } from '@/features/admin/AdminDashboard';

export default function AdminPage() {
    const { isAdmin } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, router]);

    if (!isAdmin) return null;

    return <AdminDashboard />;
}
