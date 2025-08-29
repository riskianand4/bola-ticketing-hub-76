import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePayment } from '@/context/PaymentContext';
import { supabase } from '@/integrations/supabase/client';

interface XenditPaymentButtonProps {
  amount: number;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  orderData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function XenditPaymentButton({
  amount,
  description,
  customerInfo,
  orderData,
  onSuccess,
  onError,
  className,
  children
}: XenditPaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { setPendingPayment } = usePayment();

  const handlePayment = async () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    setIsProcessing(true);

    try {
      const externalId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Call the xendit-payment edge function
      const { data, error } = await supabase.functions.invoke('xendit-payment', {
        body: {
          external_id: externalId,
          amount: amount,
          description: description,
          customer: {
            given_names: customerInfo.name,
            email: customerInfo.email,
            mobile_number: customerInfo.phone,
          },
          success_redirect_url: `${window.location.origin}/payment-success?external_id=${externalId}&success=true`,
          failure_redirect_url: `${window.location.origin}/payment-failed`,
          items: [{
            name: description,
            quantity: 1,
            price: amount
          }]
        }
      });

      if (error) throw error;

      const invoice = data.invoice;

      // Save to database if orderData provided
      if (orderData) {
        // Save based on order type
        if (orderData.type === 'ticket') {
          await supabase.from('ticket_orders').insert({
            user_id: user.id,
            ticket_id: orderData.ticket_id,
            quantity: orderData.quantity || 1,
            total_amount: amount,
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            customer_phone: customerInfo.phone,
            payment_status: 'pending',
            payment_reference: externalId,
            order_date: new Date().toISOString()
          });
        } else if (orderData.type === 'merchandise') {
          await supabase.from('merchandise_orders').insert({
            user_id: user.id,
            total_amount: amount,
            shipping_address: orderData.shipping_address || '',
            payment_status: 'pending',
            payment_reference: externalId,
            order_status: 'processing'
          });
        }
      }

      // Set pending payment for banner notification
      setPendingPayment({
        paymentUrl: invoice.invoice_url,
        externalId: externalId,
        amount: amount,
        description: description,
        createdAt: new Date()
      });

      // Call success callback
      if (onSuccess) {
        onSuccess({ invoice, externalId });
      }

      // Redirect to payment page
      window.location.href = invoice.invoice_url;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error("Gagal membuat pembayaran", {
        description: error.message || "Terjadi kesalahan, silakan coba lagi"
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Memproses...
        </>
      ) : children ? children : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Bayar Sekarang
        </>
      )}
    </Button>
  );
}