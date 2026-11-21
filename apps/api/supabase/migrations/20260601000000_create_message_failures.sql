-- Structured failure log for message sends
CREATE TABLE IF NOT EXISTS public.message_failures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    number TEXT,
    error_message TEXT NOT NULL,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    stage TEXT, -- e.g. 'send', 'connection_timeout', 'status_update'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast "recent failures" lookups per client
CREATE INDEX IF NOT EXISTS idx_message_failures_client_created_at
    ON public.message_failures(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_failures_message_id
    ON public.message_failures(message_id);

-- Enable RLS
ALTER TABLE public.message_failures ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own failures
CREATE POLICY "Users can view own message failures" ON public.message_failures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = public.message_failures.client_id
            AND user_id = auth.uid()
        )
    );

-- Service role bypasses RLS so the worker can insert rows.
