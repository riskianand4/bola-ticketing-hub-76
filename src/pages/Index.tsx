import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Play,
  Star,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSlider } from "@/components/HeroSlider";
import { LiveMatchTimer } from "@/components/LiveMatchTimer";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [liveMinute, setLiveMinute] = useState<number | null>(null);
  const categories = [
    "All",
    "Team News",
    "Match Reports",
    "Transfer News",
    "Youth",
  ];
  // Real-time subscription for live match updates
  useEffect(() => {
    const channel = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.live'
        },
        (payload) => {
          console.log('Live match updated:', payload.new);
          setMatches(prev => 
            prev.map(match => 
              match.id === payload.new.id 
                ? { ...match, ...payload.new }
                : match
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select(
            `
    *,
    match_events (
      id,
      event_type,
      event_time,
      player_name,
      description,
      team
    )
  `
          )
          .order("match_date", { ascending: true });

        if (error) throw error;

        const now = new Date();
        const relevantMatches = data
          .filter((match) => {
            const matchDate = new Date(match.match_date);
            return (
              match.status === "live" ||
              matchDate >= now ||
              (match.status === "finished" &&
                now.getTime() - matchDate.getTime() < 2 * 60 * 60 * 1000)
            );
          })
          .sort((a, b) => {
            if (a.status === "live" && b.status !== "live") return -1;
            if (b.status === "live" && a.status !== "live") return 1;
            return (
              new Date(a.match_date).getTime() -
              new Date(b.match_date).getTime()
            );
          })
          .slice(0, 3);

        setMatches(relevantMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from("news")
          .select(
            `
            *,
            profiles:author_id(full_name)
          `
          )
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(3);  

        if (error) throw error;
        setNews(data || []);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchMatches();
    fetchNews();
  }, []);

  const upcomingMatches = matches.filter((match) => {
    const matchDate = new Date(match.match_date);
    const now = new Date();
    return match.status === "scheduled" && matchDate > now;
  });

  const trendingTopics = [
    "Transfer Window",
    "Liga 1 Indonesia", 
    "Laskar Rencong",
    "Stadion Harapan Bangsa",
    "SKULL Supporters",
  ];

  return (
    <div className="min-h-screen bg-background">
      <HeroSlider />

      <section className="py-4 sm:py-6 md:py-12 bg-card/50">
        <div className="mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-0.5 sm:w-1 h-5 sm:h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-lg sm:text-xl md:text-3xl font-bold">
                Skor Langsung
              </h2>
            </div>
            <Link to="/matches">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowRight className="ml-1 sm:ml-2 h-3 sm:h-4 w-3 sm:w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-primary"></div>
            </div>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {matches.map((match, index) => (
                <Card
                  key={match.id || index}
                  className="group hover:shadow-lg transition-all duration-300 border border-gray-700 bg-[#1c1c1c] text-white"
                >
                  <CardContent className="p-6 sm:p-4 md:p-6">
                    <div className="flex flex-col items-center">
                      <Badge
                        variant={
                          match.status === "live" ? "destructive" : "secondary"
                        }
                        className={`text-xs px-2 sm:px-3 py-1 mb-2 sm:mb-3 ${
                          match.status === "live" ? "animate-pulse" : ""
                        }`}
                      >
                        {match.status === "live"
                          ? "LIVE"
                          : match.status?.toUpperCase() || "UPCOMING"}
                      </Badge>

                      <div className="flex items-center justify-between w-full">
                        {/* Home Team */}
                        <div className="flex flex-col items-center flex-1 min-w-0">
                          <img
                            src={match.home_team_logo}
                            alt={match.home_team}
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-600"
                          />
                          <div className="mt-1 sm:mt-2 w-full px-1">
                            <span className="block text-center font-semibold text-xs sm:text-sm md:text-base truncate max-w-[80px] sm:max-w-[100px] md:max-w-[110px] mx-auto">
                              {match.home_team}
                            </span>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center mx-2 sm:mx-3 md:mx-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-lg sm:text-xl md:text-4xl font-bold text-red-500">
                              {match.home_score ?? 0}
                            </span>
                            <span className="text-sm sm:text-base md:text-xl font-semibold">
                              vs
                            </span>
                            <span className="text-lg sm:text-xl md:text-4xl font-bold text-red-500">
                              {match.away_score ?? 0}
                            </span>
                          </div>
                           <div className="text-xs text-gray-400 mt-1">
                              {match.status === "live" ? (
                                <LiveMatchTimer
                                  matchId={match.id}
                                  status={match.status}
                                  currentMinute={match.current_minute || 0}
                                  extraTime={match.extra_time || 0}
                                  isTimerActive={match.is_timer_active || false}
                                  halfTimeBreak={match.half_time_break || false}
                                  homeTeam={match.home_team}
                                  awayTeam={match.away_team}
                                  variant="compact"
                                />
                              ) : (
                                new Date(match.match_date).toLocaleDateString("id-ID")
                              )}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center flex-1 min-w-0">
                          <img
                            src={match.away_team_logo}
                            alt={match.away_team}
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-600"
                          />
                          <div className="mt-1 sm:mt-2 w-full px-1">
                            <span className="block text-center font-semibold text-xs sm:text-sm md:text-base truncate max-w-[80px] sm:max-w-[100px] md:max-w-[110px] mx-auto">
                              {match.away_team}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {match.match_events && match.match_events.length > 0 && (
                      <div className="mt-3 w-full ">
                        {match.match_events.map((ev) => {
                          const isHome = ev.team === match.home_team;
                          return (
                            <div
                              key={ev.id}
                              className={`flex items-center gap-2 text-xs flex-row ${
                                isHome
                                  ? "justify-start text-left"
                                  : "justify-end text-right"
                              }`}
                            >
                              {isHome && (
                                <>
                                  <span className="font-bold">
                                    {ev.event_time}'
                                  </span>
                                  <span
                                    className={
                                      ev.event_type === "Kartu Kuning"
                                        ? "text-yellow-500 font-semibold"
                                        : ev.event_type === "Kartu Merah"
                                        ? "text-red-600 font-semibold"
                                        : ""
                                    }
                                  >
                                    {ev.event_type === "goal"
                                      ? "⚽ Goal"
                                      : ev.event_type === "Kartu Kuning"
                                      ? "🟨"
                                      : ev.event_type === "Kartu Merah"
                                      ? "🟥"
                                      : ev.event_type}
                                  </span>
                                  <span className="truncate">
                                    {ev.player_name}
                                  </span>
                                </>
                              )}
                              {!isHome && (
                                <>
                                  <span>
                                    {ev.event_type === "goal"
                                      ? "Goal.."
                                      : ev.event_type}
                                  </span>
                                  <span className="truncate">
                                    {ev.player_name}
                                  </span>
                                  <span className="font-bold">
                                    {ev.event_time}'
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 sm:py-8">
              Tidak ada pertandingan yang sedang berlangsung atau mendatang
            </p>
          )}
        </div>
      </section>

      {/* News Section */}
      <section className="py-4 sm:py-6 md:py-16 px-3 sm:px-4">
        <div className=" mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-0.5 sm:w-1 h-5 sm:h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-lg sm:text-xl md:text-3xl font-bold">
                Berita Terbaru
              </h2>
            </div>
            <Link to="/news">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowRight className="ml-1 sm:ml-2 h-3 sm:h-4 w-3 sm:w-4" />
              </Button>
            </Link>
          </div>

          <div className="mb-4 sm:mb-6 md:mb-10">
            <div className="sm:hidden">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full bg-background border border-border">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-foreground hover:bg-accent"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:flex gap-2 md:gap-3 overflow-x-auto pb-2">
              <div className="flex gap-2 md:gap-3 flex-nowrap min-w-max">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full px-3 sm:px-4 md:px-6 py-2 text-xs sm:text-sm transition-all duration-200 hover:scale-105 whitespace-nowrap flex-shrink-0"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Featured News Grid */}
          {newsLoading ? (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-primary"></div>
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
              {news.map((article) => (
                <Link key={article.id} to={`/news/${article.id}`}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 h-full">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={article.featured_image || "/placeholder.svg"}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 bg-primary/90 backdrop-blur-sm text-xs">
                        Berita
                      </Badge>
                    </div>
                    <CardHeader className="pb-2 md:pb-3 p-3 sm:p-4 md:p-6">
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors duration-200 text-sm sm:text-base md:text-lg leading-tight">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 sm:line-clamp-3 text-muted-foreground text-xs sm:text-sm">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="font-medium truncate">
                          {article.profiles?.full_name || "Admin"}
                        </span>
                        <span className="text-xs">
                          {new Date(article.published_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 sm:py-8">
              Belum ada berita tersedia
            </p>
          )}
        </div>
      </section>

      {/* Upcoming Matches */}
      <section className="py-4 sm:py-6 md:py-16 bg-muted/30 px-3 sm:px-4">
        <div className=" mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-0.5 sm:w-1 h-5 sm:h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-lg sm:text-xl md:text-3xl font-bold">
                Pertandingan Mendatang
              </h2>
            </div>
            <Link to="/tickets">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowRight className="ml-1 sm:ml-2 h-3 sm:h-4 w-3 sm:w-4" />
              </Button>
            </Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Tidak ada pertandingan mendatang
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Pertandingan baru akan segera ditambahkan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
              {upcomingMatches.map((match) => (
                <Card
                  key={match.id}
                  className="group p-3 sm:p-4 md:p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4 md:mb-6">
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-1 w-fit"
                    >
                      {match.competition || "Liga 1"}
                    </Badge>
                    <Badge className="bg-green-700  text-[10px] w-fit">
                      Tersedia
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      {match.home_team_logo ? (
                        <img
                          src={match.home_team_logo}
                          alt={match.home_team}
                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-600"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center border border-gray-600">
                          <span className="text-xs sm:text-sm font-bold text-primary">
                            {match.home_team.substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="mt-1 sm:mt-2 font-bold text-xs sm:text-sm md:text-base text-center truncate max-w-[80px] sm:max-w-[100px] md:max-w-[110px]">
                        {match.home_team}
                      </span>
                    </div>

                    {/* VS */}
                    <div className="px-2 sm:px-4 md:px-6">
                      <span className="text-lg sm:text-xl md:text-3xl font-bold text-muted-foreground">
                        VS
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      {match.away_team_logo ? (
                        <img
                          src={match.away_team_logo}
                          alt={match.away_team}
                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-600"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center border border-gray-600">
                          <span className="text-xs sm:text-sm font-bold text-primary">
                            {match.away_team.substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="mt-1 sm:mt-2 font-bold text-xs sm:text-sm md:text-base text-center truncate max-w-[80px] sm:max-w-[100px] md:max-w-[110px]">
                        {match.away_team}
                      </span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          className=" space-y-2 mb-3 sm:mb-4 p-2 sm:p-4 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-colors text-center  text-xs"
                          aria-label="Lihat detail jadwal pertandingan"
                        >
                          Detail
                        </button>
                      </div>
                    </DialogTrigger>

                    {/* Popup detail */}
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Detail Jadwal Pertandingan</DialogTitle>
                        <DialogDescription>
                          {match.home_team} vs {match.away_team}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-2 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium">
                            {new Date(match.match_date).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium">
                            {new Date(match.match_date).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            WIB
                          </div>
                        </div>

                        {match.venue && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="font-medium">{match.venue}</div>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/tickets/purchase/${match.id}`}
                        className="mt-4"
                      >
                        <Button className="w-full">
                          <Ticket className="mr-2 h-4 w-4" />
                          Beli Tiket
                        </Button>
                      </Link>
                    </DialogContent>
                  </Dialog>

                  <Link to={`/tickets/purchase/${match.id}`}>
                    <Button className="w-full py-2 sm:py-3 md:py-6 text-xs sm:text-sm md:text-lg font-semibold">
                      <Ticket className="mr-2 h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5" />
                      Beli Tiket
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-6 sm:py-8 md:py-16 bg-card border-y border-border">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h3 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-foreground">
            Dukung Persiraja!
          </h3>
          <p className="text-sm sm:text-base md:text-xl mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto text-muted-foreground px-4">
            Bergabunglah dengan SKULL Komunitas suporter terbesar Aceh
          </p>
          <Button
            size="default"
            variant="default"
            className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm md:text-lg font-semibold w-full sm:w-auto"
            onClick={() => {
              window.open(
                "https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20bergabung%20dengan%20komunitas%20SKULL%20Persiraja",
                "_blank"
              );
            }}
          >
            <Users className="mr-2 h-4 md:h-6 w-4 md:w-6" />
            Gabung Komunitas
          </Button>
        </div>
      </section>
    </div>
  );
}
