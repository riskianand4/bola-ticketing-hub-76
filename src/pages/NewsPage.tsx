import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "@/components/ui/login-dialog";
import { toast } from "sonner";
import { SearchInput } from "@/components/ui/search-input";
import { CategoryPills } from "@/components/ui/category-pills";
import { NewsCard } from "@/components/ui/news-card";

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedArticles, setDisplayedArticles] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { isAuthenticated } = useAuth();

  const categories = [
    { id: "all", name: "Semua", label: "Semua" },
    { id: "liga1", name: "Liga 1", label: "Liga 1" },
    { id: "international", name: "Internasional", label: "Internasional" },
    { id: "timnas", name: "Timnas", label: "Timnas" },
    { id: "transfer", name: "Transfer", label: "Transfer" },
    { id: "opinion", name: "Opini", label: "Opini" },
  ];

  useEffect(() => {
    fetchNews();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('news-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'news' },
        () => fetchNews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id(full_name)
        `)
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching news:', error);
        setArticles([]);
      } else {
        setArticles(data || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "all" || (article.category && article.category.toLowerCase().includes(selectedCategory));
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const articlesToShow = filteredArticles.slice(0, displayedArticles);
  const hasMoreArticles = filteredArticles.length > displayedArticles;

  const handleLikeArticle = async (articleId: string) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    
    // Here you can implement the actual like functionality
    toast.success("Artikel disukai!");
  };

  const handleLoadMore = () => {
    setDisplayedArticles(prev => prev + 6);
  };

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 md:pt-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-heading-lg mb-2 sm:mb-4">Berita Sepak Bola</h1>
          <p className="text-muted-foreground text-body px-4">
            Update terkini seputar dunia sepak bola Indonesia dan internasional
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 space-md">
          <SearchInput
            placeholder="Cari berita..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
          />

          {/* Category filters */}
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Featured Article (First article) */}
        {articlesToShow.length > 0 && (
          <Link to={`/news/${articlesToShow[0].id}`} className="mb-6 sm:mb-8 block">
            <NewsCard 
              article={articlesToShow[0]} 
              featured={true}
              onLike={handleLikeArticle}
            />
          </Link>
        )}

        {/* Articles Grid */}
        <div className="grid-responsive-cards gap-4 sm:gap-6">
          {articlesToShow.slice(1).map((article) => (
            <Link key={article.id} to={`/news/${article.id}`}>
              <NewsCard 
                article={article}
                onLike={handleLikeArticle}
              />
            </Link>
          ))}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid-responsive-cards gap-4 sm:gap-6 mt-4 sm:mt-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card-mobile">
                <Skeleton className="aspect-video rounded-lg mb-3" />
                <div className="space-sm">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMoreArticles && !isLoading && (
          <div className="text-center mt-8 sm:mt-12">
            <Button 
              size="touch"
              className="w-full sm:w-auto"
              variant="outline" 
              onClick={handleLoadMore}
            >
              Muat Lebih Banyak
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && !isLoading && (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-muted-foreground text-body-lg mb-4">
              Tidak ada berita yang ditemukan
            </p>
            <Button 
              size="touch"
              onClick={() => {
                setSearchQuery(""); 
                setSelectedCategory("all"); 
                setDisplayedArticles(7);
              }}
              className="w-full sm:w-auto"
            >
              Reset Filter
            </Button>
          </div>
        )}

        <LoginDialog 
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="Login untuk Menyukai Artikel"
          description="Silakan login terlebih dahulu untuk menyukai artikel."
        />
      </div>
      
    </div>
  );
}