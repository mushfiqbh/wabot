CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS bkash_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_token TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed with a row if not exists to make update easier, or we handles it in code
-- Alternatively, just insert/update the first row.