import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Clock, Users, Search, Filter, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { LiveMatchTimer } from "@/components/LiveMatchTimer";
import { LoadingCard } from "@/components/ui/loading-spinner";

export default function TicketsPage() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters = [
    { id: "all", label: "Semua" },
    { id: "available", label: "Tersedia" },
    { id: "liga1", label: "Liga 1" },
    { id: "timnas", label: "Timnas" },
    { id: "international", label: "Internasional" },
  ];

  useEffect(() => {
    fetchMatches();

    // Setup realtime subscription
    const channel = supabase
      .channel("matches-tickets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => fetchMatches()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          tickets(*)
        `
        )
        .order("match_date", { ascending: true });

      if (error) {
        console.error("Error fetching matches:", error);
      } else {
        // Kategorikan pertandingan berdasarkan status dan waktu
        const categorizedMatches = (data || []).map((match) => {
          const matchDate = new Date(match.match_date);
          const matchEndTime = new Date(
            matchDate.getTime() + 2 * 60 * 60 * 1000
          ); // Add 2 hours

          let ticketStatus = "available";

          // Jika pertandingan sudah selesai (status finished atau sudah lewat 2 jam)
          if (match.status === "finished" || now > matchEndTime) {
            ticketStatus = "expired";
          }
          // Jika pertandingan sedang berlangsung
          else if (
            match.status === "live" ||
            (now >= matchDate && now <= matchEndTime)
          ) {
            ticketStatus = "ongoing";
          }
          // Jika pertandingan belum dimulai dan masih scheduled
          else if (match.status === "scheduled" && now < matchDate) {
            ticketStatus = "available";
          }

          return {
            ...match,
            ticketStatus,
          };
        });

        const availableMatches = categorizedMatches.filter(
          (match) =>
            match.ticketStatus === "available" ||
            match.ticketStatus === "ongoing"
        );

        setMatches(availableMatches);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredMatches = matches.filter((match) => {
    const hasTickets = match.tickets && match.tickets.length > 0;
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "available" && hasTickets);
    const matchesSearch =
      match.home_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.away_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.competition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 md:pt-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Tiket Pertandingan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-4">
            Dapatkan tiket pertandingan sepak bola favorit Anda dengan mudah dan
            aman
          </p>
        </div>

        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pertandingan, tim, atau stadion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.id)}
                className="rounded-full text-[10px] sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingCard key={index} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {filteredMatches.map((match) => (
            <Card
              key={match.id}
              className="bg-card border-border overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="bg-primary/5 p-3 sm:p-4 border-b border-border">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <Badge variant="outline" className="text-xs">
                      {match.competition}
                    </Badge>
                    
                    {/* Live Timer Component */}
                    <LiveMatchTimer
                      matchId={match.id}
                      status={match.status}
                      currentMinute={match.current_minute}
                      extraTime={match.extra_time}
                      isTimerActive={match.is_timer_active}
                      halfTimeBreak={match.half_time_break}
                      homeTeam={match.home_team}
                      awayTeam={match.away_team}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <div className="w-8 h-8 sm:w-16 sm:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <img
                          src={match.home_team_logo}
                          alt={match.home_team}
                          className="w-10 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-600"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm truncate">
                          {match.home_team}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Home
                        </p>
                      </div>
                    </div>

                    <div className="text-center px-2 sm:px-4 flex-shrink-0">
                      <p className="text-lg sm:text-2xl font-bold text-primary">
                        VS
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-right truncate">
                          {match.away_team}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                          Away
                        </p>
                      </div>
                      <div className="w-8 h-8 sm:w-16 sm:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold">
                          <img
                            src={match.away_team_logo}
                            alt={match.away_team}
                            className="w-10 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-600"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {new Date(match.match_date).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {new Date(match.match_date).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" }
                        )}{" "}
                        WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm sm:col-span-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{match.venue}</span>
                    </div>
                  </div>

                  {/* Pricing - Mobile Optimized */}
                  {match.tickets && match.tickets.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Harga tiket
                          </p>
                          <p className="font-bold text-xs sm:text-sm text-secondary truncate">
                            {formatPrice(
                              Math.min(...match.tickets.map((t) => t.price))
                            )}{" "}
                            -{" "}
                            {formatPrice(
                              Math.max(...match.tickets.map((t) => t.price))
                            )}
                          </p>
                        </div>
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base h-10 sm:h-11"
                    disabled={
                      match.ticketStatus === "expired" ||
                      !match.tickets ||
                      match.tickets.length === 0
                    }
                    onClick={() => {
                      if (
                        match.tickets &&
                        match.tickets.length > 0 &&
                        match.ticketStatus !== "expired"
                      ) {
                        navigate(`/tickets/purchase/${match.id}`);
                      }
                    }}
                  >
                    {match.ticketStatus === "expired"
                      ? "Tiket Kadaluarsa"
                      : match.ticketStatus === "ongoing"
                      ? "Sedang Berlangsung"
                      : match.tickets && match.tickets.length > 0
                      ? "Beli Tiket Sekarang"
                      : "Segera Tersedia"}
                  </Button>
                </div>
              </CardContent>
            </Card>
              ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredMatches.length === 0 && (
          <div className="col-span-full">
            <EmptyStateCard
              icon={Ticket}
              title={searchQuery || selectedFilter !== "all" ? "Tidak ada pertandingan ditemukan" : "Belum ada pertandingan tersedia"}
              description={
                searchQuery || selectedFilter !== "all"
                  ? "Coba ubah filter pencarian atau kata kunci Anda"
                  : "Admin sedang menyiapkan jadwal pertandingan. Silakan cek lagi nanti!"
              }
              actionLabel={searchQuery || selectedFilter !== "all" ? "Reset Filter" : undefined}
              onAction={
                searchQuery || selectedFilter !== "all"
                  ? () => {
                      setSearchQuery("");
                      setSelectedFilter("all");
                    }
                  : undefined
              }
            />
          </div>
        )}

        {/* Load More */}
        {!isLoading && filteredMatches.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <Button
              size="lg"
              variant="outline"
              className="text-sm sm:text-base"
            >
              Lihat Lebih Banyak Pertandingan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
