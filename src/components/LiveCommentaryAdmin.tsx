import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Target,
  UserX,
  MessageSquare,
  Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface MatchEvent {
  id: string;
  match_id: string;
  event_type: "goal" | "yellow_card" | "red_card" | "substitution" | "half_time" | "full_time" | "commentary";
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
}

interface LiveCommentaryAdminProps {
  matchId: string;
}

export const LiveCommentaryAdmin = ({ matchId }: LiveCommentaryAdminProps) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [formData, setFormData] = useState({
    event_type: "commentary",
    event_time: "",
    player_name: "",
    description: "",
    team: "",
  });

  const eventTypes = [
    { value: "goal", label: "Goal ⚽", icon: Target },
    { value: "yellow_card", label: "Kartu Kuning 🟨", icon: MessageSquare },
    { value: "red_card", label: "Kartu Merah 🟥", icon: MessageSquare },
    { value: "substitution", label: "Pergantian 🔄", icon: UserX },
    { value: "half_time", label: "Half Time ⏸️", icon: Play },
    { value: "full_time", label: "Full Time 🏁", icon: Play },
    { value: "commentary", label: "Komentar 📝", icon: MessageSquare },
  ];

  const fetchMatchAndEvents = async () => {
    try {
      setLoading(true);

      // Fetch match details
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchError) throw matchError;
      setMatch(matchData);

      // Fetch match events
      const { data: eventsData, error: eventsError } = await supabase
        .from("match_events")
        .select("*")
        .eq("match_id", matchId)
        .order("event_time", { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error("Error fetching match data:", error);
      toast.error("Gagal memuat data pertandingan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchAndEvents();
  }, [matchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const eventData = {
        match_id: matchId,
        event_type: formData.event_type as "goal" | "yellow_card" | "red_card" | "substitution" | "half_time" | "full_time" | "commentary",
        event_time: parseInt(formData.event_time),
        player_name: formData.player_name || null,
        description: formData.description,
        team: formData.team === "none" ? null : formData.team,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("match_events")
          .update(eventData)
          .eq("id", editingEvent.id);

        if (error) throw error;
        toast.success("Event berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("match_events")
          .insert([eventData]);

        if (error) throw error;
        toast.success("Event berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      fetchMatchAndEvents();
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast.error("Gagal menyimpan event");
    }
  };

  const handleEdit = (event: MatchEvent) => {
    setEditingEvent(event);
    setFormData({
      event_type: event.event_type,
      event_time: event.event_time.toString(),
      player_name: event.player_name || "",
      description: event.description,
      team: event.team || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus event ini?")) return;

    try {
      const { error } = await supabase
        .from("match_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Event berhasil dihapus");
      fetchMatchAndEvents();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error("Gagal menghapus event");
    }
  };

  const resetForm = () => {
    setFormData({
      event_type: "commentary",
      event_time: "",
      player_name: "",
      description: "",
      team: "",
    });
  };

  const getEventIcon = (eventType: string) => {
    const eventTypeObj = eventTypes.find((type) => type.value === eventType);
    if (eventTypeObj) {
      const IconComponent = eventTypeObj.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <MessageSquare className="h-4 w-4" />;
  };

  const quickAddGoal = (team: "home" | "away") => {
    if (!match) return;

    setFormData({
      event_type: "goal",
      event_time: "45",
      player_name: "",
      description: `GOAL untuk ${
        team === "home" ? match.home_team : match.away_team
      }!`,
      team: team,
    });
    setIsDialogOpen(true);
  };

  const isMatchActive = () => {
    return match?.status === "live" || match?.status === "in_progress";
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
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              {match.home_team} vs {match.away_team}
            </h3>
            <Badge
              variant={match.status === "live" ? "destructive" : "outline"}
              className="text-xs"
            >
              {match.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(match.match_date), "dd MMM yyyy, HH:mm", {
              locale: id,
            })}
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickAddGoal("home")}
              className="text-green-600 text-xs sm:text-sm"
              disabled={!isMatchActive()}
            >
              <Target className="h-3 w-3 mr-1" />
              <span className="truncate">{match.home_team}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickAddGoal("away")}
              className="text-green-600 text-xs sm:text-sm"
              disabled={!isMatchActive()}
            >
              <Target className="h-3 w-3 mr-1" />
              <span className="truncate">{match.away_team}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base sm:text-lg">Kelola Komentar Langsung</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setEditingEvent(null);
                  }}
                  disabled={!isMatchActive()}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs sm:text-sm">Tambah Event</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {editingEvent ? "Edit Event" : "Tambah Event"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor="event_type" className="text-sm">Jenis Event</Label>
                      <Select
                        value={formData.event_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, event_type: value })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="event_time" className="text-sm">Menit</Label>
                      <Input
                        id="event_time"
                        type="number"
                        min="0"
                        max="120"
                        value={formData.event_time}
                        onChange={(e) =>
                          setFormData({ ...formData, event_time: e.target.value })
                        }
                        placeholder="45"
                        required
                        className="h-9"
                      />
                    </div>

                    <div>
                      <Label htmlFor="team" className="text-sm">Tim</Label>
                      <Select
                        value={formData.team}
                        onValueChange={(value) =>
                          setFormData({ ...formData, team: value })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Pilih tim" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tidak ada tim</SelectItem>
                          <SelectItem value={match.home_team}>
                            {match.home_team}
                          </SelectItem>
                          <SelectItem value={match.away_team}>
                            {match.away_team}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="player_name" className="text-sm">Nama Pemain (Opsional)</Label>
                      <Input
                        id="player_name"
                        value={formData.player_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            player_name: e.target.value,
                          })
                        }
                        placeholder="Nama pemain"
                        className="h-9"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="description" className="text-sm">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Deskripsi event..."
                        required
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      size="sm"
                    >
                      Batal
                    </Button>
                    <Button type="submit" size="sm">
                      {editingEvent ? "Perbarui" : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {events.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Belum ada event untuk pertandingan ini
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3"
                >
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm">{event.event_time}'</span>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                        {event.team && (
                          <Badge variant="outline" className="text-xs truncate max-w-20">
                            {event.team}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-tight">{event.description}</p>
                      {event.player_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Pemain: {event.player_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
