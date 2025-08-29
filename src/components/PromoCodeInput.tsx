import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PromoCodeInputProps {
  promoType: 'ticket' | 'merchandise';
  totalAmount: number;
  onPromoApplied: (discount: number, promoId: string, promoCode: string) => void;
  onPromoRemoved: () => void;
  appliedPromo?: {
    code: string;
    discount: number;
    id: string;
  } | null;
  disabled?: boolean;
}

export function PromoCodeInput({ 
  promoType, 
  totalAmount, 
  onPromoApplied, 
  onPromoRemoved, 
  appliedPromo,
  disabled = false 
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Masukkan kode promo');
      return;
    }

    if (totalAmount <= 0) {
      toast.error('Total pembelian harus lebih dari 0');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        _code: promoCode.toUpperCase(),
        _promo_type: promoType,
        _purchase_amount: totalAmount
      });

      if (error) throw error;

      const result = data[0];
      if (result.valid) {
        onPromoApplied(result.discount_amount, result.promo_id, promoCode.toUpperCase());
        toast.success(result.message);
        setPromoCode('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Gagal memvalidasi kode promo');
    } finally {
      setLoading(false);
    }
  };

  const removePromo = () => {
    onPromoRemoved();
    toast.info('Kode promo dihapus');
  };

  if (appliedPromo) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Kode Promo</span>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Tag className="h-3 w-3" />
            {appliedPromo.code}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={removePromo}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            Diskon diterapkan
          </span>
          <span className="font-medium text-green-600">
            -Rp {appliedPromo.discount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Punya kode promo?</span>
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Masukkan kode promo"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && validatePromoCode()}
          disabled={loading || disabled}
          className="uppercase"
        />
        <Button 
          onClick={validatePromoCode}
          disabled={loading || disabled || !promoCode.trim()}
          variant="outline"
        >
          {loading ? 'Validasi...' : 'Terapkan'}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Berlaku untuk {promoType === 'ticket' ? 'tiket' : 'merchandise'}
      </div>
    </div>
  );
}