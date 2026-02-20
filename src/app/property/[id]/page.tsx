'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MapPin, MessageSquare, Heart, Share2, ArrowLeft, CheckCircle2, Phone, ExternalLink } from 'lucide-react';
import { PropertyImageGallery } from '@/components/PropertyImageGallery';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Property, Broker } from '@/lib/types';
import { sanitizePhone } from '@/lib/utils';

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { properties, brokers, siteConfig, addPropertyLead, likeProperty, setProperties, setBrokers, fetchSiteConfig } = useStore();

    const [property, setProperty] = useState<Property | undefined>(properties.find(p => p.id === id));
    const [broker, setBroker] = useState<Broker | undefined>(brokers.find(b => b.id === property?.brokerId));
    const [loading, setLoading] = useState(!property);

    // Fetch property if not in store (direct link access)
    useEffect(() => {
        const fetchProperty = async () => {
            // Fetch site config as well
            fetchSiteConfig();

            if (property) return;

            const { data: propData, error: propError } = await supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (propError) {
                console.error('Error fetching property:', propError);
                setLoading(false);
                return;
            }

            if (propData) {
                const mappedProperty: Property = {
                    id: propData.id,
                    brokerId: propData.broker_id,
                    title: propData.title,
                    description: propData.description,
                    price: propData.price,
                    district: propData.district,
                    location: propData.location,
                    village: propData.village,
                    type: propData.type,
                    category: propData.category,
                    images: propData.images,
                    createdAt: propData.created_at,
                    updatedAt: propData.updated_at,
                    expiresAt: propData.expires_at,
                    isActive: propData.is_active,
                    likes: propData.likes,
                    leadsCount: propData.leads_count,
                    amenities: propData.amenities,
                    brokerPhone: propData.broker_phone // Assuming this might be joined or stored
                };
                setProperty(mappedProperty);

                // Fetch Broker for this property
                const { data: brokerData, error: brokerError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', propData.broker_id)
                    .single();

                if (brokerData) {
                    const mappedBroker: Broker = {
                        id: brokerData.id,
                        name: brokerData.name,
                        email: brokerData.email,
                        phone: brokerData.phone,
                        broker_code: brokerData.broker_code,
                        role: 'broker',
                        districts: brokerData.districts || [],
                        status: brokerData.status,
                        registeredAt: brokerData.registered_at,
                        subscriptionExpiry: brokerData.subscription_expiry,
                        referralCode: brokerData.referral_code,
                        referralsCount: brokerData.referrals_count
                    };
                    setBroker(mappedBroker);
                }
            }
            setLoading(false);
        };

        fetchProperty();
    }, [id, property]);

    const [leadForm, setLeadForm] = useState({
        name: '',
        phone: '',
        message: 'I am interested in this property. Please contact me.'
    });

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading property details...</div>;
    }

    if (!property) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold">Property not found</h2>
                <Button className="mt-4" asChild>
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        );
    }

    const handleLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadForm.name || !leadForm.phone) {
            toast.error('Please fill in your name and phone number.');
            return;
        }

        addPropertyLead({
            id: `lead-${Date.now()}`,
            propertyId: property.id,
            brokerId: property.brokerId,
            name: leadForm.name,
            phone: leadForm.phone,
            message: leadForm.message,
            timestamp: new Date().toISOString(),
        });

        toast.success('Inquiry sent successfully! The broker will contact you soon.');
        setLeadForm({ name: '', phone: '', message: 'I am interested in this property. Please contact me.' });
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const whatsappShareMsg = `Check out this property on Property Dosti: "${property.title}" - ${property.price.toLocaleString('en-IN')} INR in ${property.location}. View details: ${shareUrl}`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Top Banner Promotion */}
            {siteConfig.promoBanner?.isVisible !== false && (
                <div
                    className="relative text-white py-3 shadow-md overflow-hidden"
                    style={{
                        background: siteConfig.promoBanner?.backgroundImage
                            ? `url(${siteConfig.promoBanner.backgroundImage}) center/cover no-repeat`
                            : 'linear-gradient(to right, #1e293b, #0f172a)' // Dark professional slate fallback
                    }}
                >
                    {/* Overlay for readability if image is present */}
                    {siteConfig.promoBanner?.backgroundImage && (
                        <div className="absolute inset-0 bg-black/30" />
                    )}

                    <div className="container px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left text-sm font-medium relative z-10">
                        {/* If Admin has not configured custom text, show 'Advertise with Us' fallback */}
                        {(!siteConfig.promoBanner?.text || siteConfig.promoBanner?.text === 'Grow Your Business with Property Dosti') ? (
                            <>
                                <span className="flex flex-col sm:flex-row items-center gap-2">
                                    <Badge variant="secondary" className="bg-primary text-white border-none uppercase text-[10px] w-fit">ADVERTISE</Badge>
                                    <span className="font-semibold">Put your brand here! Contact us for advertising opportunities.</span>
                                </span>
                                <Link href="https://wa.me/917760704400" target="_blank" className="flex items-center gap-1 bg-primary px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap text-xs text-white">
                                    Book Now <MessageSquare className="h-3 w-3" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <span className="flex flex-col sm:flex-row items-center gap-2">
                                    <Badge variant="secondary" className="bg-white/20 text-white border-none animate-pulse uppercase text-[10px] w-fit">PROMO</Badge>
                                    <span className="line-clamp-1">{siteConfig.promoBanner.text}</span>
                                </span>
                                <Link href={siteConfig.promoBanner.buttonLink || "/signup"} className="flex items-center gap-1 bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20 transition-colors shadow-sm whitespace-nowrap text-xs">
                                    {siteConfig.promoBanner.buttonText || 'Join Network'} <ExternalLink className="h-3 w-3" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="container px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 hover:bg-transparent hover:text-primary transition-colors">
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Property Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <PropertyImageGallery images={property.images} title={property.title} />

                        {/* Title and Info */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border shadow-sm ring-1 ring-black/5">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors uppercase tracking-wider text-[10px] font-bold">
                                            {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                                            {property.category}
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black mb-2 text-gray-900 dark:text-white tracking-tight leading-tight">{property.title}</h1>
                                    <div className="flex items-center text-muted-foreground font-medium">
                                        <MapPin className="h-5 w-5 mr-1 text-primary" />
                                        {property.village ? `${property.village}, ` : ''}{property.location}, {property.district}
                                    </div>
                                </div>
                                <div className="text-left md:text-right bg-primary/5 p-4 rounded-xl border border-primary/10 min-w-[200px]">
                                    <div className="text-3xl font-black text-primary">₹{property.price.toLocaleString('en-IN')}</div>
                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Total Price</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 py-6 border-y border-gray-100 my-6">
                                <Button
                                    variant="outline"
                                    className={`flex-1 min-w-[140px] gap-2 transition-all ${property.likes > 0 ? 'bg-pink-50 text-pink-600 border-pink-200' : 'hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200'}`}
                                    onClick={() => {
                                        likeProperty(property.id);
                                        toast.success('Liked!');
                                    }}
                                >
                                    <Heart className={property.likes > 0 ? 'fill-current' : ''} size={18} /> {property.likes} Likes
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 min-w-[140px] gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                    onClick={() => {
                                        const msg = encodeURIComponent(`Check out this property: ${property.title} - ${property.price.toLocaleString('en-IN')} INR. ${shareUrl}`);
                                        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                                        const whatsappUrl = isMobile
                                            ? `whatsapp://send?text=${msg}`
                                            : `https://wa.me/?text=${msg}`;
                                        window.open(whatsappUrl, '_blank');
                                    }}
                                >
                                    <Share2 size={18} /> Share
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 min-w-[140px] gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-all"
                                    onClick={() => {
                                        const msg = encodeURIComponent(whatsappShareMsg);
                                        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                                        const url = isMobile
                                            ? `whatsapp://send?text=${msg}`
                                            : `https://wa.me/?text=${msg}`;
                                        window.open(url, '_blank');
                                    }}
                                >
                                    <MessageSquare size={18} /> Share WhatsApp
                                </Button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <span className="w-8 h-1 bg-primary rounded-full"></span>
                                        Description
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                                        {property.description}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <span className="w-8 h-1 bg-primary rounded-full"></span>
                                        Amenities
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {property.amenities.map((amenity, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 transition-all hover:shadow-md hover:border-primary/20">
                                                <div className="bg-primary/10 p-2 rounded-lg">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="text-sm font-semibold">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Inquiry Form & Ad */}
                    <div className="space-y-8">
                        <Card className="sticky top-8 shadow-2xl border-primary/20 overflow-hidden ring-1 ring-primary/10">
                            <div className="bg-gradient-to-br from-primary to-indigo-600 p-6 text-white">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 fill-white/20" />
                                    Instant Inquiry
                                </h3>
                                <p className="text-white/80 text-xs mt-2 font-medium">Professional service via Property Dosti verified brokers</p>
                            </div>
                            <CardContent className="pt-8">
                                <form onSubmit={handleLeadSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Name</label>
                                        <Input
                                            className="bg-gray-50 border-gray-100 h-12 focus:bg-white transition-all"
                                            placeholder="Enter your full name"
                                            value={leadForm.name}
                                            onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</label>
                                        <Input
                                            className="bg-gray-50 border-gray-100 h-12 focus:bg-white transition-all"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={leadForm.phone}
                                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Message</label>
                                        <textarea
                                            className="w-full flex min-h-[100px] rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
                                            placeholder="Tell the broker what you're looking for..."
                                            value={leadForm.message}
                                            onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full shadow-xl shadow-primary/40 h-14 text-lg font-black tracking-tight hover:scale-[1.02] transition-transform">
                                        Send Inquiry
                                    </Button>
                                </form>

                                <div className="mt-8 pt-8 border-t border-dashed border-gray-200 font-medium text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Direct Communication</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="gap-2 font-bold border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                                            onClick={() => {
                                                const msg = encodeURIComponent(`Hi, I am interested in your property on Property Dosti: "${property.title}". Please share more details.`);
                                                // Sanitize phone number: remove + if present, ensure 91 prefix
                                                const phone = sanitizePhone(broker?.phone || '7760704400');

                                                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                                                const url = isMobile
                                                    ? `whatsapp://send?phone=${phone}&text=${msg}`
                                                    : `https://wa.me/${phone}?text=${msg}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4" /> WhatsApp
                                        </Button>
                                        <Button variant="outline" className="gap-2 font-bold bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 rounded-xl" asChild>
                                            <a href={`tel:${broker?.phone || '7760704400'}`}>
                                                <Phone className="h-4 w-4" /> Call Broker
                                            </a>
                                        </Button>
                                    </div>
                                    {broker && (
                                        <div className="mt-4 flex items-center justify-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                {broker.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xs font-black">{broker.name}</div>
                                                <div className="text-[10px] text-muted-foreground">Verified Broker ({broker.broker_code})</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Property Dosti Brand Ad */}
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-primary text-white shadow-2xl relative overflow-hidden group border border-white/10">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

                            <Badge className="mb-4 bg-white/20 border-none text-[10px] font-bold tracking-widest">ECOSYSTEM</Badge>
                            <h3 className="text-2xl font-black mb-3 relative z-10 tracking-tight">Expand Your Reach</h3>
                            <p className="text-sm text-white/70 mb-8 relative z-10 leading-relaxed">
                                Join our network of over 5,000 professional brokers across Karnataka. Get access to exclusive listings and high-quality leads.
                            </p>
                            <Button variant="secondary" className="w-full h-12 font-black shadow-lg hover:bg-white transition-colors relative z-10 rounded-xl" asChild>
                                <Link href="/signup">Join Property Dosti</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
