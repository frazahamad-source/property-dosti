-- 1. Ensure Columns Exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS designation TEXT;

-- 2. Correct Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    phone, 
    company_name, 
    designation,
    broker_code,
    rera_number,
    districts,        -- DATABASE COLUMN IS 'districts' (Array)
    city,
    village,
    status,           -- Ensure status is set
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
    new.raw_user_meta_data->>'rera_number',
    ARRAY[new.raw_user_meta_data->>'primary_district'], -- Convert single district to Array
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'village',
    'pending',        -- Default status
    COALESCE((new.raw_user_meta_data->>'registered_at')::timestamptz, NOW()),
    (new.raw_user_meta_data->>'subscription_expiry')::timestamptz,
    new.raw_user_meta_data->>'referral_code',
    new.raw_user_meta_data->>'referred_by'
  )
  ON CONFLICT (id) DO UPDATE
  SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      company_name = EXCLUDED.company_name,
      designation = EXCLUDED.designation,
      city = EXCLUDED.city,
      village = EXCLUDED.village,
      districts = EXCLUDED.districts;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Cleanup Old User (Just in case)
DELETE FROM auth.users WHERE email = 'frazahamad@gmail.com';

SELECT 'Fixed columns and trigger!' as status;
