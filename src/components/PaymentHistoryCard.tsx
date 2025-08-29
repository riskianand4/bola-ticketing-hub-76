import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Receipt, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";

interface PaymentHistoryItem {
  id: string;
  amount: number;
  description: string;
  payment_method: string;
  payment_status: string;
  payment_reference: string;
  created_at: string;
  payment_url?: string;
}

interface PaymentHistoryCardProps {
  payment: PaymentHistoryItem;
}

export function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">Berhasil</Badge>;
      case "pending":
        return <Badge variant="secondary">Menunggu</Badge>;
      case "failed":
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadReceipt = () => {
    // In a real implementation, this would generate a PDF receipt
    toast.success("Receipt akan segera diunduh");
  };

  const handleResendEmail = () => {
    toast.success("Email konfirmasi pembayaran telah dikirim ulang");
  };

  const handleRetryPayment = () => {
    if (payment.payment_url) {
      window.open(payment.payment_url, '_blank');
    } else {
      toast.error("Link pembayaran tidak tersedia");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{payment.description}</CardTitle>
          {getStatusBadge(payment.payment_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Jumlah:</span>
            <p className="font-semibold text-primary">{formatPrice(payment.amount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Metode:</span>
            <p className="font-medium">{payment.payment_method || 'Online Payment'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Referensi:</span>
            <p className="font-mono text-xs">{payment.payment_reference}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tanggal:</span>
            <p>{formatDate(payment.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {payment.payment_status === 'completed' && (
            <>
              <Button size="sm" variant="outline" onClick={handleDownloadReceipt}>
                <Download className="h-3 w-3 mr-1" />
                Receipt
              </Button>
              <Button size="sm" variant="outline" onClick={handleResendEmail}>
                <Mail className="h-3 w-3 mr-1" />
                Kirim Email
              </Button>
            </>
          )}
          
          {payment.payment_status === 'pending' && (
            <Button size="sm" onClick={handleRetryPayment}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Lanjut Bayar
            </Button>
          )}
          
          {payment.payment_status === 'failed' && (
            <Button size="sm" variant="outline" onClick={handleRetryPayment}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Coba Lagi
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}