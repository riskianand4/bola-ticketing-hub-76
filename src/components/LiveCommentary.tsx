import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, UserX, Users, MessageSquare, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MatchEvent {
  id: string;
  match_id: string;
  event_type: string;
  event_time: number;
  player_name: string | null;
  description: string;
  team: string | null;
  created_at: string;
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  match_date: string;
  venue: string | null;
  competition: string | null;
  home_team_logo: string | null;
  away_team_logo: string | null;
}

interface LiveCommentaryProps {
  matchId: string;
}

export const LiveCommentary = ({ matchId }: LiveCommentaryProps) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatchAndEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      setMatch(matchData);

      // Fetch match events
      const { data: eventsData, error: eventsError } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId)
        .order('event_time', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error('Error fetching match data:', error);
      toast.error('Gagal memuat data pertandingan');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for match events
  useEffect(() => {
    fetchMatchAndEvents();

    // Subscribe to real-time updates for match events
    const channel = supabase
      .channel('live-commentary')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('Real-time event update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [payload.new as MatchEvent, ...prev]);
            
            // Show notification for important events
            const newEvent = payload.new as MatchEvent;
            if (newEvent.event_type === 'goal') {
              toast.success(`⚽ GOAL! ${newEvent.description}`);
            } else if (newEvent.event_type === 'card') {
              toast.info(`🟨 ${newEvent.description}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(event => 
              event.id === payload.new.id ? payload.new as MatchEvent : event
            ));
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(event => event.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          setMatch(payload.new as Match);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return <Target className="h-4 w-4 text-green-600" />;
      case 'card':
        return <Square className="h-4 w-4 text-yellow-500" />;
      case 'substitution':
        return <UserX className="h-4 w-4 text-blue-600" />;
      case 'kickoff':
      case 'halftime':
      case 'fulltime':
        return <Play className="h-4 w-4 text-gray-600" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return <Badge className="bg-green-100 text-green-800">GOAL</Badge>;
      case 'card':
        return <Badge className="bg-yellow-100 text-yellow-800">CARD</Badge>;
      case 'substitution':
        return <Badge className="bg-blue-100 text-blue-800">SUB</Badge>;
      case 'kickoff':
        return <Badge className="bg-gray-100 text-gray-800">KICK OFF</Badge>;
      case 'halftime':
        return <Badge className="bg-orange-100 text-orange-800">HALF TIME</Badge>;
      case 'fulltime':
        return <Badge className="bg-red-100 text-red-800">FULL TIME</Badge>;
      case 'comment':
        return <Badge className="bg-purple-100 text-purple-800">COMMENT</Badge>;
      default:
        return <Badge variant="outline">{eventType.toUpperCase()}</Badge>;
    }
  };

  const TeamLogo = ({ src, alt, fallback }: { src: string | null, alt: string, fallback: string }) => {
    if (src) {
      return (
        <img 
          src={src} 
          alt={alt}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-bold">
        {fallback}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Pertandingan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">{match.competition || 'Pertandingan'}</Badge>
            <Badge 
              variant={match.status === 'live' ? 'destructive' : 'outline'}
              className={match.status === 'live' ? 'animate-pulse' : ''}
            >
              {match.status === 'live' ? 'LIVE' : 
               match.status === 'scheduled' ? 'Terjadwal' : 
               match.status === 'finished' ? 'Selesai' : match.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 items-center text-center">
            <div className="flex flex-col items-center">
              <TeamLogo 
                src={match.home_team_logo} 
                alt={match.home_team}
                fallback={match.home_team.substring(0, 3).toUpperCase()}
              />
              <h3 className="font-bold text-lg mt-2">{match.home_team}</h3>
              {(match.status === 'live' || match.status === 'finished') && (
                <p className="text-3xl font-bold text-primary mt-2">{match.home_score || 0}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">vs</p>
              {match.status === 'live' && (
                <p className="text-sm text-red-600 font-medium mt-2 animate-pulse">LIVE</p>
              )}
            </div>
            <div className="flex flex-col items-center">
              <TeamLogo 
                src={match.away_team_logo} 
                alt={match.away_team}
                fallback={match.away_team.substring(0, 3).toUpperCase()}
              />
              <h3 className="font-bold text-lg mt-2">{match.away_team}</h3>
              {(match.status === 'live' || match.status === 'finished') && (
                <p className="text-3xl font-bold text-primary mt-2">{match.away_score || 0}</p>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>{format(new Date(match.match_date), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB</p>
            {match.venue && <p>{match.venue}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Live Commentary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Komentar Langsung
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada komentar untuk pertandingan ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex gap-4 p-4 rounded-lg border bg-muted/50">
                  <div className="flex-shrink-0">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg">{event.event_time}'</span>
                      {getEventBadge(event.event_type)}
                      {event.team && (
                        <Badge variant="outline" className="text-xs">
                          {event.team === 'home' ? match.home_team : match.away_team}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{event.description}</p>
                    {event.player_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pemain: {event.player_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.created_at), 'HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};