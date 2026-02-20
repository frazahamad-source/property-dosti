
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
import { PropertySearch, SearchFilters } from "@/components/PropertySearch";
import { BannerSlider } from "@/components/BannerSlider";

export default function Home() {
  const { properties, setProperties, bannerSlides, fetchBannerSlides, siteConfig, fetchSiteConfig } = useStore();
  const [loading, setLoading] = useState(true);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...properties];

    if (filters.district) {
      filtered = filtered.filter(p => p.district.toLowerCase().includes(filters.district.toLowerCase()));
    }
    if (filters.city) {
      filtered = filtered.filter(p => p.location.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.village) {
      filtered = filtered.filter(p => p.village?.toLowerCase().includes(filters.village.toLowerCase()));
    }
    if (filters.agentName) {
      filtered = filtered.filter(p => p.profiles?.name.toLowerCase().includes(filters.agentName.toLowerCase()));
    }

    setFilteredProperties(filtered);
  };

  useEffect(() => {
    if (properties.length > 0 && filteredProperties.length === 0) {
      // Initial load or reset
      setFilteredProperties(properties);
    } else if (properties.length > 0 && filteredProperties.length !== properties.length) {
      // Properties updated but we might have filters?
      // Actually this logic is tricky. Let's just default to properties if NO search is active.
      // But we don't track "search active" state here easily without more state.
      // Simplest: Just use filteredProperties defaulting to properties on load.
    }
  }, [properties]);

  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  useEffect(() => {
    fetchSiteConfig();
    fetchBannerSlides(); // Fetch global banner settings
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
              backgroundImage: `url("${siteConfig?.heroBackgroundImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920'}")`,
            }}
          />
          <div className="absolute inset-0 z-0 bg-black/50" /> {/* Dark Overlay */}

          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white whitespace-pre-line">
                  {siteConfig?.heroTitle || 'Empowering Real Estate Brokers \nin Karnataka'}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl dark:text-gray-300">
                  {siteConfig?.heroDescription || 'We are the first and most trusted network of verified brokers in all districts and villages in the state of Karnataka.'}
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

        {/* Search Section */}
        <section className="container relative z-20 px-4 md:px-6">
          <PropertySearch onSearch={handleSearch} />
        </section>

        {/* Dynamic Promotional Banner Slider */}
        <section className="w-full bg-gray-900 border-y border-gray-800 p-0">
          <BannerSlider slides={bannerSlides} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Skeleton Loading
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[400px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))
              ) : filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-lg">No properties found matching your search.</p>
                </div>
              )}
            </div>
            <div className="mt-12 text-center">
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
