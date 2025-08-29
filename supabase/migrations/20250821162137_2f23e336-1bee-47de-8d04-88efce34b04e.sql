-- Create a simple test scanner user with plaintext password for testing
DELETE FROM public.scanner_users WHERE username = 'test';
INSERT INTO public.scanner_users (username, password_hash, full_name, is_active)
VALUES ('test', crypt('123', gen_salt('bf')), 'Test User', true);

-- Test with the simple password
SELECT * FROM public.authenticate_scanner_user('test', '123');