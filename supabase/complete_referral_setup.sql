-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create function to generate Unique Broker ID
CREATE OR REPLACE FUNCTION public.generate_unique_broker_id()
RETURNS TEXT AS $body$
DECLARE
    new_id TEXT;
    exists_id BOOLEAN;
BEGIN
    LOOP
        -- Generate ID in format PD-XXXXXX (6 digits)
        new_id := 'PD-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if ID already exists
        SELECT EXISTS (SELECT 1 FROM public.profiles WHERE unique_broker_id = new_id) INTO exists_id;
        
        -- Exit loop if unique
        IF NOT exists_id THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$body$ LANGUAGE plpgsql;

-- 2. Add new fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unique_broker_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 3. Backfill unique IDs for existing brokers
UPDATE public.profiles 
SET unique_broker_id = public.generate_unique_broker_id() 
WHERE unique_broker_id IS NULL AND (is_admin IS NOT TRUE);

-- 4. Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referring_broker_id UUID REFERENCES public.profiles(id),
    referred_broker_id UUID REFERENCES public.profiles(id),
    referred_person_name TEXT,
    referred_contact TEXT,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    admin_approval_status BOOLEAN DEFAULT FALSE,
    approval_date TIMESTAMPTZ,
    reward_status TEXT DEFAULT 'pending', -- 'pending', 'applied'
    reward_value NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Delete any existing policies to avoid conflicts
DO $do$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Brokers can view their own referrals') THEN
        DROP POLICY "Brokers can view their own referrals" ON public.referrals;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can view all referrals') THEN
        DROP POLICY "Admins can view all referrals" ON public.referrals;
    END IF;
END $do$;

-- Policy: Brokers can view their own referrals
CREATE POLICY "Brokers can view their own referrals" 
ON public.referrals 
FOR SELECT 
TO authenticated 
USING (auth.uid() = referring_broker_id);

-- Policy: Admins can view all referrals
CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- 6. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $body$
DECLARE
    referrer_id UUID;
    provided_code TEXT;
BEGIN
  -- Get the referral code provided during signup
  provided_code := new.raw_user_meta_data->>'referred_by';
  
  -- Resolve referral code to the referrer's UUID if valid
  IF provided_code IS NOT NULL AND provided_code <> '' THEN
    SELECT id INTO referrer_id 
    FROM public.profiles 
    WHERE referral_code = provided_code 
       OR unique_broker_id = provided_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id, 
    name, 
    phone, 
    company_name, 
    designation,
    broker_code, 
    unique_broker_id,
    rera_number,
    districts,
    city,
    village,
    registered_at,
    subscription_expiry,
    referral_code,
    referred_by,
    status
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'designation',
    new.raw_user_meta_data->>'broker_code',
    public.generate_unique_broker_id(),
    new.raw_user_meta_data->>'rera_number',
    ARRAY[new.raw_user_meta_data->>'primary_district'],
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'village',
    COALESCE((new.raw_user_meta_data->>'registered_at')::timestamptz, NOW()),
    (new.raw_user_meta_data->>'subscription_expiry')::timestamptz,
    new.raw_user_meta_data->>'referral_code',
    referrer_id::TEXT, -- Store the resolved UUID as TEXT
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;
