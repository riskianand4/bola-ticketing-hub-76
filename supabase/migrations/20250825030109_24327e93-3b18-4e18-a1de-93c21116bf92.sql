-- Create promo codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  promo_type TEXT NOT NULL CHECK (promo_type IN ('ticket', 'merchandise', 'both')),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND valid_until >= now());

-- Create function to update updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to validate and apply promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  _code TEXT,
  _promo_type TEXT,
  _purchase_amount NUMERIC
)
RETURNS TABLE(
  valid BOOLEAN,
  message TEXT,
  discount_amount NUMERIC,
  promo_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  promo_record RECORD;
  calculated_discount NUMERIC;
BEGIN
  -- Get promo code details
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE code = _code
    AND is_active = true
    AND valid_from <= now()
    AND valid_until >= now()
    AND (promo_type = _promo_type OR promo_type = 'both');
  
  -- Check if promo code exists and is valid
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Kode promo tidak valid atau sudah kadaluarsa'::text, 0::numeric, NULL::uuid;
    RETURN;
  END IF;
  
  -- Check minimum purchase amount
  IF promo_record.min_purchase_amount > 0 AND _purchase_amount < promo_record.min_purchase_amount THEN
    RETURN QUERY SELECT false, 
      'Minimum pembelian untuk kode promo ini adalah Rp ' || promo_record.min_purchase_amount::text,
      0::numeric, NULL::uuid;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF promo_record.usage_limit IS NOT NULL AND promo_record.used_count >= promo_record.usage_limit THEN
    RETURN QUERY SELECT false, 'Kode promo sudah mencapai batas penggunaan'::text, 0::numeric, NULL::uuid;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF promo_record.discount_type = 'percentage' THEN
    calculated_discount := (_purchase_amount * promo_record.discount_value / 100);
  ELSE
    calculated_discount := promo_record.discount_value;
  END IF;
  
  -- Apply max discount limit if set
  IF promo_record.max_discount_amount IS NOT NULL AND calculated_discount > promo_record.max_discount_amount THEN
    calculated_discount := promo_record.max_discount_amount;
  END IF;
  
  -- Ensure discount doesn't exceed purchase amount
  IF calculated_discount > _purchase_amount THEN
    calculated_discount := _purchase_amount;
  END IF;
  
  RETURN QUERY SELECT true, 'Kode promo berhasil diterapkan'::text, calculated_discount, promo_record.id;
END;
$$;

-- Create function to increment promo code usage
CREATE OR REPLACE FUNCTION public.increment_promo_usage(_promo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.promo_codes
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = _promo_id;
END;
$$;