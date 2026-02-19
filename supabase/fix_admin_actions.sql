-- PART 2: GRANTING FULL ADMIN ACCESS
-- This ensures Admins can Approve/Reject brokers (UPDATE) and Delete Properties.

-- 1. Profiles: Allow Admins to do EVERYTHING (Update, Delete, Select)
-- First, drop the specific DELETE policy we made earlier to avoid redundancy/conflict
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can perform all actions on profiles" ON profiles;

CREATE POLICY "Admins can perform all actions on profiles" ON profiles
    FOR ALL USING (
        (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    );

-- 2. Properties: Allow Admins to do EVERYTHING (Delete listing, Update details)
DROP POLICY IF EXISTS "Admins can perform all actions on properties" ON properties;
CREATE POLICY "Admins can perform all actions on properties" ON properties
    FOR ALL USING (
        (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    );
