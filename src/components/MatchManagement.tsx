import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Edit, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LiveMatchControl } from "@/components/LiveMatchControl";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  venue: string;
  competition: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team_logo: string | null;
  away_team_logo: string | null;
  current_minute?: number;
  extra_time?: number;
  is_timer_active?: boolean;
  half_time_break?: boolean;
  created_at: string;
}

export const MatchManagement = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState({
    home_team: "Persiraja Banda Aceh",
    away_team: "",
    match_date: "",
    venue: "",
    competition: "",
    home_score: "",
    away_score: "",
    status: "scheduled",
    home_team_logo: "",
    away_team_logo: "",
  });
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState("");

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      console.error("Error fetching matches:", error);
      toast.error("Gagal memuat data pertandingan");
    } finally {
      setLoading(false);
    }
  };

  const getAutoStatus = (matchDate: string) => {
    const now = new Date();
    const match = new Date(matchDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDay = new Date(
      match.getFullYear(),
      match.getMonth(),
      match.getDate()
    );

    if (matchDay > today) return "scheduled";
    if (matchDay.getTime() === today.getTime()) return "live";
    return "finished";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const autoStatus = getAutoStatus(formData.match_date);

      const matchData = {
        home_team: formData.home_team,
        away_team: formData.away_team,
        match_date: formData.match_date,
        venue: formData.venue,
        competition: formData.competition,
        home_score: formData.home_score ? parseInt(formData.home_score) : null,
        away_score: formData.away_score ? parseInt(formData.away_score) : null,
        status: autoStatus,
        home_team_logo: formData.home_team_logo || null,
        away_team_logo: formData.away_team_logo || null,
      };

      if (editingMatch) {
        const { error } = await supabase
          .from("matches")
          .update(matchData)
          .eq("id", editingMatch.id);

        if (error) throw error;
        toast.success("Pertandingan berhasil diperbarui");
      } else {
        const { error } = await supabase.from("matches").insert([matchData]);

        if (error) throw error;
        toast.success("Pertandingan berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      setEditingMatch(null);
      resetForm();
      fetchMatches();
    } catch (error: any) {
      console.error("Error saving match:", error);
      toast.error("Gagal menyimpan pertandingan");
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      home_team: match.home_team,
      away_team: match.away_team,
      match_date: format(new Date(match.match_date), "yyyy-MM-dd'T'HH:mm"),
      venue: match.venue || "",
      competition: match.competition || "",
      home_score: match.home_score?.toString() || "",
      away_score: match.away_score?.toString() || "",
      status: match.status,
      home_team_logo: match.home_team_logo || "",
      away_team_logo: match.away_team_logo || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pertandingan ini?")) return;

    try {
      const { error } = await supabase.from("matches").delete().eq("id", id);

      if (error) throw error;
      toast.success("Pertandingan berhasil dihapus");
      fetchMatches();
    } catch (error: any) {
      console.error("Error deleting match:", error);
      toast.error("Gagal menghapus pertandingan");
    }
  };

  const handlePostpone = async (match: Match) => {
    setEditingMatch(match);
    setPostponeDate("");
    setIsPostponeDialogOpen(true);
  };

  const handleConfirmPostpone = async () => {
    if (!editingMatch || !postponeDate) return;

    try {
      const { error } = await supabase
        .from("matches")
        .update({
          match_date: postponeDate,
          status: "postponed",
        })
        .eq("id", editingMatch.id);

      if (error) throw error;
      toast.success("Pertandingan berhasil ditunda");
      setIsPostponeDialogOpen(false);
      setEditingMatch(null);
      setPostponeDate("");
      fetchMatches();
    } catch (error: any) {
      console.error("Error postponing match:", error);
      toast.error("Gagal menunda pertandingan");
    }
  };

  const handleCancel = async (matchId: string) => {
    if (!confirm("Yakin ingin membatalkan pertandingan ini?")) return;

    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "cancelled" })
        .eq("id", matchId);

      if (error) throw error;
      toast.success("Pertandingan berhasil dibatalkan");
      fetchMatches();
    } catch (error: any) {
      console.error("Error cancelling match:", error);
      toast.error("Gagal membatalkan pertandingan");
    }
  };

  const resetForm = () => {
    setFormData({
      home_team: "Persiraja Banda Aceh",
      away_team: "",
      match_date: "",
      venue: "",
      competition: "",
      home_score: "",
      away_score: "",
      status: "scheduled",
      home_team_logo: "",
      away_team_logo: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Mendatang
          </Badge>
        );
      case "live":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            Live
          </Badge>
        );
      case "finished":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Selesai
          </Badge>
        );
      case "postponed":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Ditunda
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  // Remove auto status update effect as it conflicts with match timer system
  // The timer is now handled by the database and edge functions

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-xl md:text-3xl font-bold">Kelola Pertandingan</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setEditingMatch(null);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMatch ? "Edit Pertandingan" : "Tambah Pertandingan"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="home_team">Tim Tuan Rumah</Label>
                  <Input
                    id="home_team"
                    value={formData.home_team}
                    onChange={(e) =>
                      setFormData({ ...formData, home_team: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="away_team">Tim Tamu</Label>
                  <Input
                    id="away_team"
                    value={formData.away_team}
                    onChange={(e) =>
                      setFormData({ ...formData, away_team: e.target.value })
                    }
                    placeholder="Nama tim tamu"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="match_date">Tanggal & Waktu</Label>
                <Input
                  id="match_date"
                  type="datetime-local"
                  value={formData.match_date}
                  onChange={(e) =>
                    setFormData({ ...formData, match_date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  placeholder="Stadion"
                />
              </div>

              <div>
                <Label htmlFor="competition">Kompetisi</Label>
                <Input
                  id="competition"
                  value={formData.competition}
                  onChange={(e) =>
                    setFormData({ ...formData, competition: e.target.value })
                  }
                  placeholder="Liga/Turnamen"
                />
              </div>

              <div>
                <Label htmlFor="home_team_logo">Logo Tim Tuan Rumah</Label>
                <Input
                  id="home_team_logo"
                  type="url"
                  value={formData.home_team_logo}
                  onChange={(e) =>
                    setFormData({ ...formData, home_team_logo: e.target.value })
                  }
                  placeholder="https://example.com/home-logo.png"
                />
              </div>

              <div>
                <Label htmlFor="away_team_logo">Logo Tim Tamu</Label>
                <Input
                  id="away_team_logo"
                  type="url"
                  value={formData.away_team_logo}
                  onChange={(e) =>
                    setFormData({ ...formData, away_team_logo: e.target.value })
                  }
                  placeholder="https://example.com/away-logo.png"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="home_score">Skor Tuan Rumah</Label>
                  <Input
                    id="home_score"
                    type="number"
                    min="0"
                    value={formData.home_score}
                    onChange={(e) =>
                      setFormData({ ...formData, home_score: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="away_score">Skor Tamu</Label>
                  <Input
                    id="away_score"
                    type="number"
                    min="0"
                    value={formData.away_score}
                    onChange={(e) =>
                      setFormData({ ...formData, away_score: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Status (Otomatis)</Label>
                  <div className="p-2 border rounded-md bg-muted text-sm">
                    {formData.match_date
                      ? getAutoStatus(formData.match_date) === "scheduled"
                        ? "Mendatang"
                        : getAutoStatus(formData.match_date) === "live"
                        ? "Live"
                        : "Selesai"
                      : "Pilih tanggal"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingMatch ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-1">
            {matches.map((match) => (
              <div
                key={match.id}
                className="space-y-4 p-4 border-b border-border/50 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-sm font-medium">
                        {match.home_team} vs {match.away_team}
                      </div>
                      {getStatusBadge(match.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(
                          new Date(match.match_date),
                          "dd MMM yyyy, HH:mm",
                          { locale: id }
                        )}
                      </div>
                      {match.venue && <div>Venue: {match.venue}</div>}
                      {match.competition && (
                        <div>Liga: {match.competition}</div>
                      )}
                      {match.home_score !== null &&
                        match.away_score !== null && (
                          <div className="font-medium">
                            Skor: {match.home_score} - {match.away_score}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(match)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {match.status === "scheduled" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePostpone(match)}
                          className="h-7 px-2 text-xs"
                        >
                          Tunda
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(match.id)}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          Batal
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(match.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Live Match Control for live matches */}
                {match.status === 'live' && (
                  <LiveMatchControl 
                    match={match} 
                    onUpdate={fetchMatches}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Postpone Dialog */}
      <Dialog
        open={isPostponeDialogOpen}
        onOpenChange={setIsPostponeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tunda Pertandingan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="postpone_date">Tanggal & Waktu Baru</Label>
              <Input
                id="postpone_date"
                type="datetime-local"
                value={postponeDate}
                onChange={(e) => setPostponeDate(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPostponeDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleConfirmPostpone} disabled={!postponeDate}>
                Tunda Pertandingan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
