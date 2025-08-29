-- Function to clean up duplicate roles and keep only the highest priority role per user
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_record RECORD;
    highest_role app_role;
BEGIN
    -- Loop through all users who have multiple roles
    FOR user_record IN 
        SELECT user_id, COUNT(*) as role_count
        FROM public.user_roles 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
    LOOP
        -- Get the highest priority role for this user
        SELECT role INTO highest_role
        FROM public.user_roles 
        WHERE user_id = user_record.user_id
        ORDER BY 
            CASE 
                WHEN role = 'super_admin' THEN 1
                WHEN role = 'admin' THEN 2
                WHEN role = 'user' THEN 3
            END
        LIMIT 1;
        
        -- Delete all roles for this user
        DELETE FROM public.user_roles WHERE user_id = user_record.user_id;
        
        -- Insert only the highest priority role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_record.user_id, highest_role);
        
        RAISE NOTICE 'Cleaned up roles for user %. Kept role: %', user_record.user_id, highest_role;
    END LOOP;
END;
$$;

-- Execute the cleanup function
SELECT public.cleanup_duplicate_roles();

-- Update the get_user_role function to ensure it always returns the correct single role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE 
      WHEN role = 'super_admin' THEN 1
      WHEN role = 'admin' THEN 2
      WHEN role = 'user' THEN 3
    END
  LIMIT 1
$$;

-- Create a trigger to prevent duplicate roles from being created
CREATE OR REPLACE FUNCTION public.prevent_duplicate_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Delete any existing roles for this user before inserting the new one
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS prevent_duplicate_roles_trigger ON public.user_roles;
CREATE TRIGGER prevent_duplicate_roles_trigger
    BEFORE INSERT ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_duplicate_roles();