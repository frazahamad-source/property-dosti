'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, QrCode, MessageSquare, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralBanner } from '@/components/broker/ReferralBanner';
import { supabase } from '@/lib/supabaseClient';
import { mapProfileToBroker } from '@/lib/authUtils';

export function SubscriptionDashboard() {
    const { user, setUser } = useStore();
    const broker = user && 'referralCode' in user ? user : null;
    const [pendingRequest, setPendingRequest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isExempt = broker && (broker.role === 'manager' || broker.role === 'supervisor');

    // Calculate plan dates
    const expiryDate = useMemo(() => broker ? new Date(broker.subscriptionExpiry) : new Date(), [broker]);
    const daysLeft = useMemo(() => {
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [expiryDate]);
    const isExpired = daysLeft <= 0;

    // Sync profile and subscription status from database
    const syncProfile = async () => {
        if (!user?.id) return;
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile for sync inside SubscriptionDashboard:', profileError.message);
                return;
            }

            if (profile) {
                const { data: userRoleData } = await supabase
                    .from('user_roles')
                    .select('*')
                    .eq('user_id', profile.id);

                const userRole = (userRoleData && userRoleData.length > 0) ? userRoleData[0] : null;
                const mappedProfile = mapProfileToBroker(profile, userRole, user.email || '');

                // Check if there are updates compared to local Zustand store
                const expiryChanged = mappedProfile.subscriptionExpiry !== (user as any).subscriptionExpiry;
                const roleChanged = mappedProfile.role !== (user as any).role;
                const statusChanged = mappedProfile.status !== (user as any).status;

                if (expiryChanged || roleChanged || statusChanged) {
                    setUser(mappedProfile);
                    console.log('Synchronized broker profile state with database inside SubscriptionDashboard.');
                }
            }
        } catch (err) {
            console.error('Failed to sync user profile in SubscriptionDashboard:', err);
        }
    };

    // Fetch the agent's latest request on mount
    const fetchLatestRequest = async () => {
        if (!broker) return;
        setIsLoading(true);
        try {
            // First sync the profile state so any DB overrides are loaded in UI
            await syncProfile();

            const { data, error } = await supabase
                .from('renewal_requests')
                .select('*')
                .eq('agent_id', broker.id)
                .order('intimated_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                setPendingRequest(data[0]);
            }
        } catch (error: any) {
            console.error('Error fetching renewal request:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestRequest();
    }, [broker?.id]);

    // Handle "I have made the payment" button click
    const handleIntimatePayment = async () => {
        if (!broker) return;
        setIsSubmitting(true);
        try {
            // Get active Supabase auth session token
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;

            const response = await fetch('/api/renewal/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    agentId: broker.id,
                    notes: 'Semi-automated payment intimated by agent via app button click.'
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit payment intimation.');
            }
            
            setPendingRequest(result.data);
            toast.success('Renewal request successfully sent to Admin for verification!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to intimate payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    // 1. MANAGER / SUPERVISOR EXEMPTION UI
    if (isExempt) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20 backdrop-blur md:col-span-2 lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">Subscription Status</CardTitle>
                            <Badge className="bg-indigo-600 text-white font-bold">Exempt Account</Badge>
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
                <Card className="border-primary/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">Subscription Validity</CardTitle>
                            <Badge variant={isExpired ? "destructive" : "default"}>
                                {isExpired ? "Expired" : "Active"}
                            </Badge>
                        </div>
                        <CardDescription>Status of your Property Dosti network access</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${isExpired ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                                <Calendar className={`h-6 w-6 ${isExpired ? 'text-red-500' : 'text-green-500'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Expiry Date</p>
                                <p className="text-xl font-black">{expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className={`p-3 rounded-lg border ${isExpired ? 'bg-red-50/50 border-red-200/50 text-red-700 dark:bg-red-950/20' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                            <p className="text-sm font-medium">
                                {daysLeft > 0
                                    ? `${daysLeft} days remaining in your membership`
                                    : 'Subscription expired. Please pay to continue.'}
                            </p>
                        </div>

                        {/* Pending Request Indicator */}
                        {pendingRequest && pendingRequest.status === 'pending' && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-start gap-3 animate-pulse">
                                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Awaiting Admin Approval</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                        You intimated payment on {new Date(pendingRequest.intimated_at).toLocaleDateString()}. Admin is currently checking bank statements.
                                    </p>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs text-amber-700 hover:text-amber-800 p-0 mt-2 flex items-center gap-1 font-bold"
                                        onClick={fetchLatestRequest}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Status
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Rejected Request Indicator */}
                        {pendingRequest && pendingRequest.status === 'rejected' && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/40 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Renewal Disapproved</h4>
                                    <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-semibold">
                                        Reason: {pendingRequest.rejection_reason || "Payment not found in bank ledger."}
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                        Please ensure you paid the correct UPI account and that your WhatsApp message matches your Agent ID: **{broker.uniqueBrokerId || broker.id}**.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="border-primary/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur md:col-span-2 lg:col-span-2">
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
                        Once paid, click below to verify on WhatsApp, then intimate the admin in-app.
                    </p>

                    <div className="w-full space-y-3 mt-6">
                        <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-transparent shadow-sm hover:shadow transition-all font-semibold rounded-xl py-5" variant="outline" size="lg" asChild>
                            <a href={`https://wa.me/917760704400?text=Hi+Property+Dosti+Admin%2C+I+have+made+the+subscription+payment.+My+Agent+ID+is+${broker ? (broker.uniqueBrokerId || broker.id) : 'N/A'}.+Please+verify+and+approve+my+request.`} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="mr-2 h-5 w-5 fill-current" />
                                1. Open WhatsApp to Send Receipt
                            </a>
                        </Button>

                        <Button
                            onClick={handleIntimatePayment}
                            disabled={isSubmitting || (pendingRequest && pendingRequest.status === 'pending')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold rounded-xl py-5"
                            size="lg"
                        >
                            {isSubmitting ? 'Submitting...' : pendingRequest && pendingRequest.status === 'pending' ? 'Verification Awaiting Admin Review' : '2. I Have Made the Payment'}
                        </Button>
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
