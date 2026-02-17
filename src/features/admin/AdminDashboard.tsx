
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
import { supabase } from '@/lib/supabaseClient'; // Assuming supabase client is imported here

export function AdminDashboard() {
    const { brokers, setBrokers, approveBroker, rejectBroker, updateBroker, banner, updateBanner, deleteBroker, properties, setProperties, updateProperty } = useStore();
    const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
    const [tempBanner, setTempBanner] = useState<Banner>(banner);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch brokers from Supabase
    // Fetch brokers and properties from Supabase
    useEffect(() => {
        const fetchData = async () => {
            // Fetch Brokers
            const { data: brokerData, error: brokerError } = await supabase
                .from('profiles')
                .select('*')
                .order('registered_at', { ascending: false });

            if (brokerError) {
                console.error('Error fetching brokers:', brokerError);
            } else if (brokerData) {
                const mappedBrokers: Broker[] = brokerData.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    email: b.email,
                    phone: b.phone,
                    brokerCode: b.broker_code,
                    reraNumber: b.rera_number,
                    districts: b.districts || [],
                    city: b.city,
                    village: b.village,
                    status: b.status,
                    registeredAt: b.registered_at,
                    subscriptionExpiry: b.subscription_expiry,
                    referralCode: b.referral_code,
                    referredBy: b.referred_by,
                    referralsCount: b.referrals_count,
                }));
                setBrokers(mappedBrokers);
            }

            // Fetch Properties
            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (propertyError) {
                console.error('Error fetching properties:', propertyError);
            } else if (propertyData) {
                const mappedProperties: any[] = propertyData.map((p: any) => ({
                    id: p.id,
                    brokerId: p.broker_id,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    district: p.district,
                    location: p.location,
                    type: p.type,
                    category: p.category,
                    images: p.images,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    expiresAt: p.expires_at,
                    isActive: p.is_active,
                    likes: p.likes,
                    leadsCount: p.leads_count,
                    amenities: p.amenities,
                }));
                setProperties(mappedProperties);
            }

            setIsLoading(false);
        };

        fetchData();
        setMounted(true);
    }, [setBrokers, setProperties]);

    if (!mounted) return null;

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

    const handleReject = async (id: string, name: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) {
            toast.error(`Failed to reject ${name}: ${error.message}`);
        } else {
            rejectBroker(id);
            toast.info(`Rejected broker ${name}`);
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
        if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;

        // Note: Real deletion would also require deleting the auth user, which requires admin service role
        // For now, we delete from profiles (which has ON DELETE CASCADE if configured correctly)
        // Actually, deleting from profiles is enough if auth.users is handled elsewhere or if it's just profile deletion
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error(`Failed to delete ${name}: ${error.message}`);
        } else {
            deleteBroker(id);
        }
    };
    const handleDeleteProperty = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete property "${title}"?`)) return;

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error(`Failed to delete property: ${error.message}`);
        } else {
            setProperties(properties.filter(p => p.id !== id));
            toast.success(`Deleted property "${title}"`);
        }
    };

    const handleClearData = async () => {
        const password = confirm("CRITICAL: You are about to clear ALL property and broker data. This cannot be undone.");
        if (!password) return;

        const confirmation = prompt("Please type 'CLEARDATA' to proceed:");
        if (confirmation !== 'CLEARDATA') {
            toast.error("Cleanup cancelled. Confirmation text did not match.");
            return;
        }

        toast.loading("Clearing data...");

        // Delete all properties first
        const { error: propError } = await supabase.from('properties').delete().neq('id', '0');
        if (propError) console.error("Error clearing properties:", propError);

        // Delete all non-admin profiles
        const { error: profileError } = await supabase.from('profiles').delete().neq('id', '0');
        if (profileError) console.error("Error clearing profiles:", profileError);

        toast.dismiss();
        toast.success("All data has been cleared.");
        window.location.reload();
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
                                            onClick={() => handleDelete(broker.id, broker.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-4">Properties Management ({properties.length})</h2>
                    <div className="rounded-md border bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
                        <div className="p-4 bg-muted/50 text-xs font-medium grid grid-cols-5 gap-4 border-b">
                            <div className="col-span-2">Property Details</div>
                            <div>Price</div>
                            <div>Location</div>
                            <div className="text-right">Actions</div>
                        </div>
                        {properties.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No properties listed yet.</div>
                        ) : (
                            properties.map((prop) => (
                                <div key={prop.id} className="p-4 text-sm grid grid-cols-5 gap-4 items-center border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <div className="col-span-2 flex gap-3 items-center">
                                        <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img src={prop.images[0]} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{prop.title}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{prop.category} • {prop.type}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-primary">₹{prop.price.toLocaleString('en-IN')}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {prop.location}, {prop.district}
                                    </div>
                                    <div className="text-right flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-600 border-red-100 hover:bg-red-50"
                                            onClick={() => handleDeleteProperty(prop.id, prop.title)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="mt-8 pt-8 border-t border-red-100">
                    <div className="flex items-center gap-2 mb-4 text-red-600">
                        <Trash2 className="h-6 w-6" />
                        <h2 className="text-xl font-bold">System Maintenance</h2>
                    </div>
                    <Card className="border-red-200 bg-red-50/30">
                        <CardHeader>
                            <CardTitle className="text-red-700">Danger Zone</CardTitle>
                            <CardDescription>Actions here are permanent and cannot be reversed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                Clearing all data will remove all property listings and broker profiles from the database.
                                This is typically used after a testing phase before going live.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleClearData}
                                className="bg-red-600 hover:bg-red-700 font-bold"
                            >
                                Clear All Application Data
                            </Button>
                        </CardContent>
                    </Card>
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
