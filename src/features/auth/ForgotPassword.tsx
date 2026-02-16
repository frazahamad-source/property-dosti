'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        console.log('Password reset requested for:', data.email);
        setIsSubmitted(true);
        toast.success('Check your email for reset instructions.');
        setIsLoading(false);
    };

    if (isSubmitted) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Email Sent</CardTitle>
                    <CardDescription>
                        We've sent a password reset link to your email address. Please check your inbox and spam folder.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button asChild variant="outline">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive recovery instructions</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email">Email Address</label>
                        <Input id="email" type="email" {...register('email')} placeholder="name@example.com" />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Send Recovery Link
                    </Button>
                    <div className="text-center mt-4">
                        <Link href="/login" className="text-sm text-primary hover:underline">
                            Remember your password? Login
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
