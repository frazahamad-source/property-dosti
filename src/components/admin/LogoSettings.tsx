'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { LogoConfig, IconConfig } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Upload, Trash2, Image as ImageIcon, Type, RefreshCw } from 'lucide-react';

export function LogoSettings() {
    const { siteConfig, updateSiteConfig } = useStore();
    const [isLoading, setIsLoading] = useState(false);

    // Local state for temporary changes before saving
    const [logo, setLogo] = useState<LogoConfig>(siteConfig.logo || {
        type: 'text',
        text: 'Property Dosti',
        tagline: "Broker's virtual Office",
        fontSize: 24,
        color: '#0f172a'
    });

    const [icon, setIcon] = useState<IconConfig>(siteConfig.icon || {
        type: 'default'
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateSiteConfig({
                ...siteConfig,
                logo,
                icon
            });
            toast.success('Logo settings saved successfully!');
        } catch (error) {
            toast.error('Failed to save logo settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'icon') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (PNG, JPG, or SVG)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size should be less than 2MB');
            return;
        }

        setIsLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${target}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `branding/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            if (target === 'logo') {
                setLogo({ ...logo, type: 'image', imageUrl: publicUrl });
            } else {
                setIcon({ ...icon, type: 'image', imageUrl: publicUrl });
            }

            toast.success(`${target === 'logo' ? 'Logo' : 'Icon'} uploaded! Remember to Save Changes.`);
        } catch (error: any) {
            console.error('Error uploading:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Live Preview Section */}
            <Card className="bg-muted/30 border-dashed border-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Live Header Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-8 bg-white dark:bg-gray-900 rounded-b-xl border-t">
                    <div className="scale-125 transform transition-all duration-300">
                        {/* We use a mockup div to simulate the header context if needed, but Logo is enough */}
                        <div className="p-4 border rounded shadow-sm bg-background">
                            <Logo
                                className="pointer-events-none"
                                // We manually override props to show local state preview
                                taglineClassName="text-gray-500"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Type Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Logo Display Mode</CardTitle>
                        <CardDescription>Choose between a text-based or image-based logo.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button
                            variant={logo.type === 'text' ? 'default' : 'outline'}
                            onClick={() => setLogo({ ...logo, type: 'text' })}
                            className="flex-1 gap-2"
                        >
                            <Type className="h-4 w-4" /> Text Logo
                        </Button>
                        <Button
                            variant={logo.type === 'image' ? 'default' : 'outline'}
                            onClick={() => setLogo({ ...logo, type: 'image' })}
                            className="flex-1 gap-2"
                        >
                            <ImageIcon className="h-4 w-4" /> Image Logo
                        </Button>
                    </CardContent>
                </Card>

                {/* Icon Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blue Logo Icon</CardTitle>
                        <CardDescription>Manage the standalone icon badge.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                {icon.type === 'image' && icon.imageUrl ? (
                                    <img src={icon.imageUrl} alt="Icon preview" className="h-full w-full object-contain" />
                                ) : (
                                    <span className="text-primary font-bold">PD</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium">Resolution: 128x128px recommended</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild className="relative overflow-hidden cursor-pointer h-8 text-xs">
                                        <label>
                                            <Upload className="h-3 w-3 mr-1" /> Replace Icon
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'icon')} />
                                        </label>
                                    </Button>
                                    {icon.type === 'image' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-red-600"
                                            onClick={() => setIcon({ type: 'default' })}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {logo.type === 'text' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Text Logo Customization</CardTitle>
                        <CardDescription>Style your brand name and tagline.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Brand Heading</label>
                                <Input
                                    value={logo.text}
                                    onChange={(e) => setLogo({ ...logo, text: e.target.value })}
                                    placeholder="Property Dosti"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tagline</label>
                                <Input
                                    value={logo.tagline}
                                    onChange={(e) => setLogo({ ...logo, tagline: e.target.value })}
                                    placeholder="Broker's virtual Office"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Font Size (px)</label>
                                <Input
                                    type="number"
                                    value={logo.fontSize}
                                    onChange={(e) => setLogo({ ...logo, fontSize: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Text Color</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={logo.color}
                                        onChange={(e) => setLogo({ ...logo, color: e.target.value })}
                                        className="w-12 p-1 h-10"
                                    />
                                    <Input
                                        value={logo.color}
                                        onChange={(e) => setLogo({ ...logo, color: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Image Logo Upload</CardTitle>
                        <CardDescription>Upload a high-quality version of your logo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors hover:bg-muted/50 border-muted">
                            {logo.imageUrl ? (
                                <div className="space-y-4 flex flex-col items-center w-full">
                                    <img src={logo.imageUrl} alt="Logo preview" className="max-h-24 max-w-full object-contain" />
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild className="cursor-pointer relative">
                                            <label>
                                                Change Image
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                                            </label>
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setLogo({ ...logo, imageUrl: undefined, type: 'text' })}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Remove Image
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                        <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Upload Logo Image</p>
                                        <p className="text-xs text-muted-foreground">PNG, SVG or JPG (Max 2MB)</p>
                                        <p className="text-xs text-muted-foreground italic">Recommended dimensions: 300x80px</p>
                                    </div>
                                    <Button variant="default" size="sm" asChild className="cursor-pointer relative">
                                        <label>
                                            Select File
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                                        </label>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full md:w-auto px-8 py-6 text-lg shadow-xl shadow-primary/20"
                >
                    {isLoading ? 'Saving...' : 'Save Branding Changes'}
                </Button>
            </div>
        </div>
    );
}
