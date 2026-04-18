
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { mapProfileToBroker } from '@/lib/authUtils';

export default function AuthCallback() {
    const router = useRouter();
    const { login } = useStore();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const handleCallback = async () => {
            try {
                // 1. Get current session after redirect
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) throw sessionError;
                if (!session?.user) {
                    router.replace('/login');
                    return;
                }

                const user = session.user;

                // 2. Fetch profile from public.profiles
                // Note: The SQL Trigger 'on_auth_user_created' should have created the profile
                // We might need to retry a few times if the trigger is slow, but usually it's instant.
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code === 'PGRST116') {
                    // Profile not found yet, possibly trigger is still running or failed.
                    // For OAuth, we can attempt to create it here if missing, 
                    // though the trigger is the preferred way.
                    console.warn('Profile not found for OAuth user, trigger may have failed or still running.');
                    
                    // Optional: Wait and retry once
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retry = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    
                    if (retry.data) {
                        profile = retry.data;
                    } else {
                        // If still missing, the trigger definitely didn't run.
                        // We'll let the user know and sign out or redirect to a help page.
                        toast.error('Profile creation failed. Please contact support.');
                        await supabase.auth.signOut();
                        router.replace('/login');
                        return;
                    }
                } else if (profileError) {
                    throw profileError;
                }

                // 3. Check for admin
                if (profile?.is_admin) {
                    login({ ...profile, isAdmin: true } as any, true);
                    toast.success('Welcome Admin');
                    router.replace('/admin');
                    return;
                }

                // 4. Check for approval status
                if (profile.status !== 'approved') {
                    toast.error('Your account is pending approval.');
                    await supabase.auth.signOut();
                    router.replace('/login');
                    return;
                }

                // 5. Fetch user role
                const { data: userRole } = await supabase
                    .from('user_roles')
                    .select('*')
                    .eq('user_id', profile.id)
                    .single();

                // 6. Update local store
                const mappedProfile = mapProfileToBroker(profile, userRole, user.email || '');
                login(mappedProfile, false);
                
                toast.success('Signed in successfully!');
                router.replace('/dashboard');
            } catch (err: unknown) {
                const error = err as Error;
                console.error('Auth callback error:', error);
                toast.error('Authentication failed: ' + (error.message || 'Unknown error'));
                router.replace('/login');
            }
        };

        handleCallback();
    }, [router, login]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Completing sign in...</h2>
                <p className="mt-2 text-gray-500">Please wait a moment.</p>
            </div>
        </div>
    );
}
