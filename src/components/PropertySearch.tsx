'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, X } from 'lucide-react';

interface PropertySearchProps {
    onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
    district: string;
    city: string; // matches 'location' in Property type
    village: string;
    agentName: string;
}

export function PropertySearch({ onSearch }: PropertySearchProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        district: '',
        city: '',
        village: '',
        agentName: '',
    });
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = () => {
        onSearch(filters);
    };

    const handleClear = () => {
        const resetFilters = { district: '', city: '', village: '', agentName: '' };
        setFilters(resetFilters);
        onSearch(resetFilters);
    };

    const handleChange = (key: keyof SearchFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full max-w-4xl mx-auto -mt-8 relative z-20 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Main Search Bar - Desktop: Agent/District, Mobile: Toggle key fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                            <Input
                                placeholder="District..."
                                value={filters.district}
                                onChange={(e) => handleChange('district', e.target.value)}
                                className="bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <Input
                                placeholder="City / Area..."
                                value={filters.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                className="bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <Input
                                placeholder="Village..."
                                value={filters.village}
                                onChange={(e) => handleChange('village', e.target.value)}
                                className="bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <Input
                                placeholder="Agent Name..."
                                value={filters.agentName}
                                onChange={(e) => handleChange('agentName', e.target.value)}
                                className="bg-gray-50 border-gray-200"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <Button onClick={handleSearch} className="flex-1 md:w-auto font-bold shadow-lg shadow-primary/25">
                            <Search className="h-4 w-4 mr-2" /> Search
                        </Button>
                        {(filters.district || filters.city || filters.village || filters.agentName) && (
                            <Button variant="ghost" size="icon" onClick={handleClear} className="text-gray-500 hover:text-red-500">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
