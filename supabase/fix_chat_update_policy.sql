-- Add UPDATE policy for chat_messages to allow marking as read
CREATE POLICY "Users can update their own received messages"
    ON public.chat_messages
    FOR UPDATE
    USING (auth.uid()::text = receiver_id);
