-- MASTER SYSTEM FIX
-- Run this script to fix:
-- 1. Missing columns (company_name, designation)
-- 2. Signup Trigger (saving all fields)
-- 3. RLS Permissions (Admin access, Broker access, Public access)
-- 4. Recursion errors in policies

-- [SECTION 1: SCHEMA UPDATES]
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS village TEXT,
ADD COLUMN IF NOT EXISTS broker_code TEXT,
ADD COLUMN IF NOT EXISTS rera_number TEXT,
ADD COLUMN IF NOT EXISTS districts TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- [SECTION 2: TRIGGER UPDATE]
-- Ensures new signups get their metadata saved correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
      id,
      email,
      name,
      phone,
      company_name,
      designation,
      broker_code,
      rera_number,
      districts,
      city,
      village,
      status,
      registered_at,
      subscription_expiry,
      referral_code,
      referred_by,
      is_admin
  )
  VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', 'New User'),
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'designation',
      new.raw_user_meta_data->>'broker_code',
      new.raw_user_meta_data->>'rera_number',
      CASE 
        WHEN new.raw_user_meta_data->>'primary_district' IS NOT NULL 
        THEN ARRAY[new.raw_user_meta_data->>'primary_district']
        ELSE NULL 
      END,
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'village',
      'pending',
      COALESCE((new.raw_user_meta_data->>'registered_at')::timestamptz, NOW()),
      (new.raw_user_meta_data->>'subscription_expiry')::timestamptz,
      new.raw_user_meta_data->>'referral_code',
      new.raw_user_meta_data->>'referred_by',
      false -- Default is_admin to false
  )
  ON CONFLICT (id) DO UPDATE
  SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      company_name = EXCLUDED.company_name,
      designation = EXCLUDED.designation,
      city = EXCLUDED.city,
      village = EXCLUDED.village,
      districts = EXCLUDED.districts,
      status = 'pending'; -- Reset to pending on re-registration if record existed
      
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [SECTION 3: RECURSION-FREE ADMIN CHECK]
-- Create a secure function to check admin status without triggering RLS on profiles table again
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- We query the profiles table directly, but since this function is SECURITY DEFINER,
  -- it bypasses RLS, avoiding infinite recursion.
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [SECTION 4: RLS POLICIES]
-- Reset Policies on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;

-- 4.1 View: Public (needed for resolving broker names in property listings)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 4.2 Update: Users can update their own
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4.3 All: Admins can do everything (Using the non-recursive function)
CREATE POLICY "Admins can do everything" 
ON public.profiles FOR ALL 
USING (public.is_admin());

-- Reset Policies on Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Brokers can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Brokers can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Brokers can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;

-- 4.4 Properties View: Public
CREATE POLICY "Public properties are viewable by everyone" 
ON public.properties FOR SELECT 
USING (true);

-- 4.5 Properties Insert: Authenticated Users
CREATE POLICY "Brokers can insert own properties" 
ON public.properties FOR INSERT 
WITH CHECK (auth.uid() = broker_id);

-- 4.6 Properties Update: Own or Admin
CREATE POLICY "Brokers can update own properties" 
ON public.properties FOR UPDATE 
USING (auth.uid() = broker_id OR public.is_admin());

-- 4.7 Properties Delete: Own or Admin
CREATE POLICY "Brokers can delete own properties" 
ON public.properties FOR DELETE 
USING (auth.uid() = broker_id OR public.is_admin());

-- [SECTION 5: BANNERS STORAGE]
-- Ensure storage policies exist for banners
-- (Assuming bucket 'property-images' exists)
-- This part is tricky in SQL script without knowing existing policies, but generally:
-- INSERT/UPDATE/DELETE for Admins only on 'banners/' folder.
