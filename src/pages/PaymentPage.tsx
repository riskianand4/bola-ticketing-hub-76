import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Smartphone, Building, QrCode, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/xendit";
import { usePayment } from "@/context/PaymentContext";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPendingPayment } = usePayment();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get order data from location state
  const orderData = location.state;

  if (!orderData) {
    navigate("/tickets");
    return null;
  }

  const { match, ticket, quantity, customerInfo, totalPrice } = orderData;

  const paymentMethods = [
    {
      id: "credit-card",
      name: "Kartu Kredit/Debit",
      icon: CreditCard,
      description: "Visa, Mastercard, JCB",
      processingTime: "Instan"
    },
    {
      id: "gopay",
      name: "GoPay",
      icon: Smartphone,
      description: "Bayar dengan GoPay",
      processingTime: "Instan"
    },
    {
      id: "ovo",
      name: "OVO",
      icon: Smartphone,
      description: "Bayar dengan OVO",
      processingTime: "Instan"
    },
    {
      id: "dana",
      name: "DANA",
      icon: Smartphone,
      description: "Bayar dengan DANA",
      processingTime: "Instan"
    },
    {
      id: "bank-transfer",
      name: "Transfer Bank",
      icon: Building,
      description: "BCA, Mandiri, BNI, BRI",
      processingTime: "1-3 menit"
    },
    {
      id: "qris",
      name: "QRIS",
      icon: QrCode,
      description: "Scan QR dengan aplikasi bank",
      processingTime: "Instan"
    }
  ];

  const formatPrice = (price: number) => {
    return formatCurrency(price);
  };

  const handlePayment = async () => {
    if (!selectedPayment) {
      toast.error("Pilih Metode Pembayaran", {
        description: "Silakan pilih metode pembayaran terlebih dahulu"
      });
      return;
    }

    if (!user) {
      toast.error("Tidak terautentikasi", {
        description: "Silakan login terlebih dahulu"
      });
      return;
    }

    console.log('Starting payment process...');
    console.log('Payment data:', {
      totalPrice,
      match: match.home_team + ' vs ' + match.away_team,
      customerInfo,
      ticketId: orderData.ticketId,
      quantity
    });

    setIsProcessing(true);

    try {
      // Use Xendit edge function for secure payment processing
      const { data, error } = await supabase.functions.invoke('xendit-payment', {
        body: {
          type: 'ticket',
          amount: totalPrice,
          description: `Tiket ${match.home_team} vs ${match.away_team}`,
          customer_data: {
            given_names: customerInfo.name,
            email: customerInfo.email,
            mobile_number: customerInfo.phone,
          },
          ticket_id: orderData.ticketId,
          quantity: quantity,
          redirect_url: {
            success: `${window.location.origin}/tickets/confirmation?success=true`,
            failure: `${window.location.origin}/payment-failed`
          }
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create payment');
      }

      if (!data) {
        throw new Error('No data received from payment service');
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment creation failed');
      }

      // Store pending payment info
      const pendingPaymentInfo = {
        paymentUrl: data.payment_url,
        externalId: data.external_id,
        amount: totalPrice,
        description: `Tiket ${match.home_team} vs ${match.away_team}`,
        createdAt: new Date()
      };
      
      setPendingPayment(pendingPaymentInfo);
      
      // Redirect to Xendit payment page
      if (data.payment_url) {
        console.log('Redirecting to payment URL:', data.payment_url);
        window.location.href = data.payment_url;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error("Gagal membuat pembayaran", {
        description: error.message || "Terjadi kesalahan, silakan coba lagi"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Pilih Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={method.id} className="font-semibold cursor-pointer">
                                {method.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {method.processingTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Form */}
            {selectedPayment === "credit-card" && (
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Kartu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Nomor Kartu</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Tanggal Kadaluarsa</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardName">Nama di Kartu</Label>
                    <Input
                      id="cardName"
                      placeholder="Nama sesuai kartu"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Match Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold">{match.home_team} vs {match.away_team}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(match.match_date).toLocaleDateString('id-ID')} | {new Date(match.match_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {match.venue}
                  </p>
                  <Badge variant="outline">{match.competition}</Badge>
                </div>

                <Separator />

                {/* Ticket Details */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Kategori:</span>
                    <span className="font-semibold">{ticket.ticket_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah:</span>
                    <span>{quantity} tiket</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Informasi Pembeli:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{customerInfo.name}</p>
                    <p>{customerInfo.email}</p>
                    <p>{customerInfo.phone}</p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={!selectedPayment || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Memproses Pembayaran...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Bayar Sekarang
                    </>
                  )}
                </Button>

                {/* Security Info */}
                <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Transaksi aman dengan enkripsi SSL</span>
                  </div>
                  <p>• Data kartu tidak disimpan di server kami</p>
                  <p>• Pembayaran diproses oleh payment gateway terpercaya</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
