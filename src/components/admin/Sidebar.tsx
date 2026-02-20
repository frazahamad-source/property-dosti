'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Image as ImageIcon, Settings, Users, Building2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';

const sidebarItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Brokers', href: '/admin?view=brokers', icon: Users },
    { name: 'Properties', href: '/admin?view=properties', icon: Building2 },
];

export function Sidebar() {
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
        <div className="flex h-full flex-col bg-gray-900 text-white w-64 fixed left-0 top-0 bottom-0 overflow-y-auto z-50">
            <div className="flex h-16 items-center px-6 border-b border-gray-800">
                <Building2 className="mr-2 h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Admin Panel</span>
            </div>
            <div className="flex-1 py-6 px-3 space-y-1">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
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
