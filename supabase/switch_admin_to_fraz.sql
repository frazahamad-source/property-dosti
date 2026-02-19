-- SWITCH ADMIN TO FRAZAHAMAD@GMAIL.COM & REMOVE OLD EMAIL
-- Note: 'email' and 'role' columns do NOT exist in public.profiles.

-- 1. Remove 'Properties@westlinebuilders.com' explicitly
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email ILIKE 'Properties@westlinebuilders.com');

DELETE FROM auth.users WHERE email ILIKE 'Properties@westlinebuilders.com';

-- 2. Elevate 'frazahamad@gmail.com' to Admin
-- Restore/Insert profile if missing, or Update if exists
INSERT INTO public.profiles (id, name, is_admin, status, registered_at)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', 'Admin User'), 
    true, 
    'approved',
    created_at
FROM auth.users
WHERE email ILIKE 'frazahamad@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    is_admin = true, 
    status = 'approved';

-- 3. Verify
-- If this returns a row, you are good to log in as Fraz.
SELECT id, name, is_admin, status FROM public.profiles WHERE is_admin = true;
