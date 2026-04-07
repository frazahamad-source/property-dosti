'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label: string;
    recommendedSize?: string;
    maxSizeMB?: number;
    path?: string; // storage path prefix
    className?: string;
    aspectRatio?: 'video' | 'square' | 'wide' | 'any';
}

export function ImageUpload({
    value,
    onChange,
    label,
    recommendedSize = '1920x1080px',
    maxSizeMB = 10,
    path = 'banners',
    className = '',
    aspectRatio = 'video'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        const validExts = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];
        
        if (!validExts.includes(ext || '')) {
            toast.error('Unsupported format. Allowed: PNG, JPG, JPEG, SVG, GIF, WEBP');
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`File size should be less than ${maxSizeMB}MB`);
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast.success('Image uploaded successfully!');
        } catch (err: any) {
            console.error('Error uploading:', err);
            toast.error(err.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case 'video': return 'aspect-video';
            case 'square': return 'aspect-square';
            case 'wide': return 'aspect-[3/1]';
            default: return 'min-h-[200px]';
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-xs font-bold uppercase text-gray-500">{label}</label>
            
            <div className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors hover:bg-muted/30 ${value ? 'border-primary/20' : 'border-muted'} ${getAspectRatioClass()}`}>
                {value ? (
                    <div className="group relative h-full w-full">
                        <Image 
                            src={value} 
                            alt={label} 
                            fill 
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button variant="secondary" size="sm" asChild className="cursor-pointer">
                                <label>
                                    <Upload className="h-4 w-4 mr-2" /> Change
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                                </label>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleRemove} disabled={isUploading}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                            {isUploading ? (
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{isUploading ? 'Uploading...' : `Upload ${label}`}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Recommended: {recommendedSize} • Max {maxSizeMB}MB
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="relative cursor-pointer" disabled={isUploading}>
                            <label>
                                Select Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                            </label>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
