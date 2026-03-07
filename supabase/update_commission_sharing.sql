-- UPDATE COMMISSION SHARING — RLS + NOTIFICATIONS
-- Run this in the Supabase SQL Editor AFTER create_commissions.sql

-- ================================================================
-- 1. Update RLS on commission_records so recipients can view
--    records they have shares in
-- ================================================================
DROP POLICY IF EXISTS "Brokers can view own commissions" ON public.commission_records;

CREATE POLICY "Brokers can view own or shared commissions"
    ON public.commission_records FOR SELECT
    USING (
        broker_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.commission_shares
            WHERE commission_id = id AND shared_with_broker_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ================================================================
-- 2. Update RLS on commission_shares so recipients can view
--    their own shares
-- ================================================================
DROP POLICY IF EXISTS "Commission shares viewable by record owner" ON public.commission_shares;

CREATE POLICY "Commission shares viewable by owner or recipient"
    ON public.commission_shares FOR SELECT
    USING (
        shared_with_broker_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.commission_records
            WHERE id = commission_id AND broker_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ================================================================
-- 3. Create broker_notifications table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.broker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broker_notifications ENABLE ROW LEVEL SECURITY;

-- Brokers can view their own notifications
CREATE POLICY "Brokers can view own notifications"
    ON public.broker_notifications FOR SELECT
    USING (broker_id = auth.uid());

-- Any authenticated user can insert notifications (needed for share flow)
CREATE POLICY "Authenticated users can insert notifications"
    ON public.broker_notifications FOR INSERT
    WITH CHECK (true);

-- Brokers can update their own notifications (mark as read)
CREATE POLICY "Brokers can update own notifications"
    ON public.broker_notifications FOR UPDATE
    USING (broker_id = auth.uid());

-- Brokers can delete their own notifications
CREATE POLICY "Brokers can delete own notifications"
    ON public.broker_notifications FOR DELETE
    USING (broker_id = auth.uid());

-- ================================================================
-- 4. Verify
-- ================================================================
SELECT * FROM public.broker_notifications LIMIT 0;
