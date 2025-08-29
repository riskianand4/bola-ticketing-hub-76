-- Add media_type column to gallery table to distinguish between photos and videos
ALTER TABLE public.gallery ADD COLUMN media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video'));

-- Add video-specific fields
ALTER TABLE public.gallery ADD COLUMN video_url TEXT;
ALTER TABLE public.gallery ADD COLUMN thumbnail_url TEXT;
ALTER TABLE public.gallery ADD COLUMN duration TEXT; -- Format: "MM:SS"

-- Create website_visitors table for tracking website visits
CREATE TABLE public.website_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_ip TEXT,
  user_agent TEXT,
  page_path TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for website_visitors
ALTER TABLE public.website_visitors ENABLE ROW LEVEL SECURITY;

-- Create policy for website visitors (admins only can read)
CREATE POLICY "Admins can view website visitors" 
ON public.website_visitors 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create policy for anyone to insert visit records (public access needed for tracking)
CREATE POLICY "Anyone can insert visit records" 
ON public.website_visitors 
FOR INSERT 
WITH CHECK (true);

-- Update existing gallery items to be photos by default
UPDATE public.gallery SET media_type = 'photo' WHERE media_type IS NULL;