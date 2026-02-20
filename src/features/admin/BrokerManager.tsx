
'use client';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Check, User, Edit2, Phone, Mail, MapPin, MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Broker } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { sanitizePhone } from '@/lib/utils';

export function BrokerManager() {
    const { brokers, approveBroker, rejectBroker, updateBroker, deleteBroker } = useStore();
    const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

    const pendingBrokers = brokers.filter(b => b.status === 'pending');
    const approvedBrokers = brokers.filter(b => b.status === 'approved');

    const handleApprove = async (id: string, name: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) {
            toast.error(`Failed to approve ${name}: ${error.message}`);
        } else {
            approveBroker(id);
            toast.success(`Approved broker ${name}`);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingBroker) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                name: editingBroker.name,
                phone: editingBroker.phone,
                rera_number: editingBroker.reraNumber,
                city: editingBroker.city,
                village: editingBroker.village,
                company_name: editingBroker.companyName,
                designation: editingBroker.designation,
            })
            .eq('id', editingBroker.id);

        if (error) {
            toast.error(`Failed to update ${editingBroker.name}: ${error.message}`);
        } else {
            updateBroker(editingBroker.id, editingBroker);
            toast.success(`Updated broker ${editingBroker.name}`);
            setEditingBroker(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) return;

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Delete error:", error);
            toast.error(`Failed to delete ${name}: ${error.message || 'Check if you have admin privileges.'}`);
        } else {
            deleteBroker(id);
            toast.success(`Successfully deleted broker ${name}`);
        }
    };

    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-xl font-semibold mb-4">Pending Approvals ({pendingBrokers.length})</h2>
                {pendingBrokers.length === 0 ? (
                    <p className="text-muted-foreground">No pending approvals.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingBrokers.map((broker) => (
                            <Card key={broker.id}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{broker.name}</CardTitle>
                                            <CardDescription>{broker.email}</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                        onClick={() => setEditingBroker(broker)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phone:</span>
                                            <span>{broker.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">RERA:</span>
                                            <span>{broker.reraNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Code:</span>
                                            <span className="font-mono">{broker.broker_code}</span>
                                        </div>
                                        {broker.companyName && (
                                            <div className="mt-2 pt-2 border-t text-xs">
                                                <span className="block font-semibold text-gray-700 dark:text-gray-300">{broker.companyName}</span>
                                                {broker.designation && <span className="text-muted-foreground">{broker.designation}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            size="sm"
                                            onClick={() => handleApprove(broker.id, broker.name)}
                                        >
                                            <Check className="w-4 h-4 mr-1" /> Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-100 hover:bg-red-50"
                                            size="sm"
                                            onClick={() => handleDelete(broker.id, broker.name)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Approved Brokers ({approvedBrokers.length})</h2>
                {approvedBrokers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground border rounded-md bg-white dark:bg-gray-950">No approved brokers yet.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {approvedBrokers.map((broker) => (
                            <Card key={broker.id} className="overflow-hidden">
                                <CardHeader className="pb-3 bg-green-50/50 dark:bg-green-900/10 border-b">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                                <User className="h-5 w-5 text-green-700 dark:text-green-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-900 dark:text-white truncate">{broker.name}</div>
                                                {broker.companyName && (
                                                    <div className="text-xs text-muted-foreground truncate">{broker.companyName}</div>
                                                )}
                                                <Badge variant="success" className="text-[10px] mt-0.5">Active</Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-gray-500 border-gray-200 hover:text-primary"
                                                onClick={() => setEditingBroker(broker)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-green-600 border-green-200"
                                                asChild
                                            >
                                                <a
                                                    href={`https://wa.me/${sanitizePhone(broker.phone)}?text=Hi ${broker.name}, this is Property Dosti Admin. I have a question regarding your account.`}
                                                    target="_blank"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-600 border-red-100 hover:bg-red-50"
                                                onClick={() => handleDelete(broker.id, broker.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        <span className="truncate">{broker.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        <span>{broker.phone}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                                        <span>{broker.city || 'N/A'}, {broker.village || 'N/A'}</span>
                                    </div>
                                    <div className="pt-2 border-t">
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {broker.districts.map(d => (
                                                <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                                            ))}
                                        </div>
                                        <div className="font-mono text-[10px] text-primary bg-primary/5 px-2 py-1 rounded">
                                            Referral Code: {broker.referralCode || 'N/A'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Edit Broker Modal */}
            <Modal
                isOpen={!!editingBroker}
                onClose={() => setEditingBroker(null)}
                title="Edit Broker Information"
            >
                {editingBroker && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={editingBroker.name}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={editingBroker.email}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Name</label>
                                <Input
                                    value={editingBroker.companyName || ''}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, companyName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Designation</label>
                                <Input
                                    value={editingBroker.designation || ''}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, designation: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input
                                    value={editingBroker.phone}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">RERA Number</label>
                                <Input
                                    value={editingBroker.reraNumber || ''}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, reraNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">City</label>
                                <Input
                                    value={editingBroker.city || ''}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Village</label>
                                <Input
                                    value={editingBroker.village || ''}
                                    onChange={(e) => setEditingBroker({ ...editingBroker, village: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900 flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingBroker(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
