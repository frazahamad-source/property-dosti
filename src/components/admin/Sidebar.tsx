'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Image as ImageIcon, Settings, Users, Building2, LogOut, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

import { useStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';

const sidebarItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Brokers', href: '/admin?view=brokers', icon: Users },
    { name: 'Properties', href: '/admin?view=properties', icon: Building2 },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const { logout } = useStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (item: any) => {
        if (item.href === '/admin' && !currentView) {
            return pathname === '/admin';
        }
        if (item.href.includes('view=')) {
            return currentView === item.href.split('view=')[1];
        }
        return pathname === item.href;
    };

    return (
        <div className={cn(
            "fixed inset-y-0 left-0 z-[60] w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="flex h-24 items-center justify-start px-6 border-b border-gray-800 bg-gray-900 relative">
                <div className="flex-1 flex items-center justify-start overflow-visible">
                    <Logo
                        iconClassName="text-white"
                        textClassName="text-white"
                        taglineClassName="text-white/70"
                    />
                </div>
            </div>

            {/* Mobile-only Close Arrow: Centered vertically on the right edge to avoid logo conflict */}
            {onClose && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="lg:hidden absolute top-1/2 -right-2 transform -translate-y-1/2 bg-primary text-white rounded-full shadow-xl z-50 h-10 w-10 hover:bg-primary/90 border-2 border-gray-900"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            )}

            <div className="flex-1 py-6 px-3 space-y-1">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onClose?.()}
                        className={cn(
                            "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 hover:text-white",
                            isActive(item) ? "bg-gray-800 text-white" : "text-gray-400"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                    </Link>
                ))}
            </div>
            <div className="p-4 border-t border-gray-800">
                <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={handleLogout}>
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
