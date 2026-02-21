-- Ensure the admin profile exists for frazahamad@gmail.com
-- Replace 'YOUR_USER_ID_HERE' with the actual ID from auth.users if known, 
-- or use this subquery if the user already exists in auth.users.

INSERT INTO public.profiles (id, email, name, is_admin, status, registered_at)
SELECT id, email, 'Admin', TRUE, 'approved', NOW()
FROM auth.users
WHERE email = 'frazahamad@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = TRUE,
    status = 'approved';

-- Verify the profile
SELECT * FROM public.profiles WHERE email = 'frazahamad@gmail.com';
