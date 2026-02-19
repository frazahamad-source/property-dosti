-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    broker_code TEXT UNIQUE,
    rera_number TEXT,
    districts TEXT[],
    city TEXT,
    village TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_expiry TIMESTAMPTZ,
    referral_code TEXT,
    referred_by TEXT,
    referrals_count INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    district TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'rent')),
    category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'land')),
    images TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 days'),
    is_active BOOLEAN DEFAULT TRUE,
    likes INTEGER DEFAULT 0,
    leads_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Properties Policies
CREATE POLICY "Public properties are viewable by everyone." ON properties
    FOR SELECT USING (is_active = true);

CREATE POLICY "Brokers can manage their own properties." ON properties
    FOR ALL USING (auth.uid() = broker_id);

-- Storage Bucket for Property Images
-- Run this in the Supabase Dashboard as well if needed, but SQL can handle it if extensions are enabled
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage Policies
CREATE POLICY "Property images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update/delete their own property images" ON storage.objects
    FOR ALL USING (bucket_id = 'property-images' AND auth.uid() = owner);

-- Function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
