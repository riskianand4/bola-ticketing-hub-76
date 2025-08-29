import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Users, Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  venue: string | null;
  competition: string | null;
  status: string;
  home_team_logo: string | null;
  away_team_logo: string | null;
  created_at: string;
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      toast.error('Gagal memuat data pertandingan');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for live score updates
  useEffect(() => {
    fetchMatches();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          console.log('Real-time match update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setMatches(prev => [...prev, payload.new as Match]);
            toast.success('Pertandingan baru ditambahkan!');
          } else if (payload.eventType === 'UPDATE') {
            setMatches(prev => prev.map(match => 
              match.id === payload.new.id ? payload.new as Match : match
            ));
            
            // Show specific toast for score updates
            const updatedMatch = payload.new as Match;
            if (updatedMatch.status === 'live' && (updatedMatch.home_score !== null || updatedMatch.away_score !== null)) {
              toast.success(`🏆 Skor update: ${updatedMatch.home_team} ${updatedMatch.home_score} - ${updatedMatch.away_score} ${updatedMatch.away_team}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setMatches(prev => prev.filter(match => match.id !== payload.old.id));
            toast.info('Pertandingan dihapus');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter matches based on search query
  const filteredMatches = matches.filter(match =>
    match.home_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.away_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (match.competition && match.competition.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Categorize matches
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const liveMatches = filteredMatches.filter(match => 
    match.status === 'live' || 
    (match.status === 'scheduled' && new Date(match.match_date) >= todayStart && new Date(match.match_date) < todayEnd)
  );

  const upcomingMatches = filteredMatches.filter(match => 
    match.status === 'scheduled' && new Date(match.match_date) > todayEnd
  );

  const completedMatches = filteredMatches.filter(match => 
    match.status === 'finished' || match.status === 'cancelled'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse text-xs sm:text-sm">LIVE</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs sm:text-sm">Terjadwal</Badge>;
      case 'finished':
        return <Badge variant="secondary" className="text-xs sm:text-sm">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 text-xs sm:text-sm">Dibatalkan</Badge>;
      case 'postponed':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs sm:text-sm">Ditunda</Badge>;
      default:
        return <Badge variant="outline" className="text-xs sm:text-sm">{status}</Badge>;
    }
  };

  const TeamLogo = ({ src, alt, fallback }: { src: string | null, alt: string, fallback: string }) => {
    if (src) {
      return (
        <img 
          src={src} 
          alt={alt}
          className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-full border-2 border-border"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-border">
        {fallback}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-6 sm:pt-10 md:pt-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Pertandingan</h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-4">
            Ikuti semua pertandingan sepak bola terkini dan mendatang
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 sm:mb-8">
          <div className="relative w-full sm:max-w-md mx-auto sm:mx-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari tim atau pertandingan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="live" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger 
              value="live" 
              className="text-xs sm:text-sm px-2 py-2 sm:py-3 flex-1 text-center leading-tight"
            >
              <span className="block sm:inline">Live & Hari Ini</span>
              <span className="block sm:inline sm:ml-1">({liveMatches.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="text-xs sm:text-sm px-2 py-2 sm:py-3 flex-1 text-center leading-tight"
            >
              <span className="block sm:inline">Mendatang</span>
              <span className="block sm:inline sm:ml-1">({upcomingMatches.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="text-xs sm:text-sm px-2 py-2 sm:py-3 flex-1 text-center leading-tight"
            >
              <span className="block sm:inline">Selesai</span>
              <span className="block sm:inline sm:ml-1">({completedMatches.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Live Matches */}
          <TabsContent value="live">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">Pertandingan Live & Hari Ini</h2>
              </div>
              
              {liveMatches.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Tidak ada pertandingan hari ini</h3>
                  <p className="text-muted-foreground text-sm sm:text-base px-4">
                    Cek tab "Mendatang" untuk pertandingan selanjutnya
                  </p>
                </div>
              ) : (
                liveMatches.map((match) => (
                  <Card key={match.id} className="bg-card border-border">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {match.competition || 'Pertandingan'}
                        </Badge>
                        {getStatusBadge(match.status)}
                      </div>
                      
                      <div className="grid grid-cols-3 items-center text-center gap-2">
                        {/* Home Team */}
                        <div className="flex flex-col items-center">
                          <TeamLogo 
                            src={match.home_team_logo} 
                            alt={match.home_team}
                            fallback={match.home_team.substring(0, 3).toUpperCase()}
                          />
                          <h3 className="font-bold text-sm sm:text-lg mt-1 sm:mt-2 leading-tight">
                            {match.home_team}
                          </h3>
                          {match.status === 'live' || match.status === 'finished' ? (
                            <p className="text-xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
                              {match.home_score || 0}
                            </p>
                          ) : null}
                        </div>

                        {/* Center */}
                        <div className="px-2">
                          <p className="text-muted-foreground text-sm sm:text-base">vs</p>
                          {match.status === 'live' ? (
                            <p className="text-xs sm:text-sm text-red-600 font-medium mt-1 sm:mt-2 animate-pulse">
                              LIVE
                            </p>
                          ) : match.status === 'scheduled' ? (
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                              <p>{format(new Date(match.match_date), 'HH:mm', { locale: id })}</p>
                              <p className="hidden sm:block">
                                {format(new Date(match.match_date), 'dd MMM', { locale: id })}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center">
                          <TeamLogo 
                            src={match.away_team_logo} 
                            alt={match.away_team}
                            fallback={match.away_team.substring(0, 3).toUpperCase()}
                          />
                          <h3 className="font-bold text-sm sm:text-lg mt-1 sm:mt-2 leading-tight">
                            {match.away_team}
                          </h3>
                          {match.status === 'live' || match.status === 'finished' ? (
                            <p className="text-xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
                              {match.away_score || 0}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {match.venue && (
                        <div className="mt-3 sm:mt-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{match.venue}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Upcoming Matches */}
          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {upcomingMatches.length === 0 ? (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Tidak ada pertandingan mendatang</h3>
                  <p className="text-muted-foreground text-sm sm:text-base px-4">
                    Pertandingan baru akan segera ditambahkan
                  </p>
                </div>
              ) : (
                upcomingMatches.map((match) => (
                  <Card key={match.id} className="bg-card border-border">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {match.competition || 'Pertandingan'}
                        </Badge>
                        <Badge className="bg-success text-xs sm:text-sm">Tiket Tersedia</Badge>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <div className="flex flex-col items-center flex-1">
                            <TeamLogo 
                              src={match.home_team_logo} 
                              alt={match.home_team}
                              fallback={match.home_team.substring(0, 3).toUpperCase()}
                            />
                            <h3 className="font-bold text-sm sm:text-lg mt-1 sm:mt-2 leading-tight text-center px-1">
                              {match.home_team}
                            </h3>
                          </div>
                          <span className="text-muted-foreground text-lg sm:text-xl font-bold mx-2 sm:mx-4">
                            vs
                          </span>
                          <div className="flex flex-col items-center flex-1">
                            <TeamLogo 
                              src={match.away_team_logo} 
                              alt={match.away_team}
                              fallback={match.away_team.substring(0, 3).toUpperCase()}
                            />
                            <h3 className="font-bold text-sm sm:text-lg mt-1 sm:mt-2 leading-tight text-center px-1">
                              {match.away_team}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(match.match_date), 'dd MMMM yyyy', { locale: id })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span>{format(new Date(match.match_date), 'HH:mm', { locale: id })} WIB</span>
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{match.venue}</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base py-2 sm:py-3" 
                        onClick={() => navigate(`/tickets/purchase/${match.id}`)}
                      >
                        Beli Tiket
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Completed Matches */}
          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {completedMatches.length === 0 ? (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Belum ada pertandingan selesai</h3>
                  <p className="text-muted-foreground text-sm sm:text-base px-4">
                    Hasil pertandingan akan muncul di sini
                  </p>
                </div>
              ) : (
                completedMatches.map((match) => (
                  <Card key={match.id} className="bg-card border-border">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {match.competition || 'Pertandingan'}
                        </Badge>
                        {getStatusBadge(match.status)}
                      </div>
                      
                      <div className="grid grid-cols-3 items-center text-center mb-3 sm:mb-4 gap-2">
                        <div className="flex flex-col items-center">
                          <TeamLogo 
                            src={match.home_team_logo} 
                            alt={match.home_team}
                            fallback={match.home_team.substring(0, 3).toUpperCase()}
                          />
                          <h3 className="font-bold text-sm sm:text-lg mt-1 sm:mt-2 leading-tight">
                            {match.home_team}
                          </h3>
                          <p className="text-xl sm:text-3xl font-bold text-secondary mt-1 sm:mt-2">
                            {match.home_score || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm sm:text-base">vs</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <TeamLogo 
                            src={match.away_team_logo} 
                            alt={match.away_team}
                            fallback={match.away_team.substring(0, 3).toUpperCase()}
                          />
                          <h3 className="font-bold text-sm sm:text-lg mt-1 sm:mt-2 leading-tight">
                            {match.away_team}
                          </h3>
                          <p className="text-xl sm:text-3xl font-bold text-secondary mt-1 sm:mt-2">
                            {match.away_score || 0}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground text-center mb-3 sm:mb-4">
                        {format(new Date(match.match_date), 'dd MMMM yyyy', { locale: id })}
                      </p>

                      {match.venue && (
                        <div className="text-center mb-3 sm:mb-4">
                          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{match.venue}</span>
                          </div>
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full text-sm sm:text-base py-2 sm:py-3"
                        onClick={() => navigate(`/match/${match.id}`)}
                      >
                        Lihat Detail
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}