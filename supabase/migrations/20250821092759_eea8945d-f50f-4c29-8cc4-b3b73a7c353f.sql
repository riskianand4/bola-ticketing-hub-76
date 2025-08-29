-- Create admin function to delete users (super admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only super admin can delete users';
  END IF;
  
  -- Delete user profile first
  DELETE FROM public.profiles WHERE user_id = _user_id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Delete user from auth (this will cascade to other tables)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;