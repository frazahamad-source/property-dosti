'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { VillaTypeConfig } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';

export function VillaTypesManager() {
    const [villaTypes, setVillaTypes] = useState<VillaTypeConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Add/Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<VillaTypeConfig | null>(null);
    const [formName, setFormName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchVillaTypes();
    }, []);

    const fetchVillaTypes = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('villa_types_config')
            .select('*')
            .order('name');

        if (error) {
            toast.error('Failed to fetch villa types');
            console.error(error);
        } else {
            setVillaTypes(data || []);
        }
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Type name is required');
            return;
        }

        setIsSaving(true);
        try {
            if (editingType) {
                const { error } = await supabase
                    .from('villa_types_config')
                    .update({
                        name: formName.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingType.id);

                if (error) throw error;
                toast.success('Villa type updated');
            } else {
                const { error } = await supabase
                    .from('villa_types_config')
                    .insert({
                        name: formName.trim()
                    });

                if (error) throw error;
                toast.success('Villa type added');
            }
            setIsModalOpen(false);
            fetchVillaTypes();
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Error saving type');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this type?')) return;

        try {
            const { error } = await supabase
                .from('villa_types_config')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Villa type deleted');
            fetchVillaTypes();
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Error deleting type');
        }
    };

    const openModal = (villaType?: VillaTypeConfig) => {
        if (villaType) {
            setEditingType(villaType);
            setFormName(villaType.name);
        } else {
            setEditingType(null);
            setFormName('');
        }
        setIsModalOpen(true);
    };

    const filteredTypes = villaTypes.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-2 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search villa types..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={() => openModal()} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Villa Type
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg">Existing Villa Types</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Type Name</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-muted-foreground">Loading...</td>
                                    </tr>
                                ) : filteredTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-muted-foreground">No types found</td>
                                    </tr>
                                ) : (
                                    filteredTypes.map((t) => (
                                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">{t.name}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => openModal(t)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(t.id)}
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
                            <h3 className="font-semibold text-lg">{editingType ? 'Edit Villa Type' : 'Add New Villa Type'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type Name</label>
                                <Input
                                    placeholder="e.g. 1 BHK"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    autoFocus
                                />
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
                                    {isSaving ? 'Saving...' : 'Save Type'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
