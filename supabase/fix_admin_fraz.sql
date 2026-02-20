-- FIX ADMIN PROFILE FOR frazahamad@gmail.com
-- This script ensures the user exists in profiles and is set as admin. (v2: Removed email column)

-- 1. Insert profile if missing
INSERT INTO public.profiles (id, name, is_admin, status)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', 'Fraz Admin'),
    true, 
    'approved'
FROM auth.users
WHERE email = 'frazahamad@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    is_admin = true,
    status = 'approved';

-- 2. Verify
SELECT id, is_admin, status, name 
FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');
