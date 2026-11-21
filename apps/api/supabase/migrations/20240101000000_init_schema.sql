-- Enable pgcrypto for gen_random_uuid and gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create clients table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT, -- Admin/Client phone
    api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'base64'),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sessions table to store WhatsApp authentication state
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores creds and keys
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own client record
CREATE POLICY "Users can view own client record" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);

-- Index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON public.clients(api_key);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

