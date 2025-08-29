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
      // In a real implementation, you would have a comments table
      // For now, we'll show placeholder comments
      const mockComments: Comment[] = [
        {
          id: '1',
          content: 'Wah berita yang menarik! Semoga tim makin sukses',
          created_at: new Date().toISOString(),
          user_id: 'user1',
          likes_count: 5,
          is_liked: false,
          profiles: {
            full_name: 'Ahmad Supporter',
            avatar_url: undefined
          },
          replies: [
            {
              id: '2',
              content: 'Setuju! Persiraja yang terbaik!',
              created_at: new Date().toISOString(),
              user_id: 'user2',
              parent_id: '1',
              likes_count: 2,
              is_liked: false,
              profiles: {
                full_name: 'Budi Fan'
              }
            }
          ]
        }
      ];
      
      setComments(mockComments);
    } catch (error) {
      console.error('Error loading comments:', error);
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
      // In a real implementation, you would save to comments table
      const mockNewComment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        created_at: new Date().toISOString(),
        user_id: user.id,
        likes_count: 0,
        is_liked: false,
        profiles: {
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: undefined
        }
      };

      setComments(prev => [mockNewComment, ...prev]);
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
      const mockReply: Comment = {
        id: Date.now().toString(),
        content: replyContent,
        created_at: new Date().toISOString(),
        user_id: user.id,
        parent_id: parentId,
        likes_count: 0,
        is_liked: false,
        profiles: {
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: undefined
        }
      };

      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), mockReply] }
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

    // Update like status locally
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          is_liked: !comment.is_liked,
          likes_count: comment.is_liked ? comment.likes_count - 1 : comment.likes_count + 1
        };
      }
      return comment;
    }));
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