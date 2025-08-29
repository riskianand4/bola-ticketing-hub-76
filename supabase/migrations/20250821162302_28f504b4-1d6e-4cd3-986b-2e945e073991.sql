-- Update the admin user password to plaintext for testing
UPDATE public.scanner_users 
SET password_hash = 'admin123'
WHERE username = 'admin';