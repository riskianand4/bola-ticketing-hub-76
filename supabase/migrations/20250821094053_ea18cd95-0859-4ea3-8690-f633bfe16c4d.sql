-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the admin_create_scanner_user function to handle the gen_salt properly
CREATE OR REPLACE FUNCTION public.admin_create_scanner_user(_username text, _password text, _full_name text DEFAULT NULL::text)
RETURNS TABLE(success boolean, message text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.scanner_users WHERE username = _username) THEN
    RETURN QUERY SELECT false, 'Username sudah digunakan'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Insert new scanner user
  INSERT INTO public.scanner_users (username, password_hash, full_name)
  VALUES (_username, crypt(_password, gen_salt('bf')), _full_name)
  RETURNING id INTO new_user_id;
  
  RETURN QUERY SELECT true, 'Scanner user berhasil dibuat'::text, new_user_id;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT false, 'Username sudah digunakan'::text, NULL::uuid;
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error: ' || SQLERRM, NULL::uuid;
END;
$function$;

-- Create function to update scanner user
CREATE OR REPLACE FUNCTION public.admin_update_scanner_user(_user_id uuid, _username text, _full_name text DEFAULT NULL::text, _password text DEFAULT NULL::text, _is_active boolean DEFAULT NULL::boolean)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if caller is super admin
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN QUERY SELECT false, 'Unauthorized: Hanya super admin yang dapat mengubah scanner user'::text;
    RETURN;
  END IF;
  
  -- Check if scanner user exists
  IF NOT EXISTS (SELECT 1 FROM public.scanner_users WHERE id = _user_id) THEN
    RETURN QUERY SELECT false, 'Scanner user tidak ditemukan'::text;
    RETURN;
  END IF;
  
  -- Check username uniqueness if username is being changed
  IF EXISTS (SELECT 1 FROM public.scanner_users WHERE username = _username AND id != _user_id) THEN
    RETURN QUERY SELECT false, 'Username sudah digunakan'::text;
    RETURN;
  END IF;
  
  -- Update scanner user
  UPDATE public.scanner_users 
  SET 
    username = COALESCE(_username, username),
    full_name = COALESCE(_full_name, full_name),
    password_hash = CASE 
      WHEN _password IS NOT NULL THEN crypt(_password, gen_salt('bf'))
      ELSE password_hash 
    END,
    is_active = COALESCE(_is_active, is_active),
    updated_at = now()
  WHERE id = _user_id;
  
  RETURN QUERY SELECT true, 'Scanner user berhasil diperbarui'::text;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT false, 'Username sudah digunakan'::text;
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error: ' || SQLERRM;
END;
$function$;

-- Create function to delete scanner user
CREATE OR REPLACE FUNCTION public.admin_delete_scanner_user(_user_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if caller is super admin
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN QUERY SELECT false, 'Unauthorized: Hanya super admin yang dapat menghapus scanner user'::text;
    RETURN;
  END IF;
  
  -- Check if scanner user exists
  IF NOT EXISTS (SELECT 1 FROM public.scanner_users WHERE id = _user_id) THEN
    RETURN QUERY SELECT false, 'Scanner user tidak ditemukan'::text;
    RETURN;
  END IF;
  
  -- Delete scanner user
  DELETE FROM public.scanner_users WHERE id = _user_id;
  
  RETURN QUERY SELECT true, 'Scanner user berhasil dihapus'::text;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error: ' || SQLERRM;
END;
$function$;