import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Plus, 
  Coffee,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LiveMatchTimer } from './LiveMatchTimer';

interface LiveMatchControlProps {
  match: {
    id: string;
    home_team: string;
    away_team: string;
    status: string;
    current_minute?: number;
    extra_time?: number;
    is_timer_active?: boolean;
    half_time_break?: boolean;
  };
  onUpdate?: () => void;
}

export function LiveMatchControl({ match, onUpdate }: LiveMatchControlProps) {
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  const callMatchTimer = async (action: string, extraMinutes?: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-timer', {
        body: { 
          action, 
          matchId: match.id,
          extraMinutes 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Match ${action} berhasil!`);
        onUpdate?.();
      } else {
        toast.error(data.data?.message || 'Gagal mengupdate match');
      }
    } catch (error) {
      console.error('Match timer error:', error);
      toast.error('Error mengupdate match timer');
    } finally {
      setLoading(false);
    }
  };

  const isLive = match.status === 'live';
  const isActive = match.is_timer_active;
  const isHalfTime = match.half_time_break;
  const currentMinute = match.current_minute || 0;
  const totalMinutes = currentMinute + (match.extra_time || 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Match Control: {match.home_team} vs {match.away_team}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Status Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="text-sm font-medium">
              {match.status?.toUpperCase()}
              {isHalfTime && " (ISTIRAHAT)"}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Waktu</Label>
            <div className="text-sm font-mono font-bold">
              <LiveMatchTimer
                matchId={match.id}
                status={match.status}
                currentMinute={match.current_minute || 0}
                extraTime={match.extra_time || 0}
                isTimerActive={!!match.is_timer_active}
                halfTimeBreak={!!match.half_time_break}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
                variant="compact"
              />
            </div>
          </div>
        </div>

        {/* Basic Controls */}
        <div className="grid grid-cols-2 gap-2">
          {!isLive ? (
            <Button 
              onClick={() => callMatchTimer('start')}
              disabled={loading}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Mulai Pertandingan
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => callMatchTimer(isActive ? 'pause' : 'resume')}
                disabled={loading}
                variant={isActive ? 'secondary' : 'default'}
                className="w-full"
              >
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Jeda Timer
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Lanjut Timer
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => callMatchTimer('finish')}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                Akhiri Pertandingan
              </Button>
            </>
          )}
        </div>

        {/* Advanced Controls - Only show for live matches */}
        {isLive && (
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Kontrol Lanjutan</Label>
            
            {/* Half Time Controls */}
            <div className="grid grid-cols-1 gap-2">
              {!isHalfTime && currentMinute >= 40 && currentMinute < 50 ? (
                <Button 
                  onClick={() => callMatchTimer('half_time')}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Mulai Istirahat (Babak 1)
                </Button>
              ) : isHalfTime ? (
                <Button 
                  onClick={() => callMatchTimer('second_half')}
                  disabled={loading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Mulai Babak 2
                </Button>
              ) : null}
            </div>

            {/* Extra Time Control */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="extra-time" className="text-xs">
                  Tambah Waktu (menit)
                </Label>
                <Input
                  id="extra-time"
                  type="number"
                  min="1"
                  max="10"
                  value={extraMinutes}
                  onChange={(e) => setExtraMinutes(Number(e.target.value))}
                  placeholder="1-10"
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    if (extraMinutes > 0 && extraMinutes <= 10) {
                      callMatchTimer('add_extra_time', extraMinutes);
                      setExtraMinutes(0);
                    } else {
                      toast.error('Masukkan waktu 1-10 menit');
                    }
                  }}
                  disabled={loading || extraMinutes <= 0}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <div className="mb-1">
            <strong>Otomatis Selesai:</strong> Pertandingan akan otomatis berakhir pada menit ke-97
          </div>
          <div className="mb-1">
            <strong>Timer Berjalan:</strong> Timer akan bertambah setiap menit secara real-time
          </div>
          <div>
            <strong>Real-time:</strong> Semua user akan melihat update waktu secara langsung
          </div>
        </div>
      </CardContent>
    </Card>
  );
}