-- 1. Create a secure function to check admin status
-- SECURITY DEFINER means it runs with system privileges, bypassing the RLS check loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all conflicting policies on profiles to clear the recursion
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users and Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- 3. Re-create simple, safe policies using the new function
-- SELECT: Everyone can see profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

-- INSERT: Users can create their own profile
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile OR Admins can update any
CREATE POLICY "Users and Admins can update profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  );

-- DELETE: Only Admins can delete
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- 4. Enable RLS (ensure it's on)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verify status
SELECT 'Recursion fixed successfully!' as status;
