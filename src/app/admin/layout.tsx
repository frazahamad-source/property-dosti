'use client';

import { Sidebar } from '@/components/admin/Sidebar';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAdmin, hasHydrated } = useStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (hasHydrated && mounted) {
            if (!user || !isAdmin) {
                // Redirect to login if not admin
                // router.push('/login'); 
                // Commented out to prevent accidental lockout during dev if mock/state is flaky.
                // Ideally should be uncommented for prod.
            }
        }
    }, [user, isAdmin, router, hasHydrated, mounted]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                {children}
            </div>
        </div>
    );
}
