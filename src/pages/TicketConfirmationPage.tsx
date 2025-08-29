import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Home,
  Share2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "react-qr-code";

interface TicketOrder {
  id: string;
  ticket_id: string;
  quantity: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: string;
  payment_reference: string;
  order_date: string;
  tickets: {
    ticket_type: string;
    description: string;
    price: number;
    matches: {
      home_team: string;
      away_team: string;
      home_team_logo: string;
      away_team_logo: string;
      match_date: string;
      venue: string;
      competition: string;
    }
  }
}

export default function TicketConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<TicketOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get external_id from URL params
  const externalId = searchParams.get('external_id');
  const success = searchParams.get('success');

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!externalId) {
        setError('ID transaksi tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ticket_orders')
          .select(`
            *,
            tickets!inner(
              ticket_type,
              description,
              price,
              matches!inner(
                home_team,
                away_team,
                home_team_logo,
                away_team_logo,
                match_date,
                venue,
                competition
              )
            )
          `)
          .eq('payment_reference', externalId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          setError('Tiket tidak ditemukan');
          return;
        }

        setOrderData(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Terjadi kesalahan saat mengambil data tiket');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [externalId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadTicket = () => {
    toast({
      title: "Download Dimulai",
      description: "E-ticket Anda sedang diunduh...",
    });
    // In real app, trigger actual download
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Tiket ${orderData?.tickets?.matches?.home_team} vs ${orderData?.tickets?.matches?.away_team}`,
        text: `Saya akan menonton ${orderData?.tickets?.matches?.home_team} vs ${orderData?.tickets?.matches?.away_team}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Disalin",
        description: "Link telah disalin ke clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat data tiket...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tiket Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Tiket dengan ID tersebut tidak ditemukan'}
            </p>
            <Button onClick={() => navigate('/tickets')} className="w-full">
              Kembali ke Tiket
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const match = orderData.tickets.matches;
  const ticket = orderData.tickets;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {orderData.payment_status === 'completed' ? 'Pembayaran Berhasil!' : 'E-Ticket Anda'}
          </h1>
          <p className="text-muted-foreground">
            {orderData.payment_status === 'completed' 
              ? 'Tiket Anda telah berhasil dibeli. E-ticket telah dikirim ke email Anda.'
              : 'Berikut adalah detail tiket Anda'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* E-Ticket Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center justify-between">
                  <span>E-Ticket</span>
                  <Badge variant={orderData.payment_status === 'completed' ? 'default' : 'secondary'} 
                         className={orderData.payment_status === 'completed' ? 'bg-success' : ''}>
                    {orderData.payment_status === 'completed' ? 'Valid' : orderData.payment_status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Match Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {match.home_team} vs {match.away_team}
                  </h2>
                  <Badge variant="outline" className="mb-4">{match.competition || 'Liga 1'}</Badge>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                      {match.home_team_logo ? (
                        <img src={match.home_team_logo} alt={match.home_team} className="w-12 h-12 object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {match.home_team.substring(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="font-bold">{match.home_team}</p>
                    <p className="text-xs text-muted-foreground">Home</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">VS</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                      {match.away_team_logo ? (
                        <img src={match.away_team_logo} alt={match.away_team} className="w-12 h-12 object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {match.away_team.substring(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="font-bold">{match.away_team}</p>
                    <p className="text-xs text-muted-foreground">Away</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Match Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{formatDate(match.match_date)}</p>
                      <p className="text-xs text-muted-foreground">Tanggal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{formatTime(match.match_date)} WIB</p>
                      <p className="text-xs text-muted-foreground">Waktu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{match.venue || 'Stadium TBA'}</p>
                      <p className="text-xs text-muted-foreground">Venue</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Kategori Tiket</p>
                      <p className="font-semibold">{ticket.ticket_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Tiket</p>
                      <p className="font-semibold">{orderData.quantity} tiket</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nama Pemesan</p>
                      <p className="font-semibold">{orderData.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bayar</p>
                      <p className="font-semibold text-primary">{formatPrice(orderData.total_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                    <QRCode 
                      value={orderData.id}
                      size={128}
                      level="M"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tunjukkan QR code ini saat masuk stadion
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Penting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>• Datang minimal 1 jam sebelum pertandingan dimulai</p>
                  <p>• Bawa identitas diri (KTP/SIM/Paspor) yang valid</p>
                  <p>• Tunjukkan e-ticket dan QR code saat masuk stadion</p>
                  <p>• Tiket tidak dapat dipindahtangankan atau dikembalikan</p>
                  <p>• Dilarang membawa makanan, minuman, dan benda tajam</p>
                  <p>• Ikuti protokol keamanan dan kesehatan yang berlaku</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Aksi Tiket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleDownloadTicket}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download E-Ticket
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Bagikan
                </Button>

                <Separator />

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/tickets")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Lihat Tiket Lain
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/")}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Kembali ke Beranda
                  </Button>
                </div>

                <Separator />

                {/* Transaction Details */}
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold">Detail Transaksi:</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>ID Tiket:</span>
                      <span className="font-mono text-xs">{orderData.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ref Pembayaran:</span>
                      <span className="font-mono text-xs">{orderData.payment_reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="capitalize">{orderData.payment_status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggal Order:</span>
                      <span>{new Date(orderData.order_date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Butuh Bantuan?</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hubungi customer service kami di support@persiraja.com atau 
                    WhatsApp: +62 812-3456-7890
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}