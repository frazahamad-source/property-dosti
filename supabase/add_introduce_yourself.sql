-- Add introduce_yourself column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS introduce_yourself TEXT;

-- Update the registration trigger to include introduce_yourself
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, name, phone, company_name, designation, 
    broker_code, rera_number, districts, city, village, status,
    registered_at, subscription_expiry, referral_code, referred_by, is_admin,
    introduce_yourself
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
    false,
    new.raw_user_meta_data->>'introduce_yourself'
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
    introduce_yourself = EXCLUDED.introduce_yourself;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
