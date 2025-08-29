-- Ensure pgcrypto extension is properly enabled and accessible
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update authenticate_scanner_user function to properly use crypt
CREATE OR REPLACE FUNCTION public.authenticate_scanner_user(_username text, _password text)
RETURNS TABLE(id uuid, username text, full_name text, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if pgcrypto extension is available
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension is not available';
  END IF;

  RETURN QUERY
  SELECT 
    su.id,
    su.username,
    su.full_name,
    su.is_active
  FROM public.scanner_users su
  WHERE su.username = _username 
    AND su.password_hash = crypt(_password, su.password_hash)
    AND su.is_active = true;
END;
$function$;