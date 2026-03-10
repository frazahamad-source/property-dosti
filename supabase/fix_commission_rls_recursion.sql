-- FIX INFINITE RECURSION IN COMMISSION RLS POLICIES
-- Run this in the Supabase SQL Editor

-- 1. Create a SECURITY DEFINER function to securely look up the broker_id
-- for a given commission_record. This breaks the direct cyclical table dependency
-- between commission_records and commission_shares.
CREATE OR REPLACE FUNCTION public.get_commission_owner(target_commission_id UUID)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT broker_id FROM public.commission_records WHERE id = target_commission_id;
$$;

-- 2. Drop the recursive policy on commission_shares
DROP POLICY IF EXISTS "Commission shares viewable by owner or recipient" ON public.commission_shares;
DROP POLICY IF EXISTS "Commission shares viewable by record owner" ON public.commission_shares;

-- 3. Recreate the policy cleanly using the SECURITY DEFINER function
CREATE POLICY "Commission shares viewable by owner or recipient"
    ON public.commission_shares FOR SELECT
    USING (
        shared_with_broker_id = auth.uid()
        OR get_commission_owner(commission_id) = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Note: The policy "Brokers can view own or shared commissions" on `commission_records` 
-- does not require changes because it only queries `commission_shares` for `shared_with_broker_id` 
-- matching `auth.uid()`, which no longer triggers a cycle since `commission_shares` no 
-- longer directly queries `commission_records`.
