-- Fix search_path for the functions created earlier
DROP FUNCTION IF EXISTS public.authenticate_scanner_user(text, text);
DROP FUNCTION IF EXISTS public.scan_ticket(uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_create_scanner_user(text, text, text);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.authenticate_scanner_user(
  _username text,
  _password text
)
RETURNS TABLE(
  id uuid,
  username text,
  full_name text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.scan_ticket(
  _ticket_order_id uuid,
  _scanner_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  message text,
  ticket_info jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.admin_create_scanner_user(
  _username text,
  _password text,
  _full_name text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  message text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Insert new scanner user
  INSERT INTO public.scanner_users (username, password_hash, full_name)
  VALUES (_username, crypt(_password, gen_salt('bf')), _full_name)
  RETURNING id INTO new_user_id;
  
  RETURN QUERY SELECT true, 'Scanner user created successfully'::text, new_user_id;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT false, 'Username already exists'::text, NULL::uuid;
END;
$$;