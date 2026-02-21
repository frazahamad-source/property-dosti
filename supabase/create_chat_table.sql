-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL, -- Can be UUID or 'bot'
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;

-- Create Policies
CREATE POLICY "Users can view their own messages"
    ON public.chat_messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid()::text = receiver_id);

CREATE POLICY "Users can insert their own messages"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Expose to realtime
-- Note: This might fail if already added, but it's usually fine in Supabase SQL editor
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END $$;
