
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
                <CardHeader>
                    <CardTitle className="text-xl">Quick Payment</CardTitle>
                    <CardDescription>Scan QR to pay ₹100/month</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="w-40 h-40 bg-white border p-2 rounded-lg shadow-inner flex items-center justify-center relative group">
                        <QrCode className="w-32 h-32 text-gray-800" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <p className="text-white text-xs font-bold px-2 text-center">UPI: propertydosti@upi</p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                        Scan the QR code with any UPI app (GPay, PhonePe, Paytm).
                        Once paid, send a screenshot on WhatsApp to Admin for instant activation.
                    </p>
                    <Button className="mt-4 w-full" variant="outline" asChild>
                        <a href="https://wa.me/919999999999?text=I%20have%20made%20the%20payment%20for%20my%20subscription%20on%20Property%20Dosti" target="_blank">
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
