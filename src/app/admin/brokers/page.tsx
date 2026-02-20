'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminBrokersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin?view=brokers');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
