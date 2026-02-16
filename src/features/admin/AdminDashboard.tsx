
'use client';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Check, X, User, Edit2, Phone, Mail, MapPin, MessageSquare, Megaphone, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Broker, Banner } from '@/lib/types';
import { toast } from 'sonner';

export function AdminDashboard() {
    const { brokers, approveBroker, rejectBroker, updateBroker, banner, updateBanner, deleteBroker } = useStore();
    const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
    const [tempBanner, setTempBanner] = useState<Banner>(banner);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const pendingBrokers = brokers.filter(b => b.status === 'pending');
    const approvedBrokers = brokers.filter(b => b.status === 'approved');

    const handleApprove = (id: string, name: string) => {
        approveBroker(id);
        toast.success(`Approved broker ${name}`);
    };

    const handleReject = (id: string, name: string) => {
        rejectBroker(id);
        toast.info(`Rejected broker ${name}`);
    };

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingBroker) return;

        updateBroker(editingBroker.id, editingBroker);
        toast.success(`Updated broker ${editingBroker.name}`);
        setEditingBroker(null);
    };

    return (
        <div className="container py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid gap-8">
                {/* Banner Management Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Megaphone className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-semibold">Banner Management</h2>
                    </div>
                    <Card className="border-primary/20 shadow-md">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-lg">Promotion Banner</CardTitle>
                            <CardDescription>Update the landing page promotion banner (Standard size: 1920x600 px)</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Banner Title</label>
                                    <Input
                                        value={tempBanner.title}
                                        onChange={(e) => setTempBanner({ ...tempBanner, title: e.target.value })}
                                        placeholder="e.g. Grow Your Business"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Button Text</label>
                                    <Input
                                        value={tempBanner.buttonText}
                                        onChange={(e) => setTempBanner({ ...tempBanner, buttonText: e.target.value })}
                                        placeholder="e.g. Join Now"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input
                                        value={tempBanner.description}
                                        onChange={(e) => setTempBanner({ ...tempBanner, description: e.target.value })}
                                        placeholder="Enter banner description..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Button Link</label>
                                    <Input
                                        value={tempBanner.buttonLink}
                                        onChange={(e) => setTempBanner({ ...tempBanner, buttonLink: e.target.value })}
                                        placeholder="e.g. /signup"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Background Image (Optional)</label>
                                    <Input
                                        value={tempBanner.backgroundImage || ''}
                                        onChange={(e) => setTempBanner({ ...tempBanner, backgroundImage: e.target.value })}
                                        placeholder="URL for custom background"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={() => {
                                        updateBanner(tempBanner);
                                        toast.success('Promotion banner updated successfully!');
                                    }}
                                    className="gap-2"
                                >
                                    <Save className="h-4 w-4" /> Save Banner Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Pending Approvals ({pendingBrokers.length})</h2>
                    {pendingBrokers.length === 0 ? (
                        <p className="text-muted-foreground">No pending approvals.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingBrokers.map((broker) => (
                                <Card key={broker.id}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{broker.name}</CardTitle>
                                            <CardDescription>{broker.email}</CardDescription>
                                        </div>
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
                                                <span className="font-mono">{broker.brokerCode}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 mt-2">
                                                <span className="text-muted-foreground">Districts:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {broker.districts.map(d => (
                                                        <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                size={"sm" as any}
                                                onClick={() => handleApprove(broker.id, broker.name)}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                variant={"outline" as any}
                                                className="flex-1 text-red-600 border-red-100 hover:bg-red-50"
                                                size={"sm" as any}
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to permanently delete ${broker.name}?`)) {
                                                        deleteBroker(broker.id);
                                                        toast.success(`Deleted broker ${broker.name}`);
                                                    }
                                                }}
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
                    <div className="rounded-md border bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
                        <div className="p-4 bg-muted/50 text-xs font-medium grid grid-cols-5 gap-4 border-b">
                            <div>Name & Contact</div>
                            <div>Districts</div>
                            <div>City/Village</div>
                            <div>Status</div>
                            <div className="text-right">Actions</div>
                        </div>
                        {approvedBrokers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No approved brokers yet.</div>
                        ) : (
                            approvedBrokers.map((broker) => (
                                <div key={broker.id} className="p-4 text-sm grid grid-cols-5 gap-4 items-center border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{broker.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                                            <Mail className="h-3 w-3 mr-1" /> {broker.email}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                            <Phone className="h-3 w-3 mr-1" /> {broker.phone}
                                        </div>
                                    </div>
                                    <div className="text-xs">
                                        <div className="flex flex-wrap gap-1">
                                            {broker.districts.slice(0, 2).map(d => (
                                                <Badge key={d} className="text-[10px] scale-90 origin-left">
                                                    {d}
                                                </Badge>
                                            ))}
                                            {broker.districts.length > 2 && <span className="text-[10px] text-muted-foreground">+{broker.districts.length - 2}</span>}
                                        </div>
                                        <div className="mt-2 font-mono text-[10px] text-primary">
                                            Code: {broker.referralCode}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <div className="flex items-start">
                                            <MapPin className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                                            <span>
                                                {broker.city || 'N/A'}, {broker.village || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Badge variant="success" className="text-[10px]">Active</Badge>
                                    </div>
                                    <div className="text-right flex justify-end gap-2">
                                        <Button
                                            variant={"outline" as any}
                                            size={"sm" as any}
                                            className="h-8 w-8 p-0 text-green-600 border-green-200"
                                            asChild
                                        >
                                            <a
                                                href={`https://wa.me/91${broker.phone}?text=Hi ${broker.name}, this is Property Dosti Admin. I have a question regarding your account.`}
                                                target="_blank"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant={"outline" as any}
                                            size={"sm" as any}
                                            className="h-8 w-8 p-0 text-red-600 border-red-100 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to permanently delete ${broker.name}?`)) {
                                                    deleteBroker(broker.id);
                                                    toast.success(`Deleted broker ${broker.name}`);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

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
                            <Button type="button" variant={"outline" as any} className="flex-1" onClick={() => setEditingBroker(null)}>
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
