
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/lib/store';
import { DISTRICTS } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

import { Eye, EyeOff } from 'lucide-react';

const signupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email(),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    companyName: z.string().optional(),
    designation: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    reraNumber: z.string().optional(),
    districts: z.string().min(1, "District selection is mandatory"),
    city: z.string().min(2, "City is required"),
    village: z.string().min(2, "Local Area/Village is required"),
    referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
    const router = useRouter();
    const { registerBroker } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema) as any,
        defaultValues: {
            districts: "",
        }
    });

    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true);

        try {
            // 1. Sign up user in Supabase Auth
            const now = new Date();
            const trialExpiry = new Date(now);
            trialExpiry.setDate(trialExpiry.getDate() + 45);
            const brokerCode = `PD-${Math.floor(1000 + Math.random() * 9000)}`;
            const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 1. Sign up user in Supabase Auth (Profile created via Trigger)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        phone: data.phone,
                        company_name: data.companyName,
                        designation: data.designation,
                        broker_code: brokerCode,
                        rera_number: data.reraNumber || null,
                        primary_district: data.districts, // SQL Trigger uses this key
                        city: data.city,
                        village: data.village,
                        registered_at: now.toISOString(),
                        subscription_expiry: trialExpiry.toISOString(),
                        referral_code: myReferralCode,
                        referred_by: data.referralCode || null, // The code they entered
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed');

            // Note: Manual insert into 'profiles' is removed because the SQL Trigger 'on_auth_user_created' handles it.

            // 3. Handle Referral if applicable
            if (data.referralCode) {
                // We'll need a way to check if referral code is valid in Supabase
                // For now, let's just log it or handle it in a separate function
                console.log('Referral code provided:', data.referralCode);
            }

            // Google Form Integration Logic (Keeping it as requested previously)
            const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc62jS8QUvNLoK0knj-THJzLd6zeH6tBcT2VD906FYbtH3Reg/formResponse";
            const formFields = {
                "entry.2005620554": data.name,
                "entry.1045798835": data.email,
                "entry.1168172671": data.phone,
                "entry.1166974658": data.city,
                "entry.839337160": data.village,
            };

            const formData = new FormData();
            Object.entries(formFields).forEach(([key, value]) => {
                formData.append(key, value);
            });

            try {
                await fetch(GOOGLE_FORM_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData
                });
            } catch (formError) {
                console.warn('Google Form submission failed:', formError);
                // Do not throw, allow registration to proceed
            }

            toast.success('Registration successful! Please wait for admin approval.');
            router.push('/login');
        } catch (error: any) {
            console.error('Signup error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Broker Registration</CardTitle>
                <CardDescription>Join our network of verified brokers</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name">Name</label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email">Email</label>
                        <Input id="email" type="email" {...register('email')} />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="companyName">Company / Agency Name (Optional)</label>
                        <Input id="companyName" {...register('companyName')} placeholder="e.g. Property Dosti Realtors" />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="designation">Designation (Optional)</label>
                        <Input id="designation" {...register('designation')} placeholder="e.g. Proprietor / Director" />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="phone">Phone</label>
                        <Input id="phone" {...register('phone')} />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password">Password</label>
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

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...register('confirmPassword')}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="reraNumber">RERA Number (Optional)</label>
                        <Input id="reraNumber" {...register('reraNumber')} />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="district" className="block text-sm font-medium">Primary District</label>
                        <select
                            id="district"
                            {...register('districts')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select a District</option>
                            {DISTRICTS.map((district) => (
                                <option key={district} value={district}>
                                    {district}
                                </option>
                            ))}
                        </select>
                        {errors.districts && <p className="text-sm text-red-500">{errors.districts.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="city">City</label>
                            <Input id="city" {...register('city')} placeholder="City" />
                            {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="village">Local Area/Village</label>
                            <Input id="village" {...register('village')} placeholder="Local Area/Village" />
                            {errors.village && <p className="text-sm text-red-500">{errors.village.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="referralCode">Referral Code (Optional)</label>
                        <Input id="referralCode" {...register('referralCode')} placeholder="Enter code for bonus" />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Legal Agreements</p>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="legalAgreement"
                                required
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="legalAgreement" className="text-sm text-muted-foreground leading-tight">
                                I agree to the <Link href="/terms" target="_blank" className="text-primary hover:underline font-semibold">Terms of Service</Link>, <Link href="/privacy" target="_blank" className="text-primary hover:underline font-semibold">Privacy Policy</Link>, and <Link href="/refund" target="_blank" className="text-primary hover:underline font-semibold">Refund & Cancellation Policy</Link>.
                            </label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-black tracking-tight" isLoading={isLoading}>
                        Register
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
