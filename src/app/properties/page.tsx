'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Property } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { PropertyCard } from '@/components/PropertyCard';
import { SmartSearchForm, SmartSearchFilters } from '@/components/SmartSearchForm';
import { Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

function PropertiesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { properties, setProperties } = useStore();
    const [loading, setLoading] = useState(true);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

    const searchBy = searchParams.get('by') as any || 'city';
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('properties')
                .select(`
                    *,
                    profiles (
                        name,
                        phone
                    )
                `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const mapped: Property[] = data.map((p: any) => ({
                    id: p.id,
                    brokerId: p.broker_id,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    district: p.district,
                    location: p.location,
                    village: p.village,
                    type: p.type,
                    category: p.category,
                    structureType: p.structure_type,
                    images: p.images,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    expiresAt: p.expires_at,
                    isActive: p.is_active,
                    likes: p.likes,
                    leadsCount: p.leads_count,
                    amenities: p.amenities || [],
                    brokerPhone: p.profiles?.phone,
                    profiles: p.profiles
                }));
                setProperties(mapped);
                applyFilters(mapped, { searchBy, query, propertyType: type });
            }
            setLoading(false);
        };

        fetchProperties();
    }, [setProperties]);

    // Re-filter when search params change
    useEffect(() => {
        if (properties.length > 0) {
            applyFilters(properties, { searchBy, query, propertyType: type });
        }
    }, [searchParams, properties]);

    const normalizeLocation = (loc: string) => {
        const lower = loc.toLowerCase().trim();
        // Common aliases and spelling variations
        const aliases: Record<string, string[]> = {
            'mangaluru': ['mangalore', 'mangaluru', 'mng'],
            'udupi': ['udupi', 'udipi'],
            'bikkarnakatte': ['bikarnakatte', 'bikkarnakatte'],
            'kankanady': ['kankanady', 'kankanadi'],
            'moodbidri': ['moodabidri', 'moodbidri', 'mudbidri'],
            'puttur': ['puttur', 'putur'],
        };

        for (const [canonical, variations] of Object.entries(aliases)) {
            if (variations.some(v => lower.includes(v) || v.includes(lower))) {
                return canonical;
            }
        }
        return lower;
    };

    const applyFilters = (allProps: Property[], filters: SmartSearchFilters) => {
        let filtered = [...allProps];

        if (filters.query) {
            const q = filters.query.toLowerCase().trim();
            const normalizedQ = normalizeLocation(q);

            if (filters.searchBy === 'city') {
                filtered = filtered.filter(p => {
                    const loc = p.location.toLowerCase();
                    return loc.includes(q) || normalizeLocation(loc).includes(normalizedQ);
                });
            } else if (filters.searchBy === 'district') {
                filtered = filtered.filter(p => p.district.toLowerCase().includes(q));
            } else if (filters.searchBy === 'village') {
                filtered = filtered.filter(p => {
                    const vil = p.village?.toLowerCase() || '';
                    return vil.includes(q) || normalizeLocation(vil).includes(normalizedQ);
                });
            } else if (filters.searchBy === 'agent') {
                filtered = filtered.filter(p => p.profiles?.name.toLowerCase().includes(q));
            }
        }

        if (filters.propertyType) {
            const t = filters.propertyType.toLowerCase();
            filtered = filtered.filter(p =>
                p.category.toLowerCase() === t ||
                p.structureType?.toLowerCase() === t
            );
        }

        setFilteredProperties(filtered);
    };

    const handleSearch = (filters: SmartSearchFilters) => {
        const params = new URLSearchParams();
        if (filters.searchBy) params.set('by', filters.searchBy);
        if (filters.query) params.set('q', filters.query);
        if (filters.propertyType) params.set('type', filters.propertyType);

        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-30">
                <div className="container px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Building2 className="h-6 w-6" />
                        <span>Property Dosti</span>
                    </Link>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Home</Link>
                    </Button>
                </div>
            </header>

            <main className="container px-4 py-8">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold mb-2">Explore Properties</h1>
                    <p className="text-muted-foreground mb-8">Find your dream home or investment across Karnataka.</p>

                    <SmartSearchForm
                        onSearch={handleSearch}
                        initialFilters={{ searchBy, query, propertyType: type }}
                    />
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        {loading ? 'Searching...' : `${filteredProperties.length} Properties Found`}
                    </h2>
                    {(query || type) && (
                        <Button variant="ghost" size="sm" onClick={() => router.push('/properties')}>
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[400px] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        ))
                    ) : filteredProperties.length > 0 ? (
                        filteredProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No properties found</h3>
                            <p className="text-gray-500">Try adjusting your search filters or browse other areas.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function PropertiesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading properties...</div>}>
            <PropertiesContent />
        </Suspense>
    );
}
