import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveMatchTimerProps {
  matchId: string;
  status: string;
  currentMinute?: number;
  extraTime?: number;
  isTimerActive?: boolean;
  halfTimeBreak?: boolean;
  homeTeam: string;
  awayTeam: string;
  variant?: 'full' | 'compact';
}

export function LiveMatchTimer({
  matchId,
  status,
  currentMinute = 0,
  extraTime = 0,
  isTimerActive = false,
  halfTimeBreak = false,
  homeTeam,
  awayTeam,
  variant = 'full'
}: LiveMatchTimerProps) {
  const [liveMinute, setLiveMinute] = useState(currentMinute);
  const [liveExtraTime, setLiveExtraTime] = useState(extraTime);
  const [liveStatus, setLiveStatus] = useState(status);
  const [liveIsActive, setLiveIsActive] = useState(isTimerActive);
  const [liveHalfTime, setLiveHalfTime] = useState(halfTimeBreak);
  const [seconds, setSeconds] = useState(0);

  // Format timer display
  const formatTimer = () => {
    if (liveHalfTime) {
      return "HT";
    }

    // Show MM:SS while match is live (including paused state)
    if (liveStatus === 'live') {
      const baseMinute = liveExtraTime > 0 ? `${liveMinute}+${liveExtraTime}` : `${liveMinute + liveExtraTime}`;
      const ss = String(seconds).padStart(2, '0');
      return `${baseMinute}:${ss}`;
    }

    // Fallback for non-live statuses
    if (liveExtraTime > 0) {
      return `${liveMinute}+${liveExtraTime}'`;
    }

    return `${liveMinute + liveExtraTime}'`;
  };

  // Get timer badge variant and color
  const getTimerBadge = () => {
    if (liveStatus !== 'live') {
      return { variant: 'secondary' as const, text: liveStatus.toUpperCase() };
    }
    
    if (liveHalfTime) {
      return { variant: 'outline' as const, text: 'ISTIRAHAT' };
    }
    
    if (liveIsActive) {
      return { variant: 'destructive' as const, text: 'LIVE' };
    }
    
    return { variant: 'secondary' as const, text: 'PAUSED' };
  };

  const badge = getTimerBadge();

  // Real-time subscription to match updates
  useEffect(() => {
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('Match updated:', payload.new);
          const newData = payload.new as any;

          const isLive = (newData.status || 'scheduled') === 'live';
          const isActive = newData.is_timer_active || false;
          const isHT = newData.half_time_break || false;
          let addMin = 0;
          let sec = 0;
          const baseline = newData.updated_at || newData.match_started_at;
          if (isLive && isActive && !isHT && baseline) {
            const elapsed = Math.max(0, Math.floor((Date.now() - new Date(baseline).getTime()) / 1000));
            console.log('Elapsed (realtime):', elapsed, 's');
            addMin = Math.floor(elapsed / 60);
            sec = elapsed % 60;
          }
          setLiveMinute((newData.current_minute || 0) + addMin);
          setLiveExtraTime(newData.extra_time || 0);
          setLiveStatus(newData.status || 'scheduled');
          setLiveIsActive(isActive);
          setLiveHalfTime(isHT);
          setSeconds(sec);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Initial fetch to get accurate elapsed time on refresh
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('current_minute, extra_time, status, is_timer_active, half_time_break, updated_at, match_started_at')
        .eq('id', matchId)
        .maybeSingle();
      if (!error && data && !cancelled) {
        const isLive = (data.status || 'scheduled') === 'live';
        const isActive = data.is_timer_active || false;
        const isHT = data.half_time_break || false;
        let addMin = 0;
        let sec = 0;
        const baseline = data.updated_at || data.match_started_at;
        if (isLive && isActive && !isHT && baseline) {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(baseline).getTime()) / 1000));
          console.log('Elapsed (initial):', elapsed, 's');
          addMin = Math.floor(elapsed / 60);
          sec = elapsed % 60;
        }
        setLiveMinute((data.current_minute || 0) + addMin);
        setLiveExtraTime(data.extra_time || 0);
        setLiveStatus(data.status || 'scheduled');
        setLiveIsActive(isActive);
        setLiveHalfTime(isHT);
        setSeconds(sec);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [matchId]);

  // Per-second timer for live matches
  useEffect(() => {
    if (liveStatus === 'live' && liveIsActive && !liveHalfTime) {
      const interval = setInterval(() => {
        setSeconds(prev => {
          if (prev >= 59) {
            setLiveMinute(m => m + 1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [liveStatus, liveIsActive, liveHalfTime]);

  // Compact variant - just return the timer text
  if (variant === 'compact') {
    return (
      <span className="text-xs text-gray-400 font-mono">
        {formatTimer()}
      </span>
    );
  }

  if (liveStatus === 'scheduled') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Belum dimulai</span>
      </div>
    );
  }

  if (liveStatus === 'finished') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary">SELESAI</Badge>
        <span className="text-muted-foreground">{formatTimer()}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={badge.variant}
        className={`${badge.variant === 'destructive' ? 'animate-pulse' : ''} text-xs`}
      >
        {badge.text}
      </Badge>
      
      <div className="flex items-center gap-1 text-sm font-mono">
        <Timer className="h-3 w-3" />
        <span className="font-bold">{formatTimer()}</span>
      </div>
      
      {liveStatus === 'live' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {liveIsActive && !liveHalfTime ? (
            <>
              <Play className="h-3 w-3 text-green-500" />
              <span>Berjalan</span>
            </>
          ) : (
            <>
              <Pause className="h-3 w-3 text-yellow-500" />
              <span>Dijeda</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}