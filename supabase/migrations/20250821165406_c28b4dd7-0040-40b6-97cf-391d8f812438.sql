-- Create merchandise orders table for payment tracking
CREATE TABLE public.merchandise_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  merchandise_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL, -- Price per item in cents
  total_amount INTEGER NOT NULL, -- Total amount in cents
  currency TEXT DEFAULT 'IDR',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
  payment_method TEXT,
  stripe_session_id TEXT UNIQUE,
  xendit_invoice_id TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merchandise_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for merchandise orders
CREATE POLICY "Users can view their own merchandise orders" 
ON public.merchandise_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merchandise orders" 
ON public.merchandise_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchandise orders" 
ON public.merchandise_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for edge functions to manage orders
CREATE POLICY "Allow edge functions to insert merchandise orders" 
ON public.merchandise_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow edge functions to update merchandise orders" 
ON public.merchandise_orders 
FOR UPDATE 
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_merchandise_orders_updated_at
BEFORE UPDATE ON public.merchandise_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();