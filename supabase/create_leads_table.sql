-- Create property_leads table
CREATE TABLE property_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    broker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'new'
);

-- Enable RLS
ALTER TABLE property_leads ENABLE ROW LEVEL SECURITY;

-- Policies for property_leads
CREATE POLICY "Anyone can insert leads" ON property_leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Brokers can view leads for their properties" ON property_leads
    FOR SELECT USING (auth.uid() = broker_id);

CREATE POLICY "Admins can view all leads" ON property_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
