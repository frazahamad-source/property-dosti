-- Create function to generate Unique Broker ID
CREATE OR REPLACE FUNCTION public.generate_unique_broker_id()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Add new fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unique_broker_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Backfill unique IDs for existing brokers
UPDATE public.profiles 
SET unique_broker_id = public.generate_unique_broker_id() 
WHERE unique_broker_id IS NULL AND role = 'broker';

-- Create referrals tracking table
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

-- Update handle_new_user trigger function to use unique_broker_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    phone, 
    company_name, 
    designation,
    broker_code, -- legacy field, keep for compatibility
    unique_broker_id,
    rera_number,
    primary_district,
    city,
    village,
    registered_at,
    subscription_expiry,
    referral_code,
    referred_by
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
    new.raw_user_meta_data->>'primary_district',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'village',
    COALESCE((new.raw_user_meta_data->>'registered_at')::timestamptz, NOW()),
    (new.raw_user_meta_data->>'subscription_expiry')::timestamptz,
    new.raw_user_meta_data->>'referral_code',
    new.raw_user_meta_data->>'referred_by'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
