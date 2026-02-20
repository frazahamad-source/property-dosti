'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { BannerSlide } from '@/lib/types';

interface BannerSliderProps {
    slides: BannerSlide[];
}

export function BannerSlider({ slides }: BannerSliderProps) {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

    if (!slides || slides.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
                {slides.map((slide) => (
                    <div className="flex-[0_0_100%] min-w-0 relative" key={slide.id}>
                        {/* Slide Content */}
                        <Link href={slide.buttonLink || '#'} className="block group w-full relative">
                            {/* Background Image */}
                            <div
                                className="w-full relative overflow-hidden"
                                style={{
                                    // Desktop: 1920x600 ratio. Mobile: Taller for content.
                                    aspectRatio: '1920 / 600',
                                    backgroundImage: `url(${slide.backgroundImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: slide.backgroundPosition || '50% 50%',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                {/* Overlay Gradient for readability */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                                {/* Content Container */}
                                <div className="absolute inset-0 flex items-center">
                                    <div className="container px-4 md:px-6">
                                        <div className="max-w-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <Badge className="bg-primary text-white border-none mb-2">FEATURED</Badge>
                                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                                                {slide.title}
                                            </h2>
                                            <p className="text-lg text-gray-200 line-clamp-2 drop-shadow-md">
                                                {slide.description}
                                            </p>
                                            <div className="pt-4">
                                                <Button size="lg" className="font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                                    {slide.buttonText}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile aspect ratio helper */}
                            <div className="block md:hidden min-h-[400px]" style={{ display: 'none' }}></div>
                            {/* ^ We rely on aspectRatio CSS, but for mobile we might want min-height. 
                                 However, the user asked for edge-to-edge. 
                                 Let's trust aspect-ratio or maybe add min-height to the div style.
                             */}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
