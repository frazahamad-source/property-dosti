-- EMERGENCY FIX: RESTORE ALL MISSING PROFILES
-- This script finds ALL users in auth.users who do not have a corresponding row in public.profiles
-- and creates a profile for them. This fixes the "0 rows" login error.

INSERT INTO public.profiles (id, name, is_admin, status, registered_at)
SELECT 
    au.id, 
    COALESCE(au.raw_user_meta_data->>'name', 'Restored User'),
    CASE 
        -- If their email contains 'westlinebuilders', make them admin (Case insensitive check)
        WHEN au.email ILIKE '%westlinebuilders%' THEN true 
        ELSE false 
    END,
    'approved',
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE pp.id IS NULL; -- Only insert if profile is MISSING

-- Confirm the fix by showing the profiles
SELECT * FROM public.profiles;
