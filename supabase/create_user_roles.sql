-- CREATE USER ROLES TABLE FOR MANAGER/SUPERVISOR ROLE MANAGEMENT
-- Run this in the Supabase SQL Editor

-- 1. Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'supervisor')),
    can_view_leads BOOLEAN DEFAULT FALSE,
    can_reply_chats BOOLEAN DEFAULT FALSE,
    can_change_logo BOOLEAN DEFAULT FALSE,
    can_edit_footer BOOLEAN DEFAULT FALSE,
    can_approve_brokers BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Everyone can read roles (needed for UI checks)
CREATE POLICY "User roles are viewable by everyone"
    ON public.user_roles FOR SELECT
    USING (true);

-- Only admins can insert roles
CREATE POLICY "Admins can insert user roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Only admins can update roles
CREATE POLICY "Admins can update user roles"
    ON public.user_roles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Only admins can delete roles
CREATE POLICY "Admins can delete user roles"
    ON public.user_roles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 4. Verify
SELECT * FROM public.user_roles;
