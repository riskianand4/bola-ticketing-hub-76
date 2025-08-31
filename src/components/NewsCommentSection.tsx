import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Reply, Flag, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  news_id: string;
  parent_id?: string;
  likes_count: number;
  is_liked: boolean;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface NewsCommentSectionProps {
  newsId: string;
}

export function NewsCommentSection({ newsId }: NewsCommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [newsId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Fetch top-level comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('news_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          news_id,
          parent_id
        `)
        .eq('news_id', newsId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment) => {
          // Get profile data for comment
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', comment.user_id)
            .maybeSingle();

          const { data: repliesData } = await supabase
            .from('news_comments')
            .select(`
              id,
              content,
              created_at,
              user_id,
              news_id,
              parent_id
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          // Get likes count for comment
          const { count: likesCount } = await supabase
            .from('news_comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          // Check if current user liked this comment
          let isLiked = false;
          if (user) {
            const { data: userLike } = await supabase
              .from('news_comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isLiked = !!userLike;
          }

          // Process replies with likes
          const repliesWithLikes = await Promise.all(
            (repliesData || []).map(async (reply) => {
              // Get profile data for reply
              const { data: replyProfileData } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', reply.user_id)
                .maybeSingle();

              const { count: replyLikesCount } = await supabase
                .from('news_comment_likes')
                .select('*', { count: 'exact', head: true })
                .eq('comment_id', reply.id);

              let isReplyLiked = false;
              if (user) {
                const { data: userReplyLike } = await supabase
                  .from('news_comment_likes')
                  .select('id')
                  .eq('comment_id', reply.id)
                  .eq('user_id', user.id)
                  .maybeSingle();
                isReplyLiked = !!userReplyLike;
              }

              return {
                ...reply,
                likes_count: replyLikesCount || 0,
                is_liked: isReplyLiked,
                profiles: {
                  full_name: replyProfileData?.full_name || 'Anonymous',
                  avatar_url: replyProfileData?.avatar_url
                }
              };
            })
          );

          return {
            ...comment,
            likes_count: likesCount || 0,
            is_liked: isLiked,
            replies: repliesWithLikes,
            profiles: {
              full_name: profileData?.full_name || 'Anonymous',
              avatar_url: profileData?.avatar_url
            }
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Gagal memuat komentar');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Anda harus login untuk berkomentar');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Komentar tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    try {
      const { data: newCommentData, error } = await supabase
        .from('news_comments')
        .insert([{
          news_id: newsId,
          user_id: user.id,
          content: newComment.trim()
        }])
        .select(`
          id,
          content,
          created_at,
          user_id,
          news_id,
          parent_id
        `)
        .single();

      if (error) {
        console.error('Error submitting comment:', error);
        toast.error('Gagal menambahkan komentar');
        return;
      }

      // Get user profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const commentWithLikes = {
        ...newCommentData,
        likes_count: 0,
        is_liked: false,
        replies: [],
        profiles: {
          full_name: profileData?.full_name || 'Anonymous',
          avatar_url: profileData?.avatar_url
        }
      };

      setComments(prev => [commentWithLikes, ...prev]);
      setNewComment('');
      toast.success('Komentar berhasil ditambahkan');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Gagal menambahkan komentar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Anda harus login untuk membalas');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Balasan tidak boleh kosong');
      return;
    }

    try {
      const { data: newReplyData, error } = await supabase
        .from('news_comments')
        .insert([{
          news_id: newsId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        }])
        .select(`
          id,
          content,
          created_at,
          user_id,
          news_id,
          parent_id
        `)
        .single();

      if (error) {
        console.error('Error submitting reply:', error);
        toast.error('Gagal menambahkan balasan');
        return;
      }

      // Get user profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const replyWithLikes = {
        ...newReplyData,
        likes_count: 0,
        is_liked: false,
        profiles: {
          full_name: profileData?.full_name || 'Anonymous',
          avatar_url: profileData?.avatar_url
        }
      };

      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), replyWithLikes] }
          : comment
      ));
      
      setReplyContent('');
      setReplyTo(null);
      toast.success('Balasan berhasil ditambahkan');
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Gagal menambahkan balasan');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Anda harus login untuk memberikan like');
      return;
    }

    try {
      // Check if user already liked this comment
      const { data: existingLike } = await supabase
        .from('news_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Remove like
        await supabase
          .from('news_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        // Update local state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: false,
              likes_count: comment.likes_count - 1
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId 
                  ? { ...reply, is_liked: false, likes_count: reply.likes_count - 1 }
                  : reply
              )
            };
          }
          return comment;
        }));
      } else {
        // Add like
        await supabase
          .from('news_comment_likes')
          .insert([{
            comment_id: commentId,
            user_id: user.id
          }]);

        // Update local state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: true,
              likes_count: comment.likes_count + 1
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId 
                  ? { ...reply, is_liked: true, likes_count: reply.likes_count + 1 }
                  : reply
              )
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Gagal memperbarui like');
    }
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex space-x-3 ${isReply ? 'ml-8 mt-3' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.profiles.avatar_url} />
        <AvatarFallback>
          {comment.profiles.full_name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.profiles.full_name}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button 
            onClick={() => handleLikeComment(comment.id)}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
              comment.is_liked ? 'text-red-500' : ''
            }`}
          >
            <Heart className={`h-3 w-3 ${comment.is_liked ? 'fill-current' : ''}`} />
            {comment.likes_count > 0 && comment.likes_count}
          </button>
          
          {!isReply && (
            <button 
              onClick={() => setReplyTo(comment.id)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Reply className="h-3 w-3" />
              Balas
            </button>
          )}
          
          <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
            <Flag className="h-3 w-3" />
            Laporkan
          </button>
        </div>

        {replyTo === comment.id && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Tulis balasan..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                Balas
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply={true} />
        ))}
      </div>
    </div>
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Komentar ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Tulis komentar Anda..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Harap gunakan bahasa yang sopan dan konstruktif
              </p>
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? 'Mengirim...' : 'Kirim Komentar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground mb-3">
              Login untuk bergabung dalam diskusi
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Login Sekarang
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Memuat komentar...</p>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="text-center p-6">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Belum ada komentar. Jadilah yang pertama berkomentar!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}