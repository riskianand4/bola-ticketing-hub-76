import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, MapPin, Clock, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LiveCommentary } from "@/components/LiveCommentary";

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

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = async () => {
    if (!matchId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error: any) {
      console.error('Error fetching match:', error);
      toast.error('Gagal memuat detail pertandingan');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse">LIVE</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Terjadwal</Badge>;
      case 'finished':
        return <Badge variant="secondary">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Dibatalkan</Badge>;
      case 'postponed':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Ditunda</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const TeamLogo = ({ src, alt, fallback }: { src: string | null, alt: string, fallback: string }) => {
    if (src) {
      return (
        <img 
          src={src} 
          alt={alt}
          className="w-16 h-16 object-cover rounded-full border-2 border-border"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return (
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-sm font-bold border-2 border-border">
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

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pertandingan tidak ditemukan</p>
          <Button onClick={() => navigate('/matches')}>
            Kembali ke Pertandingan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/matches')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Detail Pertandingan</h1>
            {getStatusBadge(match.status)}
          </div>
        </div>

        {/* Match Overview */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {match.competition || 'Pertandingan'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 items-center text-center mb-8">
              <div className="flex flex-col items-center">
                <TeamLogo 
                  src={match.home_team_logo} 
                  alt={match.home_team}
                  fallback={match.home_team.substring(0, 3).toUpperCase()}
                />
                <h2 className="font-bold text-2xl mt-4">{match.home_team}</h2>
                {(match.status === 'live' || match.status === 'finished') && (
                  <p className="text-5xl font-bold text-primary mt-4">{match.home_score || 0}</p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <p className="text-2xl text-muted-foreground font-bold">VS</p>
                {match.status === 'live' && (
                  <p className="text-sm text-red-600 font-medium mt-2 animate-pulse">LIVE</p>
                )}
                {match.status === 'scheduled' && (
                  <div className="text-center mt-2">
                    <p className="text-lg font-bold">
                      {format(new Date(match.match_date), 'HH:mm', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(match.match_date), 'dd MMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <TeamLogo 
                  src={match.away_team_logo} 
                  alt={match.away_team}
                  fallback={match.away_team.substring(0, 3).toUpperCase()}
                />
                <h2 className="font-bold text-2xl mt-4">{match.away_team}</h2>
                {(match.status === 'live' || match.status === 'finished') && (
                  <p className="text-5xl font-bold text-primary mt-4">{match.away_score || 0}</p>
                )}
              </div>
            </div>

            {/* Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(match.match_date), 'dd MMMM yyyy', { locale: id })}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(match.match_date), 'HH:mm', { locale: id })} WIB
                </span>
              </div>
              {match.venue && (
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{match.venue}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {match.status === 'scheduled' && (
              <div className="flex justify-center mt-6">
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => navigate(`/tickets/purchase/${match.id}`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Beli Tiket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="commentary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commentary">Komentar Langsung</TabsTrigger>
            <TabsTrigger value="stats">Statistik</TabsTrigger>
            <TabsTrigger value="lineup">Susunan Pemain</TabsTrigger>
          </TabsList>

          <TabsContent value="commentary">
            <LiveCommentary matchId={match.id} />
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Statistik Pertandingan</h3>
                  <p className="text-muted-foreground">
                    Statistik akan ditampilkan saat pertandingan berlangsung
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineup">
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Susunan Pemain</h3>
                  <p className="text-muted-foreground">
                    Susunan pemain akan diumumkan menjelang pertandingan
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}