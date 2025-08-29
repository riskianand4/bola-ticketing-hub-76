import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LiveMatchTimer } from '@/components/LiveMatchTimer';
import { Link } from 'react-router-dom';
import { createRealtimeSubscription } from '@/utils/realtimeHelper';

interface LiveMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  current_minute?: number;
  extra_time?: number;
  is_timer_active?: boolean;
  half_time_break?: boolean;
  venue?: string;
  competition?: string;
}

export function LiveScoresSection() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      
      // Fetch live and recently finished matches
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['live', 'finished'])
        .order('match_date', { ascending: false })
        .limit(6);

      if (error) throw error;

      setLiveMatches(data || []);
    } catch (error) {
      console.error('Error fetching live matches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for live updates
  useEffect(() => {
    const cleanup = createRealtimeSubscription(
      'live-scores-updates',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: 'status=in.(live,finished)'
      },
      (payload) => {
        console.log('Live scores update:', payload);
        
        if (payload.eventType === 'UPDATE') {
          setLiveMatches(prev => 
            prev.map(match => 
              match.id === payload.new.id ? { ...match, ...payload.new } : match
            )
          );
        } else if (payload.eventType === 'INSERT') {
          const newMatch = payload.new as LiveMatch;
          if (newMatch.status === 'live' || newMatch.status === 'finished') {
            setLiveMatches(prev => [newMatch, ...prev.slice(0, 5)]);
          }
        }
      }
    );

    return cleanup;
  }, []);

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Live Scores</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-8 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Live Scores</h2>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Pertandingan Live</h3>
            <p className="text-muted-foreground">
              Belum ada pertandingan yang sedang berlangsung saat ini
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Live Scores</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveMatches.map((match) => (
          <Link to={`/matches/${match.id}`} key={match.id}>
            <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <LiveMatchTimer
                    matchId={match.id}
                    status={match.status}
                    currentMinute={match.current_minute}
                    extraTime={match.extra_time}
                    isTimerActive={match.is_timer_active}
                    halfTimeBreak={match.half_time_break}
                    homeTeam={match.home_team}
                    awayTeam={match.away_team}
                    variant="compact"
                  />
                  {match.competition && (
                    <Badge variant="outline" className="text-xs">
                      {match.competition}
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <div className="text-center flex-1">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      {match.home_team}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {match.home_score ?? '-'}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-muted-foreground text-sm">vs</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      {match.away_team}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {match.away_score ?? '-'}
                    </p>
                  </div>
                </div>

                {match.venue && (
                  <p className="text-xs text-muted-foreground text-center mt-2 truncate">
                    {match.venue}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}