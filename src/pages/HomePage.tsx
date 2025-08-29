import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LiveScoresSection } from "@/components/LiveScoresSection";
import { TrendingTopicsSection } from "@/components/TrendingTopicsSection";
import { LiveMatchUpdates } from "@/components/LiveMatchUpdates";

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [featuredNews, setFeaturedNews] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "all", label: "Semua" },
    { id: "liga1", label: "Liga 1" },
    { id: "international", label: "Internasional" },
    { id: "timnas", label: "Timnas" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch news
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select(`
          *,
          profiles (full_name)
        `)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (newsError) throw newsError;

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(3);

      if (matchesError) throw matchesError;

      setFeaturedNews(newsData || []);
      setUpcomingMatches(matchesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
        <div className="relative container mx-auto px-4 py-12 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
              Berita Bola <span className="text-primary">Terkini</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Dapatkan update terbaru sepak bola Indonesia dan dunia. 
              Beli tiket pertandingan favorit Anda dengan mudah.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/news')}
              >
                Lihat Berita Terbaru
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/tickets')}
              >
                Beli Tiket Sekarang
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Live Scores */}
        <LiveScoresSection />

        {/* Live Match Updates */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* News content will go here */}
            </div>
            <div className="lg:col-span-1">
              <LiveMatchUpdates />
            </div>
          </div>
        </section>

        {/* News Categories */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Berita Terbaru</h2>
            <Link to="/news">
              <Button variant="ghost" className="text-primary hover:text-primary">
                Lihat Semua →
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Featured News Grid */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted rounded-t-lg mb-4" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredNews.map((news) => (
                <Link to={`/news/${news.slug}`} key={news.id}>
                  <Card className="group cursor-pointer hover:bg-card/80 transition-colors">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted rounded-t-lg mb-4 overflow-hidden">
                      <img 
                        src={news.featured_image || "/placeholder.svg"} 
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Berita</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(news.published_at), "dd MMM yyyy", { locale: id })}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {news.excerpt}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Oleh {news.profiles?.full_name || 'Admin'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Matches */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Pertandingan Mendatang</h2>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-8 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingMatches.map((match) => (
                <Card key={match.id} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline">{match.competition}</Badge>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(match.match_date), "dd MMM yyyy", { locale: id })}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(match.match_date), "HH:mm", { locale: id })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">{match.home_team}</span>
                        {match.home_score !== null && match.away_score !== null ? (
                          <span className="text-primary font-bold">
                            {match.home_score} - {match.away_score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">vs</span>
                        )}
                        <span className="font-bold">{match.away_team}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-4 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {match.venue}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-bold text-secondary">{match.status}</p>
                      </div>
                      <Link to={`/tickets`}>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90"
                        >
                          Lihat Tiket
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Advertisement Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-secondary/20 to-primary/20 border-secondary">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Sponsor Advertisement</h3>
              <p className="text-muted-foreground mb-6">
                Ruang iklan premium untuk sponsor sepak bola Indonesia
              </p>
              <div className="bg-muted/50 h-32 rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">728 x 90 Banner Ad</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trending Topics */}
        <TrendingTopicsSection />
      </div>
    </div>
  );
}