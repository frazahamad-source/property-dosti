-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Delete any existing policies to avoid conflicts
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Brokers can view their own referrals') THEN
        DROP POLICY "Brokers can view their own referrals" ON public.referrals;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can view all referrals') THEN
        DROP POLICY "Admins can view all referrals" ON public.referrals;
    END IF;
END $$;

-- Policy: Brokers can view their own referrals
CREATE POLICY "Brokers can view their own referrals" 
ON public.referrals 
FOR SELECT 
TO authenticated 
USING (auth.uid() = referring_broker_id);

-- Policy: Admins can view all referrals (if you have an is_admin column in profiles)
CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);
