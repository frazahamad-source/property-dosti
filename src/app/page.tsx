
'use client';
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";

import { useStore } from "@/lib/store";
import { PropertyCard } from "@/components/PropertyCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Property } from "@/lib/types";

export default function Home() {
  const { properties, setProperties, banner } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles (
            phone
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties FULL:', JSON.stringify(error, null, 2));
        // Also log to toast if possible, or just console for now
      } else if (data) {
        const mappedProperties: Property[] = data.map((p: any) => ({
          id: p.id,
          brokerId: p.broker_id,
          title: p.title,
          description: p.description,
          price: p.price,
          district: p.district,
          location: p.location,
          type: p.type,
          category: p.category,
          images: p.images,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          expiresAt: p.expires_at,
          isActive: p.is_active,
          likes: p.likes,
          leadsCount: p.leads_count,
          amenities: p.amenities,
          brokerPhone: p.profiles?.phone,
        }));
        setProperties(mappedProperties);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [setProperties]);

  const hotProperties = properties.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link className="flex items-center justify-center font-bold text-2xl" href="#">
          <Building2 className="mr-2 h-6 w-6 text-primary" />
          Property Dosti
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/signup">
            Register
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
          {/* Hero Background Image */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-black/50" /> {/* Dark Overlay */}

          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white whitespace-pre-line">
                  Empowering Real Estate Brokers {"\n"}in Karnataka
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl dark:text-gray-300">
                  We are the first and most trusted network of verified brokers in all districts and villages in the state of Karnataka.
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white" asChild>
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
                  <Link href="/login">
                    Broker Login
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Promotional Banner */}
        <section className="w-full bg-primary/10 py-6 border-y border-primary/20">
          <div className="container px-4 md:px-6">
            <div
              className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-primary/10 overflow-hidden relative"
              style={banner.backgroundImage ? {
                backgroundImage: `url(${banner.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${banner.backgroundPositionY || 50}%`
              } : {}}
            >
              {banner.backgroundImage && <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-0" />}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 flex-1">
                <Badge className="mb-2 bg-primary text-white">PROMOTION</Badge>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{banner.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{banner.description}</p>
              </div>
              <div className="relative z-10">
                <Button className="font-bold shadow-lg shadow-primary/30" asChild>
                  <Link href={banner.buttonLink}>{banner.buttonText}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Hot Properties</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Check out the latest listings from our top brokers. Reach out to them directly.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotProperties.map((property) => (
                <div key={property.id} className="h-full">
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">View All Properties</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-blue-100 rounded-full dark:bg-blue-900">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Verified Network</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Every broker is verified by our admin team, ensuring a safe and trusted community.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-green-100 rounded-full dark:bg-green-900">
                  <Building2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Manage Listings</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  List your properties with ease. 45-day validity keeps listings fresh and relevant.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-purple-100 rounded-full dark:bg-purple-900">
                  <Users className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold">Community Growth</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Connect with other brokers, share leads, and expand your business reach.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
