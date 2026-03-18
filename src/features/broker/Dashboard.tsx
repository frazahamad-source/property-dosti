'use client'; // Broker Dashboard Features
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store';
import { Property, DISTRICTS, AmenityConfig, Referral, PropertyLead } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/PropertyCard';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, MapPin, Clock, MessageSquare, Pencil, Trash2, Camera, Check, Share2, User as UserIcon, MoreVertical, Eye, Gift, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionDashboard } from '@/features/subscription/SubscriptionDashboard';
import { SmartSearchForm, SmartSearchFilters } from '@/components/SmartSearchForm';
import { ReferralBanner } from '@/components/broker/ReferralBanner';
import { ResponsibilitiesPanel } from '@/components/broker/ResponsibilitiesPanel';
import { CommissionDashboard, SoldPropertyInfo } from '@/features/broker/CommissionDashboard';
import { AmenitySelector } from '@/components/broker/AmenitySelector';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const propertySchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.coerce.number().optional().nullable(),
    district: z.string().min(1, "District is mandatory"),
    location: z.string().min(2, "Village/City/Area is required"),
    type: z.enum(['sale', 'rent', 'lease', 'joint_venture']),
    category: z.string().optional().nullable().or(z.literal('')),
    structureType: z.string().optional().nullable().or(z.literal('')),
    landArea: z.coerce.number().optional().nullable(),
    areaOfVilla: z.coerce.number().optional().nullable(),
    villaType: z.string().optional().nullable(),
    anyStructure: z.boolean().optional().nullable(),
    structureCategory: z.string().optional().nullable(),
    structureArea: z.coerce.number().optional().nullable(),
    structureSpecification: z.string().optional().nullable(),
    advanceAmount: z.coerce.number().optional().nullable(),
    sharingRatio: z.string().optional().nullable(),
    goodwillAmount: z.coerce.number().optional().nullable(),
    floorNumber: z.coerce.number().optional().nullable(),
    floorDetail: z.string().optional().nullable(),
    parkingSpaces: z.coerce.number().optional().nullable(),
    parkingType: z.string().optional().nullable().or(z.literal('')),
    parkingAllocated: z.string().optional().nullable(),
    facilities: z.array(z.string()).optional().nullable(),
    googleMapLink: z.string().optional().nullable().or(z.literal('')),
    village: z.string().optional().nullable(),
    hidePrice: z.boolean().optional(),
}).refine(data => {
    if (data.type === 'joint_venture') return true;
    return (data.price && data.price > 0) || data.hidePrice;
}, {
    message: "Either Price or 'Call for quote' is required",
    path: ["price"]
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export function BrokerDashboard() {
    const { user, properties, addProperty, setProperties, updateProperty, deleteProperty, setUser } = useStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const viewParam = searchParams.get('view');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
    const editParam = searchParams.get('edit');

    const [searchFilters, setSearchFilters] = useState<SmartSearchFilters>({
        searchBy: 'city',
        query: '',
        propertyType: ''
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'explore' | 'listings' | 'responses' | 'subscription' | 'commission' | 'profile'>('explore');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [listingSearch, setListingSearch] = useState('');
    const [amenitiesConfig, setAmenitiesConfig] = useState<AmenityConfig[]>([]);
    const [referralStats, setReferralStats] = useState<Referral[]>([]);
    const [soldProperty, setSoldProperty] = useState<SoldPropertyInfo | null>(null);
    const [villaTypesConfig, setVillaTypesConfig] = useState<any[]>([]);

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
    const parkingSpaces = watch('parkingSpaces');
    const watchType = watch('type');
    const watchAnyStructure = watch('anyStructure');
    const watchStructureCategory = watch('structureCategory');

    const broker = user && 'subscriptionExpiry' in user ? user : null;
    const isManagerOrSupervisor = broker && (broker.role === 'manager' || broker.role === 'supervisor');
    const isSubscriptionExpired = isManagerOrSupervisor ? false : (broker ? new Date(broker.subscriptionExpiry) < new Date() : false);

    const myProperties = properties.filter(p => p.brokerId === user?.id);
    const filteredMyProperties = myProperties.filter(p =>
        p.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        p.location.toLowerCase().includes(listingSearch.toLowerCase()) ||
        p.district.toLowerCase().includes(listingSearch.toLowerCase())
    );
    const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]); // Local state for leads
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
                const mappedProperties = (data as unknown[]).map((item) => {
                    const p = item as any; // Cast internally if needed, but not in parameter
                    return {
                        id: p.id,
                        brokerId: p.broker_id,
                        title: p.title || 'No Title',
                        description: p.description || '',
                        price: p.price || 0,
                        district: p.district || 'Unknown',
                        location: p.location || 'Unknown',
                        type: p.type || 'sale',
                        category: (p.category as Property['category']) || 'residential',
                        structureType: p.structure_type || '',
                        landArea: p.land_area || 0,
                        floorNumber: p.floor_number || 0,
                        floorDetail: p.floor_detail || '',
                        parkingSpaces: p.parking_spaces || 0,
                        parkingType: (p.parking_type as Property['parkingType']) || 'Open',
                        parkingAllocated: p.parking_allocated || '',
                        facilities: p.facilities || [],
                        googleMapLink: p.google_map_link || '',
                        images: p.images || [],
                        village: p.village || '',
                        createdAt: p.created_at,
                        updatedAt: p.updated_at,
                        expiresAt: p.expires_at,
                        isActive: p.is_active ?? true,
                        is_sold: p.is_sold ?? false,
                        likes: p.likes || 0,
                        leadsCount: p.leads_count || 0,
                        amenities: p.facilities || [], // Correct mapping: DB facilities -> UI amenities
                        facilities: p.facilities || [],
                        brokerPhone: p.profiles?.phone || '',
                        hidePrice: p.hide_price ?? false,
                        areaOfVilla: p.area_of_villa,
                        villaType: p.villa_type,
                        anyStructure: p.any_structure,
                        structureCategory: p.structure_category,
                        structureArea: p.structure_area,
                        structureSpecification: p.structure_specification,
                        advanceAmount: p.advance_amount,
                        sharingRatio: p.sharing_ratio,
                        goodwillAmount: p.goodwill_amount,
                    };
                });
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

    useEffect(() => {
        const fetchReferrals = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('referrals')
                .select('*')
                .eq('referring_broker_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching referrals:', error.message || error, error.details, error.hint);
            } else if (data) {
                setReferralStats(data);
            }
        };
        fetchReferrals();
    }, [user]);

    // Fetch amenities config
    useEffect(() => {
        const fetchAmenities = async () => {
            const { data, error } = await supabase
                .from('amenities_config')
                .select('*')
                .order('name');
            if (error) {
                console.error('Error fetching amenities:', error);
            } else if (data) {
                setAmenitiesConfig(data);
            }
        };
        fetchAmenities();
    }, []);

    // Fetch villa types config
    useEffect(() => {
        const fetchVillaTypes = async () => {
            const { data, error } = await supabase
                .from('villa_types_config')
                .select('*')
                .order('name');
            if (error) {
                console.error('Error fetching villa types:', error);
            } else if (data) {
                setVillaTypesConfig(data);
            }
        };
        fetchVillaTypes();
    }, []);

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
            } catch (err: unknown) {
                const error = err as Error;
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

        // Process facilities: already an array from Zod
        const facilitiesArray = data.facilities || [];

        // Determine category based on structure type if needed
        let finalCategory = data.category;
        if (data.type === 'joint_venture') {
            // Keep user selection for Joint Venture
        } else if (data.structureType === 'Land' && data.category) {
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
                    floor_number: data.floorNumber || null,
                    floor_detail: data.floorDetail,
                    parking_spaces: data.parkingSpaces || 0,
                    parking_type: data.parkingType,
                    parking_allocated: data.parkingAllocated,
                    facilities: facilitiesArray,
                    google_map_link: data.googleMapLink,
                    hide_price: data.hidePrice || false,
                    images: uploadedImages,
                    amenities: [], // Can extended similarly later
                    area_of_villa: data.areaOfVilla || null,
                    villa_type: data.villaType || null,
                    any_structure: data.anyStructure || false,
                    structure_category: data.structureCategory || null,
                    structure_area: data.structureArea || null,
                    structure_specification: data.structureSpecification || null,
                    advance_amount: data.advanceAmount || null,
                    sharing_ratio: data.sharingRatio || null,
                    goodwill_amount: data.goodwillAmount || null,
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
                floorNumber: p.floor_number,
                floorDetail: p.floor_detail,
                parkingSpaces: p.parking_spaces,
                parkingType: p.parking_type,
                parkingAllocated: p.parking_allocated,
                facilities: p.facilities,
                googleMapLink: p.google_map_link,
                hidePrice: p.hide_price,
                images: p.images,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
                expiresAt: p.expires_at,
                isActive: p.is_active,
                is_sold: p.is_sold,
                likes: p.likes,
                leadsCount: p.leads_count,
                amenities: p.facilities || [], // Map facilities to amenities for UI
                facilities: p.facilities || [],
                areaOfVilla: p.area_of_villa,
                villaType: p.villa_type,
                anyStructure: p.any_structure,
                structureCategory: p.structure_category,
                structureArea: p.structure_area,
                structureSpecification: p.structure_specification,
                advanceAmount: p.advance_amount,
                sharingRatio: p.sharing_ratio,
                goodwillAmount: p.goodwill_amount,
            };

            addProperty(newProperty);
            toast.success('Property listed successfully!');
            setIsAddModalOpen(false);
            setUploadedImages([]);
            reset();
        } catch (err: unknown) {
            const error = err as Error;
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

    const handleEdit = useCallback((property: Property) => {
        setSelectedProperty(property);
        setUploadedImages(property.images || []);

        // Populate form
        setValue('title', property.title);
        setValue('description', property.description);
        setValue('price', property.price);
        setValue('district', property.district);
        setValue('location', property.location);
        setValue('type', property.type);
        setValue('category', property.category as Property['category']);
        setValue('structureType', (property.structureType as Property['structureType']) || 'Villa');
        setValue('landArea', property.landArea);
        setValue('floorNumber', property.floorNumber);
        setValue('floorDetail', property.floorDetail);
        setValue('parkingSpaces', property.parkingSpaces);
        setValue('parkingType', property.parkingType as Property['parkingType']);
        setValue('parkingAllocated', property.parkingAllocated);
        setValue('facilities', property.facilities || []);
        setValue('googleMapLink', property.googleMapLink || '');
        setValue('village', property.village || '');
        setValue('areaOfVilla', property.areaOfVilla);
        setValue('villaType', property.villaType);
        setValue('anyStructure', property.anyStructure);
        setValue('structureCategory', property.structureCategory);
        setValue('structureArea', property.structureArea);
        setValue('structureSpecification', property.structureSpecification);
        setValue('advanceAmount', property.advanceAmount);
        setValue('sharingRatio', property.sharingRatio);
        setValue('goodwillAmount', property.goodwillAmount);

        setIsEditModalOpen(true);
    }, [setValue]);

    // Sync active tab with URL search param
    useEffect(() => {
        if (viewParam) {
            const validTabs = ['explore', 'listings', 'responses', 'subscription', 'commission', 'profile'];
            if (validTabs.includes(viewParam)) {
                setActiveTab(viewParam as 'explore' | 'listings' | 'responses' | 'subscription' | 'commission' | 'profile');
            }
        } else {
            setActiveTab('explore');
        }

        // Handle direct edit link
        if (editParam && properties.length > 0) {
            const propertyToEdit = properties.find(p => p.id === editParam);
            if (propertyToEdit && propertyToEdit.brokerId === user?.id) {
                handleEdit(propertyToEdit);
                // Clear the param from URL to avoid reopening on refresh
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('edit');
                router.replace(`/dashboard?${newParams.toString()}`);
            }
        }

        // Handle Sold Property redirection
        const soldPropertyId = searchParams.get('soldPropertyId');
        if (soldPropertyId) {
            setSoldProperty({
                propertyId: soldPropertyId,
                title: searchParams.get('soldTitle') || '',
                price: parseFloat(searchParams.get('soldPrice') || '0'),
                location: searchParams.get('soldLocation') || '',
                district: searchParams.get('soldDistrict') || ''
            });
            // Clear the params from URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('soldPropertyId');
            newParams.delete('soldTitle');
            newParams.delete('soldPrice');
            newParams.delete('soldLocation');
            newParams.delete('soldDistrict');
            router.replace(`/dashboard?${newParams.toString()}`);
        }
    }, [viewParam, editParam, properties, user, handleEdit, router, searchParams]);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id);

            if (error) throw error;

            deleteProperty(id);
            toast.success('Property deleted successfully');
            setIsDeleteModalOpen(false);
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Error occurred');
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
            const filePath = `${user.id}/avatar.${fileExt}`;

            // Use upsert to overwrite existing avatar
            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Avatar upload error:', JSON.stringify(uploadError));
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            const avatarUrl = `${publicUrl}?t=${Date.now()}`;

            // Try avatar_url column first, fallback to photo_url
            let updateError;
            const { error: err1 } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id);

            if (err1) {
                console.warn('avatar_url column failed, trying photo_url:', err1.message);
                const { error: err2 } = await supabase
                    .from('profiles')
                    .update({ photo_url: avatarUrl })
                    .eq('id', user.id);
                updateError = err2;
            }

            if (updateError) {
                console.error('Profile update error:', JSON.stringify(updateError));
                throw new Error(`Database update failed: ${updateError.message}. You may need to add an 'avatar_url' column to the 'profiles' table in Supabase.`);
            }

            setUser({ ...user, avatarUrl: avatarUrl });
            toast.success('Profile picture updated!');
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error uploading avatar:', error.message || error);
            toast.error(`Failed to upload profile picture: ${error.message || 'Unknown error'}`);
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
                            {activeTab === 'commission' && 'Commission & Sharing'}
                        </h1>
                        <p className="text-muted-foreground">
                            {activeTab === 'explore' && 'Explore verified properties across the network.'}
                            {activeTab === 'listings' && 'Manage and monitor your property listings.'}
                            {activeTab === 'responses' && 'View and manage inquiries from interested buyers.'}
                            {activeTab === 'subscription' && 'Upgrade your account for premium features.'}
                            {activeTab === 'profile' && 'View and update your professional profile.'}
                            {activeTab === 'commission' && 'Track your earnings and manage commission sharing.'}
                        </p>
                    </div>
                    {(activeTab === 'listings' || activeTab === 'explore') && (
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
                            className="shadow-lg shadow-primary/20 relative"
                            variant={isSubscriptionExpired ? "outline" : "default"}
                        >
                            {activeTab === 'explore' && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                            <Plus className="mr-2 h-4 w-4" /> {activeTab === 'explore' ? 'Quick Add Property' : 'Add Property'}
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

                        {/* Assigned Responsibilities - Manager/Supervisor only */}
                        <ResponsibilitiesPanel />

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
                        {/* Compact Search Bar */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Quick search by title or location..."
                                className="pl-10 h-10 border-gray-200 focus:ring-primary/20"
                                value={listingSearch}
                                onChange={(e) => setListingSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-4">
                            {myProperties.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <p className="text-muted-foreground">You haven&apos;t listed any properties yet.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        Create Your First Listing
                                    </Button>
                                </Card>
                            ) : filteredMyProperties.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    No properties match your search.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredMyProperties.map((p) => (
                                        <Card key={p.id} className="overflow-hidden hover:shadow-sm transition-shadow border-gray-100 dark:border-gray-800 relative">
                                            <div className="absolute top-2 right-2 z-10">
                                                <DropdownMenu
                                                    trigger={
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-sm border border-gray-100">
                                                            <MoreVertical className="h-4 w-4 text-gray-600" />
                                                        </Button>
                                                    }
                                                >
                                                    <DropdownMenuItem onClick={() => window.open(`/property/${p.id}`, '_blank')}>
                                                        <Eye className="h-4 w-4" /> View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(p)}>
                                                        <Pencil className="h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="danger"
                                                        onClick={() => {
                                                            setPropertyToDelete(p.id);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSoldProperty({
                                                                propertyId: p.id,
                                                                title: p.title,
                                                                price: p.price,
                                                                location: p.location,
                                                                district: p.district,
                                                            });
                                                            setActiveTab('commission');
                                                        }}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Sold
                                                    </DropdownMenuItem>
                                                </DropdownMenu>
                                            </div>
                                            <CardContent className="p-3 sm:p-4">
                                                <div className="flex gap-4">
                                                    {/* Left Column: Image */}
                                                    <div className="flex flex-col gap-2 w-24 sm:w-32 flex-shrink-0">
                                                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                                            {p.images && p.images.length > 0 ? (
                                                                <Image
                                                                    src={p.images[0]}
                                                                    alt={p.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Camera className="h-6 w-6 text-muted-foreground/30" />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-1 left-1">
                                                                <Badge
                                                                    className={cn(
                                                                        "px-1.5 py-0 text-[10px] uppercase font-bold",
                                                                        p.is_sold ? "bg-purple-600 text-white" : p.isActive ? "bg-green-500" : "bg-gray-400"
                                                                    )}
                                                                >
                                                                    {p.is_sold ? "Sold" : p.isActive ? "Live" : "Draft"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Details */}
                                                    <div className="flex-1 flex flex-col justify-between py-1">
                                                        <div className="space-y-1.5">
                                                            <div className="space-y-0.5">
                                                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                                    {p.hidePrice ? (
                                                                        <span className="text-sm">Please Message/ call Broker for Price</span>
                                                                    ) : p.type === 'joint_venture' ? (
                                                                        <span>Advance: ₹{p.advanceAmount?.toLocaleString('en-IN') || '0'}</span>
                                                                    ) : (
                                                                        <span>₹ {p.price.toLocaleString('en-IN')}</span>
                                                                    )}
                                                                </h3>
                                                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-primary uppercase">
                                                                    {p.type} • {p.category}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-start text-xs text-muted-foreground gap-1.5 pt-1">
                                                                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <span className="line-clamp-1 uppercase tracking-wide text-[10px] sm:text-[11px]">
                                                                    {p.location}, {p.district}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Status & Share Row */}
                                                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1 px-2 py-1 bg-pink-50 dark:bg-pink-900/20 rounded-md border border-pink-100 dark:border-pink-800 text-[10px] text-pink-600 font-bold">
                                                                    <Check className="h-3 w-3" />
                                                                    <span>{p.likes}</span>
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        "flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] cursor-pointer transition-colors font-bold",
                                                                        myLeads.filter(l => l.property_id === p.id && l.status === 'new').length > 0
                                                                            ? "bg-blue-50 border-blue-200 text-blue-600"
                                                                            : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-muted-foreground hover:text-primary"
                                                                    )}
                                                                    onClick={() => setActiveTab('responses')}
                                                                >
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    <span>{p.leadsCount}</span>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-[11px] px-3 rounded-md hover:bg-primary hover:text-white border-primary/20 text-primary flex items-center gap-1.5"
                                                                onClick={() => {
                                                                    const url = `${window.location.origin}/property/${p.id}`;
                                                                    navigator.clipboard.writeText(url);
                                                                    toast.success('Link copied!');
                                                                }}
                                                            >
                                                                <Share2 className="h-3.5 w-3.5" /> Share
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Title below thumbnail and content */}
                                                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800/50">
                                                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 line-clamp-1">
                                                        {p.title}
                                                    </h4>
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
                    <div className="max-w-4xl mx-auto py-10 space-y-12">
                        <SubscriptionDashboard />

                        <Card className="border-none shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                                        <Gift className="h-5 w-5" />
                                        Referral Rewards & History
                                    </CardTitle>
                                    <Badge variant="default" className="bg-primary text-white font-bold px-3">
                                        Total Earnings: ₹{broker?.referralEarnings || 0}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    Track your successful referrals and subscription extensions.
                                    <span className="block mt-1 text-[10px] text-amber-600 font-medium italic">
                                        * Rewards and extensions are granted only after the referred broker is approved by the Admin.
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Referred Broker</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Extension</th>
                                                <th className="px-6 py-4 text-right">Reward</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {referralStats.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                                        No referrals found. Start sharing your ID to earn rewards!
                                                    </td>
                                                </tr>
                                            ) : (
                                                referralStats.map((ref, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-900 dark:text-gray-100">{ref.referred_person_name}</div>
                                                            <div className="text-[10px] text-muted-foreground">{ref.referred_contact}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                            {new Date(ref.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge
                                                                variant={ref.admin_approval_status === 'approved' ? "default" : "secondary"}
                                                                className={ref.admin_approval_status ? "bg-green-100 text-green-700" : ""}
                                                            >
                                                                {ref.admin_approval_status ? 'Approved' : 'Pending'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {ref.reward_status === 'applied' ? (
                                                                <span className="flex items-center gap-1 text-green-600 font-bold text-[11px]">
                                                                    <Check className="h-3 w-3" /> 1 Month Added
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-[11px]">Waiting for approval</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-primary">
                                                            ₹{ref.reward_value}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Delete Property"
                >
                    <div className="space-y-6">
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex gap-3 text-sm">
                            <Trash2 className="h-5 w-5 flex-shrink-0" />
                            <p>Are you sure you want to delete this property? <strong>This action cannot be undone</strong> and all data including images and likes will be permanently removed.</p>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={!!isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 font-bold shadow-lg shadow-red-200"
                                onClick={() => propertyToDelete && handleDelete(propertyToDelete)}
                                disabled={!!isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Permanently"}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {activeTab === 'profile' && (
                    <div className="max-w-4xl space-y-8">
                        {/* Profile Header Card */}
                        <Card>
                            <CardContent className="pt-10">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="h-32 w-32 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden flex items-center justify-center relative">
                                            {user?.avatarUrl ? (
                                                <Image src={user.avatarUrl} alt={user.name || 'User'} fill className="object-cover" />
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
                                            <h2 className="text-3xl font-bold">{user?.name}</h2>
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

                {activeTab === 'commission' && (
                    <CommissionDashboard
                        soldProperty={soldProperty}
                        onSoldComplete={() => {
                            setSoldProperty(null);
                            // Re-fetch properties to reflect sold status
                            const refetch = async () => {
                                const { data } = await supabase
                                    .from('properties')
                                    .select('*, profiles(phone)')
                                    .order('created_at', { ascending: false });
                                if (data) {
                                    const mapped = (data as unknown[]).map((item) => {
                                        const p = item as any;
                                        return {
                                            id: p.id, brokerId: p.broker_id, title: p.title || 'No Title',
                                            description: p.description || '', price: p.price || 0,
                                            district: p.district || 'Unknown', location: p.location || 'Unknown',
                                            type: p.type || 'sale', category: (p.category) || 'residential',
                                            structureType: p.structure_type || '', landArea: p.land_area || 0,
                                            floorNumber: p.floor_number || 0, floorDetail: p.floor_detail || '',
                                            parkingSpaces: p.parking_spaces || 0, parkingType: (p.parking_type) || 'Open',
                                            parkingAllocated: p.parking_allocated || '', facilities: p.facilities || [],
                                            googleMapLink: p.google_map_link || '', images: p.images || [],
                                            village: p.village || '', createdAt: p.created_at, updatedAt: p.updated_at,
                                            expiresAt: p.expires_at, isActive: p.is_active ?? true,
                                            is_sold: p.is_sold ?? false,
                                            likes: p.likes || 0, leadsCount: p.leads_count || 0,
                                            amenities: p.facilities || [], // Consistently map facilities to amenities
                                            facilities: p.facilities || [],
                                            brokerPhone: p.profiles?.phone || '',
                                            hidePrice: p.hide_price ?? false,
                                            areaOfVilla: p.area_of_villa,
                                            villaType: p.villa_type,
                                            anyStructure: p.any_structure,
                                            structureCategory: p.structure_category,
                                            structureArea: p.structure_area,
                                            structureSpecification: p.structure_specification,
                                            advanceAmount: p.advance_amount,
                                            sharingRatio: p.sharing_ratio,
                                            goodwillAmount: p.goodwill_amount,
                                        };
                                    });
                                    setProperties(mapped);
                                }
                            };
                            refetch();
                        }}
                    />
                )}

                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Property">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* 0. Transaction Type */}
                        <div>
                            <label className="text-sm font-medium">Transaction Type</label>
                            <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="sale">Sale</option>
                                <option value="joint_venture">Joint Venture</option>
                                <option value="rent">Rent</option>
                                <option value="lease">Lease</option>
                            </select>
                        </div>

                        {/* 1. Structure Type */}
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
                                <option value="Commercial">Commercial (Office/Shop)</option>
                            </select>
                        </div>

                        {/* 2. Conditional Fields based on Structure */}

                        {/* Villa / Farmhouse Fields */}
                        {(structureType === 'Villa' || structureType === 'Farmhouse') && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                {watchType !== 'joint_venture' && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">Land Area (Sqft/Cents)</label>
                                        <Input type="number" {...register('landArea')} step="0.01" />
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Area of Villa (SQFT)</label>
                                    <Input type="number" {...register('areaOfVilla')} step="0.01" />
                                </div>
                                {villaTypesConfig.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium">Villa Type</label>
                                        <select {...register('villaType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="">Select Type</option>
                                            {villaTypesConfig.map(v => (
                                                <option key={v.id} value={v.name}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Apartment Fields */}
                        {structureType === 'Apartment' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Floor Number (1-50)</label>
                                    <select {...register('floorNumber')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {[...Array(50)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Floor Detail (Optional)</label>
                                    <Input {...register('floorDetail')} placeholder="e.g. 3rd Floor" />
                                </div>
                            </div>
                        )}

                        {/* Parking Details (For non-land types) */}
                        {structureType && structureType !== 'Land' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Parking Spaces (0-10)</label>
                                    <select {...register('parkingSpaces')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {[...Array(11)].map((_, i) => (
                                            <option key={i} value={i}>{i}</option>
                                        ))}
                                    </select>
                                </div>
                                {Number(parkingSpaces) > 0 && (
                                    <div>
                                        <label className="text-sm font-medium">Parking Type</label>
                                        <select {...register('parkingType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="Covered">Covered</option>
                                            <option value="Open">Open</option>
                                            <option value="Open but Covered">Open but Covered</option>
                                            <option value="Common Parking">Common Parking</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Total Area Details (For Land and Non-JV) */}
                        {structureType === 'Land' && watchType !== 'joint_venture' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Total Land Area</label>
                                    <Input type="number" {...register('landArea')} placeholder="Sqft / Cents" />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Amenities */}
                        {structureType && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium capitalize">Facilities & Amenities</label>
                                <AmenitySelector
                                    allAmenities={amenitiesConfig}
                                    selectedAmenities={watch('facilities') || []}
                                    onToggle={(amenity) => {
                                        const current = watch('facilities') || [];
                                        if (current.includes(amenity)) {
                                            setValue('facilities', current.filter(a => a !== amenity));
                                        } else {
                                            setValue('facilities', [...current, amenity]);
                                        }
                                    }}
                                    propertyType={structureType}
                                />
                            </div>
                        )}

                        {/* 2. Category, Any Structure Built, Structure Type, and Total Area */}
                        {(watchType === 'joint_venture' || structureType === 'Land') && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {!(watchType === 'joint_venture' && structureType === 'Land') && (
                                        <div>
                                            <label className="text-sm font-medium">Category</label>
                                            <select {...register('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="residential">Residential</option>
                                                <option value="commercial">Commercial</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className={watchType === 'joint_venture' && structureType === 'Land' ? "col-span-2" : ""}>
                                        <label className="text-sm font-medium">Any Structure Built</label>
                                        <select
                                            {...register('anyStructure', { setValueAs: v => v === 'true' })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    </div>
                                </div>

                                {watchAnyStructure && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Structure Type</label>
                                            <select {...register('structureCategory')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="">Select Type</option>
                                                <option value="Villa">Villa</option>
                                                <option value="Showroom">Showroom</option>
                                                <option value="Shops">Shops</option>
                                                <option value="Godown">Godown</option>
                                                <option value="Pump Shed">Pump Shed</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        {watchStructureCategory && (
                                            <div>
                                                <label className="text-sm font-medium">Area (SQFT)</label>
                                                <Input type="number" {...register('structureArea')} placeholder="e.g. 1500" />
                                            </div>
                                        )}
                                        {watchStructureCategory === 'Others' && (
                                            <div className="col-span-2">
                                                <label className="text-sm font-medium">Specification</label>
                                                <Input {...register('structureSpecification')} placeholder="Specify structure details" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!(watchType === 'joint_venture' && structureType === 'Land') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Total Area</label>
                                            <Input type="number" {...register('landArea')} placeholder="Sqft / Cents" />
                                        </div>
                                    </div>
                                )}
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
                                <label className="text-sm font-medium">City</label>
                                <Input {...register('location')} placeholder="e.g. Manipal" />
                                {errors.location?.message && <p className="text-xs text-red-500">{errors.location.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Local Area / Village (Optional)</label>
                                <Input {...register('village')} placeholder="e.g. Kadri" />
                                {errors.village?.message && <p className="text-xs text-red-500">{errors.village.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {watchType === 'joint_venture' ? (
                                <div className="space-y-4 col-span-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Advance Amount (₹)</label>
                                            <Input type="number" {...register('advanceAmount')} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Sharing Ratio</label>
                                            <Input {...register('sharingRatio')} placeholder="e.g. 50:50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Goodwill Amount (Optional)</label>
                                            <Input type="number" {...register('goodwillAmount')} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Price (₹)</label>
                                    <Input type="number" {...register('price')} />
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="h-[1px] flex-1 bg-border/50"></div>
                                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">OR</span>
                                        <div className="h-[1px] flex-1 bg-border/50"></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" {...register('hidePrice')} id="hidePriceAdd" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                        <label htmlFor="hidePriceAdd" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">Call or Message for quote</label>
                                    </div>
                                    {errors.price?.message && <p className="text-xs text-red-500">{errors.price.message}</p>}
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium">Google Map Link (Optional)</label>
                                <Input {...register('googleMapLink')} placeholder="https://maps.google.com/..." />
                            </div>
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
                                            <Image src={img} alt={`Preview ${idx}`} fill className="object-cover rounded-md border" />
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
                        if (!selectedProperty || !user) return;
                        setIsLoading(true);
                        try {
                            const facilitiesArray = data.facilities || [];

                            const { error } = await supabase
                                .from('properties')
                                .update({
                                    title: data.title,
                                    description: data.description,
                                    price: data.price,
                                    district: data.district,
                                    location: data.location,
                                    village: data.village,
                                    type: data.type,
                                    category: (data.type === 'joint_venture' || (data.structureType === 'Land')) ? data.category : (['Villa', 'Apartment', 'Farmhouse'].includes(data.structureType || '') ? 'residential' : data.category),
                                    structure_type: data.structureType,
                                    land_area: data.landArea || null,
                                    floor_number: data.floorNumber || null,
                                    floor_detail: data.floorDetail,
                                    parking_spaces: data.parkingSpaces || 0,
                                    parking_type: data.parkingType,
                                    parking_allocated: data.parkingAllocated,
                                    facilities: facilitiesArray,
                                    google_map_link: data.googleMapLink,
                                    hide_price: data.hidePrice || false,
                                    images: uploadedImages,
                                    updated_at: new Date().toISOString(),
                                    area_of_villa: data.areaOfVilla || null,
                                    villa_type: data.villaType || null,
                                    any_structure: data.anyStructure || false,
                                    structure_category: data.structureCategory || null,
                                    structure_area: data.structureArea || null,
                                    structure_specification: data.structureSpecification || null,
                                    advance_amount: data.advanceAmount || null,
                                    sharing_ratio: data.sharingRatio || null,
                                    goodwill_amount: data.goodwillAmount || null,
                                })
                                .eq('id', selectedProperty.id);

                            if (error) throw error;

                            // Update local state
                            updateProperty(selectedProperty.id, {
                                ...selectedProperty,
                                title: data.title,
                                description: data.description,
                                price: data.price,
                                district: data.district,
                                location: data.location,
                                village: data.village ?? undefined,
                                type: data.type,
                                category: (['Villa', 'Apartment', 'Farmhouse'].includes(data.structureType || '') && data.structureType !== 'Land') ? 'residential' : data.category as Property['category'],
                                structureType: data.structureType ?? undefined,
                                landArea: data.landArea ?? undefined,
                                floorNumber: data.floorNumber ?? undefined,
                                floorDetail: data.floorDetail ?? undefined,
                                parkingSpaces: data.parkingSpaces ?? undefined,
                                parkingType: data.parkingType as Property['parkingType'],
                                parkingAllocated: data.parkingAllocated ?? undefined,
                                facilities: facilitiesArray,
                                googleMapLink: data.googleMapLink ?? undefined,
                                hidePrice: data.hidePrice ?? undefined,
                                images: uploadedImages,
                                updatedAt: new Date().toISOString(),
                                areaOfVilla: data.areaOfVilla ?? undefined,
                                villaType: data.villaType ?? undefined,
                                anyStructure: data.anyStructure ?? undefined,
                                structureCategory: data.structureCategory ?? undefined,
                                structureArea: data.structureArea ?? undefined,
                                structureSpecification: data.structureSpecification ?? undefined,
                                advanceAmount: data.advanceAmount ?? undefined,
                                sharingRatio: data.sharingRatio ?? undefined,
                                goodwillAmount: data.goodwillAmount ?? undefined,
                            } as Property);

                            toast.success('Property updated successfully!');
                            setIsEditModalOpen(false);
                            setSelectedProperty(null);
                            reset();
                        } catch (err: unknown) {
                            const error = err as Error;
                            console.error('Error updating property:', error);
                            toast.error(error.message || 'Failed to update property');
                        } finally {
                            setIsLoading(false);
                        }
                    }, (errors) => {
                        console.error('Validation Errors:', errors);
                        const fieldNames = Object.keys(errors).join(', ');
                        toast.error(`Please check these fields: ${fieldNames}`);
                    })} className="space-y-4">

                        {/* 0. Transaction Type */}
                        <div>
                            <label className="text-sm font-medium">Transaction Type</label>
                            <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="sale">Sale</option>
                                <option value="joint_venture">Joint Venture</option>
                                <option value="rent">Rent</option>
                                <option value="lease">Lease</option>
                            </select>
                        </div>

                        {/* 1. Structure Type */}
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
                                <option value="Commercial">Commercial (Office/Shop)</option>
                            </select>
                        </div>

                        {/* 2. Conditional Fields based on Structure */}

                        {/* Villa / Farmhouse Fields */}
                        {(structureType === 'Villa' || structureType === 'Farmhouse') && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                {watchType !== 'joint_venture' && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">Land Area (Sqft/Cents)</label>
                                        <Input type="number" {...register('landArea')} step="0.01" />
                                        {errors.landArea?.message && <p className="text-xs text-red-500">{errors.landArea.message}</p>}
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Area of Villa (SQFT)</label>
                                    <Input type="number" {...register('areaOfVilla')} step="0.01" />
                                </div>
                                {villaTypesConfig.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium">Villa Type</label>
                                        <select {...register('villaType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="">Select Type</option>
                                            {villaTypesConfig.map(v => (
                                                <option key={v.id} value={v.name}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Apartment Fields */}
                        {structureType === 'Apartment' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Floor Number (1-50)</label>
                                    <select {...register('floorNumber')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {[...Array(50)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Floor Detail (Optional)</label>
                                    <Input {...register('floorDetail')} placeholder="e.g. 3rd Floor" />
                                </div>
                            </div>
                        )}

                        {/* Parking Details (For non-land types) */}
                        {structureType && structureType !== 'Land' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Parking Spaces (0-10)</label>
                                    <select {...register('parkingSpaces')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {[...Array(11)].map((_, i) => (
                                            <option key={i} value={i}>{i}</option>
                                        ))}
                                    </select>
                                </div>
                                {Number(parkingSpaces) > 0 && (
                                    <div>
                                        <label className="text-sm font-medium">Parking Type</label>
                                        <select {...register('parkingType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="Covered">Covered</option>
                                            <option value="Open">Open</option>
                                            <option value="Open but Covered">Open but Covered</option>
                                            <option value="Common Parking">Common Parking</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Total Area Details (For Land and Non-JV) */}
                        {structureType === 'Land' && watchType !== 'joint_venture' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Total Land Area</label>
                                    <Input type="number" {...register('landArea')} placeholder="Sqft / Cents" />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Amenities */}
                        {structureType && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium capitalize">Facilities & Amenities</label>
                                <AmenitySelector
                                    allAmenities={amenitiesConfig}
                                    selectedAmenities={watch('facilities') || []}
                                    onToggle={(amenity) => {
                                        const current = watch('facilities') || [];
                                        if (current.includes(amenity)) {
                                            setValue('facilities', current.filter(a => a !== amenity));
                                        } else {
                                            setValue('facilities', [...current, amenity]);
                                        }
                                    }}
                                    propertyType={structureType}
                                />
                            </div>
                        )}

                        {/* Land Fields */}
                        {/* 1.1 Category, Any Structure Built, Structure Type, and Total Area */}
                        {(watchType === 'joint_venture' || structureType === 'Land') && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {!(watchType === 'joint_venture' && structureType === 'Land') && (
                                        <div>
                                            <label className="text-sm font-medium">Category</label>
                                            <select {...register('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="residential">Residential</option>
                                                <option value="commercial">Commercial</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className={watchType === 'joint_venture' && structureType === 'Land' ? "col-span-2" : ""}>
                                        <label className="text-sm font-medium">Any Structure Built</label>
                                        <select
                                            {...register('anyStructure', { setValueAs: v => v === 'true' })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    </div>
                                </div>

                                {watchAnyStructure && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Structure Type</label>
                                            <select {...register('structureCategory')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="">Select Type</option>
                                                <option value="Villa">Villa</option>
                                                <option value="Showroom">Showroom</option>
                                                <option value="Shops">Shops</option>
                                                <option value="Godown">Godown</option>
                                                <option value="Pump Shed">Pump Shed</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        {watchStructureCategory && (
                                            <div>
                                                <label className="text-sm font-medium">Area (SQFT)</label>
                                                <Input type="number" {...register('structureArea')} placeholder="e.g. 1500" />
                                            </div>
                                        )}
                                        {watchStructureCategory === 'Others' && (
                                            <div className="col-span-2">
                                                <label className="text-sm font-medium">Specification</label>
                                                <Input {...register('structureSpecification')} placeholder="Specify structure details" />
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                <label className="text-sm font-medium">City</label>
                                <Input {...register('location')} placeholder="e.g. Manipal" />
                                {errors.location?.message && <p className="text-xs text-red-500">{errors.location.message}</p>}
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Local Area / Village (Optional)</label>
                                <Input {...register('village')} placeholder="e.g. Kadri" />
                                {errors.village?.message && <p className="text-xs text-red-500">{errors.village.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {watchType === 'joint_venture' ? (
                                <div className="space-y-4 col-span-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Advance Amount (₹)</label>
                                            <Input type="number" {...register('advanceAmount')} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Sharing Ratio</label>
                                            <Input {...register('sharingRatio')} placeholder="e.g. 50:50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Goodwill Amount (Optional)</label>
                                            <Input type="number" {...register('goodwillAmount')} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Price (₹)</label>
                                    <Input type="number" {...register('price')} />
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="h-[1px] flex-1 bg-border/50"></div>
                                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">OR</span>
                                        <div className="h-[1px] flex-1 bg-border/50"></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" {...register('hidePrice')} id="hidePriceEdit" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                        <label htmlFor="hidePriceEdit" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">Call or Message for quote</label>
                                    </div>
                                    {errors.price?.message && <p className="text-xs text-red-500">{errors.price.message}</p>}
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium">Google Map Link (Optional)</label>
                                <Input {...register('googleMapLink')} placeholder="https://maps.google.com/..." />
                                {errors.googleMapLink?.message && <p className="text-xs text-red-500">{errors.googleMapLink.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex flex-col gap-2 col-span-2">
                                <label className="text-sm font-medium">Photos (Max 3)</label>
                                <div className="flex gap-2">
                                    {uploadedImages.map((img, idx) => (
                                        <div key={idx} className="relative h-10 w-10 flex-shrink-0 group">
                                            <Image src={img} alt={`Preview ${idx}`} fill className="object-cover rounded-md border" />
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
