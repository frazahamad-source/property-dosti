'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { Check, X, RefreshCw, Calendar, ArrowUpRight, Search, FileSpreadsheet, ShieldAlert, CreditCard } from 'lucide-react';

export function SubscriptionManager() {
    const [activeTab, setActiveTab] = useState<'requests' | 'manual'>('requests');
    const [requests, setRequests] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Manual renewal form state
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [duration, setDuration] = useState('30'); // default 30 days
    const [customDays, setCustomDays] = useState('');
    const [overrideReason, setOverrideReason] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch pending/rejected requests with Agent details from profiles
            const { data: reqData, error: reqError } = await supabase
                .from('renewal_requests')
                .select('*, profiles:agent_id(name, phone, unique_broker_id, subscription_expiry)')
                .order('intimated_at', { ascending: false });

            if (reqError) throw reqError;
            setRequests(reqData || []);

            // 2. Fetch all agents (profiles) for the manual override list
            const { data: agentData, error: agentError } = await supabase
                .from('profiles')
                .select('id, name, phone, unique_broker_id, subscription_expiry')
                .eq('is_admin', false)
                .order('name', { ascending: true });

            if (agentError) throw agentError;
            setAgents(agentData || []);

        } catch (error: any) {
            toast.error(error.message || 'Failed to load subscription administration data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 🟢 HANDLE APPROVAL & EXTENSION
    const handleApprove = async (request: any) => {
        try {
            // Get active session token
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const response = await fetch('/api/renewal/approve', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ requestId: request.id })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Verification execution failed.');

            toast.success(`Agent ${request.profiles?.name || 'Broker'} subscription extended successfully!`);
            
            // Auto open dynamic whatsapp confirmation (Optional)
            const agentName = request.profiles?.name || 'Broker';
            const rawExpiry = new Date(result.newExpiry);
            const formattedExpiry = rawExpiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
            const message = `Hi ${agentName}, your Property Dosti subscription renewal has been approved! Expiry extended until ${formattedExpiry}. Enjoy premium platform access!`;
            const waLink = `https://wa.me/${request.profiles?.phone || ''}?text=${encodeURIComponent(message)}`;
            
            toast(`Confirmation WhatsApp template ready.`, {
                action: {
                    label: 'Send on WhatsApp',
                    onClick: () => window.open(waLink, '_blank')
                }
            });

            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Verification execution failed.');
        }
    };

    // 🔴 HANDLE REJECTION WITH REASON
    const handleReject = async (requestId: string, agentPhone: string, agentName: string) => {
        if (!rejectionReason.trim()) {
            toast.warning('Please enter a rejection reason.');
            return;
        }

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const response = await fetch('/api/renewal/reject', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ requestId, reason: rejectionReason })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to reject request.');

            toast.success('Subscription request rejected.');
            
            // Send WhatsApp rejection details (Optional)
            const message = `Hi ${agentName}, your Property Dosti subscription renewal request could not be verified. Reason: ${rejectionReason}. Please make sure your transaction fits ₹100.`;
            const waLink = `https://wa.me/${agentPhone || ''}?text=${encodeURIComponent(message)}`;
            
            toast(`WhatsApp notification template ready.`, {
                action: {
                    label: 'Notify on WhatsApp',
                    onClick: () => window.open(waLink, '_blank')
                }
            });

            setRejectionReason('');
            setActiveRejectId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject request.');
        }
    };

    // ⚙️ HANDLE MANUAL OVERRIDE (WITH OR WITHOUT PAYMENT)
    const handleManualOverride = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgentId) {
            toast.warning('Please select an agent.');
            return;
        }
        if (!overrideReason.trim()) {
            toast.warning('Please input a valid explanation reason for the override.');
            return;
        }

        const days = duration === 'custom' ? parseInt(customDays) : parseInt(duration);
        if (isNaN(days) || days <= 0) {
            toast.warning('Please input a valid positive day number.');
            return;
        }

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const response = await fetch('/api/renewal/manual', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    agentId: selectedAgentId,
                    days,
                    reason: overrideReason
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Override API request failed.');

            toast.success('Manual renewal override process succeeded!');
            setSelectedAgentId('');
            setOverrideReason('');
            setCustomDays('');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Override API request failed.');
        }
    };

    // Filter requests by search query
    const filteredRequests = requests.filter(req => {
        const name = req.profiles?.name || '';
        const phone = req.profiles?.phone || '';
        const uniqueId = req.profiles?.unique_broker_id || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) || phone.includes(query) || uniqueId.toLowerCase().includes(query);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Subscription Hub</h2>
                        <p className="text-sm text-muted-foreground">Manage agent subscriptions, approve QR payments, and execute overrides.</p>
                    </div>
                </div>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'requests' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                        Pending Requests ({requests.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                        ⚙️ Manual Override
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: REQUESTS QUEUE */}
            {activeTab === 'requests' && (
                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                        <div>
                            <CardTitle>Renewal Verification Queue</CardTitle>
                            <CardDescription>Match intimated payment records against your bank statements before approving.</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by Agent name, ID, phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground font-medium">
                                No renewal requests matching criteria found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-muted-foreground font-semibold text-xs tracking-wider uppercase bg-slate-50 dark:bg-slate-950/20">
                                            <th className="p-4">Agent details</th>
                                            <th className="p-4">WhatsApp Contact</th>
                                            <th className="p-4">Intimated time</th>
                                            <th className="p-4">Current Expiry</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map((req) => (
                                            <tr key={req.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                <td className="p-4">
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{req.profiles?.name || 'Unknown Agent'}</div>
                                                        <div className="text-xs font-mono text-muted-foreground">ID: {req.profiles?.unique_broker_id || req.agent_id.substring(0,8)}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                                                    {req.profiles?.phone || 'N/A'}
                                                </td>
                                                <td className="p-4 text-xs text-muted-foreground">
                                                    {new Date(req.intimated_at).toLocaleString('en-IN')}
                                                </td>
                                                <td className="p-4 text-xs font-semibold">
                                                    {req.profiles?.subscription_expiry ? new Date(req.profiles.subscription_expiry).toLocaleDateString('en-IN') : 'None'}
                                                </td>
                                                <td className="p-4">
                                                    <Badge 
                                                        className={
                                                            req.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                                            req.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        }
                                                    >
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right space-y-2">
                                                    {req.status === 'pending' && (
                                                        <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-2">
                                                            {activeRejectId === req.id ? (
                                                                <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 max-w-xs text-left">
                                                                    <textarea 
                                                                        placeholder="Reason for rejection (e.g. Payment not found)" 
                                                                        value={rejectionReason}
                                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                                        className="w-full text-xs p-2 border border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                                                                        rows={2}
                                                                    />
                                                                    <div className="flex gap-2 justify-end">
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setActiveRejectId(null)}>Cancel</Button>
                                                                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleReject(req.id, req.profiles?.phone, req.profiles?.name)}>Confirm Reject</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8"
                                                                        onClick={() => handleApprove(req)}
                                                                    >
                                                                        ✅ Approve
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="destructive"
                                                                        className="h-8 font-bold"
                                                                        onClick={() => setActiveRejectId(req.id)}
                                                                    >
                                                                        ❌ Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    {req.status === 'rejected' && (
                                                        <span className="text-xs text-red-500 font-semibold block">
                                                            Reason: {req.rejection_reason}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: MANUAL RENEWAL FORM */}
            {activeTab === 'manual' && (
                <Card className="max-w-2xl mx-auto shadow-md">
                    <CardHeader>
                        <CardTitle>Manual Expiration Override</CardTitle>
                        <CardDescription>Instantly update the subscription duration of any agent. No transaction check required.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleManualOverride} className="space-y-5">
                            {/* 1. AGENT SELECT */}
                            <div>
                                <label className="block text-sm font-bold mb-1.5">1. Target Agent Account</label>
                                <select 
                                    value={selectedAgentId} 
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 text-sm font-medium"
                                    required
                                >
                                    <option value="">-- Choose an Agent --</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} ({agent.unique_broker_id || 'No ID'}) - Expiry: {agent.subscription_expiry ? new Date(agent.subscription_expiry).toLocaleDateString() : 'None'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. DURATION */}
                            <div>
                                <label className="block text-sm font-bold mb-1.5">2. Extension Plan Duration</label>
                                <div className="grid grid-cols-4 gap-2.5">
                                    {[
                                        { label: '30 Days', value: '30' },
                                        { label: '90 Days', value: '90' },
                                        { label: '180 Days', value: '180' },
                                        { label: 'Custom', value: 'custom' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setDuration(opt.value)}
                                            className={`p-3 text-xs font-bold rounded-xl border text-center transition-all ${duration === opt.value ? 'bg-primary border-primary text-white shadow-sm' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {duration === 'custom' && (
                                    <div className="mt-3">
                                        <input
                                            type="number"
                                            placeholder="Input extension period in days"
                                            value={customDays}
                                            onChange={(e) => setCustomDays(e.target.value)}
                                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 text-sm font-medium"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 3. REASON */}
                            <div>
                                <label className="block text-sm font-bold mb-1.5">3. Justification / Audit Reason</label>
                                <textarea
                                    required
                                    placeholder="e.g. Compensation, Promotion, Support adjustment, Extended trial..."
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    rows={3}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 text-sm"
                                />
                            </div>

                            {/* SUBMIT BUTTON */}
                            <Button 
                                type="submit" 
                                className="w-full py-6 font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 rounded-xl flex items-center justify-center gap-2 text-sm"
                            >
                                <ArrowUpRight className="h-4.5 w-4.5" /> Execute Manual Extension
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
