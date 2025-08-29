-- Fix Function Search Path Mutable security warning
-- Update all functions to have proper search_path settings

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Fix get_total_users function
CREATE OR REPLACE FUNCTION public.get_total_users()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM auth.users
  WHERE deleted_at IS NULL;
$function$;

-- Fix admin_list_users function
CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.id, u.email, u.created_at
  FROM auth.users u
  WHERE has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role);
$function$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix scan_ticket function
CREATE OR REPLACE FUNCTION public.scan_ticket(_ticket_order_id uuid, _scanner_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(success boolean, message text, ticket_info jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ticket_order_record RECORD;
  ticket_record RECORD;
  match_record RECORD;
  scan_count integer;
BEGIN
  -- Check if ticket order exists
  SELECT * INTO ticket_order_record
  FROM public.ticket_orders
  WHERE id = _ticket_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Tiket tidak ditemukan'::text, NULL::jsonb;
    RETURN;
  END IF;
  
  -- Check payment status
  IF ticket_order_record.payment_status != 'completed' THEN
    RETURN QUERY SELECT false, 'Tiket belum dibayar'::text, NULL::jsonb;
    RETURN;
  END IF;
  
  -- Get ticket details
  SELECT * INTO ticket_record
  FROM public.tickets
  WHERE id = ticket_order_record.ticket_id;
  
  -- Get match details
  SELECT * INTO match_record
  FROM public.matches
  WHERE id = ticket_record.match_id;
  
  -- Check if match has expired (assuming match_date is the expiry)
  IF match_record.match_date < NOW() THEN
    RETURN QUERY SELECT false, 'Tiket sudah kadaluarsa'::text, 
      jsonb_build_object(
        'customer_name', ticket_order_record.customer_name,
        'ticket_type', ticket_record.ticket_type,
        'match_info', match_record.home_team || ' vs ' || match_record.away_team,
        'match_date', match_record.match_date,
        'quantity', ticket_order_record.quantity
      );
    RETURN;
  END IF;
  
  -- Check if already scanned
  SELECT COUNT(*) INTO scan_count
  FROM public.ticket_scans
  WHERE ticket_order_id = _ticket_order_id;
  
  IF scan_count > 0 THEN
    RETURN QUERY SELECT false, 'Tiket sudah pernah di-scan sebelumnya'::text,
      jsonb_build_object(
        'customer_name', ticket_order_record.customer_name,
        'ticket_type', ticket_record.ticket_type,
        'match_info', match_record.home_team || ' vs ' || match_record.away_team,
        'match_date', match_record.match_date,
        'quantity', ticket_order_record.quantity
      );
    RETURN;
  END IF;
  
  -- Insert scan record
  INSERT INTO public.ticket_scans (ticket_order_id, scanner_user_id)
  VALUES (_ticket_order_id, _scanner_user_id);
  
  -- Return success
  RETURN QUERY SELECT true, 'Tiket berhasil di-scan'::text,
    jsonb_build_object(
      'customer_name', ticket_order_record.customer_name,
      'ticket_type', ticket_record.ticket_type,
      'match_info', match_record.home_team || ' vs ' || match_record.away_team,
      'match_date', match_record.match_date,
      'quantity', ticket_order_record.quantity,
      'scanned_at', NOW()
    );
END;
$function$;

-- Fix authenticate_scanner_user function
CREATE OR REPLACE FUNCTION public.authenticate_scanner_user(_username text, _password text)
 RETURNS TABLE(id uuid, username text, full_name text, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify using bcrypt: hash(_password, stored_salt) must equal stored hash
  RETURN QUERY
  SELECT 
    su.id,
    su.username,
    su.full_name,
    su.is_active
  FROM public.scanner_users su
  WHERE su.username = _username
    AND su.is_active = true
    AND su.password_hash = crypt(_password, su.password_hash);
END;
$function$;

-- Move pgcrypto extension to extensions schema (if not already there)
-- This addresses the "Extension in Public" warning
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Move extension to extensions schema
        CREATE SCHEMA IF NOT EXISTS extensions;
        ALTER EXTENSION pgcrypto SET SCHEMA extensions;
        
        -- Update function references to use the new schema
        UPDATE pg_proc SET pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'extensions')
        WHERE proname IN ('crypt', 'gen_salt') AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        RAISE NOTICE 'Moved pgcrypto extension to extensions schema';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not move pgcrypto extension: %', SQLERRM;
END $$;