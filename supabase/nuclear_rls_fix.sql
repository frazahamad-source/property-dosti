-- NUCLEAR RLS & REGISTRATION FIX (REBOOT)
-- Run this in the Supabase SQL Editor to resolve all recursion and visibility issues.

-- 1. CLEANUP ALL POLICIES (THE TRUE NUCLEAR OPTION)
-- This loop drops EVERY policy on profiles and properties regardless of their name.
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
    END LOOP;

    -- Drop all policies on properties
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'properties' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY %I ON public.properties', pol.policyname);
    END LOOP;
END $$;

-- 2. CREATE NON-RECURSIVE ADMIN CHECK (Hardened)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER function bypasses RLS on the tables it queries.
  -- Setting search_path is a security best practice for SECURITY DEFINER functions.
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. APPLY CLEAN RLS POLICIES FOR PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (required for resolving names)
CREATE POLICY "Public profiles viewable" ON public.profiles 
FOR SELECT USING (true);

-- Users can create their own profile during signup
CREATE POLICY "Users can insert own" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update themselves, Admins can update anyone
CREATE POLICY "Users and Admins can update" ON public.profiles 
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Only admins can delete
CREATE POLICY "Admins can delete" ON public.profiles 
FOR DELETE USING (public.is_admin());


-- 4. APPLY CLEAN RLS POLICIES FOR PROPERTIES
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Everyone can view active properties
CREATE POLICY "Public properties viewable" ON public.properties 
FOR SELECT USING (true);

-- Authenticated brokers can insert
CREATE POLICY "Brokers can insert" ON public.properties 
FOR INSERT WITH CHECK (auth.uid() = broker_id);

-- Brokers can edit own, Admins can edit all
CREATE POLICY "Brokers and Admins can update" ON public.properties 
FOR UPDATE USING (auth.uid() = broker_id OR public.is_admin());

-- Brokers can delete own, Admins can delete all
CREATE POLICY "Brokers and Admins can delete" ON public.properties 
FOR DELETE USING (auth.uid() = broker_id OR public.is_admin());


-- 5. FIX REGISTRATION TRIGGER
-- Ensures all metadata from SignupForm.tsx is correctly saved to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, name, phone, company_name, designation, 
    broker_code, rera_number, districts, city, village, status,
    registered_at, subscription_expiry, referral_code, referred_by, is_admin
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
    false
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
    districts = EXCLUDED.districts;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 6. VERIFICATION QUERIES
-- Run these individually to check status
-- a) List current policies (should only see the 4 we just created)
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- b) Check if "Musthak Ahamed" exists in Auth:
-- SELECT id, email FROM auth.users WHERE email LIKE '%musthak%';

-- c) Check if he has a profile:
-- SELECT * FROM public.profiles WHERE email LIKE '%musthak%';

-- d) Verify your own admin status:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'frazahamad@gmail.com';
