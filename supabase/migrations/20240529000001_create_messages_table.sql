-- Create messages table for queuing
CREATE TABLE IF NOT EXISTS public.wa_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.wa_clients(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for the worker to find pending messages efficiently
CREATE INDEX IF NOT EXISTS idx_wa_messages_status_created_at ON public.wa_messages(status, created_at);
CREATE INDEX IF NOT EXISTS idx_wa_messages_client_id ON public.wa_messages(client_id);

-- Enable RLS
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own messages
CREATE POLICY "Users can view own messages" ON public.wa_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wa_clients
            WHERE id = public.wa_messages.client_id
            AND user_id = auth.uid()
        )
    );
