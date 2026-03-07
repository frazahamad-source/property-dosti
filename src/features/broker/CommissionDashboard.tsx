'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
    ArrowLeft,
    Plus,
    Trash2,
    IndianRupee,
    Briefcase,
    Globe,
    UserPlus,
    Link as LinkIcon,
    X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface CommissionRecord {
    id: string;
    broker_id: string;
    source: 'property_dosti' | 'outside';
    property_id_label: string;
    linked_property_id: string | null;
    deal_value: number;
    commission_total: number;
    tds_amount: number;
    commission_earned: number;
    created_at: string;
    shares: CommissionShare[];
}

interface CommissionShare {
    id: string;
    commission_id: string;
    shared_with_broker_id: string;
    amount: number;
    broker_name?: string;
}

interface BrokerOption {
    id: string;
    name: string;
    email: string;
}

type ViewMode = 'overview' | 'detail';
type DealSource = 'property_dosti' | 'outside';

export function CommissionDashboard() {
    const { user } = useStore();
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [currentSource, setCurrentSource] = useState<DealSource>('property_dosti');
    const [records, setRecords] = useState<CommissionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [brokers, setBrokers] = useState<BrokerOption[]>([]);

    // New record form state
    const [newDealValue, setNewDealValue] = useState('');
    const [newCommissionTotal, setNewCommissionTotal] = useState('');
    const [newTds, setNewTds] = useState('');
    const [newShares, setNewShares] = useState<{ brokerId: string; amount: string }[]>([]);

    // Fetch commission records
    const fetchRecords = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const { data, error } = await supabase
            .from('commission_records')
            .select('*')
            .eq('broker_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching commissions:', error);
        } else if (data) {
            // Fetch shares for each record
            const recordsWithShares: CommissionRecord[] = [];
            for (const rec of data) {
                const { data: shares } = await supabase
                    .from('commission_shares')
                    .select('*')
                    .eq('commission_id', rec.id);

                // Get broker names for shares
                const sharesWithNames: CommissionShare[] = [];
                if (shares) {
                    for (const share of shares) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('name')
                            .eq('id', share.shared_with_broker_id)
                            .single();
                        sharesWithNames.push({
                            ...share,
                            broker_name: profile?.name || 'Unknown',
                        });
                    }
                }

                recordsWithShares.push({
                    ...rec,
                    shares: sharesWithNames,
                });
            }
            setRecords(recordsWithShares);
        }
        setIsLoading(false);
    }, [user]);

    // Fetch broker list for sharing
    const fetchBrokers = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('status', 'approved')
            .neq('id', user.id)
            .order('name');
        if (data) {
            setBrokers(data);
        }
    }, [user]);

    useEffect(() => {
        fetchRecords();
        fetchBrokers();
    }, [fetchRecords, fetchBrokers]);

    // Computed totals
    const pdRecords = records.filter(r => r.source === 'property_dosti');
    const outsideRecords = records.filter(r => r.source === 'outside');

    const getPDTotal = () => {
        return pdRecords.reduce((sum, r) => {
            const totalShared = r.shares.reduce((s, sh) => s + sh.amount, 0);
            return sum + r.commission_earned - totalShared;
        }, 0);
    };

    const getOutsideTotal = () => {
        return outsideRecords.reduce((sum, r) => {
            const totalShared = r.shares.reduce((s, sh) => s + sh.amount, 0);
            return sum + r.commission_earned - totalShared;
        }, 0);
    };

    // Generate next Property ID label
    const getNextPropertyIdLabel = () => {
        const sourceRecords = records.filter(r => r.source === currentSource);
        const maxNum = sourceRecords.reduce((max, r) => {
            const match = r.property_id_label.match(/PD-(\d+)/);
            if (match) return Math.max(max, parseInt(match[1]));
            return max;
        }, 0);
        return `PD-${String(maxNum + 1).padStart(3, '0')}`;
    };

    // Add new commission record
    const handleAddRecord = async () => {
        if (!user) return;
        const dealValue = parseFloat(newDealValue);
        const commTotal = parseFloat(newCommissionTotal);
        const tds = parseFloat(newTds) || 0;

        if (!dealValue || !commTotal) {
            toast.error('Deal Value and Commission are required');
            return;
        }

        setIsLoading(true);
        try {
            const propertyIdLabel = getNextPropertyIdLabel();

            const { data: newRec, error } = await supabase
                .from('commission_records')
                .insert({
                    broker_id: user.id,
                    source: currentSource,
                    property_id_label: propertyIdLabel,
                    deal_value: dealValue,
                    commission_total: commTotal,
                    tds_amount: tds,
                })
                .select()
                .single();

            if (error) throw error;

            // Add shares
            for (const share of newShares) {
                if (share.brokerId && parseFloat(share.amount) > 0) {
                    const { error: shareError } = await supabase
                        .from('commission_shares')
                        .insert({
                            commission_id: newRec.id,
                            shared_with_broker_id: share.brokerId,
                            amount: parseFloat(share.amount),
                        });
                    if (shareError) console.error('Error adding share:', shareError);
                }
            }

            toast.success('Commission record added!');
            setIsAddModalOpen(false);
            resetForm();
            fetchRecords();
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Failed to add record');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete record
    const handleDeleteRecord = async (id: string) => {
        const { error } = await supabase
            .from('commission_records')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete record');
        } else {
            toast.success('Record deleted');
            fetchRecords();
        }
    };

    const resetForm = () => {
        setNewDealValue('');
        setNewCommissionTotal('');
        setNewTds('');
        setNewShares([]);
    };

    const addShareRow = () => {
        setNewShares([...newShares, { brokerId: '', amount: '' }]);
    };

    const removeShareRow = (index: number) => {
        setNewShares(newShares.filter((_, i) => i !== index));
    };

    const updateShare = (index: number, field: 'brokerId' | 'amount', value: string) => {
        const updated = [...newShares];
        updated[index][field] = value;
        setNewShares(updated);
    };

    // Computed values for the add form
    const formCommission = parseFloat(newCommissionTotal) || 0;
    const formTds = parseFloat(newTds) || 0;
    const formNetCommission = formCommission - formTds;
    const formTotalShared = newShares.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const formRemainingBalance = formNetCommission - formTotalShared;

    const currentRecords = currentSource === 'property_dosti' ? pdRecords : outsideRecords;

    const openDetail = (source: DealSource) => {
        setCurrentSource(source);
        setViewMode('detail');
    };

    // Overview: Two cards
    if (viewMode === 'overview') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Commission & Sharing</h1>
                    <p className="text-muted-foreground">Track your earnings from all deals.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {/* Property Dosti Deals Card */}
                    <Card
                        onClick={() => openDetail('property_dosti')}
                        className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] border-0 overflow-hidden group"
                    >
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 sm:p-6 text-white h-full">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold mb-1 group-hover:underline">
                                Property Dosti Deals
                            </h3>
                            <p className="text-blue-100 text-[10px] sm:text-xs mb-4">
                                Earnings from PD platform
                            </p>
                            <div className="mt-auto">
                                <p className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Total Earnings</p>
                                <p className="text-xl sm:text-2xl font-black">
                                    ₹{getPDTotal().toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-1">
                                <Badge className="bg-white/20 text-white text-[9px] border-0">
                                    {pdRecords.length} {pdRecords.length === 1 ? 'deal' : 'deals'}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Outside Deals Card */}
                    <Card
                        onClick={() => openDetail('outside')}
                        className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] border-0 overflow-hidden group"
                    >
                        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-4 sm:p-6 text-white h-full">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Globe className="h-5 w-5" />
                                </div>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold mb-1 group-hover:underline">
                                Outside Deals
                            </h3>
                            <p className="text-emerald-100 text-[10px] sm:text-xs mb-4">
                                Earnings from external deals
                            </p>
                            <div className="mt-auto">
                                <p className="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">Total Earnings</p>
                                <p className="text-xl sm:text-2xl font-black">
                                    ₹{getOutsideTotal().toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-1">
                                <Badge className="bg-white/20 text-white text-[9px] border-0">
                                    {outsideRecords.length} {outsideRecords.length === 1 ? 'deal' : 'deals'}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Detail View
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('overview')}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                        {currentSource === 'property_dosti' ? (
                            <>
                                <Briefcase className="h-5 w-5 text-blue-600" />
                                Property Dosti Deals
                            </>
                        ) : (
                            <>
                                <Globe className="h-5 w-5 text-emerald-600" />
                                Outside Deals
                            </>
                        )}
                    </h1>
                </div>
                <Button
                    size="sm"
                    onClick={() => {
                        resetForm();
                        setIsAddModalOpen(true);
                    }}
                    className="shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Deal
                </Button>
            </div>

            {/* Summary Card */}
            <div className={`rounded-xl p-4 ${currentSource === 'property_dosti'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Net Earnings</p>
                        <p className="text-2xl font-black">
                            ₹{(currentSource === 'property_dosti' ? getPDTotal() : getOutsideTotal()).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {currentRecords.length} {currentRecords.length === 1 ? 'deal' : 'deals'}
                    </Badge>
                </div>
            </div>

            {/* Records Table */}
            {currentRecords.length === 0 ? (
                <Card className="p-12 text-center">
                    <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No deals recorded yet.</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                            resetForm();
                            setIsAddModalOpen(true);
                        }}
                    >
                        Record Your First Deal
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {currentRecords.map((rec, idx) => {
                        const totalShared = rec.shares.reduce((s, sh) => s + sh.amount, 0);
                        const remaining = rec.commission_earned - totalShared;
                        return (
                            <Card key={rec.id} className="overflow-hidden border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-bold text-primary">
                                                {idx + 1}
                                            </div>
                                            {rec.linked_property_id ? (
                                                <a
                                                    href={`/property/${rec.linked_property_id}`}
                                                    target="_blank"
                                                    className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                                                >
                                                    <LinkIcon className="h-3 w-3" />
                                                    {rec.property_id_label}
                                                </a>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {rec.property_id_label}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteRecord(rec.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Deal Value</p>
                                            <p className="font-bold">₹{rec.deal_value.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Commission</p>
                                            <p className="font-bold">₹{rec.commission_total.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">TDS Deducted</p>
                                            <p className="font-bold text-red-500">
                                                {rec.tds_amount > 0 ? `-₹${rec.tds_amount.toLocaleString('en-IN')}` : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">After TDS</p>
                                            <p className="font-bold text-green-600">₹{rec.commission_earned.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>

                                    {/* Shares */}
                                    {rec.shares.length > 0 && (
                                        <div className="border-t pt-3 mt-3 space-y-2">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                                <UserPlus className="h-3 w-3" /> Shared With
                                            </p>
                                            {rec.shares.map(sh => (
                                                <div key={sh.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{sh.broker_name}</span>
                                                    <span className="font-bold text-orange-600">- ₹{sh.amount.toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-dashed">
                                                <span>Your Remaining</span>
                                                <span className="text-green-600">₹{remaining.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add Deal Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Add ${currentSource === 'property_dosti' ? 'Property Dosti' : 'Outside'} Deal`}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Property ID</p>
                        <p className="text-lg font-black text-primary font-mono">{getNextPropertyIdLabel()}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Deal Value (₹)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 5000000"
                            value={newDealValue}
                            onChange={(e) => setNewDealValue(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Total Commission (₹)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 100000"
                            value={newCommissionTotal}
                            onChange={(e) => setNewCommissionTotal(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">TDS Deduction (₹) <span className="text-muted-foreground font-normal">— optional</span></label>
                        <Input
                            type="number"
                            placeholder="e.g. 10000"
                            value={newTds}
                            onChange={(e) => setNewTds(e.target.value)}
                        />
                    </div>

                    {/* Auto-calculated fields */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Commission:</span>
                            <span className="font-bold">₹{formCommission.toLocaleString('en-IN')}</span>
                        </div>
                        {formTds > 0 && (
                            <div className="flex justify-between text-sm text-red-500">
                                <span>TDS:</span>
                                <span className="font-bold">- ₹{formTds.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold border-t border-green-200 dark:border-green-700 pt-1">
                            <span>Commission Earned:</span>
                            <span className="text-green-600">₹{formNetCommission.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Shared With */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold flex items-center gap-1">
                                <UserPlus className="h-4 w-4" /> Shared With
                            </label>
                            <Button type="button" variant="outline" size="sm" onClick={addShareRow}>
                                <Plus className="h-3 w-3 mr-1" /> Add Broker
                            </Button>
                        </div>

                        {newShares.map((share, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <select
                                    className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    value={share.brokerId}
                                    onChange={(e) => updateShare(i, 'brokerId', e.target.value)}
                                >
                                    <option value="">Select Broker</option>
                                    {brokers.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.email})</option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    placeholder="₹ Amount"
                                    className="w-28"
                                    value={share.amount}
                                    onChange={(e) => updateShare(i, 'amount', e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                    onClick={() => removeShareRow(i)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {newShares.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 space-y-1">
                                <div className="flex justify-between text-sm text-orange-600">
                                    <span>Total Shared:</span>
                                    <span className="font-bold">- ₹{formTotalShared.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold border-t border-orange-200 dark:border-orange-700 pt-1">
                                    <span>Your Remaining Balance:</span>
                                    <span className={formRemainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        ₹{formRemainingBalance.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleAddRecord}
                        isLoading={isLoading}
                        disabled={!newDealValue || !newCommissionTotal}
                    >
                        Save Commission Record
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
