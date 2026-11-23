-- Keep retrying messages out of the ready queue until their backoff expires.
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_pending_next_attempt
    ON public.messages(status, next_attempt_at, created_at);
