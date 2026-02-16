
'use client';

import { useState } from 'react';
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

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const { brokers, login } = useStore();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check for admin
        if (data.email === 'admin@propertydosti.com' && data.password === 'admin123') {
            login({ id: 'admin', email: data.email, password: '' }, true);
            toast.success('Welcome Admin');
            router.push('/admin');
            return;
        }

        // Check for broker
        const broker = brokers.find((b) => b.email === data.email && b.password === data.password);

        if (broker) {
            if (broker.status !== 'approved') {
                toast.error('Your account is pending approval.');
                setIsLoading(false);
                return;
            }
            login(broker, false);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } else {
            toast.error('Invalid credentials');
        }
        setIsLoading(false);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <Input id="password" type="password" {...register('password')} />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Login
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
