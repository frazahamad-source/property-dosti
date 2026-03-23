'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize, X } from 'lucide-react';

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
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenIndex, setFullScreenIndex] = useState(0);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        onSelect();
        emblaMainApi.on('select', onSelect);
        emblaMainApi.on('reInit', onSelect);
    }, [emblaMainApi, onSelect]);

    // Handle body scroll locking when full screen is open
    useEffect(() => {
        if (isFullScreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isFullScreen]);

    if (!images || images.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Main Carousel */}
            <div className="relative group overflow-hidden rounded-2xl border-4 border-white shadow-xl bg-gray-100 dark:bg-gray-800 aspect-[16/9]">
                <div className="overflow-hidden h-full" ref={emblaMainRef}>
                    <div className="flex h-full">
                        {images.map((src, index) => (
                            <div className="flex-[0_0_100%] min-w-0 relative h-full" key={index}>
                                <Image
                                    src={src}
                                    alt={`${title} - Image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute top-4 right-4 bg-white/80 hover:bg-white border-none shadow-lg rounded-full z-10"
                                    onClick={() => {
                                        setFullScreenIndex(index);
                                        setIsFullScreen(true);
                                    }}
                                >
                                    <Maximize className="h-5 w-5" />
                                </Button>
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
                            <Image
                                src={src}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Full-Screen Overlay */}
            {isFullScreen && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                    {/* Header with Close Button */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-[110]">
                        <span className="text-white font-medium">
                            {fullScreenIndex + 1} / {images.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full"
                            onClick={() => setIsFullScreen(false)}
                        >
                            <X className="h-8 w-8" />
                        </Button>
                    </div>

                    {/* Main Image View */}
                    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
                        <div className="relative w-full h-full">
                            <Image
                                src={images[fullScreenIndex]}
                                alt={title}
                                fill
                                className="object-contain"
                                priority
                                sizes="100vw"
                            />
                        </div>

                        {/* Navigation inside Full-Screen */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full z-[110]"
                            onClick={() => setFullScreenIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                        >
                            <ChevronLeft className="h-10 w-10" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full z-[110]"
                            onClick={() => setFullScreenIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                        >
                            <ChevronRight className="h-10 w-10" />
                        </Button>
                    </div>

                    {/* Simple Bottom Navigation Indicators */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[110]">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                className={`h-2 rounded-full transition-all ${i === fullScreenIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
                                    }`}
                                onClick={() => setFullScreenIndex(i)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
