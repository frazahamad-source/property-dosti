'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    MessageSquare,
    CreditCard,
    User,
    Settings,
    LogOut,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Listings', href: '/dashboard?view=listings', icon: Building2 },
    { name: 'Responses', href: '/dashboard?view=responses', icon: MessageSquare },
    { name: 'Subscription', href: '/dashboard?view=subscription', icon: CreditCard },
    { name: 'Profile', href: '/dashboard?view=profile', icon: User },
    // { name: 'Settings', href: '/dashboard?view=settings', icon: Settings },
];

interface BrokerSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function BrokerSidebar({ isOpen, onClose }: BrokerSidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) => {
        const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
        if (href === '/dashboard' && !currentUrl) {
            return pathname === '/dashboard';
        }
        if (href.includes('view=')) {
            const view = href.split('view=')[1];
            return currentUrl.includes(`view=${view}`);
        }
        return pathname === href;
    };

    return (
        <div className={cn(
            "fixed inset-y-0 left-0 z-[60] w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="flex h-24 items-center justify-center px-4 border-b border-gray-800 bg-gray-900 relative">
                <div className="flex-1 flex items-center justify-center overflow-visible">
                    <Logo
                        iconClassName="text-white"
                        textClassName="text-white"
                        taglineClassName="text-white/70"
                        centerOnMobile={true}
                    />
                </div>
            </div>

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
                            isActive(item.href) ? "bg-gray-800 text-white" : "text-gray-400"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-3 py-4 border-t border-primary/10">
                    <div className="relative h-10 w-10 flex-shrink-0">
                        <img
                            src={user?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop"}
                            alt={user?.name || "Broker"}
                            className="h-full w-full rounded-full object-cover border border-primary/20"
                        />
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.name || "Broker Name"}</p>
                        <p className="text-[10px] text-primary font-semibold truncate capitalize">
                            {user && 'role' in user ? user.role : (user ? "Administrator" : "Professional Broker")}
                        </p>
                    </div>
                </div>

                <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={handleLogout}>
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div >
    );
}
