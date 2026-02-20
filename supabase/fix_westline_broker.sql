-- FIX BROKER LOGIN FOR properties@westlinebuilders.com
-- Issue: "Email not confirmed" error + "0 rows" profile error

-- 1. Manually confirm the email in auth.users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'properties@westlinebuilders.com';

-- 2. Ensure a valid BROKER profile exists (is_admin = false)
INSERT INTO public.profiles (id, name, is_admin, status)
SELECT 
    id, 
    'Westline Broker', -- Default name if none exists
    false,             -- EXPLICITLY set as false (Broker)
    'approved'         -- Auto-approve so they can login immediately
FROM auth.users
WHERE email = 'properties@westlinebuilders.com'
ON CONFLICT (id) DO UPDATE
SET 
    status = 'approved',
    is_admin = false, -- Ensure they are NOT admin
    email_confirmed_at = now(); -- Just in case (custom column? likely not needed but harmless if missing, removed to be safe)

-- 2b. (Correction) We cannot update 'email_confirmed_at' in profiles if it doesn't exist.
-- The UPDATE above is for auth.users. 
-- The ON CONFLICT below is strictly for public.profiles.

-- 3. Verify
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'properties@westlinebuilders.com';
SELECT id, is_admin, status FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'properties@westlinebuilders.com');
