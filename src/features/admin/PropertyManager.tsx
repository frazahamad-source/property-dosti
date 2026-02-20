
'use client';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trash2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export function PropertyManager() {
    const { properties, setProperties } = useStore();

    const handleDeleteProperty = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete property "${title}"?`)) return;

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error(`Failed to delete property: ${error.message}`);
        } else {
            setProperties(properties.filter(p => p.id !== id));
            toast.success(`Deleted property "${title}"`);
        }
    };

    return (
        <section>
            <h2 className="text-xl font-semibold mb-4">Properties Management ({properties.length})</h2>
            <div className="rounded-md border bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
                <div className="hidden md:grid p-4 bg-muted/50 text-xs font-medium grid-cols-5 gap-4 border-b">
                    <div className="col-span-2">Property Details</div>
                    <div>Price</div>
                    <div>Location</div>
                    <div className="text-right">Actions</div>
                </div>
                {properties.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No properties listed yet.</div>
                ) : (
                    properties.map((prop) => (
                        <div key={prop.id} className="p-4 text-sm flex flex-col gap-3 md:grid md:grid-cols-5 md:gap-4 md:items-center border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <div className="md:col-span-2 flex gap-3 items-center w-full">
                                <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border">
                                    {prop.images && prop.images.length > 0 ? (
                                        <img
                                            src={prop.images[0]}
                                            alt={prop.title}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('bg-gray-200');
                                            }}
                                        />
                                    ) : (
                                        <ImageIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-gray-900 dark:text-white line-clamp-1 break-all">{prop.title}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{prop.category} • {prop.type}</div>
                                </div>
                                <div className="md:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-600 border-red-100 hover:bg-red-50"
                                        onClick={() => handleDeleteProperty(prop.id, prop.title)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-between md:contents">
                                <div className="flex flex-col md:block">
                                    <span className="md:hidden text-[10px] text-muted-foreground">Price</span>
                                    <span className="font-bold text-primary">₹{prop.price.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex flex-col md:block text-right md:text-left">
                                    <span className="md:hidden text-[10px] text-muted-foreground">Location</span>
                                    <span className="text-xs text-muted-foreground block md:truncate">
                                        {prop.location}, {prop.district}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden md:flex text-right justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 border-red-100 hover:bg-red-50"
                                    onClick={() => handleDeleteProperty(prop.id, prop.title)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
