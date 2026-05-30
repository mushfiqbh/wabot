-- Function to rotate API key for the current authenticated user
CREATE OR REPLACE FUNCTION rotate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_key TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate a new 24-byte random key encoded in base64
    new_key := encode(gen_random_bytes(24), 'base64');

    -- Update the client record for the current user
    UPDATE public.wa_clients
    SET api_key = new_key,
        updated_at = now()
    WHERE user_id = auth.uid();

    -- Return the new key
    RETURN new_key;
END;
$$;
