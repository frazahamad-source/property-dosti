-- FIX ADMIN EMAIL & STATUS
-- 1. Ensure the user with this email is confirmed (to receive emails)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmation_token = NULL,
    recovery_token = NULL
WHERE email = 'frazahamad@gmail.com';

-- 2. Make sure they are an Admin in profiles
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');

-- 3. (Optional) If the user doesn't exist in profiles but exists in auth, insert them
-- This handles edge cases where the trigger didn't fire for the admin account
INSERT INTO public.profiles (id, name, email, is_admin, status, registered_at)
SELECT id, 'Admin', email, TRUE, 'approved', NOW()
FROM auth.users
WHERE email = 'frazahamad@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = TRUE;
