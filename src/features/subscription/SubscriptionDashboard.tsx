
'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QrCode, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralBanner } from '@/components/broker/ReferralBanner';

export function SubscriptionDashboard() {
    const { user } = useStore();
    const broker = user && 'referralCode' in user ? user : null;

    const isExempt = broker && (broker.role === 'manager' || broker.role === 'supervisor');

    const expiryDate = useMemo(() => broker ? new Date(broker.subscriptionExpiry) : new Date(), [broker]);
    const daysLeft = useMemo(() => {
        const now = new Date();
        return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }, [expiryDate]);
    const isExpired = daysLeft <= 0;

    // Show for any logged-in user (broker or admin viewing)
    if (!user) return null;

    const copyReferralCode = () => {
        if (!broker) return;
        navigator.clipboard.writeText(broker.referralCode);
        toast.success('Referral code copied!');
    };

    // If Manager/Supervisor, show exempt status
    if (isExempt) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20 backdrop-blur md:col-span-2 lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">Subscription Status</CardTitle>
                            <Badge className="bg-indigo-600 text-white font-bold">Exempt</Badge>
                        </div>
                        <CardDescription>Your role includes full platform access</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                                <p className="text-lg font-bold capitalize">{broker.role}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                                ✅ No subscription required — your {broker.role.charAt(0).toUpperCase() + broker.role.slice(1)} role includes full access to all features.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {broker && (
                    <div className="md:col-span-2 lg:col-span-3">
                        <ReferralBanner
                            referralCode={broker.referralCode}
                            uniqueBrokerId={broker.uniqueBrokerId}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {broker && (
                <Card className="border-primary/20 bg-white/50 backdrop-blur">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">Subscription Status</CardTitle>
                            <Badge variant={isExpired ? "destructive" : "default"}>
                                {isExpired ? "Expired" : "Active"}
                            </Badge>
                        </div>
                        <CardDescription>Your plan details and validity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Expiry Date</p>
                                <p className="text-2xl font-bold">{expiryDate.toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-sm text-primary font-medium">
                                {daysLeft > 0
                                    ? `${daysLeft} days remaining in your ${daysLeft > 45 ? 'plan' : 'trial'}`
                                    : 'Subscription expired. Please pay to continue.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-primary/20 bg-white/50 backdrop-blur md:col-span-2 lg:col-span-1">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Complete Subscription</CardTitle>
                    <CardDescription className="text-base font-medium">Scan to complete subscription payment</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-4">
                    <div className="w-64 h-64 bg-white border-2 border-primary/10 rounded-2xl shadow-sm flex items-center justify-center relative overflow-hidden p-2 transition-all hover:shadow-md hover:border-primary/30">
                        <img src="/images/admin-gpay-qr.jpg" alt="Secure Payment QR Code" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground text-center leading-relaxed max-w-sm">
                        Use any UPI app (GPay, PhonePe, Paytm) to pay <strong className="text-foreground">₹100/month</strong>.
                        Once paid, share the screenshot on WhatsApp for instant activation.
                    </p>
                    <Button className="mt-6 w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-transparent shadow-sm hover:shadow transition-all" variant="outline" size="lg" asChild>
                        <a href="https://wa.me/917760704400?text=Hi, I have made the payment for my subscription on Property Dosti. Here is the screenshot." target="_blank" rel="noopener noreferrer">
                            Confirm Payment on WhatsApp
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {broker && (
                <div className="md:col-span-2 lg:col-span-3">
                    <ReferralBanner
                        referralCode={broker.referralCode}
                        uniqueBrokerId={broker.uniqueBrokerId}
                    />
                </div>
            )}
        </div>
    );
}
