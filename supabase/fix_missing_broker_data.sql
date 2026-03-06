-- =============================================
-- Fix missing referral_code and unique_broker_id
-- for brokers that have NULL values
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Generate referral_code for brokers that don't have one
UPDATE public.profiles
SET referral_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
WHERE referral_code IS NULL
  AND role = 'broker';

-- 2. Generate unique_broker_id for brokers that don't have one
UPDATE public.profiles
SET unique_broker_id = 'PD-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
WHERE unique_broker_id IS NULL
  AND role = 'broker';

-- 3. Verify the fix
SELECT name, email, designation, referral_code, unique_broker_id, subscription_expiry
FROM public.profiles
WHERE role = 'broker';
