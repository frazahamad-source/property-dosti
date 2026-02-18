-- COMPREHENSIVE SETUP & FIX SCRIPT

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create properties table if it doesn't exist
CREATE TABLE IF NOT EXISTS properties (
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

-- 3. Add is_admin column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 4. Set Admin Email
-- IMPORTANT: You must run this line with your actual email address.
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com'); 

-- 5. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 6. Fix Policies (Drop existing to avoid conflicts, then recreate)

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
-- Allow Admins to Delete Profiles
CREATE POLICY "Admins can delete any profile" ON profiles FOR DELETE USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Properties Policies
DROP POLICY IF EXISTS "Public properties are viewable by everyone." ON properties;
DROP POLICY IF EXISTS "Brokers can manage their own properties." ON properties;

CREATE POLICY "Public properties are viewable by everyone." ON properties FOR SELECT USING (is_active = true);
CREATE POLICY "Brokers can manage their own properties." ON properties FOR ALL USING (auth.uid() = broker_id);

-- 7. Storage Setup
-- Attempt to create bucket, ignore if exists (SQL way to handle this cleanly is tricky without extensions, 
-- but we'll focus on policies which are the main issue. 
-- If bucket doesn't exist, insert it.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage banners" ON storage.objects;

CREATE POLICY "Property images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');

-- Allow any authenticated user to upload to 'property-images' bucket
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Allow users to update/delete their own images
CREATE POLICY "Users can update/delete their own images" ON storage.objects FOR ALL USING (bucket_id = 'property-images' AND auth.uid() = owner);

-- Allow Admins to overwrite/delete ANY file in the 'banners/' folder
CREATE POLICY "Admins can manage banners" ON storage.objects FOR ALL USING (
    bucket_id = 'property-images' 
    AND (storage.foldername(name))[1] = 'banners'
    AND (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
