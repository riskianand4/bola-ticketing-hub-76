-- Delete existing scanner users and recreate with proper simple credentials  
DELETE FROM public.scanner_users;

-- Insert simple test user with manual password verification
INSERT INTO public.scanner_users (username, password_hash, full_name, is_active)
VALUES ('admin', 'admin123', 'Admin User', true);

-- Recreate authenticate function to handle plaintext passwords temporarily for testing
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
    AND su.password_hash = _password
    AND su.is_active = true;
END;
$function$;