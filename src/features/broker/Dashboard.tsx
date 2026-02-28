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
import { Plus, Search, MapPin, Clock, MessageSquare, Pencil, Trash2, Camera, Check, ExternalLink, Share2, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionDashboard } from '@/features/subscription/SubscriptionDashboard';
import { ChatWindow } from '@/features/chat/ChatWindow';
import { SmartSearchForm, SmartSearchFilters } from '@/components/SmartSearchForm';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';

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
    const { user, properties, addProperty, setProperties, updateProperty, deleteProperty, setUser } = useStore();
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [searchFilters, setSearchFilters] = useState<SmartSearchFilters>({
        searchBy: 'city',
        query: '',
        propertyType: ''
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'explore' | 'listings' | 'responses' | 'subscription' | 'profile'>('explore');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

    // Sync active tab with URL search param
    useEffect(() => {
        if (viewParam) {
            setActiveTab(viewParam as any);
        } else {
            setActiveTab('explore');
        }
    }, [viewParam]);

    const handleEdit = (property: Property) => {
        setSelectedProperty(property);
        setUploadedImages(property.images || []);

        // Populate form
        setValue('title', property.title);
        setValue('description', property.description);
        setValue('price', property.price);
        setValue('district', property.district);
        setValue('location', property.location);
        setValue('type', property.type);
        setValue('category', property.category as any);
        setValue('structureType', (property.structureType as any) || 'Villa');
        setValue('landArea', property.landArea);
        setValue('floorDetail', property.floorDetail);
        setValue('parkingAllocated', property.parkingAllocated);
        setValue('facilities', property.facilities?.join(', '));
        setValue('googleMapLink', property.googleMapLink);

        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this property? This action cannot be revoked.')) return;

        setIsDeleting(id);
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id);

            if (error) throw error;

            deleteProperty(id);
            toast.success('Property deleted successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete property');
        } finally {
            setIsDeleting(null);
        }
    };

    const onAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 500 * 1024) {
            toast.error('Avatar image must be less than 500KB');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Update local user state
            setUser({ ...user, avatarUrl: publicUrl } as any);
            toast.success('Profile picture updated!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Failed to upload profile picture');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="bg-transparent pb-10">
            <div className="px-0">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {activeTab === 'explore' && 'Global Properties'}
                            {activeTab === 'listings' && 'My Property Listings'}
                            {activeTab === 'responses' && 'Customer Responses'}
                            {activeTab === 'subscription' && 'Membership & Rewards'}
                            {activeTab === 'profile' && 'My Profile'}
                        </h1>
                        <p className="text-muted-foreground">
                            {activeTab === 'explore' && 'Explore verified properties across the network.'}
                            {activeTab === 'listings' && 'Manage and monitor your property listings.'}
                            {activeTab === 'responses' && 'View and manage inquiries from interested buyers.'}
                            {activeTab === 'subscription' && 'Upgrade your account for premium features.'}
                            {activeTab === 'profile' && 'View and update your professional profile.'}
                        </p>
                    </div>
                    {activeTab === 'listings' && (
                        <Button
                            onClick={() => {
                                if (isSubscriptionExpired) {
                                    toast.error('Subscription expired! Please renew to add new properties.');
                                } else {
                                    setIsAddModalOpen(true);
                                    reset();
                                    setUploadedImages([]);
                                }
                            }}
                            className="shadow-lg shadow-primary/20"
                            variant={(isSubscriptionExpired ? "outline" : "default") as any}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Property
                        </Button>
                    )}
                </div>

                {activeTab === 'explore' && (
                    <>
                        {/* Membership & Rewards Section - Only on Explore/Dashboard home */}
                        <div className="mb-12">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Badge variant="outline" className="text-primary border-primary">NEW</Badge>
                                Membership Upgrade
                            </h2>
                            <SubscriptionDashboard />
                        </div>

                        <div className="mb-10">
                            <SmartSearchForm
                                onSearch={(f) => setSearchFilters(f)}
                                initialFilters={searchFilters}
                                className="shadow-sm border border-gray-100 bg-white"
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                                    {myProperties.map((p) => (
                                        <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow border-gray-100 dark:border-gray-800">
                                            <CardContent className="p-0">
                                                <div className="flex flex-col sm:flex-row h-full">
                                                    {/* Property Image */}
                                                    <div className="w-full sm:w-48 h-48 sm:h-auto relative bg-muted">
                                                        {p.images && p.images.length > 0 ? (
                                                            <img
                                                                src={p.images[0]}
                                                                alt={p.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Camera className="h-8 w-8 text-muted-foreground/40" />
                                                            </div>
                                                        )}
                                                        <Badge
                                                            variant={p.isActive ? "success" : "secondary"}
                                                            className="absolute top-2 left-2 shadow-sm"
                                                        >
                                                            {p.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>

                                                    {/* Property Details */}
                                                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="text-xl font-bold text-primary">₹ {p.price.toLocaleString('en-IN')}</h3>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-primary"
                                                                        onClick={() => handleEdit(p)}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                                        onClick={() => handleDelete(p.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <h4 className="font-semibold text-lg line-clamp-1">{p.title}</h4>
                                                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                <span className="line-clamp-1">{p.location}, {p.district}</span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                    <motion.div whileHover={{ scale: 1.1 }}>
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                    </motion.div>
                                                                    <span>{p.likes} Likes</span>
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        "flex items-center gap-1.5 text-sm cursor-pointer transition-colors",
                                                                        myLeads.filter(l => l.property_id === p.id && l.status === 'new').length > 0
                                                                            ? "text-blue-600 font-semibold"
                                                                            : "text-muted-foreground hover:text-primary"
                                                                    )}
                                                                    onClick={() => setActiveTab('responses')}
                                                                >
                                                                    <MessageSquare className="h-4 w-4" />
                                                                    <span>{p.leadsCount} Leads</span>
                                                                    {myLeads.filter(l => l.property_id === p.id && l.status === 'new').length > 0 && (
                                                                        <Badge className="ml-1 px-1.5 h-4 text-[10px] bg-blue-600">
                                                                            {myLeads.filter(l => l.property_id === p.id && l.status === 'new').length} NEW
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-xs h-8 px-3 rounded-full"
                                                                    onClick={() => {
                                                                        const url = `${window.location.origin}/property/${p.id}`;
                                                                        navigator.clipboard.writeText(url);
                                                                        toast.success('Property link copied!');
                                                                    }}
                                                                >
                                                                    <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
                                                                </Button>
                                                                <Link href={`/property/${p.id}`} target="_blank">
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        className="text-xs h-8 px-3 rounded-full"
                                                                    >
                                                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <div className="max-w-4xl mx-auto py-10">
                        <SubscriptionDashboard />
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="max-w-4xl space-y-8">
                        {/* Profile Header Card */}
                        <Card>
                            <CardContent className="pt-10">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="h-32 w-32 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden flex items-center justify-center relative">
                                            {(user as any)?.avatarUrl ? (
                                                <img src={(user as any).avatarUrl} alt={(user as any)?.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserIcon className="h-16 w-16 text-blue-400" />
                                            )}

                                            {isUploadingAvatar && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-transform active:scale-95">
                                            <Camera className="h-5 w-5" />
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={onAvatarUpload}
                                                disabled={isUploadingAvatar}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-2">
                                        <div className="flex flex-col md:flex-row items-center gap-3">
                                            <h2 className="text-3xl font-bold">{(user as any)?.name}</h2>
                                            <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                Verified Broker
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                            <span className="font-medium text-foreground">Broker Code:</span> {broker?.broker_code}
                                        </p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm pt-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <span>{broker?.districts.join(', ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <span>Joined {new Date(broker?.registeredAt || '').toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile Info Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Professional Details</CardTitle>
                                    <CardDescription>Your information as visible to clients.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</label>
                                        <div className="p-2 bg-muted/30 rounded border">{broker?.companyName || 'Not Set'}</div>
                                    </div>
                                    <div className="grid gap-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Designation</label>
                                        <div className="p-2 bg-muted/30 rounded border">{broker?.designation || 'Not Set'}</div>
                                    </div>
                                    <div className="grid gap-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">RERA Number</label>
                                        <div className="p-2 bg-muted/30 rounded border">{broker?.reraNumber || 'Not Set'}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                    <CardDescription>Details for business communication.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Mobile Number</label>
                                        <div className="p-2 bg-muted/30 rounded border">{broker?.phone}</div>
                                    </div>
                                    <div className="grid gap-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
                                        <div className="p-2 bg-muted/30 rounded border">{broker?.email}</div>
                                    </div>
                                    <div className="pt-4">
                                        <Button variant="outline" className="w-full" disabled>
                                            Request Information Change
                                        </Button>
                                        <p className="text-[10px] text-center text-muted-foreground mt-2">
                                            Contract support to change verified contact details.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                        <Button type="submit" className="w-full" disabled={isLoading || uploadedImages.length === 0}>
                            {isLoading ? "Processing..." : "List Property"}
                        </Button>
                    </form>
                </Modal>

                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedProperty(null);
                    }}
                    title="Edit Property Listing"
                >
                    <form onSubmit={handleSubmit(async (data) => {
                        if (!selectedProperty) return;
                        setIsLoading(true);
                        try {
                            const facilitiesArray = data.facilities ? data.facilities.split(',').map(f => f.trim()).filter(f => f !== '') : [];

                            const { error } = await supabase
                                .from('properties')
                                .update({
                                    title: data.title,
                                    description: data.description,
                                    price: data.price,
                                    district: data.district,
                                    location: data.location,
                                    type: data.type,
                                    category: data.category,
                                    structure_type: data.structureType,
                                    land_area: data.landArea || null,
                                    floor_detail: data.floorDetail,
                                    parking_allocated: data.parkingAllocated,
                                    facilities: facilitiesArray,
                                    google_map_link: data.googleMapLink,
                                    images: uploadedImages,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', selectedProperty.id);

                            if (error) throw error;

                            // Update local state
                            updateProperty(selectedProperty.id, {
                                ...selectedProperty,
                                ...data,
                                facilities: facilitiesArray,
                                images: uploadedImages,
                                updatedAt: new Date().toISOString()
                            } as any);

                            toast.success('Property updated successfully!');
                            setIsEditModalOpen(false);
                            setSelectedProperty(null);
                        } catch (error: any) {
                            toast.error(error.message || 'Failed to update property');
                        } finally {
                            setIsLoading(false);
                        }
                    })} className="space-y-4">

                        {/* Reuse the same fields as Add Modal */}
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
                            </div>
                            <div>
                                <label className="text-sm font-medium">Google Map Link (Optional)</label>
                                <Input {...register('googleMapLink')} placeholder="https://maps.google.com/..." />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Transaction Type</label>
                                <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="sale">For Sale</option>
                                    <option value="rent">For Rent</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Photos (Max 3)</label>
                                <div className="flex gap-2">
                                    {uploadedImages.map((img, idx) => (
                                        <div key={idx} className="relative h-10 w-10 flex-shrink-0 group">
                                            <img src={img} alt={`Preview ${idx}`} className="h-full w-full object-cover rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] shadow-sm"
                                            >×</button>
                                        </div>
                                    ))}
                                    {uploadedImages.length < 3 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 border-dashed"
                                            onClick={() => document.getElementById('edit-photo-upload')?.click()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Input
                                        id="edit-photo-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedProperty(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isLoading || uploadedImages.length === 0}>
                                {isLoading ? "Updating..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
