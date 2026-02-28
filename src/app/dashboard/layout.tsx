'use client';

import { BrokerSidebar } from '@/components/broker/BrokerSidebar';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, hasHydrated } = useStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (hasHydrated && mounted) {
            if (!user) {
                // If not logged in, redirect to login
                // router.push('/login');
            }
        }
    }, [user, router, hasHydrated, mounted]);

    if (!mounted || !hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
            {/* Mobile Header */}
            <header className="lg:hidden bg-gray-900 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-[40] shadow-md">
                <div className="flex items-center">
                    <Logo
                        showTagline={false}
                        iconClassName="h-6 w-6"
                        textClassName="text-lg text-white"
                        className="mr-2"
                        centerOnMobile={false}
                    />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white">
                    <Menu className="h-6 w-6" />
                </Button>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-[50] lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <Suspense fallback={<div className="w-64 bg-gray-900 hidden lg:block" />}>
                    <BrokerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                </Suspense>

                <main className={cn(
                    "flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] lg:h-screen transition-all duration-300",
                    "lg:ml-64" // Content push on desktop
                )}>
                    <Suspense fallback={<div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>}>
                        <div className="lg:hidden mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Broker's Dashboard</h1>
                            <p className="text-xs text-gray-500">Karnataka's Verified Broker Network</p>
                        </div>
                        {children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
