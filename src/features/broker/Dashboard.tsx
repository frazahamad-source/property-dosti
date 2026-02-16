'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Property, Broker, Admin, DISTRICTS } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/PropertyCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionDashboard } from '@/features/subscription/SubscriptionDashboard';
import { ChatWindow } from '@/features/chat/ChatWindow';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const propertySchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.coerce.number().min(1, "Price is required"),
    district: z.string().min(1, "District is mandatory"),
    location: z.string().min(2, "City/Area is required"),
    type: z.enum(['sale', 'rent']),
    category: z.enum(['residential', 'commercial', 'land']),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export function BrokerDashboard() {
    const { user, properties, addProperty } = useStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'explore' | 'listings' | 'responses'>('explore');

    const broker = user && 'subscriptionExpiry' in user ? user : null;
    const isSubscriptionExpired = broker ? new Date(broker.subscriptionExpiry) < new Date() : false;

    const { propertyLeads } = useStore();
    const myProperties = properties.filter(p => p.brokerId === user?.id);
    const myLeads = propertyLeads.filter(l => l.brokerId === user?.id);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PropertyFormValues>({
        resolver: zodResolver(propertySchema) as any,
        defaultValues: {
            district: '',
        }
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + uploadedImages.length > 3) {
            toast.error('You can only upload up to 3 images.');
            return;
        }

        files.forEach(file => {
            if (file.size > 512000) { // 500KB limit
                toast.error(`${file.name} is too large. Please use low resolution images (< 500KB).`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const onSubmit = (data: PropertyFormValues) => {
        if (!user) return;

        const newProperty: Property = {
            id: `prop-${Date.now()}`,
            brokerId: user.id,
            title: data.title,
            description: data.description,
            price: data.price,
            district: data.district,
            location: data.location,
            type: data.type,
            category: data.category,
            images: uploadedImages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            likes: 0,
            leadsCount: 0,
            amenities: [],
        };

        addProperty(newProperty);
        toast.success('Property listed successfully!');
        setIsAddModalOpen(false);
        setUploadedImages([]);
        reset();
    };

    const filteredProperties = properties.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 pb-20">
            <div className="container py-8 px-4">
                {/* Membership & Rewards Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Badge variant="outline" className="text-primary border-primary">NEW</Badge>
                        Membership & Rewards
                    </h2>
                    <SubscriptionDashboard />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Broker Dashboard</h1>
                        <p className="text-muted-foreground">Manage your listings and explore properties.</p>
                    </div>
                    <Button
                        onClick={() => {
                            if (isSubscriptionExpired) {
                                toast.error('Subscription expired! Please renew to add new properties.');
                            } else {
                                setIsAddModalOpen(true);
                            }
                        }}
                        className="shadow-lg shadow-primary/20"
                        variant={(isSubscriptionExpired ? "outline" : "default") as any}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Property
                    </Button>
                </div>

                <div className="flex items-center space-x-4 mb-8 border-b">
                    {(['explore', 'listings', 'responses'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === tab
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <span className="capitalize">{tab === 'explore' ? 'Explore Global' : tab === 'listings' ? 'My Listings' : 'Responses'}</span>
                            {tab === 'responses' && myLeads.length > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px] h-4 min-w-[1rem] flex items-center justify-center font-bold">
                                    {myLeads.length}
                                </Badge>
                            )}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'explore' && (
                    <>
                        <div className="flex items-center space-x-2 mb-6">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search properties by title or location..."
                                className="max-w-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.map((property) => (
                                <div key={property.id} className="h-full">
                                    <PropertyCard property={property} />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'listings' && (
                    <div className="space-y-6">
                        <div className="grid gap-4">
                            {myProperties.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <p className="text-muted-foreground">You haven't listed any properties yet.</p>
                                    <Button
                                        variant={"outline" as any}
                                        className="mt-4"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        Create Your First Listing
                                    </Button>
                                </Card>
                            ) : (
                                <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="p-4 text-left font-medium">Property</th>
                                                <th className="p-4 text-left font-medium">Stats</th>
                                                <th className="p-4 text-left font-medium">Status</th>
                                                <th className="p-4 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {myProperties.map((p) => (
                                                <tr key={p.id} className="hover:bg-muted/20">
                                                    <td className="p-4">
                                                        <div className="font-medium">{p.title}</div>
                                                        <div className="text-xs text-muted-foreground">{p.location}, {p.district}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-3 text-xs">
                                                            <span className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">{p.likes} Likes</Badge></span>
                                                            <span className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">{p.leadsCount} Leads</Badge></span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            const url = `${window.location.origin}/property/${p.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success('Property link copied to clipboard!');
                                                        }}>
                                                            Share
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'responses' && (
                    <div className="space-y-4">
                        {myLeads.length === 0 ? (
                            <Card className="p-12 text-center text-muted-foreground">
                                No responses received yet.
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {myLeads.map((lead) => (
                                    <Card key={lead.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-lg">{lead.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(lead.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm border-l-2 pl-4 italic bg-muted/20 py-2 rounded">
                                                "{lead.message}"
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <Button size="sm" className="h-8" asChild>
                                                    <a href={`tel:${lead.phone}`}>Call Now</a>
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8" asChild>
                                                    <a href={`https://wa.me/91${lead.phone}`} target="_blank">WhatsApp</a>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Property">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input {...register('title')} placeholder="e.g. Luxury Villa" />
                            {errors.title?.message && <p className="text-xs text-red-500">{errors.title.message}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input {...register('description')} placeholder="Property details..." />
                            {errors.description?.message && <p className="text-xs text-red-500">{errors.description.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">District</label>
                                <select
                                    {...register('district')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Select District</option>
                                    {DISTRICTS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                {errors.district?.message && <p className="text-xs text-red-500">{errors.district.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">City/Area</label>
                                <Input {...register('location')} placeholder="e.g. Manipal" />
                                {errors.location?.message && <p className="text-xs text-red-500">{errors.location.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Price (₹)</label>
                                <Input type="number" {...register('price')} />
                                {errors.price?.message && <p className="text-xs text-red-500">{errors.price.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="sale">Sale</option>
                                    <option value="rent">Rent</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <select {...register('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="land">Land</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Property Photos (Max 3)</label>
                            <div className="mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 transition-colors hover:border-muted-foreground/50">
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="photo-upload"
                                    disabled={uploadedImages.length >= 3}
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className={`flex flex-col items-center cursor-pointer ${uploadedImages.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Click to upload photos</span>
                                </label>
                            </div>
                            <p className="mt-2 text-[10px] text-muted-foreground">
                                * Please upload only low resolution images. Acceptable size: less than 500KB per image.
                            </p>
                            {uploadedImages.length > 0 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                    {uploadedImages.map((img, idx) => (
                                        <div key={idx} className="relative h-16 w-16 flex-shrink-0 group">
                                            <img src={img} alt={`Preview ${idx}`} className="h-full w-full object-cover rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={uploadedImages.length === 0}>
                            List Property
                        </Button>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
