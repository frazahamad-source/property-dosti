
'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "./Button";
import { Home, User, LogOut, Settings, Building2, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";


export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin, logout } = useStore();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (pathname === '/' || pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) return null; // Don't show navbar on landing page, admin panel, or dashboard

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-20 items-center px-2 md:px-4">
                <Link href="/" className="mr-2 md:mr-6 flex-shrink-0">
                    <Logo className="scale-90 md:scale-100 origin-left" />
                </Link>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    {user || isAdmin ? (
                        <>
                            <Link
                                href={isAdmin ? "/admin" : "/dashboard"}
                                className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span className="hidden xs:inline">{isAdmin ? "Admin" : "Dashboard"}</span>
                            </Link>

                            <Button variant="ghost" size="sm" asChild className="px-2 md:px-3">
                                <Link href="/profile/change-password">
                                    <Settings className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Settings</span>
                                </Link>
                            </Button>

                            <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2 md:px-3 text-red-500 hover:text-red-600 hover:bg-red-50">
                                <LogOut className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Logout</span>
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            {/* Auth buttons handled in page */}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
