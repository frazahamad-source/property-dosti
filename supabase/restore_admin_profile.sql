-- RESTORE ADMIN PROFILE (FAILSAFE VERSION)
-- Runs ensuring only known-to-exist columns are used.

INSERT INTO public.profiles (id, is_admin, status, name)
SELECT 
    id, 
    true, 
    'approved',
    COALESCE(raw_user_meta_data->>'name', 'Admin User')
FROM auth.users
WHERE email = 'Properties@westlinebuilders.com'
ON CONFLICT (id) DO UPDATE
SET 
    is_admin = true, 
    status = 'approved';
