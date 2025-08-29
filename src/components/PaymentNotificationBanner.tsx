import { X, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePayment } from "@/context/PaymentContext";
import { toast } from "sonner";

export function PaymentNotificationBanner() {
  const { pendingPayment, clearPendingPayment } = usePayment();

  if (!pendingPayment) return null;

  const handleContinuePayment = () => {
    window.open(pendingPayment.paymentUrl, '_blank');
  };

  const handleCancelPayment = () => {
    clearPendingPayment();
    toast.success("Pembayaran dibatalkan");
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-orange-500 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Anda memiliki pembayaran yang belum diselesaikan
            </p>
            <p className="text-xs opacity-90">
              {pendingPayment.description} - Rp {pendingPayment.amount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleContinuePayment}
            className="bg-white text-orange-600 hover:bg-gray-100 text-xs px-3 py-1"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Lanjut Bayar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelPayment}
            className="text-white hover:bg-orange-600 text-xs px-2 py-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}