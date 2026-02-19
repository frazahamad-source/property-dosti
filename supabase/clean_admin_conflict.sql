-- 1. Check for and delete the conflicting user
DELETE FROM auth.users WHERE email = 'Properties@westlinebuilders.com';

-- 2. Ensure your main email is definitely the admin
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');

-- 3. Verify the result
-- Should return ONLY 'frazahamad@gmail.com' as true
SELECT email, is_admin 
FROM auth.users 
JOIN public.profiles ON auth.users.id = public.profiles.id
WHERE email IN ('frazahamad@gmail.com', 'Properties@westlinebuilders.com');
