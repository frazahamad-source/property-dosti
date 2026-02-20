'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Save } from 'lucide-react';
import { SiteConfig } from '@/lib/types';
import { toast } from 'sonner';

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
            </div>
        </div>
    );
}
