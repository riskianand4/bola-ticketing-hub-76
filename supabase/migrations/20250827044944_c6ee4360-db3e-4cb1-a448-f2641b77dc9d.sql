-- Create news views tracking table
CREATE TABLE public.news_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL,
  user_id UUID NULL, -- nullable for anonymous views
  ip_address TEXT NULL, -- for anonymous tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news likes tracking table  
CREATE TABLE public.news_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL,
  user_id UUID NOT NULL, -- only logged in users can like
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id) -- prevent duplicate likes
);

-- Enable RLS
ALTER TABLE public.news_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_views
CREATE POLICY "Anyone can insert views" ON public.news_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view views" ON public.news_views
FOR SELECT USING (true);

-- RLS Policies for news_likes
CREATE POLICY "Authenticated users can like" ON public.news_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.news_likes
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes" ON public.news_likes
FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_news_views_news_id ON public.news_views(news_id);
CREATE INDEX idx_news_likes_news_id ON public.news_likes(news_id);
CREATE INDEX idx_news_views_created_at ON public.news_views(created_at);
CREATE INDEX idx_news_likes_created_at ON public.news_likes(created_at);

-- Create function to get news statistics
CREATE OR REPLACE FUNCTION public.get_news_statistics()
RETURNS TABLE(
  news_id UUID,
  title TEXT,
  total_views BIGINT,
  total_likes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    n.id as news_id,
    n.title,
    COALESCE(v.view_count, 0) as total_views,
    COALESCE(l.like_count, 0) as total_likes,
    n.created_at
  FROM public.news n
  LEFT JOIN (
    SELECT news_id, COUNT(*) as view_count 
    FROM public.news_views 
    GROUP BY news_id
  ) v ON n.id = v.news_id
  LEFT JOIN (
    SELECT news_id, COUNT(*) as like_count 
    FROM public.news_likes 
    GROUP BY news_id
  ) l ON n.id = l.news_id
  WHERE n.published = true
  ORDER BY total_views DESC, total_likes DESC;
$$;