import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Trophy, Target, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Player {
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
  achievements?: string[];
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (error: any) {
      console.error('Error fetching player:', error);
      toast.error('Gagal memuat data pemain');
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
    fetchPlayer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Pemain Tidak Ditemukan</h2>
          <Link to="/my-club">
            <Button variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke My Club
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background pt-4 md:pt-8">
      <div className="container mx-auto px-3 md:px-4">
        {/* Back Button */}
        <Link to="/my-club">
          <Button variant="ghost" className="mb-4 md:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke My Club
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Player Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4 md:p-6 text-center">
                <div className="relative mb-4 md:mb-6">
                  <img 
                    src={player.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face"} 
                    alt={player.name}
                    className="w-32 md:w-48 h-32 md:h-48 object-cover rounded-lg mx-auto"
                  />
                  {player.jersey_number && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-primary-foreground text-sm md:text-base font-bold">
                        #{player.jersey_number}
                      </Badge>
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${getPositionColor(player.position)}`}></div>
                </div>
                
                <h1 className="text-xl md:text-3xl font-bold text-foreground mb-2">{player.name}</h1>
                <p className="text-base md:text-xl text-primary font-medium mb-4">{player.position}</p>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  {player.date_of_birth && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Usia</p>
                      <p className="text-base md:text-lg font-semibold text-foreground">{calculateAge(player.date_of_birth)}</p>
                    </div>
                  )}
                  {player.height && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Tinggi</p>
                      <p className="text-base md:text-lg font-semibold text-foreground">{player.height} cm</p>
                    </div>
                  )}
                  {player.weight && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Berat</p>
                      <p className="text-base md:text-lg font-semibold text-foreground">{player.weight} kg</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Negara</p>
                    <p className="text-base md:text-lg font-semibold text-foreground">{player.nationality || "Indonesia"}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Posisi:</span>
                    <span className="font-medium text-foreground">{player.position}</span>
                  </div>
                  {player.jersey_number && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Nomor Punggung:</span>
                      <span className="font-medium text-foreground">#{player.jersey_number}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {player.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Profil Pemain</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                    {player.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {player.achievements && player.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg md:text-xl">
                    <Award className="w-5 h-5 mr-2 text-primary" />
                    Prestasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {player.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm md:text-base text-foreground">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}