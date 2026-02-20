'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyImageGalleryProps {
    images: string[];
    title: string;
}

export function PropertyImageGallery({ images, title }: PropertyImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaMainRef, emblaMainApi] = useEmblaCarousel({ loop: true });
    const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        dragFree: true,
    });

    const onThumbClick = useCallback(
        (index: number) => {
            if (!emblaMainApi || !emblaThumbsApi) return;
            emblaMainApi.scrollTo(index);
        },
        [emblaMainApi, emblaThumbsApi]
    );

    const onSelect = useCallback(() => {
        if (!emblaMainApi || !emblaThumbsApi) return;
        setSelectedIndex(emblaMainApi.selectedScrollSnap());
        emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
    }, [emblaMainApi, emblaThumbsApi]);

    useEffect(() => {
        if (!emblaMainApi) return;
        onSelect();
        emblaMainApi.on('select', onSelect);
        emblaMainApi.on('reInit', onSelect);
    }, [emblaMainApi, onSelect]);

    if (!images || images.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Main Carousel */}
            <div className="relative group overflow-hidden rounded-2xl border-4 border-white shadow-xl bg-gray-100 dark:bg-gray-800 aspect-[16/9]">
                <div className="overflow-hidden h-full" ref={emblaMainRef}>
                    <div className="flex h-full">
                        {images.map((src, index) => (
                            <div className="flex-[0_0_100%] min-w-0 relative h-full" key={index}>
                                <img
                                    src={src}
                                    alt={`${title} - Image ${index + 1}`}
                                    className="block w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white border-none shadow-lg rounded-full"
                    onClick={() => emblaMainApi?.scrollPrev()}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white border-none shadow-lg rounded-full"
                    onClick={() => emblaMainApi?.scrollNext()}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="absolute top-4 left-4">
                    <Badge className="bg-black/50 backdrop-blur-md border-none px-3 py-1 text-white">
                        {selectedIndex + 1} / {images.length} Photos
                    </Badge>
                </div>
            </div>

            {/* Thumbnails */}
            <div className="overflow-hidden px-1" ref={emblaThumbsRef}>
                <div className="flex gap-4">
                    {images.map((src, index) => (
                        <div
                            key={index}
                            className={`relative flex-[0_0_20%] min-w-0 cursor-pointer rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all duration-300 ${index === selectedIndex ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                            onClick={() => onThumbClick(index)}
                        >
                            <img
                                src={src}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
