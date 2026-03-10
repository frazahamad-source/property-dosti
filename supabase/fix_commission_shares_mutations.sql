-- FIX INFINITE RECURSION IN COMMISSION SHARES MUTATIONS
-- Run this in the Supabase SQL Editor

-- The previous fix address the SELECT policy, but the INSERT/UPDATE/DELETE 
-- policies were still using the nested query causing infinite recursion 
-- during save. This file applies the SECURITY DEFINER function to all policies.

-- Ensure the function exists (just in case)
CREATE OR REPLACE FUNCTION public.get_commission_owner(target_commission_id UUID)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT broker_id FROM public.commission_records WHERE id = target_commission_id;
$$;

-- Drop the old recursive mutation policies
DROP POLICY IF EXISTS "Brokers can insert shares for own commissions" ON public.commission_shares;
DROP POLICY IF EXISTS "Brokers can update shares for own commissions" ON public.commission_shares;
DROP POLICY IF EXISTS "Brokers can delete shares for own commissions" ON public.commission_shares;

-- Recreate policies using the secure wrapper function
CREATE POLICY "Brokers can insert shares for own commissions"
    ON public.commission_shares FOR INSERT
    WITH CHECK (
        public.get_commission_owner(commission_id) = auth.uid()
    );

CREATE POLICY "Brokers can update shares for own commissions"
    ON public.commission_shares FOR UPDATE
    USING (
        public.get_commission_owner(commission_id) = auth.uid()
    );

CREATE POLICY "Brokers can delete shares for own commissions"
    ON public.commission_shares FOR DELETE
    USING (
        public.get_commission_owner(commission_id) = auth.uid()
    );
