-- ENSURE ADMIN PROFILE FOR frazahamad@gmail.com
-- Use this script to fix the "Profile not found" or "Cannot coerce result" error during login.

DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- 1. Get the Auth ID for the admin user
    SELECT id INTO admin_id FROM auth.users WHERE email = 'frazahamad@gmail.com';

    IF admin_id IS NULL THEN
        RAISE NOTICE 'Admin user with email frazahamad@gmail.com not found in auth.users table. Please create the user first in the Auth section of the Supabase Dashboard.';
    ELSE
        -- 2. Insert or Update the profile
        INSERT INTO public.profiles (id, name, is_admin, status)
        VALUES (
            admin_id, 
            'Admin Fraz', 
            true, 
            'approved'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            is_admin = true,
            status = 'approved';
            
        RAISE NOTICE 'Profile for frazahamad@gmail.com (ID: %) ensured and set as admin.', admin_id;
    END IF;
END $$;

-- 3. Final Verification
SELECT id, is_admin, status 
FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');
