
'use client';

import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QrCode, Share2, Users, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionDashboard() {
    const { user } = useStore();
    const broker = user && 'referralCode' in user ? user : null;

    if (!broker) return null;

    const expiryDate = new Date(broker.subscriptionExpiry);
    const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;

    const copyReferralCode = () => {
        navigator.clipboard.writeText(broker.referralCode);
        toast.success('Referral code copied!');
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

            <Card className="border-primary/20 bg-white/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-xl">Refer & Earn</CardTitle>
                    <CardDescription>Get 1 month free for every referral</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg flex items-center justify-between border">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Your Code</p>
                            <p className="text-xl font-mono font-bold">{broker.referralCode}</p>
                        </div>
                        <Button size={"icon" as any} variant={"ghost" as any} onClick={copyReferralCode}>
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1 text-center">
                            <p className="font-bold text-lg">{broker.referralsCount}</p>
                            <p className="text-muted-foreground">Referrals</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex-1 text-center">
                            <p className="font-bold text-lg text-green-600">{broker.referralsCount * 30} Days</p>
                            <p className="text-muted-foreground">Earned</p>
                        </div>
                    </div>
                    {broker.referralsCount > 0 && (
                        <div className="text-[10px] text-center text-muted-foreground pt-2 border-t">
                            <p>Reward: {broker.referralsCount} × 30 days extension</p>
                            <p>Next Reward: Complete next referral for +30 days</p>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                    <Button className="mt-4 w-full" variant={"outline" as any} asChild>
                        <a href="https://wa.me/919999999999?text=I%20have%20made%20the%20payment%20for%20my%20subscription%20on%20Property%20Dosti" target="_blank">
                            Confirm Payment on WhatsApp
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
