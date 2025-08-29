-- Drop and recreate the function with debugging
DROP FUNCTION IF EXISTS public.authenticate_scanner_user(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_scanner_user(_username text, _password text)
RETURNS TABLE(id uuid, username text, full_name text, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Debug: Check what we're looking for
  RAISE NOTICE 'Looking for username: %, password: %', _username, _password;
  
  RETURN QUERY
  SELECT 
    su.id,
    su.username,
    su.full_name,
    su.is_active
  FROM public.scanner_users su
  WHERE su.username = _username 
    AND su.password_hash = _password
    AND su.is_active = true;
END;
$function$;

-- Test the function
SELECT * FROM public.authenticate_scanner_user('admin', 'admin123');