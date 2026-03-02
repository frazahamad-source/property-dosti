
'use client';

import { useState, useEffect } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface AmenitySelectorProps {
    allAmenities: { name: string; property_types: string[] }[];
    selectedAmenities: string[];
    onToggle: (amenity: string) => void;
    propertyType: string;
}

export function AmenitySelector({
    allAmenities,
    selectedAmenities = [],
    onToggle,
    propertyType
}: AmenitySelectorProps) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Filter amenities by property type
    const filteredByPropType = allAmenities.filter(a =>
        a.property_types.includes(propertyType) || a.property_types.length === 0
    );

    const filteredBySearch = filteredByPropType.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {selectedAmenities.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No amenities selected</span>
                )}
                {selectedAmenities.map(amenity => (
                    <Badge
                        key={amenity}
                        variant="secondary"
                        className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                    >
                        {amenity}
                        <button
                            type="button"
                            onClick={() => onToggle(amenity)}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search amenities..."
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                    />
                </div>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute z-20 top-full mt-1 w-full max-h-[200px] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95">
                            {filteredBySearch.length === 0 ? (
                                <div className="p-3 text-sm text-center text-muted-foreground">No amenities found</div>
                            ) : (
                                <div className="p-1">
                                    {filteredBySearch.map(amenity => {
                                        const isSelected = selectedAmenities.includes(amenity.name);
                                        return (
                                            <button
                                                key={amenity.name}
                                                type="button"
                                                onClick={() => onToggle(amenity.name)}
                                                className={cn(
                                                    "flex items-center justify-between w-full px-3 py-2 text-sm rounded-sm transition-colors",
                                                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                {amenity.name}
                                                {isSelected && <Check className="h-4 w-4" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
