import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Goal, AlertTriangle, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createRealtimeSubscription } from '@/utils/realtimeHelper';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface MatchUpdate {
  id: string;
  match_id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'kick_off' | 'half_time' | 'full_time' | 'commentary';
  event_time: number;
  description: string;
  player_name?: string;
  team?: string;
  created_at: string;
  match?: {
    home_team: string;
    away_team: string;
    status: string;
  };
}

export function LiveMatchUpdates() {
  const [recentUpdates, setRecentUpdates] = useState<MatchUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentUpdates();
  }, []);

  const fetchRecentUpdates = async () => {
    try {
      setLoading(true);
      
      // Fetch recent match events from live matches
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          *,
          matches!inner (
            home_team,
            away_team,
            status
          )
        `)
        .eq('matches.status', 'live')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentUpdates(data || []);
    } catch (error) {
      console.error('Error fetching match updates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for match events
  useEffect(() => {
    const cleanup = createRealtimeSubscription(
      'live-match-events',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'match_events'
      },
      async (payload) => {
        console.log('New match event:', payload);
        
        const newEvent = payload.new as any;
        
        // Fetch match details for the new event
        const { data: matchData } = await supabase
          .from('matches')
          .select('home_team, away_team, status')
          .eq('id', newEvent.match_id)
          .single();

        if (matchData && matchData.status === 'live') {
          const updateWithMatch = {
            ...newEvent,
            match: matchData
          };

          setRecentUpdates(prev => [updateWithMatch, ...prev.slice(0, 9)]);

          // Show toast notification for important events
          if (['goal', 'red_card', 'full_time'].includes(newEvent.event_type)) {
            const eventEmoji = newEvent.event_type === 'goal' ? '⚽' : 
                             newEvent.event_type === 'red_card' ? '🟥' : '🏁';
            
            toast({
              title: `${eventEmoji} ${matchData.home_team} vs ${matchData.away_team}`,
              description: newEvent.description,
              duration: 5000,
            });
          }
        }
      }
    );

    return cleanup;
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return <Goal className="h-4 w-4 text-green-500" />;
      case 'yellow_card':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'red_card':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'substitution':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'kick_off':
      case 'half_time':
      case 'full_time':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return { variant: 'default' as const, text: 'GOAL' };
      case 'yellow_card':
        return { variant: 'secondary' as const, text: 'KARTU KUNING' };
      case 'red_card':
        return { variant: 'destructive' as const, text: 'KARTU MERAH' };
      case 'substitution':
        return { variant: 'outline' as const, text: 'SUBSTITUSI' };
      case 'half_time':
        return { variant: 'secondary' as const, text: 'TURUN MINUM' };
      case 'full_time':
        return { variant: 'secondary' as const, text: 'SELESAI' };
      default:
        return { variant: 'outline' as const, text: 'UPDATE' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (recentUpdates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Belum ada update terbaru</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        Update Live Terbaru
      </h3>
      
      {recentUpdates.map((update) => {
        const badge = getEventBadge(update.event_type);
        
        return (
          <Link to={`/matches/${update.match_id}`} key={update.id}>
            <Card className="hover:bg-card/80 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(update.event_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.text}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {update.event_time}'
                      </span>
                    </div>
                    
                    <p className="font-medium text-sm mb-1">
                      {update.match?.home_team} vs {update.match?.away_team}
                    </p>
                    
                    <p className="text-sm text-muted-foreground">
                      {update.description}
                      {update.player_name && ` - ${update.player_name}`}
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(update.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}