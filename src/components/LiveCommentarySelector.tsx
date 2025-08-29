import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LiveCommentaryAdmin } from "./LiveCommentaryAdmin";

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
}

export const LiveCommentarySelector = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      toast.error('Gagal memuat data pertandingan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (selectedMatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedMatch(null)}
          >
            ← Kembali ke Daftar Pertandingan
          </Button>
        </div>
        <LiveCommentaryAdmin matchId={selectedMatch} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Live Commentary Management</h2>
        <p className="text-muted-foreground">
          Pilih pertandingan untuk mengelola komentar langsung
        </p>
      </div>

      <div className="grid gap-4">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Belum ada pertandingan. Tambahkan pertandingan terlebih dahulu.
              </p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">
                        {match.home_team} vs {match.away_team}
                      </h3>
                      <Badge variant={
                        match.status === 'live' ? 'destructive' : 
                        match.status === 'finished' ? 'secondary' : 'outline'
                      }>
                        {match.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        📅 {format(new Date(match.match_date), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </span>
                      {match.venue && <span>📍 {match.venue}</span>}
                      {match.competition && <span>🏆 {match.competition}</span>}
                    </div>
                    
                    {(match.home_score !== null || match.away_score !== null) && (
                      <div className="mt-2 font-bold text-lg">
                        {match.home_score || 0} - {match.away_score || 0}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => setSelectedMatch(match.id)}
                    className="ml-4"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Kelola Commentary
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};