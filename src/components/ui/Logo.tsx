'use client';

import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    taglineClassName?: string;
    showTagline?: boolean;
}

export function Logo({
    className,
    iconClassName,
    textClassName,
    taglineClassName,
    showTagline = true
}: LogoProps) {
    const { siteConfig } = useStore();
    const logo = siteConfig?.logo;
    const icon = siteConfig?.icon;

    // Default values if no config is found
    const logoType = logo?.type || 'text';
    const logoText = logo?.text || 'Property Dosti';
    const logoTagline = logo?.tagline || "Broker's virtual Office";
    const logoColor = logo?.color || '#0f172a';
    const logoFontSize = logo?.fontSize || 24;
    const logoImageUrl = logo?.imageUrl;
    const iconType = icon?.type || 'default';
    const iconImageUrl = icon?.imageUrl;

    const hasTextColorOverride = textClassName?.includes('text-');
    const hasTaglineColorOverride = taglineClassName?.includes('text-');

    return (
        <div className={cn("flex items-center", className)}>
            {/* Left: Icon Section */}
            <div className={cn("flex-shrink-0 mr-4", iconClassName)}>
                {iconType === 'image' && iconImageUrl ? (
                    <img
                        src={iconImageUrl}
                        alt="Logo Icon"
                        className="h-8 w-8 object-contain"
                        style={{ maxWidth: '40px', maxHeight: '40px' }}
                    />
                ) : (
                    <Building2 className={cn("h-8 w-8 text-primary", iconClassName?.includes('text-') ? "" : "text-primary")} />
                )}
            </div>

            {/* Right: Text/Image Logo Content */}
            <div className="flex flex-col">
                {logoType === 'image' && logoImageUrl ? (
                    <img
                        src={logoImageUrl}
                        alt={logoText}
                        className="h-10 w-auto object-contain"
                        style={{ maxHeight: '50px' }}
                    />
                ) : (
                    <>
                        <span
                            className={cn("font-bold leading-tight block whitespace-nowrap", !hasTextColorOverride && "text-[#0f172a] dark:text-white", textClassName)}
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: `${logoFontSize}px`,
                                color: !hasTextColorOverride ? logoColor : undefined
                            }}
                        >
                            {logoText}
                        </span>

                        {/* Tagline stretched to match the width of the heading */}
                        {showTagline && logoTagline && (
                            <div
                                className={cn(
                                    "mt-0.5 text-[8.5px] uppercase font-light select-none flex justify-between w-full",
                                    !hasTaglineColorOverride && "text-gray-500 dark:text-gray-400",
                                    taglineClassName
                                )}
                                style={{
                                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                    fontWeight: 300,
                                    letterSpacing: '0.1em'
                                }}
                            >
                                {logoTagline.split("").map((char, i) => (
                                    <span key={i}>{char === " " ? "\u00A0" : char}</span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
