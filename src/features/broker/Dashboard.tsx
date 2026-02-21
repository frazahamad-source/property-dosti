'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Property, Broker, Admin, DISTRICTS } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/PropertyCard';
import { sanitizePhone } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionDashboard } from '@/features/subscription/SubscriptionDashboard';
import { ChatWindow } from '@/features/chat/ChatWindow';
import { SmartSearchForm, SmartSearchFilters } from '@/components/SmartSearchForm';
import { supabase } from '@/lib/supabaseClient';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const propertySchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.coerce.number().min(1, "Price is required"),
    district: z.string().min(1, "District is mandatory"),
    location: z.string().min(2, "Village/City/Area is required"),
    type: z.enum(['sale', 'rent']),
    category: z.enum(['residential', 'commercial', 'land']),
    structureType: z.enum(['Villa', 'Apartment', 'Farmhouse', 'Land']).optional(),
    landArea: z.coerce.number().optional(),
    floorDetail: z.string().optional(),
    parkingAllocated: z.string().optional(),
    facilities: z.string().optional(), // Comma separated string for input
    googleMapLink: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export function BrokerDashboard() {
    const { user, properties, addProperty, setProperties } = useStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchFilters, setSearchFilters] = useState<SmartSearchFilters>({
        searchBy: 'city',
        query: '',
        propertyType: ''
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'explore' | 'listings' | 'responses'>('explore');
    const [isLoading, setIsLoading] = useState(false);

    // Form Watch for Conditional Logic
    const { register, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm<PropertyFormValues>({
        resolver: zodResolver(propertySchema) as any,
        defaultValues: {
            district: '',
            structureType: 'Villa',
            type: 'sale',
            category: 'residential'
        }
    });

    const structureType = watch('structureType');
    const priceValue = watch('price');

    const broker = user && 'subscriptionExpiry' in user ? user : null;
    const isSubscriptionExpired = broker ? new Date(broker.subscriptionExpiry) < new Date() : false;

    const myProperties = properties.filter(p => p.brokerId === user?.id);
    const [propertyLeads, setPropertyLeads] = useState<any[]>([]); // Local state for leads
    const myLeads = propertyLeads;
    const unreadCount = myLeads.filter(l => l.status === 'new').length;

    // Fetch properties from Supabase
    useEffect(() => {
        const fetchProperties = async () => {
            const { data, error } = await supabase
                .from('properties')
                .select(`
                    *,
                    profiles (
                        phone
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching properties:', error);
            } else if (data) {
                const mappedProperties: Property[] = data.map((p: any) => ({
                    id: p.id,
                    brokerId: p.broker_id,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    district: p.district,
                    location: p.location,
                    type: p.type,
                    category: p.category,
                    structureType: p.structure_type,
                    landArea: p.land_area,
                    floorDetail: p.floor_detail,
                    parkingAllocated: p.parking_allocated,
                    facilities: p.facilities,
                    googleMapLink: p.google_map_link,
                    images: p.images,
                    village: p.village,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    expiresAt: p.expires_at,
                    isActive: p.is_active,
                    likes: p.likes,
                    leadsCount: p.leads_count,
                    amenities: p.amenities,
                    brokerPhone: p.profiles?.phone,
                }));
                setProperties(mappedProperties);
            }
        };

        fetchProperties();
    }, [setProperties]);

    // Fetch leads for the current broker
    useEffect(() => {
        const fetchLeads = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('property_leads')
                .select('*')
                .eq('broker_id', user.id)
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Error fetching leads:', error);
            } else if (data) {
                setPropertyLeads(data);
            }
        };

        fetchLeads();
    }, [user]);

    const markLeadAsRead = async (leadId: string) => {
        // Optimistic update
        setPropertyLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'read' } : l));

        const { error } = await supabase
            .from('property_leads')
            .update({ status: 'read' })
            .eq('id', leadId);

        if (error) {
            console.error('Error marking lead strictly as read:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + uploadedImages.length > 3) {
            toast.error('You can only upload up to 3 images.');
            return;
        }

        setIsLoading(true);
        const newImageUrls: string[] = [];

        for (const file of files) {
            if (file.size > 1024 * 1024) { // 1MB limit for Supabase
                toast.error(`${file.name} is too large. Please use images < 1MB.`);
                continue;
            }

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${user?.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath);

                newImageUrls.push(publicUrl);
            } catch (error: any) {
                console.error('Error uploading image:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setUploadedImages(prev => [...prev, ...newImageUrls]);
        setIsLoading(false);
    };

    const onSubmit = async (data: PropertyFormValues) => {
        if (!user) return;
        setIsLoading(true);

        // Process facilities from string to array
        const facilitiesArray = data.facilities ? data.facilities.split(',').map(f => f.trim()).filter(f => f !== '') : [];

        // Determine category based on structure type if needed
        let finalCategory = data.category;
        if (data.structureType === 'Land' && data.category) {
            // Keep user selection for Land
        } else {
            // Default mapping
            if (['Villa', 'Apartment', 'Farmhouse'].includes(data.structureType || '')) {
                finalCategory = 'residential';
            }
        }

        try {
            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .insert({
                    broker_id: user.id,
                    title: data.title,
                    description: data.description,
                    price: data.price,
                    district: data.district,
                    location: data.location,
                    type: data.type,
                    category: finalCategory,
                    structure_type: data.structureType,
                    land_area: data.landArea || null,
                    floor_detail: data.floorDetail,
                    parking_allocated: data.parkingAllocated,
                    facilities: facilitiesArray,
                    google_map_link: data.googleMapLink,
                    images: uploadedImages,
                    amenities: [], // Can extended similarly later
                })
                .select()
                .single();

            if (propertyError) throw propertyError;

            // Update local state by adding the new property at the top
            const p = propertyData;
            const newProperty: Property = {
                id: p.id,
                brokerId: p.broker_id,
                title: p.title,
                description: p.description,
                price: p.price,
                district: p.district,
                location: p.location,
                type: p.type,
                category: p.category,
                structureType: p.structure_type,
                landArea: p.land_area,
                floorDetail: p.floor_detail,
                parkingAllocated: p.parking_allocated,
                facilities: p.facilities,
                googleMapLink: p.google_map_link,
                images: p.images,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
                expiresAt: p.expires_at,
                isActive: p.is_active,
                likes: p.likes,
                leadsCount: p.leads_count,
                amenities: p.amenities,
            };

            addProperty(newProperty);
            toast.success('Property listed successfully!');
            setIsAddModalOpen(false);
            setUploadedImages([]);
            reset();
        } catch (error: any) {
            console.error('Error adding property:', error);
            toast.error(error.message || 'Failed to list property.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProperties = properties.filter(p => {
        const matchesQuery = !searchFilters.query || (
            searchFilters.searchBy === 'city' ? (p.location.toLowerCase().includes(searchFilters.query.toLowerCase()) || p.village?.toLowerCase().includes(searchFilters.query.toLowerCase())) :
                searchFilters.searchBy === 'district' ? p.district.toLowerCase().includes(searchFilters.query.toLowerCase()) :
                    searchFilters.searchBy === 'village' ? (p.village?.toLowerCase().includes(searchFilters.query.toLowerCase()) || p.location.toLowerCase().includes(searchFilters.query.toLowerCase())) :
                        p.profiles?.name?.toLowerCase().includes(searchFilters.query.toLowerCase())
        );

        const matchesType = !searchFilters.propertyType || (
            p.category.toLowerCase() === searchFilters.propertyType.toLowerCase() ||
            p.structureType?.toLowerCase() === searchFilters.propertyType.toLowerCase()
        );

        return matchesQuery && matchesType;
    });

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

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
                            {tab === 'responses' && unreadCount > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600 border-none text-[10px] h-4 min-w-[1rem] flex items-center justify-center font-bold animate-pulse">
                                    {unreadCount}
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
                        <div className="mb-10">
                            <SmartSearchForm
                                onSearch={(f) => setSearchFilters(f)}
                                initialFilters={searchFilters}
                                className="shadow-none border-none bg-transparent dark:bg-transparent"
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
                                                            <span className="flex items-center gap-1">
                                                                <Badge variant="outline" className={`text-[10px] ${myLeads.filter(l => l.property_id === p.id && l.status === 'new').length > 0 ? 'border-blue-500 text-blue-600' : ''}`}>
                                                                    {p.leadsCount} Leads
                                                                    {myLeads.filter(l => l.property_id === p.id && l.status === 'new').length > 0 &&
                                                                        ` (${myLeads.filter(l => l.property_id === p.id && l.status === 'new').length} new)`
                                                                    }
                                                                </Badge>
                                                            </span>
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
                                    <Card key={lead.id} className={`transition-colors ${lead.status === 'new' ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}>
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-lg">{lead.name}</h4>
                                                        {lead.status === 'new' && <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px]">New</Badge>}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(lead.timestamp).toLocaleDateString()}
                                                    </span>
                                                    {lead.status === 'new' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-[10px] text-blue-600 hover:text-blue-800 p-0"
                                                            onClick={() => markLeadAsRead(lead.id)}
                                                        >
                                                            Mark as Read
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm border-l-2 pl-4 italic bg-muted/20 py-2 rounded">
                                                "{lead.message}"
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <Button size="sm" className="h-8" asChild onClick={() => markLeadAsRead(lead.id)}>
                                                    <a href={`tel:${lead.phone}`}>Call Now</a>
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8" asChild onClick={() => markLeadAsRead(lead.id)}>
                                                    <a href={`https://wa.me/${sanitizePhone(lead.phone)}`} target="_blank">WhatsApp</a>
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

                        {/* 1. Structure Type (User requested this first) */}
                        <div>
                            <label className="text-sm font-medium">Property Type</label>
                            <select
                                {...register('structureType')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="Villa">Villa / Independent House</option>
                                <option value="Apartment">Apartment / Flat</option>
                                <option value="Farmhouse">Farmhouse</option>
                                <option value="Land">Land / Plot</option>
                            </select>
                        </div>

                        {/* 2. Conditional Fields based on Structure */}

                        {/* Villa / Farmhouse Fields */}
                        {(structureType === 'Villa' || structureType === 'Farmhouse') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Land Area</label>
                                    <Input
                                        type="number"
                                        {...register('landArea')}
                                        placeholder="Sqft / Cents"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Facilities & Amenities</label>
                                    <Input {...register('facilities')} placeholder="e.g. Garden, Pool (Comma separated)" />
                                </div>
                            </div>
                        )}

                        {/* Apartment Fields */}
                        {structureType === 'Apartment' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Floor Detail</label>
                                    <Input {...register('floorDetail')} placeholder="e.g. 3rd Floor" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Parking</label>
                                    <Input {...register('parkingAllocated')} placeholder="e.g. 1 Covered" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Facilities & Amenities</label>
                                    <Input {...register('facilities')} placeholder="e.g. Gym, Lift (Comma separated)" />
                                </div>
                            </div>
                        )}

                        {/* Land Fields */}
                        {structureType === 'Land' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <select {...register('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="residential">Residential</option>
                                        <option value="commercial">Commercial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Total Area</label>
                                    <Input
                                        type="number"
                                        {...register('landArea')}
                                        placeholder="Sqft / Cents"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input {...register('title')} placeholder="e.g. Luxury 3BHK Villa" />
                            {errors.title?.message && <p className="text-xs text-red-500">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                {...register('description')}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Write detailed description point by point..."
                            />
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
                                <label className="text-sm font-medium">Local Area / Village / City</label>
                                <Input {...register('location')} placeholder="e.g. Manipal" />
                                {errors.location?.message && <p className="text-xs text-red-500">{errors.location.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Price (₹)</label>
                                <Input type="number" {...register('price')} />
                                {errors.price?.message && <p className="text-xs text-red-500">{errors.price.message}</p>}
                                {priceValue > 0 && (
                                    <p className="text-xs text-green-600 font-medium mt-1">
                                        {priceValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Google Map Link (Optional)</label>
                                <Input {...register('googleMapLink')} placeholder="https://maps.google.com/..." />
                            </div>
                        </div>

                        {/* Hidden type field if structure selected automatically implies it, otherwise show it */}
                        {/* We keep type as separate for Sale/Rent decision */}
                        <div>
                            <label className="text-sm font-medium">Transaction Type</label>
                            <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="sale">For Sale</option>
                                <option value="rent">For Rent</option>
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
