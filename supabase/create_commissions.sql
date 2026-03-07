-- COMMISSION & SHARING TABLES
-- Run this in the Supabase SQL Editor

-- 1. Commission Records
CREATE TABLE IF NOT EXISTS public.commission_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('property_dosti', 'outside')),
    property_id_label TEXT NOT NULL,
    linked_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    deal_value NUMERIC NOT NULL DEFAULT 0,
    commission_total NUMERIC NOT NULL DEFAULT 0,
    tds_amount NUMERIC NOT NULL DEFAULT 0,
    commission_earned NUMERIC GENERATED ALWAYS AS (commission_total - tds_amount) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Commission Shares
CREATE TABLE IF NOT EXISTS public.commission_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES public.commission_records(id) ON DELETE CASCADE NOT NULL,
    shared_with_broker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_shares ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for commission_records
CREATE POLICY "Brokers can view own commissions"
    ON public.commission_records FOR SELECT
    USING (broker_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    ));

CREATE POLICY "Brokers can insert own commissions"
    ON public.commission_records FOR INSERT
    WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update own commissions"
    ON public.commission_records FOR UPDATE
    USING (broker_id = auth.uid());

CREATE POLICY "Brokers can delete own commissions"
    ON public.commission_records FOR DELETE
    USING (broker_id = auth.uid());

-- 5. RLS Policies for commission_shares
CREATE POLICY "Commission shares viewable by record owner"
    ON public.commission_shares FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.commission_records
            WHERE id = commission_id AND broker_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Brokers can insert shares for own commissions"
    ON public.commission_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.commission_records
            WHERE id = commission_id AND broker_id = auth.uid()
        )
    );

CREATE POLICY "Brokers can update shares for own commissions"
    ON public.commission_shares FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.commission_records
            WHERE id = commission_id AND broker_id = auth.uid()
        )
    );

CREATE POLICY "Brokers can delete shares for own commissions"
    ON public.commission_shares FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.commission_records
            WHERE id = commission_id AND broker_id = auth.uid()
        )
    );

-- 6. Verify
SELECT * FROM public.commission_records LIMIT 0;
SELECT * FROM public.commission_shares LIMIT 0;
