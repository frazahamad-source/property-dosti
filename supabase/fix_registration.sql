-- FIX REGISTRATION & GOOGLE AUTH
-- This script sets up a "Trigger" that automatically creates a Public Profile
-- whenever a new user Signs Up. This prevents "Permission Denied" errors.

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
      id,
      name,
      phone,
      broker_code,
      rera_number,
      districts,
      city,
      village,
      status,
      registered_at,
      subscription_expiry,
      referral_code,
      referred_by
  )
  VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'broker_code',
      new.raw_user_meta_data->>'rera_number',
      ARRAY[new.raw_user_meta_data->>'primary_district'], 
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'village',
      'pending',
      COALESCE((new.raw_user_meta_data->>'registered_at')::timestamptz, NOW()),
      (new.raw_user_meta_data->>'subscription_expiry')::timestamptz,
      new.raw_user_meta_data->>'referral_code',
      new.raw_user_meta_data->>'referred_by'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
