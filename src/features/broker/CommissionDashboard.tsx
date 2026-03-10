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
    X,
    Building2,
    ArrowDownLeft,
    Edit,
    Download,
    Mail,
    FileText,
    FileSpreadsheet,
    Calendar,
    Info,
    ChevronDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { getFinancialYearDates, getFinancialYearString, getReportPeriodDates, ReportPeriod, DateRange } from '@/lib/dateUtils';
import { exportCommissionToExcel as exportExcel, exportCommissionToPDF as exportPDF, CommissionExportData } from '@/lib/exportUtils';
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
    unique_broker_id?: string;
}

interface ReceivedShare {
    id: string;
    commission_id: string;
    amount: number;
    created_at: string;
    source: 'property_dosti' | 'outside';
    property_id_label: string;
    linked_property_id: string | null;
    deal_value: number;
    shared_by_name: string;
    shared_by_id: string;
}

interface BrokerOption {
    id: string;
    name: string;
    email: string;
}

// Property info passed when clicking "Sold" on a property
export interface SoldPropertyInfo {
    propertyId: string;
    title: string;
    price: number;
    location: string;
    district: string;
}

type ViewMode = 'overview' | 'detail';
type DealSource = 'property_dosti' | 'outside';

interface CommissionDashboardProps {
    soldProperty?: SoldPropertyInfo | null;
    onSoldComplete?: () => void;
}

export function CommissionDashboard({ soldProperty, onSoldComplete }: CommissionDashboardProps) {
    const { user } = useStore();
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [currentSource, setCurrentSource] = useState<DealSource>('property_dosti');
    const [records, setRecords] = useState<CommissionRecord[]>([]);
    const [receivedShares, setReceivedShares] = useState<ReceivedShare[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [brokers, setBrokers] = useState<BrokerOption[]>([]);

    // New record form state
    const [newDealValue, setNewDealValue] = useState('');
    const [newCommissionPercentage, setNewCommissionPercentage] = useState('');
    const [newCommissionTotal, setNewCommissionTotal] = useState('');
    const [newTds, setNewTds] = useState('');
    const [newShares, setNewShares] = useState<{ brokerId: string; amount: string }[]>([]);
    const [newDealSource, setNewDealSource] = useState<DealSource>('property_dosti');
    const [editRecordId, setEditRecordId] = useState<string | null>(null);
    const [handledSoldPropertyId, setHandledSoldPropertyId] = useState<string | null>(null);

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [pendingExportAction, setPendingExportAction] = useState<{ type: 'excel' | 'pdf' | 'email', period: ReportPeriod } | null>(null);

    // If a soldProperty is passed, auto-open the form in PD detail view
    useEffect(() => {
        if (soldProperty && soldProperty.propertyId !== handledSoldPropertyId) {
            setCurrentSource('property_dosti');
            setViewMode('detail');
            setNewDealValue(soldProperty.price > 0 ? String(soldProperty.price) : '');
            setNewCommissionPercentage('');
            setNewCommissionTotal('');
            setNewTds('');
            setNewShares([]);
            setNewDealSource('property_dosti');
            setIsAddModalOpen(true);
            setHandledSoldPropertyId(soldProperty.propertyId);
        }
    }, [soldProperty, handledSoldPropertyId]);

    // Fetch own commission records
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
            const recordsWithShares: CommissionRecord[] = [];
            for (const rec of data) {
                const { data: shares } = await supabase
                    .from('commission_shares')
                    .select('*')
                    .eq('commission_id', rec.id);

                const sharesWithNames: CommissionShare[] = [];
                if (shares) {
                    for (const share of shares) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('name, unique_broker_id')
                            .eq('id', share.shared_with_broker_id)
                            .single();
                        sharesWithNames.push({
                            ...share,
                            broker_name: profile?.name || 'Unknown',
                            unique_broker_id: profile?.unique_broker_id || 'N/A',
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

    // Fetch received shares (commissions shared WITH this user)
    const fetchReceivedShares = useCallback(async () => {
        if (!user) return;

        const { data: shares, error } = await supabase
            .from('commission_shares')
            .select('*')
            .eq('shared_with_broker_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching received shares:', error);
            return;
        }

        if (!shares || shares.length === 0) {
            setReceivedShares([]);
            return;
        }

        const received: ReceivedShare[] = [];
        for (const share of shares) {
            // Fetch parent commission record
            const { data: rec } = await supabase
                .from('commission_records')
                .select('*')
                .eq('id', share.commission_id)
                .single();

            if (rec) {
                // Fetch sharer's name
                const { data: sharerProfile } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', rec.broker_id)
                    .single();

                received.push({
                    id: share.id,
                    commission_id: share.commission_id,
                    amount: share.amount,
                    created_at: share.created_at,
                    source: rec.source,
                    property_id_label: rec.property_id_label,
                    linked_property_id: rec.linked_property_id,
                    deal_value: rec.deal_value,
                    shared_by_name: sharerProfile?.name || 'Unknown',
                    shared_by_id: rec.broker_id,
                });
            }
        }
        setReceivedShares(received);
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
        fetchReceivedShares();
        fetchBrokers();
    }, [fetchRecords, fetchReceivedShares, fetchBrokers]);

    // Computed totals — own records
    const pdRecords = records.filter(r => r.source === 'property_dosti');
    const outsideRecords = records.filter(r => r.source === 'outside');

    // Received shares by source
    const pdReceivedShares = receivedShares.filter(r => r.source === 'property_dosti');
    const outsideReceivedShares = receivedShares.filter(r => r.source === 'outside');

    // Filter for Financial Year Total
    const fyDates = getFinancialYearDates();

    const filterByFY = (item: any) => {
        const itemDate = new Date(item.created_at || item.dealDate || new Date());
        return itemDate >= fyDates.start && itemDate <= fyDates.end;
    };

    const getOwnPDTotal = () => {
        return pdRecords.filter(filterByFY).reduce((sum, r) => {
            const totalShared = r.shares.reduce((s, sh) => s + Number(sh.amount || 0), 0);
            return sum + Number(r.commission_earned || 0) - totalShared;
        }, 0);
    };

    const getOwnOutsideTotal = () => {
        return outsideRecords.filter(filterByFY).reduce((sum, r) => {
            const totalShared = r.shares.reduce((s, sh) => s + Number(sh.amount || 0), 0);
            return sum + Number(r.commission_earned || 0) - totalShared;
        }, 0);
    };

    const getReceivedPDTotal = () => pdReceivedShares.filter(filterByFY).reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const getReceivedOutsideTotal = () => outsideReceivedShares.filter(filterByFY).reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const getPDTotal = () => getOwnPDTotal() + getReceivedPDTotal();
    const getOutsideTotal = () => getOwnOutsideTotal() + getReceivedOutsideTotal();

    // Generate next Property ID label
    const getNextPropertyIdLabel = () => {
        const allRecords = records;
        const maxNum = allRecords.reduce((max, r) => {
            const match = r.property_id_label.match(/PD-(\d+)/);
            if (match) return Math.max(max, parseInt(match[1]));
            return max;
        }, 0);
        return `PD-${String(maxNum + 1).padStart(3, '0')}`;
    };

    // Send notification to a broker
    const sendNotification = async (brokerId: string, message: string) => {
        await supabase
            .from('broker_notifications')
            .insert({ broker_id: brokerId, message });
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
            let recordId = '';
            let propertyIdLabel = '';

            if (editRecordId) {
                // Update existing record
                const { error: updateError } = await supabase
                    .from('commission_records')
                    .update({
                        deal_value: dealValue,
                        commission_total: commTotal,
                        tds_amount: tds,
                    })
                    .eq('id', editRecordId);

                if (updateError) throw updateError;
                recordId = editRecordId;

                // Delete old shares, we will re-insert them
                await supabase
                    .from('commission_shares')
                    .delete()
                    .eq('commission_id', editRecordId);

                // Find property label for notifications
                const existingRec = records.find(r => r.id === editRecordId);
                propertyIdLabel = existingRec?.property_id_label || '-';

            } else {
                // Insert new record
                propertyIdLabel = getNextPropertyIdLabel();

                const { data: newRec, error } = await supabase
                    .from('commission_records')
                    .insert({
                        broker_id: user.id,
                        source: newDealSource,
                        property_id_label: newDealSource === 'property_dosti' ? propertyIdLabel : '-',
                        linked_property_id: soldProperty?.propertyId || null,
                        deal_value: dealValue,
                        commission_total: commTotal,
                        tds_amount: tds,
                    })
                    .select()
                    .single();

                if (error) throw error;
                recordId = newRec.id;
            }

            // Get current user's name for notification
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', user.id)
                .single();
            const myName = myProfile?.name || 'A broker';

            // Add shares and send notifications
            for (const share of newShares) {
                if (share.brokerId && parseFloat(share.amount) > 0) {
                    const shareAmount = parseFloat(share.amount);
                    const { error: shareError } = await supabase
                        .from('commission_shares')
                        .insert({
                            commission_id: recordId,
                            shared_with_broker_id: share.brokerId,
                            amount: shareAmount,
                        });
                    if (shareError) {
                        console.error('Error adding share:', shareError);
                    } else {
                        // Notify recipient
                        await sendNotification(
                            share.brokerId,
                            `You received ₹${shareAmount.toLocaleString('en-IN')} commission from ${myName} (${propertyIdLabel}). Contact them for details.`
                        );
                    }
                }
            }

            // If this was a "Sold" flow, mark the property as sold
            if (soldProperty) {
                const { error: updateError } = await supabase
                    .from('properties')
                    .update({ is_active: false, is_sold: true })
                    .eq('id', soldProperty.propertyId);

                if (updateError) {
                    console.error('Error marking property as sold:', updateError);
                    toast.error('Commission saved, but failed to mark property as sold.');
                } else {
                    toast.success('Property marked as Sold & Commission recorded!');
                }
                onSoldComplete?.();
            } else {
                toast.success(editRecordId ? 'Commission record updated!' : 'Commission record added!');
            }

            setIsAddModalOpen(false);
            resetForm();
            fetchRecords();
            fetchReceivedShares();
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Failed to add record');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete record — cascade deletes shares, notify affected brokers
    const handleDeleteRecord = async (rec: CommissionRecord) => {
        // Get current user's name
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user!.id)
            .single();
        const myName = myProfile?.name || 'A broker';

        // Notify all share recipients before deletion
        for (const share of rec.shares) {
            await sendNotification(
                share.shared_with_broker_id,
                `Commission share of ₹${share.amount.toLocaleString('en-IN')} (${rec.property_id_label}) was removed by ${myName}. Contact them for details.`
            );
        }

        const { error } = await supabase
            .from('commission_records')
            .delete()
            .eq('id', rec.id);

        if (error) {
            toast.error('Failed to delete record');
        } else {
            toast.success('Record deleted');
            if (rec.linked_property_id && rec.source === 'property_dosti') {
                const { error: updateError } = await supabase
                    .from('properties')
                    .update({ is_active: true, is_sold: false })
                    .eq('id', rec.linked_property_id);
                if (updateError) console.error('Error reactivating property:', updateError);
            }
            fetchRecords();
            fetchReceivedShares();
        }
    };

    const openCustomDateRange = (actionType: 'excel' | 'pdf' | 'email') => {
        setPendingExportAction({ type: actionType, period: 'custom' });
        setCustomRange({ start: '', end: '' });
        setIsCustomDateOpen(true);
    };

    const executeExport = async (type: 'excel' | 'pdf' | 'email', period: ReportPeriod, customDates?: DateRange) => {
        setIsExporting(true);
        try {
            const dateRange = getReportPeriodDates(period, customDates);

            // Generate standard label strings
            const periodLabels: Record<ReportPeriod, string> = {
                monthly: 'Monthly',
                quarterly: 'Quarterly',
                half_yearly: 'Half-Yearly',
                yearly: 'Yearly (Current FY)',
                previous_year: 'Previous FY',
                custom: 'Custom Range'
            };
            const periodLabel = periodLabels[period];

            // Format dates
            const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const dateRangeStr = `${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`;

            // Filter all relevant current tab records
            const rawRecords = currentSource === 'property_dosti' ? pdRecords : outsideRecords;
            const periodRecords = rawRecords.filter(r => {
                const itemDate = new Date(r.created_at);
                return itemDate >= dateRange.start && itemDate <= dateRange.end;
            });

            if (periodRecords.length === 0) {
                toast.error('No deals found in this period.');
                setIsExporting(false);
                return;
            }

            // Build metrics
            let totalGross = 0;
            let totalTds = 0;
            let totalShared = 0;
            let netPayable = 0;

            const mappedRecords = periodRecords.map(r => {
                const dealShared = r.shares.reduce((s, sh) => s + Number(sh.amount || 0), 0);
                const dealNet = Number(r.commission_earned || 0) - dealShared;

                // Create a string of shared broker details
                const sharedDetails = r.shares.length > 0
                    ? r.shares.map(sh => `${sh.broker_name || 'Unknown'} (${sh.unique_broker_id || 'N/A'}): Rs. ${Number(sh.amount || 0).toLocaleString('en-IN')}`).join(' | ')
                    : 'None';

                totalGross += Number(r.commission_total || 0);
                totalTds += Number(r.tds_amount || 0);
                totalShared += dealShared;
                netPayable += dealNet;

                return {
                    id: r.id,
                    referenceId: r.property_id_label,
                    dealType: r.source,
                    dealDate: r.created_at,
                    dealValue: Number(r.deal_value || 0),
                    tds: Number(r.tds_amount || 0),
                    sharedAmount: dealShared,
                    sharedDetails: sharedDetails,
                    netCommission: dealNet,
                    status: 'Active'
                };
            });

            // Use type casting to safely access name property
            const agentName = (user as any)?.name || user?.email || 'Broker';

            const exportData: CommissionExportData = {
                periodLabel,
                agentName,
                dateRangeStr,
                metrics: {
                    totalGross,
                    totalTds,
                    totalShared,
                    netPayable,
                    dealCount: mappedRecords.length
                },
                records: mappedRecords
            };

            // Dispatch Action
            if (type === 'excel') {
                exportExcel(exportData);
                toast.success('Excel statement downloaded!');
            } else if (type === 'pdf') {
                exportPDF(exportData);
                toast.success('PDF statement downloaded!');
            } else if (type === 'email') {
                const req = await fetch('/api/email-statement', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user?.email,
                        agentName: user?.email,
                        periodLabel,
                        dateRangeStr,
                        statementData: exportData
                    })
                });

                if (req.ok) {
                    toast.success('Statement has been emailed successfully!');
                } else {
                    throw new Error('Email delivery failed');
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to generate statement. Try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportAction = (type: 'excel' | 'pdf' | 'email', period: ReportPeriod) => {
        if (period === 'custom') {
            openCustomDateRange(type);
        } else {
            executeExport(type, period);
        }
    };

    const handleCustomDateSubmit = () => {
        if (!customRange.start || !customRange.end) {
            toast.error('Please select both start and end dates');
            return;
        }

        const startNode = new Date(customRange.start);
        const endNode = new Date(customRange.end);

        if (startNode > endNode) {
            toast.error('Start date cannot be after end date');
            return;
        }

        setIsCustomDateOpen(false);
        if (pendingExportAction) {
            executeExport(pendingExportAction.type, 'custom', { start: startNode, end: endNode });
            setPendingExportAction(null);
        }
    };

    const resetForm = () => {
        setNewDealValue('');
        setNewCommissionPercentage('');
        setNewCommissionTotal('');
        setNewTds('');
        setNewShares([]);
        setNewDealSource(currentSource);
        setEditRecordId(null);
    };

    const handleEditRecord = (rec: CommissionRecord) => {
        setEditRecordId(rec.id);
        setNewDealSource(rec.source);
        setNewDealValue(String(rec.deal_value || ''));
        setNewCommissionTotal(String(rec.commission_total || ''));
        setNewTds(String(rec.tds_amount || ''));

        // Derive percentage if it exists smoothly without overwriting manual total
        if (rec.deal_value && rec.commission_total) {
            const pct = (rec.commission_total / rec.deal_value) * 100;
            // Only set if it's a clean float to 2 decimals
            if (Number.isInteger(pct) || pct.toFixed(2).endsWith('0')) {
                setNewCommissionPercentage(pct.toString());
            } else {
                setNewCommissionPercentage(pct.toFixed(2));
            }
        } else {
            setNewCommissionPercentage('');
        }

        setNewShares(rec.shares.map(sh => ({
            brokerId: sh.shared_with_broker_id,
            amount: String(sh.amount)
        })));
        setIsAddModalOpen(true);
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
    const currentReceivedShares = currentSource === 'property_dosti' ? pdReceivedShares : outsideReceivedShares;

    const openDetail = (source: DealSource) => {
        setCurrentSource(source);
        setViewMode('detail');
    };

    // Overview: Two cards
    if (viewMode === 'overview') {
        return (
            <div className="space-y-6 pt-2">
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
                                <p className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Your Remaining Balance</p>
                                <p className="text-xl sm:text-2xl font-black">
                                    ₹{getPDTotal().toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-1 flex-wrap">
                                <Badge className="bg-white/20 text-white text-[9px] border-0">
                                    {pdRecords.length} own {pdRecords.length === 1 ? 'deal' : 'deals'}
                                </Badge>
                                {pdReceivedShares.length > 0 && (
                                    <Badge className="bg-white/30 text-white text-[9px] border-0">
                                        +{pdReceivedShares.length} received
                                    </Badge>
                                )}
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
                                <p className="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">Your Remaining Balance</p>
                                <p className="text-xl sm:text-2xl font-black">
                                    ₹{getOutsideTotal().toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-1 flex-wrap">
                                <Badge className="bg-white/20 text-white text-[9px] border-0">
                                    {outsideRecords.length} own {outsideRecords.length === 1 ? 'deal' : 'deals'}
                                </Badge>
                                {outsideReceivedShares.length > 0 && (
                                    <Badge className="bg-white/30 text-white text-[9px] border-0">
                                        +{outsideReceivedShares.length} received
                                    </Badge>
                                )}
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
                    onClick={() => {
                        setViewMode('overview');
                        onSoldComplete?.();
                    }}
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
            <div className={`rounded-xl p-4 md:p-6 shadow-sm ${currentSource === 'property_dosti'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800'
                }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300">Total Earned Commission</h2>
                            <Badge variant="secondary" className="font-mono text-[10px] md:text-xs tracking-tight">
                                {getFinancialYearString()}
                            </Badge>
                            <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="pointer-events-none absolute left-0 bottom-full mb-2 w-48 opacity-0 transition-opacity group-hover:opacity-100 bg-gray-900 text-white text-[10px] p-2 rounded z-50">
                                    Calculated from April 1st to March 31st. Includes received shares and deducts TDS & shares given.
                                </div>
                            </div>
                        </div>
                        <p className={`text-3xl md:text-4xl font-black ${(currentSource === 'property_dosti' ? getPDTotal() : getOutsideTotal()) > 0 ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
                            ₹{(currentSource === 'property_dosti' ? getPDTotal() : getOutsideTotal()).toLocaleString('en-IN')}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 self-start md:self-end">
                        {/* Download Statement Dropdown */}
                        <DropdownMenu align="right" trigger={
                            <Button size="sm" variant="outline" className="w-full sm:w-auto bg-white dark:bg-gray-900 justify-between sm:justify-center px-4" disabled={isExporting}>
                                {isExporting ? (
                                    <span className="animate-pulse">Loading...</span>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2 text-primary" />
                                        <span>Download Statement</span>
                                        <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                                    </>
                                )}
                            </Button>
                        }>
                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Select Period (Excel)</div>
                            <DropdownMenuItem onClick={() => handleExportAction('excel', 'monthly')}><FileSpreadsheet className="h-4 w-4 text-green-600" /> Monthly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAction('excel', 'quarterly')}><FileSpreadsheet className="h-4 w-4 text-green-600" /> Quarterly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAction('excel', 'half_yearly')}><FileSpreadsheet className="h-4 w-4 text-green-600" /> Half-Yearly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAction('excel', 'yearly')}><FileSpreadsheet className="h-4 w-4 text-green-600" /> Yearly (Current FY)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAction('excel', 'previous_year')}><FileSpreadsheet className="h-4 w-4 text-green-600" /> Previous FY</DropdownMenuItem>

                            <div className="border-t my-1"></div>
                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Select Period (PDF)</div>
                            <DropdownMenuItem onClick={() => handleExportAction('pdf', 'monthly')}><FileText className="h-4 w-4 text-red-500" /> Monthly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAction('pdf', 'quarterly')}><FileText className="h-4 w-4 text-red-500" /> Quarterly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAction('pdf', 'yearly')}><FileText className="h-4 w-4 text-red-500" /> Yearly (Current FY)</DropdownMenuItem>

                            <div className="border-t my-1"></div>
                            <DropdownMenuItem onClick={() => openCustomDateRange('excel')}><Calendar className="h-4 w-4 text-blue-500" /> Custom Range...</DropdownMenuItem>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* ---- Own Deals Section ---- */}
            {currentRecords.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Deals</h3>
                    {currentRecords.map((rec, idx) => {
                        const totalShared = rec.shares.reduce((s, sh) => s + Number(sh.amount || 0), 0);
                        const remaining = Number(rec.commission_earned || 0) - totalShared;
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
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-gray-400 hover:text-primary hover:bg-primary/10"
                                                onClick={() => handleEditRecord(rec)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteRecord(rec)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
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

            {/* ---- Received Shares Section ---- */}
            {currentReceivedShares.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        Received from Other Brokers
                    </h3>
                    {currentReceivedShares.map((rs, idx) => (
                        <Card key={rs.id} className="overflow-hidden border-green-100 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10 hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded font-bold text-green-700 dark:text-green-400">
                                            R{idx + 1}
                                        </div>
                                        {rs.linked_property_id ? (
                                            <a
                                                href={`/property/${rs.linked_property_id}`}
                                                target="_blank"
                                                className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                                            >
                                                <LinkIcon className="h-3 w-3" />
                                                {rs.property_id_label}
                                            </a>
                                        ) : (
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {rs.property_id_label}
                                            </span>
                                        )}
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px]">
                                        Received
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Deal Value</p>
                                        <p className="font-bold">₹{rs.deal_value.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Your Share</p>
                                        <p className="font-bold text-green-600">₹{rs.amount.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-3 mt-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <UserPlus className="h-3 w-3" />
                                        Shared by <span className="font-semibold text-foreground">{rs.shared_by_name}</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(rs.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty state when no records and no received */}
            {currentRecords.length === 0 && currentReceivedShares.length === 0 && (
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
            )}

            {/* Add Deal Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    if (soldProperty) onSoldComplete?.();
                }}
                title={soldProperty
                    ? `Record Sale — ${soldProperty.title}`
                    : `Add ${newDealSource === 'property_dosti' ? 'Property Dosti' : 'Outside'} Deal`
                }
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    {/* Property info banner for Sold flow */}
                    {soldProperty && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-1">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-bold">
                                <Building2 className="h-4 w-4" />
                                Marking Property as Sold
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-500">
                                {soldProperty.title} — {soldProperty.location}, {soldProperty.district}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Listed price: ₹{soldProperty.price.toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Deal Type</label>
                        <select
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            value={newDealSource}
                            onChange={(e) => setNewDealSource(e.target.value as DealSource)}
                            disabled={!!soldProperty || !!editRecordId}
                        >
                            <option value="property_dosti">Property Dosti Deal</option>
                            <option value="outside">Outside Deal</option>
                        </select>
                    </div>

                    {newDealSource === 'property_dosti' && !editRecordId && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Property ID</p>
                            <p className="text-lg font-black text-primary font-mono">{getNextPropertyIdLabel()}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Deal Value (₹)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 5000000"
                            value={newDealValue}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNewDealValue(val);
                                // Auto-update total commission if percentage is set
                                const pct = parseFloat(newCommissionPercentage);
                                const dealVal = parseFloat(val);
                                if (!isNaN(pct) && !isNaN(dealVal)) {
                                    setNewCommissionTotal(Math.round(dealVal * (pct / 100)).toString());
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">
                            Commission Percentage (%) <span className="text-muted-foreground font-normal">— optional</span>
                        </label>
                        <Input
                            type="number"
                            placeholder="e.g. 2"
                            step="0.01"
                            value={newCommissionPercentage}
                            onChange={(e) => {
                                const pctVal = e.target.value;
                                setNewCommissionPercentage(pctVal);

                                const pct = parseFloat(pctVal);
                                const dealVal = parseFloat(newDealValue);

                                if (!isNaN(pct) && !isNaN(dealVal)) {
                                    setNewCommissionTotal(Math.round(dealVal * (pct / 100)).toString());
                                } else if (pctVal === '') {
                                    // Optional: clear or leave total commission when percentage is cleared
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Total Commission (₹)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 100000"
                            value={newCommissionTotal}
                            onChange={(e) => {
                                setNewCommissionTotal(e.target.value);
                                // Optional: You could update percentage backwards here, 
                                // but the request says "If user manually enters a value... it should override" 
                                // and "If user modifies percentage... it should recalculate". 
                                // Leaving percentage unchanged but allowing manual override.
                            }}
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
                            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Input
                                        type="number"
                                        placeholder="₹ Amount"
                                        className="w-full sm:w-28"
                                        value={share.amount}
                                        onChange={(e) => updateShare(i, 'amount', e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-red-400 hover:text-red-600 shrink-0 border border-red-200 sm:border-transparent dark:border-red-900 sm:dark:border-transparent"
                                        onClick={() => removeShareRow(i)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
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
                        className={`w-full ${soldProperty ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={handleAddRecord}
                        isLoading={isLoading}
                        disabled={!newDealValue || !newCommissionTotal}
                    >
                        {soldProperty ? '✓ Mark as Sold & Save Commission' : editRecordId ? 'Update Commission Record' : 'Save Commission Record'}
                    </Button>
                </div>
            </Modal>

            {/* Custom Date Range Modal */}
            <Modal
                isOpen={isCustomDateOpen}
                onClose={() => setIsCustomDateOpen(false)}
                title="Select Custom Date Range"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Select a start and end date to generate your custom commission statement.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Start Date</label>
                            <Input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">End Date</label>
                            <Input
                                type="date"
                                min={customRange.start}
                                value={customRange.end}
                                onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCustomDateOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={handleCustomDateSubmit}
                            disabled={!customRange.start || !customRange.end}
                        >
                            Generate
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
