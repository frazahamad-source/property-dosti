/*
  MASTER FIX SCRIPT
  1. Fixes Infinite Recursion (RLS Policies)
  2. Removes conflicting admin account
  3. Ensures 'frazahamad@gmail.com' is Admin
*/

-- ==========================================
-- 1. FIX INFINITE RECURSION (Critical)
-- ==========================================

-- Create a secure function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This runs with admin privileges (SECURITY DEFINER), preventing the loop
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop ALL existing policies on profiles to be safe
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users and Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

-- Re-create Clean Policies
-- 1. VIEW: Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

-- 2. INSERT: Users can create their own profile
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Users update own, Admins update any
CREATE POLICY "Users and Admins can update profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  );

-- 4. DELETE: Only Admins can delete
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 2. RESOLVE ADMIN CONFLICT
-- ==========================================

-- Remove the conflicting account if it exists
DELETE FROM auth.users WHERE email = 'Properties@westlinebuilders.com';


-- ==========================================
-- 3. GRANT ADMIN TO YOU
-- ==========================================

-- Ensure your profile is admin
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');

-- Confirm your email is verified (skip email link)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'frazahamad@gmail.com' AND email_confirmed_at IS NULL;


-- ==========================================
-- 4. VERIFY
-- ==========================================
SELECT 
    u.email, 
    p.is_admin, 
    'Recursion Fixed & Admin Set' as status 
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'frazahamad@gmail.com';
