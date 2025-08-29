import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Mohon masukkan email Anda!");
      return;
    }
    setIsSubmitted(true);
    toast.success("Email reset password telah dikirim!", {
      description: "Periksa kotak masuk email Anda"
    });
  };
  if (isSubmitted) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Email Terkirim!</h2>
                  <p className="text-muted-foreground text-sm">
                    Kami telah mengirim link reset password ke email{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <Button className="w-full" onClick={() => window.open(`mailto:${email}`, '_blank')}>
                    Buka Email
                  </Button>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Kembali ke Login
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tidak menerima email? Periksa folder spam atau{" "}
                  <button onClick={() => setIsSubmitted(false)} className="text-primary hover:underline">
                    kirim ulang
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Lupa Password?</CardTitle>
            <CardDescription>
              Masukkan email Anda dan kami akan mengirim link untuk reset password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg">
                Kirim Link Reset Password
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali ke halaman login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}