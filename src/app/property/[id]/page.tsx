'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MapPin, Phone, MessageSquare, Heart, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { properties, banner, addPropertyLead, likeProperty } = useStore();

    const property = properties.find(p => p.id === id);

    const [leadForm, setLeadForm] = useState({
        name: '',
        phone: '',
        message: 'I am interested in this property. Please contact me.'
    });

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Top Banner Promotion */}
            <div className="bg-primary text-white py-3">
                <div className="container px-4 flex justify-between items-center text-sm font-medium">
                    <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-none">NEW</Badge>
                        {banner.title}
                    </span>
                    <Link href="/signup" className="underline underline-offset-4 hover:text-white/80">
                        Join as Broker
                    </Link>
                </div>
            </div>

            <div className="container px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Property Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 aspect-[16/9] overflow-hidden rounded-2xl border shadow-sm">
                                <img
                                    src={property.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}
                                    className="w-full h-full object-cover"
                                    alt={property.title}
                                />
                            </div>
                            {property.images.slice(1).map((img, idx) => (
                                <div key={idx} className="aspect-[4/3] overflow-hidden rounded-xl border shadow-sm">
                                    <img src={img} className="w-full h-full object-cover" alt={`${property.title} ${idx + 2}`} />
                                </div>
                            ))}
                        </div>

                        {/* Title and Info */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Badge className="mb-2">{property.type === 'sale' ? 'For Sale' : 'For Rent'}</Badge>
                                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="h-5 w-5 mr-2 text-primary" />
                                        {property.location}, {property.district}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-primary">₹{property.price.toLocaleString('en-IN')}</div>
                                    <div className="text-sm text-muted-foreground mt-1 capitalize">{property.category}</div>
                                </div>
                            </div>

                            <div className="flex gap-4 py-6 border-y my-6">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2 text-pink-600 border-pink-100"
                                    onClick={() => {
                                        likeProperty(property.id);
                                        toast.success('Liked!');
                                    }}
                                >
                                    <Heart className={property.likes > 0 ? 'fill-current' : ''} /> {property.likes} Likes
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2 text-blue-600 border-blue-100"
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success('Link copied!');
                                    }}
                                >
                                    <Share2 /> Share Property
                                </Button>
                            </div>

                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-xl font-bold mb-4">Description</h3>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                    {property.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Inquiry Form & Ad */}
                    <div className="space-y-8">
                        <Card className="sticky top-8 shadow-xl border-primary/10 overflow-hidden">
                            <div className="bg-primary/5 p-4 border-b border-primary/10">
                                <h3 className="font-bold flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    Inquire Now
                                </h3>
                            </div>
                            <CardContent className="pt-6">
                                <form onSubmit={handleLeadSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Your Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={leadForm.name}
                                            onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <Input
                                            placeholder="+91 XXXXX XXXXX"
                                            value={leadForm.phone}
                                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Message</label>
                                        <textarea
                                            className="w-full flex min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="Your message..."
                                            value={leadForm.message}
                                            onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full shadow-lg shadow-primary/30 py-6 text-lg font-bold">
                                        Send Inquiry
                                    </Button>
                                </form>

                                <div className="mt-6 pt-6 border-t font-medium text-center">
                                    <p className="text-sm text-muted-foreground mb-4">Or contact via WhatsApp</p>
                                    <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50 font-bold" asChild>
                                        <a
                                            href={`https://wa.me/91${property.id === '1' ? '9876543210' : '9988776655'}?text=Hi, I am interested in your property on Property Dosti: "${property.title}"`}
                                            target="_blank"
                                        >
                                            Chat on WhatsApp
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Property Dosti Brand Ad */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold mb-2 relative z-10">Property Dosti</h3>
                            <p className="text-sm text-white/80 mb-6 relative z-10">
                                Verify your profile today and join the most elite network of real estate professionals in Karnataka.
                            </p>
                            <Button variant="secondary" className="w-full font-bold relative z-10" asChild>
                                <Link href="/signup">Join Network Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
