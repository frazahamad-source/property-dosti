'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Save, Trash2 } from 'lucide-react';
import { SiteConfig } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
    const { siteConfig, fetchSiteConfig, updateSiteConfig } = useStore();
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSiteConfig();
    }, [fetchSiteConfig]);

    useEffect(() => {
        if (siteConfig) {
            setConfig(siteConfig);
        }
    }, [siteConfig]);

    const handleChange = (field: keyof SiteConfig, value: string) => {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    };

    const handleSocialChange = (field: keyof SiteConfig['socialLinks'], value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            socialLinks: { ...config.socialLinks, [field]: value }
        });
    };

    const handlePromoChange = (field: keyof NonNullable<SiteConfig['promoBanner']>, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            promoBanner: { ...config.promoBanner!, [field]: value }
        });
    };

    const handleSave = async () => {
        if (!config) return;
        setLoading(true);
        try {
            await updateSiteConfig(config);
            toast.success('Settings updated successfully!');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = async () => {
        const password = confirm("CRITICAL: You are about to clear ALL property and broker data. This cannot be undone.");
        if (!password) return;

        const confirmation = prompt("Please type 'CLEARDATA' to proceed:");
        if (confirmation !== 'CLEARDATA') {
            toast.error("Cleanup cancelled. Confirmation text did not match.");
            return;
        }

        toast.loading("Clearing data...");

        // Delete all properties first
        const { error: propError } = await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (propError) console.error("Error clearing properties:", propError);

        // Delete all non-admin profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .neq('is_admin', true);

        if (profileError) console.error("Error clearing profiles:", profileError);

        toast.dismiss();
        toast.success("Client data cleared. Admin accounts preserved.");
        window.location.reload();
    };

    if (!config) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Site Settings</h1>
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" /> Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Hero Section</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Hero Custom Title</label>
                            <Input
                                value={config.heroTitle}
                                onChange={(e) => handleChange('heroTitle', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Hero Description</label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[80px]"
                                value={config.heroDescription}
                                onChange={(e) => handleChange('heroDescription', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Hero Background Image URL</label>
                            <Input
                                value={config.heroBackgroundImage}
                                onChange={(e) => handleChange('heroBackgroundImage', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Footer & Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Footer Copyright Text</label>
                            <Input
                                value={config.footerText}
                                onChange={(e) => handleChange('footerText', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Phone</label>
                                <Input
                                    value={config.contactPhone}
                                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input
                                    value={config.contactEmail}
                                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Promo Banner (Property Details)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="bannerVisible"
                                checked={config.promoBanner?.isVisible ?? true}
                                onChange={(e) => handlePromoChange('isVisible', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="bannerVisible" className="text-sm font-medium">Show Promo Banner on Property Detail Pages</label>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Banner Text</label>
                            <Input
                                value={config.promoBanner?.text || ''}
                                onChange={(e) => handlePromoChange('text', e.target.value)}
                                placeholder="Grow Your Business with Property Dosti"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Background Image URL (Optional)</label>
                            <Input
                                value={config.promoBanner?.backgroundImage || ''}
                                onChange={(e) => handlePromoChange('backgroundImage', e.target.value)}
                                placeholder="https://... (Recommended size: 1920x60)"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Button Text</label>
                                <Input
                                    value={config.promoBanner?.buttonText || ''}
                                    onChange={(e) => handlePromoChange('buttonText', e.target.value)}
                                    placeholder="Join Network"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Button Link</label>
                                <Input
                                    value={config.promoBanner?.buttonLink || ''}
                                    onChange={(e) => handlePromoChange('buttonLink', e.target.value)}
                                    placeholder="/signup"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Social Media Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Facebook</label>
                            <Input
                                value={config.socialLinks.facebook || ''}
                                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                placeholder="#"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Twitter / X</label>
                            <Input
                                value={config.socialLinks.twitter || ''}
                                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                placeholder="#"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Instagram</label>
                            <Input
                                value={config.socialLinks.instagram || ''}
                                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                placeholder="#"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">LinkedIn</label>
                            <Input
                                value={config.socialLinks.linkedin || ''}
                                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                                placeholder="#"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/10">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            <CardTitle className="text-lg">Danger Zone</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Clearing all data will permanently remove all property listings and non-admin broker profiles.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={handleClearData}
                            className="bg-red-600 hover:bg-red-700 font-bold"
                        >
                            Reset Application Data
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
