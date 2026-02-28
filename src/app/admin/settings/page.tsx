'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Save, Trash2, Settings, Image as ImageIcon } from 'lucide-react';
import { SiteConfig } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { LogoSettings } from '@/components/admin/LogoSettings';

export default function SettingsPage() {
    const { siteConfig, fetchSiteConfig, updateSiteConfig } = useStore();
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'branding'>('general');

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Site Management</h1>
                    <p className="text-muted-foreground text-sm">Configure your website appearance and settings.</p>
                </div>
                {activeTab === 'general' && (
                    <Button onClick={handleSave} disabled={loading} className="gap-2 shadow-lg shadow-primary/20">
                        <Save className="h-4 w-4" /> Save General Settings
                    </Button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                <Button
                    variant={activeTab === 'general' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('general')}
                    className="gap-2"
                >
                    <Settings className="h-4 w-4" /> General Settings
                </Button>
                <Button
                    variant={activeTab === 'branding' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('branding')}
                    className="gap-2"
                >
                    <ImageIcon className="h-4 w-4" /> Logo & Branding
                </Button>
            </div>

            <div className="grid gap-6">
                {activeTab === 'branding' ? (
                    <LogoSettings />
                ) : (
                    <>
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
                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-medium">Office Address</label>
                                    <textarea
                                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[100px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={config.officeAddress || ''}
                                        onChange={(e) => handleChange('officeAddress', e.target.value)}
                                        placeholder="Enter full office address..."
                                    />
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
                    </>
                )}
            </div>
        </div>
    );
}
