import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, Share2, Heart, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsInteractions } from "@/hooks/useNewsInteractions";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { likes, views, isLiked, toggleLike, shareNative } = useNewsInteractions(id);

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchRelatedArticles();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id(full_name)
        `)
        .eq('id', id)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching article:', error);
        toast.error('Gagal memuat artikel');
        return;
      }

      if (!data) {
        toast.error('Artikel tidak ditemukan');
        return;
      }

      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      // Get other published articles, ordered by most viewed/liked
      const { data } = await supabase
        .rpc('get_news_statistics')
        .neq('news_id', id)
        .limit(3);

      if (data && data.length > 0) {
        setRelatedArticles(data);
      }
    } catch (error) {
      console.error('Error fetching related articles:', error);
    }
  };
  const handleShare = () => {
    const currentUrl = window.location.href;
    const title = article?.title || '';
    shareNative(title, currentUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/news">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Berita
              </Button>
            </Link>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/news">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Berita
              </Button>
            </Link>
          </div>
          
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Artikel Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-6">
              Artikel yang Anda cari tidak tersedia atau telah dihapus.
            </p>
            <Link to="/news">
              <Button>Kembali ke Halaman Berita</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/news">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Berita
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{article.category || 'Berita'}</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(article.published_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {article.profiles?.full_name || 'Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {Math.ceil((article.content?.length || 0) / 200)} min baca
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`gap-2 ${isLiked ? 'text-red-600 border-red-600 bg-red-50 hover:bg-red-100' : ''}`} 
                  onClick={toggleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-600' : ''}`} />
                  {likes}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {views}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="aspect-video bg-muted rounded-lg mb-8 overflow-hidden">
              <img 
                src={article.featured_image} 
                alt={article.title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <p className="text-lg italic text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          )}

          {/* Article Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-primary prose-ul:text-foreground prose-ol:text-foreground prose-blockquote:text-foreground prose-a:text-primary" 
                dangerouslySetInnerHTML={{
                  __html: article.content || '<p>Konten artikel tidak tersedia.</p>'
                }} 
              />
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {article.profiles?.full_name || 'Admin'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Penulis artikel
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Berita Terpopuler Lainnya</h3>
                <div className="space-y-4">
                  {relatedArticles.map((related) => (
                    <Link 
                      key={related.news_id} 
                      to={`/news/${related.news_id}`}
                      className="block group"
                    >
                      <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {related.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {related.total_views}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {related.total_likes}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}