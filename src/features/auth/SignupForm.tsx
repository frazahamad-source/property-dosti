
'use client';

import { useState } from 'react';
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

const signupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email(),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    reraNumber: z.string().optional(),
    districts: z.string().min(1, "District selection is mandatory"),
    city: z.string().min(2, "City is required"),
    village: z.string().min(2, "Village is required"),
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

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema) as any,
        defaultValues: {
            districts: "",
        }
    });

    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const brokerId = `broker-${Date.now()}`;
        registerBroker({
            id: brokerId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            brokerCode: `PD-${Math.floor(Math.random() * 1000)}`,
            reraNumber: data.reraNumber,
            districts: [data.districts],
            city: data.city,
            village: data.village,
            status: 'pending',
            password: data.password,
            registeredAt: '', // Initialized in store
            subscriptionExpiry: '', // Initialized in store
            referralCode: '', // Initialized in store
            referralsCount: 0,
        });

        if (data.referralCode) {
            useStore.getState().applyReferral(data.referralCode, brokerId);
        }

        // Google Form Integration Logic
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
            console.log('Successfully logged to Google Form');
        } catch (error) {
            console.error('Error logging to Google Form:', error);
        }

        toast.success('Registration successful! Please wait for admin approval.');
        router.push('/login');
        setIsLoading(false);
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
                        <label htmlFor="phone">Phone</label>
                        <Input id="phone" {...register('phone')} />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password">Password</label>
                        <Input id="password" type="password" {...register('password')} />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
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
                            <label htmlFor="village">Village</label>
                            <Input id="village" {...register('village')} placeholder="Village/Area" />
                            {errors.village && <p className="text-sm text-red-500">{errors.village.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="referralCode">Referral Code (Optional)</label>
                        <Input id="referralCode" {...register('referralCode')} placeholder="Enter code for bonus" />
                    </div>

                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Register
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
