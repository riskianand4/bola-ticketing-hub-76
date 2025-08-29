import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useNewsInteractions = (newsId: string | undefined) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (newsId) {
      fetchStats();
      if (user) {
        checkUserLike();
      }
      trackView();
    }
  }, [newsId, user]);

  const fetchStats = async () => {
    if (!newsId) return;

    try {
      // Get views count
      const { count: viewsCount } = await supabase
        .from('news_views')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);

      // Get likes count
      const { count: likesCount } = await supabase
        .from('news_likes')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);

      setViews(viewsCount || 0);
      setLikes(likesCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserLike = async () => {
    if (!newsId || !user) return;

    try {
      const { data } = await supabase
        .from('news_likes')
        .select('id')
        .eq('news_id', newsId)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking user like:', error);
    }
  };

  const trackView = async () => {
    if (!newsId) return;

    // Check if this user/session already viewed this article today
    const sessionKey = `viewed_${newsId}_${new Date().toDateString()}`;
    const hasViewed = sessionStorage.getItem(sessionKey);
    
    // Only track if not viewed today
    if (hasViewed) {
      return;
    }

    try {
      // Check if user already viewed this article today in database
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingView } = await supabase
        .from('news_views')
        .select('id')
        .eq('news_id', newsId)
        .gte('created_at', today.toISOString())
        .eq('user_id', user?.id || null)
        .maybeSingle();

      if (existingView) {
        sessionStorage.setItem(sessionKey, 'true');
        return;
      }

      await supabase
        .from('news_views')
        .insert([{
          news_id: newsId,
          user_id: user?.id || null,
          ip_address: 'anonymous'
        }]);

      sessionStorage.setItem(sessionKey, 'true');
      setViews(prev => prev + 1);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const toggleLike = async () => {
    if (!newsId || !user) {
      toast.error('Anda harus login untuk memberikan like');
      return;
    }

    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('news_likes')
          .delete()
          .eq('news_id', newsId)
          .eq('user_id', user.id);

        setIsLiked(false);
        setLikes(prev => prev - 1);
      } else {
        // Add like
        await supabase
          .from('news_likes')
          .insert([{
            news_id: newsId,
            user_id: user.id
          }]);

        setIsLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Gagal memperbarui like');
    }
  };

  const shareNative = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Baca berita: ${title}`,
          url: url,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          fallbackShare(url);
        }
      }
    } else {
      fallbackShare(url);
    }
  };

  const fallbackShare = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link berhasil disalin!');
  };

  return {
    likes,
    views,
    isLiked,
    loading,
    toggleLike,
    shareNative
  };
};