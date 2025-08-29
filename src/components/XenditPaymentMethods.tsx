import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Smartphone, Building, QrCode, Wallet, Zap } from "lucide-react";

export const XenditPaymentMethods = () => {
  const paymentMethods = [
    {
      category: "E-Wallet",
      icon: Smartphone,
      methods: [
        { name: "GoPay", description: "Pembayaran instant via GoPay", processing: "Instant" },
        { name: "OVO", description: "Pembayaran via OVO Points atau OVO Cash", processing: "Instant" },
        { name: "DANA", description: "Pembayaran digital DANA", processing: "Instant" },
        { name: "LinkAja", description: "Pembayaran via LinkAja", processing: "Instant" },
        { name: "ShopeePay", description: "Pembayaran via ShopeePay", processing: "Instant" }
      ]
    },
    {
      category: "Virtual Account",
      icon: Building,
      methods: [
        { name: "BCA Virtual Account", description: "Transfer via ATM/Mobile Banking BCA", processing: "1-3 menit" },
        { name: "Mandiri Virtual Account", description: "Transfer via ATM/Mobile Banking Mandiri", processing: "1-3 menit" },
        { name: "BNI Virtual Account", description: "Transfer via ATM/Mobile Banking BNI", processing: "1-3 menit" },
        { name: "BRI Virtual Account", description: "Transfer via ATM/Mobile Banking BRI", processing: "1-3 menit" },
        { name: "Permata Virtual Account", description: "Transfer via ATM/Mobile Banking Permata", processing: "1-3 menit" }
      ]
    },
    {
      category: "Kartu Kredit/Debit",
      icon: CreditCard,
      methods: [
        { name: "Visa", description: "Kartu Kredit/Debit Visa", processing: "Instant" },
        { name: "Mastercard", description: "Kartu Kredit/Debit Mastercard", processing: "Instant" },
        { name: "JCB", description: "Kartu Kredit/Debit JCB", processing: "Instant" },
        { name: "American Express", description: "Kartu Kredit American Express", processing: "Instant" }
      ]
    },
    {
      category: "QR Code",
      icon: QrCode,
      methods: [
        { name: "QRIS", description: "Scan QR dengan aplikasi bank atau e-wallet", processing: "Instant" },
        { name: "GoPay QR", description: "Scan QR khusus GoPay", processing: "Instant" }
      ]
    },
    {
      category: "Retail Store",
      icon: Building,
      methods: [
        { name: "Alfamart", description: "Bayar di kasir Alfamart terdekat", processing: "Instant" },
        { name: "Indomaret", description: "Bayar di kasir Indomaret terdekat", processing: "Instant" }
      ]
    },
    {
      category: "Paylater",
      icon: Zap,
      methods: [
        { name: "Kredivo", description: "Bayar nanti dengan Kredivo", processing: "Instant" },
        { name: "Akulaku", description: "Cicilan 0% dengan Akulaku", processing: "Instant" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Metode Pembayaran Tersedia</h2>
        <p className="text-muted-foreground">
          Kami menyediakan berbagai metode pembayaran yang aman dan terpercaya melalui Xendit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.category} className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-primary" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.methods.map((method) => (
                    <div key={method.name} className="border-l-2 border-primary/20 pl-3">
                      <h4 className="font-semibold text-sm">{method.name}</h4>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">{method.processing}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Keamanan Pembayaran</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Enkripsi SSL 256-bit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>PCI DSS Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Data tidak disimpan</span>
          </div>
        </div>
      </div>
    </div>
  );
};