-- Create packages if we want to store them, but user specified two specific ones.
-- For simplicity, we can just manage them in code or create a table.
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.packages(id),
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ledger table for accounting
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL, -- Positive for credit, Negative for debit
    type TEXT NOT NULL, -- e.g., 'subscription_payment', 'top_up', 'refund'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON public.subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_ledger_client_id ON public.ledger(client_id);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view packages" ON public.packages FOR SELECT USING (true);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = public.subscriptions.client_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = client_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = client_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own ledger" ON public.ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = public.ledger.client_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own ledger" ON public.ledger
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = client_id
            AND user_id = auth.uid()
        )
    );
