-- Drop and recreate pgcrypto extension to ensure it's properly loaded
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto;

-- Test that crypt functions work
SELECT crypt('test', gen_salt('bf')) as test_hash;

-- Create a test scanner user with proper password hashing
INSERT INTO public.scanner_users (username, password_hash, full_name, is_active)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'Admin User', true)
ON CONFLICT (username) DO UPDATE SET 
  password_hash = crypt('admin123', gen_salt('bf')),
  full_name = 'Admin User',
  is_active = true;

-- Recreate the authenticate function
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