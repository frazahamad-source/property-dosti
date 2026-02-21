'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Building, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface SmartSearchFilters {
    searchBy: 'city' | 'district' | 'village' | 'agent';
    query: string;
    propertyType: string;
}

interface SmartSearchFormProps {
    onSearch: (filters: SmartSearchFilters) => void;
    initialFilters?: Partial<SmartSearchFilters>;
    className?: string;
}

export const PROPERTY_TYPES = [
    'Residential',
    'Commercial',
    'Villa',
    'Apartment',
    'Offices',
    'Farmhouse',
    'Land',
    'Godown'
];

export function SmartSearchForm({ onSearch, initialFilters, className = "" }: SmartSearchFormProps) {
    const [filters, setFilters] = useState<SmartSearchFilters>({
        searchBy: initialFilters?.searchBy || 'city',
        query: initialFilters?.query || '',
        propertyType: initialFilters?.propertyType || '',
    });

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        onSearch(filters);
    };

    return (
        <form
            onSubmit={handleSearch}
            className={`w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-2 md:p-3 ${className}`}
        >
            <div className="flex flex-col lg:flex-row items-stretch gap-2">
                {/* Search By Dropdown */}
                <div className="flex-1 lg:flex-[0.8] relative group">
                    <label className="absolute left-3 top-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search by</label>
                    <select
                        value={filters.searchBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchBy: e.target.value as any }))}
                        className="w-full h-14 pl-3 pr-8 pt-4 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                        <option value="city">City / Town</option>
                        <option value="district">District</option>
                        <option value="village">Village</option>
                        <option value="agent">Agent Name</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <MapPin className="h-4 w-4" />
                    </div>
                </div>

                {/* Query Input */}
                <div className="flex-[2] relative group">
                    <label className="absolute left-3 top-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight">Enter Details</label>
                    <Input
                        value={filters.query}
                        onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                        placeholder={
                            filters.searchBy === 'city' ? "Which city?" :
                                filters.searchBy === 'district' ? "Which district?" :
                                    filters.searchBy === 'village' ? "Which village?" : "Agent name..."
                        }
                        className="w-full h-14 pl-3 pt-4 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {filters.query && (
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, query: '' }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Property Type Dropdown */}
                <div className="flex-1 lg:flex-[0.8] relative group">
                    <label className="absolute left-3 top-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight">Property Type</label>
                    <select
                        value={filters.propertyType}
                        onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                        className="w-full h-14 pl-3 pr-8 pt-4 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Any Type</option>
                        {PROPERTY_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Building className="h-4 w-4" />
                    </div>
                </div>

                {/* Search Button */}
                <Button
                    type="submit"
                    className="h-14 lg:px-8 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-full lg:w-auto mt-2 lg:mt-0"
                >
                    <Search className="h-5 w-5 mr-2" />
                    Search
                </Button>
            </div>
        </form>
    );
}
