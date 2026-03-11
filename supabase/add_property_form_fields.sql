-- 1. Drop existing check constraint and recreate it to include new transaction types
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_type_check;

ALTER TABLE public.properties ADD CONSTRAINT properties_type_check 
CHECK (type IN ('sale', 'rent', 'lease', 'joint_venture'));

-- 2. Add new columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS area_of_villa DECIMAL,
ADD COLUMN IF NOT EXISTS villa_type TEXT,
ADD COLUMN IF NOT EXISTS any_structure BOOLEAN,
ADD COLUMN IF NOT EXISTS structure_category TEXT,
ADD COLUMN IF NOT EXISTS structure_specification TEXT,
ADD COLUMN IF NOT EXISTS advance_amount NUMERIC,
ADD COLUMN IF NOT EXISTS sharing_ratio TEXT,
ADD COLUMN IF NOT EXISTS goodwill_amount NUMERIC;

-- 3. Create Villa Types Config Table
CREATE TABLE IF NOT EXISTS public.villa_types_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on new table
ALTER TABLE public.villa_types_config ENABLE ROW LEVEL SECURITY;

-- 5. Add Policies for Villa Types Config
CREATE POLICY "Public villa types are viewable by everyone" ON public.villa_types_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage villa types" ON public.villa_types_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 6. Seed Initial Data
INSERT INTO public.villa_types_config (name) VALUES
('1 BHK'),
('2 BHK'),
('3 BHK'),
('4 BHK'),
('3 BHK Duplex'),
('4 BHK Duplex')
ON CONFLICT (name) DO NOTHING;
