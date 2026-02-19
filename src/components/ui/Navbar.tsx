
'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "./Button";
import { Home, User, LogOut, Settings } from "lucide-react";

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin, logout } = useStore();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (pathname === '/') return null; // Don't show navbar on landing page (it has its own)

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <Home className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">Property Dosti</span>
                </Link>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    {user || isAdmin ? (
                        <>
                            <Link
                                href={isAdmin ? "/admin" : "/dashboard"}
                                className="flex items-center gap-2 text-sm text-muted-foreground mr-4 hover:text-primary transition-colors cursor-pointer"
                            >
                                <User className="h-4 w-4" />
                                <span>{isAdmin ? "Admin" : (user as any)?.name}</span>
                            </Link>
                            <Button variant="ghost" size="sm" asChild className="mr-2">
                                <Link href="/profile/change-password">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Change Password
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
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
