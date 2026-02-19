-- 1. Ensure is_admin column exists (idempotent)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Update the admin user permissions
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');

-- 3. Ensure email is confirmed for admin
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmation_token = NULL,
    recovery_token = NULL
WHERE email = 'frazahamad@gmail.com';
