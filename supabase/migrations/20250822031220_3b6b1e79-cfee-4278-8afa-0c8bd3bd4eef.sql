-- Fix scanner login: use proper bcrypt verification and remove sensitive logging
CREATE OR REPLACE FUNCTION public.authenticate_scanner_user(_username text, _password text)
RETURNS TABLE(id uuid, username text, full_name text, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify using bcrypt: hash(_password, stored_salt) must equal stored hash
  RETURN QUERY
  SELECT 
    su.id,
    su.username,
    su.full_name,
    su.is_active
  FROM public.scanner_users su
  WHERE su.username = _username
    AND su.is_active = true
    AND su.password_hash = crypt(_password, su.password_hash);
END;
$function$;