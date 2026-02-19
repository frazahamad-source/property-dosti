-- 1. SETUP PROFILE CREATION LOGIC
-- Be absolutely sure the profile gets created when you sign up
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

-- Re-create the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. CLEANUP OLD USER
-- Delete the old user so you can sign up again fresh
DELETE FROM auth.users WHERE email = 'frazahamad@gmail.com';

-- 3. VERIFY
SELECT 'Ready for signup!' as status;
