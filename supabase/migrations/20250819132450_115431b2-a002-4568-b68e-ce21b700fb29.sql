-- Create function to get total users count from auth.users
CREATE OR REPLACE FUNCTION public.get_total_users()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM auth.users
  WHERE deleted_at IS NULL;
$$;