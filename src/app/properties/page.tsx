'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
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
    
    // Use selectors for better performance and stability
    const properties = useStore(state => state.properties);
    const setProperties = useStore(state => state.setProperties);
    
    const [loading, setLoading] = useState(true);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

    // Memoize search params to ensure primitives are stable
    const searchBy = useMemo(() => (searchParams.get('by') as SmartSearchFilters['searchBy']) || 'city', [searchParams]);
    const query = useMemo(() => searchParams.get('q') || '', [searchParams]);
    const type = useMemo(() => searchParams.get('type') || '', [searchParams]);

    const initialFilters = useMemo(() => ({ searchBy, query, propertyType: type }), [searchBy, query, type]);

    const normalizeLocation = useCallback((loc: string) => {
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
    }, []);

    const applyFilters = useCallback((allProps: Property[], filters: SmartSearchFilters) => {
        let filtered = [...allProps];

        if (filters.query) {
            const q = filters.query.toLowerCase().trim();
            const normalizedQ = normalizeLocation(q);

            if (filters.searchBy === 'city') {
                filtered = filtered.filter(p => {
                    const loc = (p.location || '').toLowerCase().trim();
                    const vil = (p.village || '').toLowerCase().trim();
                    const match = loc.includes(q) || normalizeLocation(loc).includes(normalizedQ) ||
                        vil.includes(q) || normalizeLocation(vil).includes(normalizedQ);
                    return match;
                });
            } else if (filters.searchBy === 'district') {
                filtered = filtered.filter(p => (p.district || '').toLowerCase().trim().includes(q));
            } else if (filters.searchBy === 'village') {
                filtered = filtered.filter(p => {
                    const loc = (p.location || '').toLowerCase().trim();
                    const vil = (p.village || '').toLowerCase().trim();
                    const match = vil.includes(q) || normalizeLocation(vil).includes(normalizedQ) ||
                        loc.includes(q) || normalizeLocation(loc).includes(normalizedQ);
                    return match;
                });
            } else if (filters.searchBy === 'agent') {
                filtered = filtered.filter(p => (p.profiles?.name || '').toLowerCase().trim().includes(q));
            }
            console.log(`Search Results for ${filters.searchBy}="${q}" (normalized: "${normalizedQ}"): found ${filtered.length} matches`);
        }

        if (filters.propertyType) {
            const t = filters.propertyType.toLowerCase();
            filtered = filtered.filter(p =>
                p.category.toLowerCase() === t ||
                p.structureType?.toLowerCase() === t
            );
        }

        setFilteredProperties(filtered);
    }, [normalizeLocation]);

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
                    title: p.title || 'No Title',
                    description: p.description || '',
                    price: p.price || 0,
                    district: p.district || 'Unknown',
                    location: p.location || 'Unknown',
                    village: p.village || '',
                    type: p.type || 'sale',
                    category: (p.category as Property['category']) || 'residential',
                    structureType: p.structure_type || '',
                    images: p.images || [],
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    expiresAt: p.expires_at,
                    isActive: p.is_active ?? true,
                    likes: p.likes || 0,
                    leadsCount: p.leads_count || 0,
                    amenities: p.facilities || [], // Correct mapping
                    facilities: p.facilities || [],
                    brokerPhone: p.profiles?.phone || '',
                    profiles: p.profiles,
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
                    landArea: p.land_area,
                    floorNumber: p.floor_number,
                    floorDetail: p.floor_detail,
                    parkingSpaces: p.parking_spaces,
                    parkingType: p.parking_type,
                    parkingAllocated: p.parking_allocated,
                    googleMapLink: p.google_map_link,
                    tdrCertNumber: p.tdr_cert_number,
                    tdrDateOfIssue: p.tdr_date_of_issue,
                    tdrIssuingAuthority: p.tdr_issuing_authority,
                    tdrIssuingAuthorityOther: p.tdr_issuing_authority_other,
                    tdrTotalAreaAvailable: p.tdr_total_area_available,
                    tdrTotalAreaUnit: p.tdr_total_area_unit,
                    tdrSaleValue: p.tdr_sale_value,
                    tdrSaleValueUnit: p.tdr_sale_value_unit,
                    tdrLocation: p.tdr_location,
                    tdrSurveyNumber: p.tdr_survey_number,
                    tdrZoneClassification: p.tdr_zone_classification,
                    tdrTotalSaleConsideration: p.tdr_total_sale_consideration
                }));
                setProperties(mapped);
                applyFilters(mapped, { searchBy, query, propertyType: type });
            }
            setLoading(false);
        };

        fetchProperties();
    }, [setProperties, searchBy, query, type, applyFilters]);

    // Re-filter when search params change
    useEffect(() => {
        console.log('Properties Page: properties or search params changed', { propertiesCount: properties.length, searchBy, query, type });
        if (properties.length > 0) {
            applyFilters(properties, { searchBy, query, propertyType: type });
        }
    }, [properties, applyFilters, searchBy, query, type]);


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
                        initialFilters={initialFilters}
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
