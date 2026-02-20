'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trash2, Plus, Save, Image as ImageIcon } from 'lucide-react';
import { BannerSlide, SiteConfig } from '@/lib/types';
import { toast } from 'sonner';

export default function BannersPage() {
    const {
        bannerSlides, fetchBannerSlides, updateBannerSlides,
        siteConfig, fetchSiteConfig, updateSiteConfig
    } = useStore();
    const [slides, setSlides] = useState<BannerSlide[]>([]);
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBannerSlides();
        fetchSiteConfig();
    }, [fetchBannerSlides, fetchSiteConfig]);

    useEffect(() => {
        setSlides(bannerSlides || []);
    }, [bannerSlides]);

    useEffect(() => {
        if (siteConfig) {
            setConfig(siteConfig);
        }
    }, [siteConfig]);

    const handleAddSlide = () => {
        const newSlide: BannerSlide = {
            id: Date.now().toString(),
            title: 'New Promotion',
            description: 'Description of the promotion',
            buttonText: 'Learn More',
            buttonLink: '/',
            backgroundImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920',
            backgroundPosition: '50% 50%'
        };
        setSlides([...slides, newSlide]);
    };

    const handleRemoveSlide = (id: string) => {
        setSlides(slides.filter(s => s.id !== id));
    };

    const handleChange = (id: string, field: keyof BannerSlide, value: string) => {
        setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handlePromoChange = (field: keyof NonNullable<SiteConfig['promoBanner']>, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            promoBanner: { ...config.promoBanner!, [field]: value }
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const promises: Promise<any>[] = [updateBannerSlides(slides)];
            if (config) {
                promises.push(updateSiteConfig(config));
            }
            await Promise.all(promises);
            toast.success('All banner settings updated successfully!');
        } catch (error) {
            toast.error('Failed to update banner settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Banner Management</h1>
                <Button onClick={handleSave} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90">
                    <Save className="h-4 w-4" /> Save All Changes
                </Button>
            </div>

            {config && (
                <Card className="border-primary/20 shadow-md">
                    <CardHeader className="bg-primary/5 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="p-1.5 bg-primary/10 rounded-md">
                                <ImageIcon className="h-4 w-4 text-primary" />
                            </span>
                            Top Promo Banner (Individual Property Pages)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2 p-3 bg-secondary/20 rounded-lg">
                            <input
                                type="checkbox"
                                id="bannerVisible"
                                checked={config.promoBanner?.isVisible ?? true}
                                onChange={(e) => handlePromoChange('isVisible', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="bannerVisible" className="text-sm font-semibold select-none cursor-pointer">
                                Enable Announcement Bar on Detail Pages
                            </label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Banner Message</label>
                                <Input
                                    value={config.promoBanner?.text || ''}
                                    onChange={(e) => handlePromoChange('text', e.target.value)}
                                    placeholder="Grow Your Business with Property Dosti"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Background Image URL (Optional)</label>
                                <Input
                                    value={config.promoBanner?.backgroundImage || ''}
                                    onChange={(e) => handlePromoChange('backgroundImage', e.target.value)}
                                    placeholder="https://... (1920x60 recommended)"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Button Text</label>
                                <Input
                                    value={config.promoBanner?.buttonText || ''}
                                    onChange={(e) => handlePromoChange('buttonText', e.target.value)}
                                    placeholder="Join Network"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Button Link</label>
                                <Input
                                    value={config.promoBanner?.buttonLink || ''}
                                    onChange={(e) => handlePromoChange('buttonLink', e.target.value)}
                                    placeholder="/signup"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="pt-4 border-t border-dashed">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="p-1 bg-gray-100 rounded">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                    </span>
                    Home Page Hero Slides
                </h2>
                <div className="space-y-4">
                    {slides.map((slide, index) => (
                        <Card key={slide.id} className="relative overflow-hidden">
                            <CardHeader className="bg-gray-50 flex flex-row items-center justify-between py-3">
                                <CardTitle className="text-sm font-medium">Slide #{index + 1}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveSlide(slide.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500">Title</label>
                                    <Input
                                        value={slide.title}
                                        onChange={(e) => handleChange(slide.id, 'title', e.target.value)}
                                        placeholder="Banner Title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500">Image URL</label>
                                    <Input
                                        value={slide.backgroundImage}
                                        onChange={(e) => handleChange(slide.id, 'backgroundImage', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500">Description</label>
                                    <textarea
                                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                                        value={slide.description}
                                        onChange={(e) => handleChange(slide.id, 'description', e.target.value)}
                                        placeholder="Short description..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500">Button Text</label>
                                    <Input
                                        value={slide.buttonText}
                                        onChange={(e) => handleChange(slide.id, 'buttonText', e.target.value)}
                                        placeholder="e.g. Learn More"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500">Button Link</label>
                                    <Input
                                        value={slide.buttonLink}
                                        onChange={(e) => handleChange(slide.id, 'buttonLink', e.target.value)}
                                        placeholder="/signup or https://..."
                                    />
                                </div>
                                <div className="col-span-2 mt-2 p-2 bg-gray-100 rounded text-xs text-gray-500 text-center">
                                    Preview: Content will be overlaid on the image.
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Button variant="outline" className="w-full border-dashed border-2 py-8" onClick={handleAddSlide}>
                <Plus className="h-4 w-4 mr-2" /> Add New Slide
            </Button>
        </div>
    );
}
