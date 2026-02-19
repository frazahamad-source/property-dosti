-- Enable pgcrypto extension to generate password hashes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set the password for the admin user
-- REPLACE 'Admin@123' with your desired temporary password
UPDATE auth.users
SET 
    encrypted_password = crypt('Admin@123', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW(),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email = 'frazahamad@gmail.com';

-- Ensure the user is an admin in the public.profiles table
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');

-- Check if the update was successful
SELECT email, email_confirmed_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'frazahamad@gmail.com';
