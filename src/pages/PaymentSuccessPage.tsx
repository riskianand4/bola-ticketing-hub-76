import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { usePayment } from "@/context/PaymentContext";
import { supabase } from "@/integrations/supabase/client";

interface OrderData {
  id: string;
  customer_name: string;
  total_amount: number;
  payment_reference: string;
  tickets: {
    ticket_type: string;
    matches: {
      home_team: string;
      away_team: string;
    }
  }
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearPendingPayment } = usePayment();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const success = searchParams.get('success');
  const externalId = searchParams.get('external_id');

  useEffect(() => {
    // Clear pending payment when reaching success page
    clearPendingPayment();
    
    const fetchOrderData = async () => {
      if (success === 'true' && externalId) {
        try {
          const { data, error } = await supabase
            .from('ticket_orders')
            .select(`
              id,
              customer_name,
              total_amount,
              payment_reference,
              tickets!inner(
                ticket_type,
                matches!inner(
                  home_team,
                  away_team
                )
              )
            `)
            .eq('payment_reference', externalId)
            .single();

          if (error) {
            console.error('Error fetching order:', error);
          } else {
            setOrderData(data);
          }
        } catch (err) {
          console.error('Fetch error:', err);
        }

        toast.success("Pembayaran berhasil!", {
          description: "Tiket Anda akan segera dikirim ke email"
        });
      }
      setLoading(false);
    };

    fetchOrderData();
  }, [success, externalId, clearPendingPayment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Pembayaran Berhasil!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderData && (
            <div className="text-center space-y-2 mb-6">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{orderData.tickets.matches.home_team} vs {orderData.tickets.matches.away_team}</h3>
                <p className="text-sm text-muted-foreground">
                  {orderData.tickets.ticket_type} - {orderData.customer_name}
                </p>
                <p className="text-lg font-bold text-primary">
                  Rp {orderData.total_amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Terima kasih atas pembelian tiket Anda
            </p>
            <p className="text-sm text-muted-foreground">
              E-ticket akan dikirim ke email Anda dalam beberapa menit
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate(`/tickets/confirmation?external_id=${externalId}&success=true`)}
            >
              <Download className="w-4 h-4 mr-2" />
              Lihat E-ticket
            </Button>
            <Button className="w-full" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Kirim Ulang E-ticket
            </Button>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/tickets')}
            >
              Lihat Tiket Lainnya
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Kembali ke Beranda
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1 border-t pt-4">
            <p>• Tunjukkan e-ticket saat masuk stadion</p>
            <p>• Tiket tidak dapat dipindahtangankan</p>
            <p>• Hubungi customer service jika ada masalah</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}