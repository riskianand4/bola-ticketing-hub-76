-- Update the scanner user with a fresh password hash
UPDATE public.scanner_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin';

-- Test the authentication function
SELECT public.authenticate_scanner_user('admin', 'admin123');