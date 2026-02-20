
import Link from 'next/link';
import { Property } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { sanitizePhone } from '@/lib/utils';

interface PropertyCardProps {
    property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
    const { likeProperty } = useStore();

    const handleLike = async () => {
        const { error } = await supabase.rpc('increment_likes', { row_id: property.id });

        // If RPC isn't available, fallback to simple update (though RPC is safer for concurrency)
        if (error) {
            const { error: updateError } = await supabase
                .from('properties')
                .update({ likes: property.likes + 1 })
                .eq('id', property.id);

            if (updateError) {
                toast.error('Failed to like property');
                return;
            }
        }

        likeProperty(property.id);
        toast.success('Property liked!');
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
            <div className="aspect-[16/9] relative bg-gray-200">
                <Link href={`/property/${property.id}`} className="block w-full h-full cursor-pointer">
                    {property.images[0] ? (
                        <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                </Link>
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
                    <Badge variant={property.type === 'sale' ? 'default' : 'secondary'}>
                        For {property.type === 'sale' ? 'Sale' : 'Rent'}
                    </Badge>
                    {property.structureType && (
                        <Badge variant="outline" className="bg-white/80 backdrop-blur text-black border-none text-[10px]">
                            {property.structureType}
                        </Badge>
                    )}
                </div>
            </div>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1 text-primary" />
                            <span className="font-medium text-black dark:text-white">
                                {property.village ? `${property.village}, ${property.location}` : property.location}
                            </span>
                            <span className="text-xs ml-1 opacity-70">({property.district})</span>
                        </div>
                    </div>
                </div>
                <div className="text-lg font-bold text-primary mt-1">
                    ₹{property.price.toLocaleString('en-IN')}
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 whitespace-pre-line">{property.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                    <div className="flex gap-2">
                        {property.landArea ? <span className="bg-gray-100 px-2 py-1 rounded">{property.landArea} Sqft</span> : null}
                        {property.parkingAllocated ? <span className="bg-gray-100 px-2 py-1 rounded">Pkng: {property.parkingAllocated}</span> : null}
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        variant={"outline" as any}
                        size={"sm" as any}
                        className="flex-1 h-9 text-pink-600 border-pink-100 hover:bg-pink-50 hover:text-pink-700 font-bold"
                        onClick={handleLike}
                    >
                        <Heart className={`h-4 w-4 mr-2 ${property.likes > 0 ? 'fill-current' : ''}`} />
                        {property.likes}
                    </Button>
                    <Button
                        variant={"outline" as any}
                        size={"sm" as any}
                        className="flex-1 h-9 text-blue-600 border-blue-100 hover:bg-blue-50 hover:text-blue-700 font-bold"
                        onClick={() => {
                            const url = `${window.location.origin}/property/${property.id}`;
                            const msg = encodeURIComponent(`Check out this property: ${property.title} - ${property.price.toLocaleString('en-IN')} INR. ${url}`);
                            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                            const whatsappUrl = isMobile
                                ? `whatsapp://send?text=${msg}`
                                : `https://wa.me/?text=${msg}`;
                            window.open(whatsappUrl, '_blank');
                        }}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                </div>

                <Button
                    variant={"primary" as any}
                    className="w-full mt-3 font-bold shadow-md shadow-primary/20"
                    onClick={() => {
                        const phone = sanitizePhone(property.brokerPhone || '7760704400');
                        const msg = encodeURIComponent(`Hi, I am interested in your property: "${property.title}" in ${property.location}. Is it still available?`);
                        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                        const url = isMobile
                            ? `whatsapp://send?phone=${phone}&text=${msg}`
                            : `https://wa.me/${phone}?text=${msg}`;
                        window.open(url, '_blank');
                    }}
                >
                    Inquire on WhatsApp
                </Button>
            </CardContent>
        </Card >
    );
}
