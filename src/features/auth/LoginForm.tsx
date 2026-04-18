
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { mapProfileToBroker } from '@/lib/authUtils';

import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const { login, user, isAdmin, hasHydrated } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (hasHydrated && user) {
            if (isAdmin) {
                router.replace('/admin');
            } else {
                router.replace('/dashboard');
            }
        }
    }, [hasHydrated, user, isAdmin, router]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);

        try {
            // 1. Sign in with Supabase
            console.log('Attempting login with:', data.email);
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) {
                console.error('Supabase Auth Error:', JSON.stringify(authError, null, 2));
                throw authError;
            }
            console.log('Auth successful, User ID:', authData.user?.id);

            if (!authData.user) throw new Error('Login failed: No user data returned');

            // 2. Fetch profile from public.profiles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                console.error('Profile Fetch Error:', JSON.stringify(profileError, null, 2));
                if (profileError.code === 'PGRST116') {
                    throw new Error('User profile not found. Please contact the administrator.');
                }
                throw profileError;
            }
            console.log('Profile fetched:', profile);

            // Check if user is admin based on DB flag
            if (profile?.is_admin) {
                // Admin login
                login({ ...profile, isAdmin: true } as any, true);
                toast.success('Welcome Admin');
                router.push('/admin');
                return;
            }

            if (profile.status !== 'approved') {
                toast.error('Your account is pending approval.');
                await supabase.auth.signOut();
                return;
            }

            // 3. Fetch user role from user_roles table (Manager/Supervisor)
            const { data: userRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', profile.id)
                .single();

            // 4. Update local store using utility
            const mappedProfile = mapProfileToBroker(profile, userRole, authData.user?.email || '');
            
            login(mappedProfile, false);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Login error:', error);
            toast.error(error.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Google login error:', error);
            toast.error(error.message || 'Failed to sign in with Google');
            setIsGoogleLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input id="email" type="email" {...register('email')} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password">Password</label>
                                <Link href="/forgot-password" title="Recover password" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    {...register('password')}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Login
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full py-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        onClick={handleGoogleLogin}
                        isLoading={isGoogleLoading}
                    >
                        {!isGoogleLoading && (
                            <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                        )}
                        <span className="font-semibold">Sign in with Google</span>
                    </Button>

                    <div className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

