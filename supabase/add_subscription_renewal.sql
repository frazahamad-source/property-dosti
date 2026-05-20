-- =========================================================================
-- PROPERTY DOSTI – SUBSCRIPTION RENEWAL SYSTEM DATABASE MIGRATION
-- =========================================================================
-- Run this script inside the Supabase SQL Editor.
-- This script configures the databases, foreign keys, and Row Level Security.

-- 1. Ensure profiles table has subscription_expiry column
-- (In your existing setup.sql, subscription_expiry exists. This acts as a safe fallback)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ DEFAULT NOW();

-- 2. Create 'renewal_requests' table (Intimation requests from agents)
CREATE TABLE IF NOT EXISTS public.renewal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT, -- Notes or descriptions from the agent
    rejection_reason TEXT, -- Populated if disapproved by admin
    screenshot_url TEXT, -- In case agent uploads receipt screenshots
    intimated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id) -- Admin account who resolved it
);

-- 3. Create 'subscriptions' table (Payment & Manual override history ledger)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('payment', 'override')),
    reason TEXT, -- Detailed reason (standard renewal or custom manual justification)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create 'admin_logs' table (Audit trail of administrative actions)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    target_agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approve_renewal', 'reject_renewal', 'manual_override')),
    details JSONB NOT NULL, -- e.g. { previous_expiry, new_expiry, reason, amount, request_id }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) for all new tables
ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS SECURITY POLICIES
-- =========================================================================

-- --- renewal_requests Policies ---
DROP POLICY IF EXISTS "Agents can view their own requests." ON public.renewal_requests;
CREATE POLICY "Agents can view their own requests."
    ON public.renewal_requests FOR SELECT
    USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents can submit their own requests." ON public.renewal_requests;
CREATE POLICY "Agents can submit their own requests."
    ON public.renewal_requests FOR INSERT
    WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Admins have full access to renewal requests." ON public.renewal_requests;
CREATE POLICY "Admins have full access to renewal requests."
    ON public.renewal_requests FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- --- subscriptions Policies ---
DROP POLICY IF EXISTS "Agents can view their own subscription history." ON public.subscriptions;
CREATE POLICY "Agents can view their own subscription history."
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Admins have full access to subscriptions history." ON public.subscriptions;
CREATE POLICY "Admins have full access to subscriptions history."
    ON public.subscriptions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- --- admin_logs Policies ---
DROP POLICY IF EXISTS "Admins can view audit logs." ON public.admin_logs;
CREATE POLICY "Admins can view audit logs."
    ON public.admin_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Admins can write audit logs." ON public.admin_logs;
CREATE POLICY "Admins can write audit logs."
    ON public.admin_logs FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
