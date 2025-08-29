import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, Users, CreditCard, ArrowLeft, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PromoCodeInput } from "@/components/PromoCodeInput";

interface Ticket {
  id: string;
  ticket_type: string;
  price: number;
  available_quantity: number;
  description?: string;
}

export default function TicketPurchasePage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [match, setMatch] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    id: string;
  } | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: ""
  });

  const handlePromoApplied = (discountAmount: number, promoId: string, promoCode: string) => {
    setAppliedPromo({
      code: promoCode,
      discount: discountAmount,
      id: promoId
    });
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  useEffect(() => {
    fetchMatchData();
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          *,
          tickets(*)
        `)
        .eq('id', matchId)
        .single();

      if (error) {
        console.error('Error fetching match:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data pertandingan",
          variant: "destructive"
        });
        navigate('/tickets');
        return;
      }

      // Cek apakah pertandingan sudah selesai
      const now = new Date();
      const matchDate = new Date(matchData.match_date);
      const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
      
      if (matchData.status === 'finished' || now > matchEndTime) {
        toast({
          title: "Tiket Kadaluarsa",
          description: "Pertandingan ini sudah selesai, tiket tidak dapat dibeli lagi",
          variant: "destructive"
        });
        navigate('/tickets');
        return;
      }

      setMatch(matchData);
      setTickets(matchData.tickets || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTicket = tickets.find(ticket => ticket.id === selectedCategory);
  const basePrice = selectedTicket ? selectedTicket.price * quantity : 0;
  const discount = appliedPromo?.discount || 0;
  const subtotal = Math.max(0, basePrice - discount);
  const adminFee = subtotal * 0.05; // 5% admin fee
  const finalTotal = subtotal + adminFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login terlebih dahulu untuk membeli tiket",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!selectedCategory) {
      toast({
        title: "Pilih Kategori Tiket",
        description: "Silakan pilih kategori tiket terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Lengkapi Data",
        description: "Silakan lengkapi semua data pembelian",
        variant: "destructive"
      });
      return;
    }

    // Navigate to payment page
    navigate(`/payment/${matchId}`, {
      state: {
        match,
        ticket: selectedTicket,
        ticketId: selectedTicket?.id,
        quantity,
        customerInfo,
        totalPrice: finalTotal,
        appliedPromo
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pertandingan tidak ditemukan</h2>
          <Button onClick={() => navigate('/tickets')}>
            Kembali ke Halaman Tiket
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Informasi Pertandingan</CardTitle>
              </CardHeader>
              <CardContent>
                  {/* Teams */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        {match.home_team_logo ? (
                          <img src={match.home_team_logo} alt={match.home_team} className="w-12 h-12 rounded-full object-cover border" />
                        ) : (
                          <span className="text-xs font-bold">{match.home_team.slice(0, 3).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{match.home_team}</p>
                        <p className="text-sm text-muted-foreground">Home</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">VS</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-bold text-right">{match.away_team}</p>
                        <p className="text-sm text-muted-foreground text-right">Away</p>
                      </div>
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        {match.away_team_logo ? (
                          <img src={match.away_team_logo} alt={match.away_team} className="w-12 h-12 rounded-full object-cover border" />
                        ) : (
                          <span className="text-xs font-bold">{match.away_team.slice(0, 3).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="mb-4">{match.competition}</Badge>

                  {/* Match Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(match.match_date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(match.match_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{match.venue}</span>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Ticket Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Pilih Kategori Tiket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.length > 0 ? tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCategory === ticket.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setSelectedCategory(ticket.id);
                      // Auto scroll to form section
                      setTimeout(() => {
                        const formSection = document.getElementById('ticket-form');
                        if (formSection) {
                          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{ticket.ticket_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.available_quantity} tiket tersedia
                        </p>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatPrice(ticket.price)}</p>
                        <p className="text-xs text-muted-foreground">per tiket</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Tiket untuk pertandingan ini belum tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quantity & Customer Info */}
            {selectedCategory && (
              <Card id="ticket-form">
                <CardHeader>
                  <CardTitle>Detail Pembelian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quantity */}
                  <div>
                    <Label htmlFor="quantity">Jumlah Tiket</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        disabled={quantity >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Informasi Pembeli</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                          placeholder="contoh@email.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">No. Telepon *</Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="idCard">No. KTP (Opsional)</Label>
                        <Input
                          id="idCard"
                          value={customerInfo.idCard}
                          onChange={(e) => setCustomerInfo({...customerInfo, idCard: e.target.value})}
                          placeholder="3201xxxxxxxxxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTicket ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Kategori:</span>
                        <span className="font-semibold">{selectedTicket.ticket_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Harga per tiket:</span>
                        <span>{formatPrice(selectedTicket.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jumlah:</span>
                        <span>{quantity} tiket</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPrice(basePrice)}</span>
                      </div>
                      
                      {/* Promo Code Section */}
                      <PromoCodeInput
                        promoType="ticket"
                        totalAmount={basePrice}
                        onPromoApplied={handlePromoApplied}
                        onPromoRemoved={handlePromoRemoved}
                        appliedPromo={appliedPromo}
                      />
                      
                      {appliedPromo && (
                        <div className="flex justify-between text-green-600">
                          <span>Diskon ({appliedPromo.code}):</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Biaya admin (5%):</span>
                        <span>{formatPrice(adminFee)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">{formatPrice(finalTotal)}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handlePurchase}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Lanjut ke Pembayaran
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Pilih kategori tiket untuk melihat ringkasan pesanan
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Tiket akan dikirim via email</p>
                  <p>• Tunjukkan e-ticket saat masuk stadion</p>
                  <p>• Tidak dapat dibatalkan atau dikembalikan</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}