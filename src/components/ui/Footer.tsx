'use client';

import Link from "next/link";
import { Building2, Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

export function Footer() {
    const { siteConfig, fetchSiteConfig } = useStore();

    useEffect(() => {
        fetchSiteConfig();
    }, [fetchSiteConfig]);

    return (
        <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <Link className="flex items-center font-bold text-2xl text-white" href="/">
                            <Building2 className="mr-2 h-6 w-6 text-primary" />
                            Property Dosti
                        </Link>
                        <p className="text-sm leading-relaxed">
                            The first and most trusted network of verified brokers in Karnataka.
                            Connecting people with their dream properties through professional services.
                        </p>
                        <div className="flex space-x-4">
                            {siteConfig?.socialLinks.facebook && (
                                <Link href={siteConfig.socialLinks.facebook} className="hover:text-primary transition-colors">
                                    <Facebook className="h-5 w-5" />
                                </Link>
                            )}
                            {siteConfig?.socialLinks.instagram && (
                                <Link href={siteConfig.socialLinks.instagram} className="hover:text-primary transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </Link>
                            )}
                            {siteConfig?.socialLinks.twitter && (
                                <Link href={siteConfig.socialLinks.twitter} className="hover:text-primary transition-colors">
                                    <Twitter className="h-5 w-5" />
                                </Link>
                            )}
                            {siteConfig?.socialLinks.linkedin && (
                                <Link href={siteConfig.socialLinks.linkedin} className="hover:text-primary transition-colors">
                                    <Linkedin className="h-5 w-5" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">Broker Login</Link></li>
                            <li><Link href="/signup" className="hover:text-primary transition-colors">Join Network</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-bold mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>{siteConfig?.contactPhone || '+91 77 60 70 44 00'}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                <span>{siteConfig?.contactEmail || 'support@propertydosti.com'}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-primary mt-1" />
                                <span>Ground Floor, Kankanady Gate Building,<br />Kankanady Cross Road, Kankanady,<br />Mangaluru - 575002</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter/Disclaimer */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold mb-4">About the App</h3>
                        <p className="text-sm">
                            Join our premium network to get exclusive leads and premium listing visibility across all districts.
                        </p>
                        <div className="pt-2">
                            <Link href="/signup">
                                <button className="bg-primary text-white text-xs px-4 py-2 rounded-md font-bold hover:bg-primary/90 transition-colors">
                                    Register Now
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>{siteConfig?.footerText || `© ${new Date().getFullYear()} Property Dosti. All rights reserved.`}</p>
                    <nav className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6">
                        <Link className="hover:underline underline-offset-4" href="/terms">Terms of Service</Link>
                        <Link className="hover:underline underline-offset-4" href="/privacy">Privacy Policy</Link>
                        <Link className="hover:underline underline-offset-4" href="/refund">Refund Policy</Link>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
