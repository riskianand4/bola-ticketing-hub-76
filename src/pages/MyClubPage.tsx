import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, Star, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Person {
  id: string;
  name: string;
  position: string;
  jersey_number?: number;
  nationality?: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  bio?: string;
  photo_url?: string;
  is_active: boolean;
  player_type: string;
  role_title?: string;
  experience_years?: number;
  achievements?: string[];
  sort_order?: number;
}

export default function MyClubPage() {
  const [selectedCategory, setSelectedCategory] = useState("players");
  const [players, setPlayers] = useState<Person[]>([]);
  const [coaches, setCoaches] = useState<Person[]>([]);
  const [management, setManagement] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('player_type', 'player')
        .eq('is_active', true)
        .order('jersey_number', { ascending: true, nullsFirst: false });

      if (playersError) throw playersError;

      // Fetch coaches
      const { data: coachesData, error: coachesError } = await supabase
        .from('players')
        .select('*')
        .eq('player_type', 'coach')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (coachesError) throw coachesError;

      // Fetch management
      const { data: managementData, error: managementError } = await supabase
        .from('players')
        .select('*')
        .eq('player_type', 'management')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (managementError) throw managementError;

      setPlayers(playersData || []);
      setCoaches(coachesData || []);
      setManagement(managementData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case "striker": return "bg-red-500";
      case "midfielder": return "bg-green-500";
      case "defender": return "bg-blue-500";
      case "goalkeeper": return "bg-yellow-500";
      case "winger": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 md:pt-28">
      <div className="container mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12  ">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 mobile-title">My Club</h1>
          <p className="text-sm md:text-lg text-muted-foreground mobile-compact max-w-2xl mx-auto">
            Kenali tim Persiraja - Pemain, pelatih, dan manajemen yang berdedikasi untuk kejayaan club
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8">
            <TabsTrigger value="players" className="text-xs md:text-sm">
              <Users className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Pemain
            </TabsTrigger>
            <TabsTrigger value="coaches" className="text-xs md:text-sm">
              <Trophy className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Pelatih
            </TabsTrigger>
            <TabsTrigger value="management" className="text-xs md:text-sm">
              <Star className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Manajemen
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {players.map((player) => (
                  <Link key={player.id} to={`/player/${player.id}`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                      <CardContent className="p-3 md:p-4">
                        <div className="relative mb-3 md:mb-4">
                          <img 
                            src={player.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"} 
                            alt={player.name}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          {player.jersey_number && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                #{player.jersey_number}
                              </Badge>
                            </div>
                          )}
                          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getPositionColor(player.position)}`}></div>
                        </div>
                        <h3 className="font-bold text-sm md:text-base text-foreground mb-1 mobile-compact group-hover:text-primary transition-colors">
                          {player.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">{player.position}</p>
                        <div className="flex justify-between items-center text-xs">
                          {player.date_of_birth ? (
                            <span className="text-muted-foreground">Usia: {calculateAge(player.date_of_birth)}</span>
                          ) : (
                            <span className="text-muted-foreground">Usia: -</span>
                          )}
                          <span className="text-primary font-semibold">{player.nationality || "Indonesia"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Coaches Tab */}
          <TabsContent value="coaches">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {coaches.map((coach) => (
                  <Card key={coach.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={coach.photo_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face"} 
                          alt={coach.name}
                          className="w-16 md:w-20 h-16 md:h-20 object-cover rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-base md:text-lg text-foreground mb-1">{coach.name}</h3>
                          <p className="text-sm md:text-base text-primary font-medium mb-2">{coach.role_title || coach.position}</p>
                          <div className="space-y-1">
                            {coach.experience_years && (
                              <p className="text-xs md:text-sm text-muted-foreground">
                                <Calendar className="w-3 md:w-4 h-3 md:h-4 inline mr-1" />
                                Pengalaman: {coach.experience_years} tahun
                              </p>
                            )}
                            {coach.achievements && coach.achievements.length > 0 && (
                              <p className="text-xs md:text-sm text-muted-foreground">
                                <Trophy className="w-3 md:w-4 h-3 md:h-4 inline mr-1" />
                                {coach.achievements[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
                {management.map((person) => (
                  <Card key={person.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 md:p-8 text-center">
                      <img 
                        src={person.photo_url || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face"} 
                        alt={person.name}
                        className="w-24 md:w-32 h-24 md:h-32 object-cover rounded-full mx-auto mb-4"
                      />
                      <h3 className="font-bold text-lg md:text-xl text-foreground mb-2">{person.name}</h3>
                      <p className="text-base md:text-lg text-primary font-medium mb-3">{person.role_title || person.position}</p>
                      {person.experience_years && (
                        <p className="text-sm md:text-base text-muted-foreground">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Pengalaman: {person.experience_years} tahun
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}