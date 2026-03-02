
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AmenityConfig } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, X, Check, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Farmhouse', 'Land', 'Commercial'];

export function AmenitiesManager() {
    const [amenities, setAmenities] = useState<AmenityConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('All');

    // Add/Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<AmenityConfig | null>(null);
    const [formName, setFormName] = useState('');
    const [formTypes, setFormTypes] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAmenities();
    }, []);

    const fetchAmenities = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('amenities_config')
            .select('*')
            .order('name');

        if (error) {
            toast.error('Failed to fetch amenities');
            console.error(error);
        } else {
            setAmenities(data || []);
        }
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Amenity name is required');
            return;
        }

        setIsSaving(true);
        try {
            if (editingAmenity) {
                const { error } = await supabase
                    .from('amenities_config')
                    .update({
                        name: formName.trim(),
                        property_types: formTypes,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingAmenity.id);

                if (error) throw error;
                toast.success('Amenity updated');
            } else {
                const { error } = await supabase
                    .from('amenities_config')
                    .insert({
                        name: formName.trim(),
                        property_types: formTypes
                    });

                if (error) throw error;
                toast.success('Amenity added');
            }
            setIsModalOpen(false);
            fetchAmenities();
        } catch (error: any) {
            toast.error(error.message || 'Error saving amenity');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this amenity?')) return;

        try {
            const { error } = await supabase
                .from('amenities_config')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Amenity deleted');
            fetchAmenities();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting amenity');
        }
    };

    const openModal = (amenity?: AmenityConfig) => {
        if (amenity) {
            setEditingAmenity(amenity);
            setFormName(amenity.name);
            setFormTypes(amenity.property_types);
        } else {
            setEditingAmenity(null);
            setFormName('');
            setFormTypes([]);
        }
        setIsModalOpen(true);
    };

    const toggleType = (type: string) => {
        setFormTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const filteredAmenities = amenities.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'All' || a.property_types.includes(filterType);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-2 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search amenities..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        {PROPERTY_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <Button onClick={() => openModal()} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Amenity
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg">Existing Amenities</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Amenity Name</th>
                                    <th className="px-6 py-3">Property Types</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Loading...</td>
                                    </tr>
                                ) : filteredAmenities.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">No amenities found</td>
                                    </tr>
                                ) : (
                                    filteredAmenities.map((amenity) => (
                                        <tr key={amenity.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">{amenity.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {amenity.property_types.map(t => (
                                                        <span key={t} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => openModal(amenity)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(amenity.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Dialog for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-lg">{editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amenity Name</label>
                                <Input
                                    placeholder="e.g. Swimming Pool"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Applies to Property Types</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PROPERTY_TYPES.map(type => {
                                        const isSelected = formTypes.includes(type);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleType(type)}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2 text-sm border rounded-md transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                                        : "border-input bg-background hover:bg-accent"
                                                )}
                                            >
                                                {type}
                                                {isSelected && <Check className="h-4 w-4" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Select types where this amenity should be available.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Amenity'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

