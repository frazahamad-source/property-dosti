-- This adds the missing UPDATE policy to the property_leads table
-- Without this, brokers cannot mark their leads as 'read' because Supabase RLS silently blocks the update

CREATE POLICY "Brokers can update their leads" ON property_leads
    FOR UPDATE USING (auth.uid() = broker_id);
