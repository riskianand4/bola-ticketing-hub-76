-- Drop and recreate the authenticate_scanner_user function to ensure it works properly
DROP FUNCTION IF EXISTS public.authenticate_scanner_user(text, text);

-- Recreate the function with proper crypt usage
CREATE OR REPLACE FUNCTION public.authenticate_scanner_user(_username text, _password text)
RETURNS TABLE(id uuid, username text, full_name text, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.authenticate_scanner_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.authenticate_scanner_user(text, text) TO authenticated;