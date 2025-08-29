-- Add missing category column to news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Berita';

-- Drop and recreate the news statistics function with updated return type
DROP FUNCTION IF EXISTS public.get_news_statistics();

CREATE OR REPLACE FUNCTION public.get_news_statistics()
RETURNS TABLE(
  news_id UUID,
  title TEXT,
  total_views BIGINT,
  total_likes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  category TEXT
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
    n.created_at,
    COALESCE(n.category, 'Berita') as category
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