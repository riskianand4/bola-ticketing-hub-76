
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  HelpCircle, 
  Shield, 
  Star, 
  Share2, 
  Download,
  Bell,
  Globe,
  CreditCard,
  Users,
  Images
} from "lucide-react";
import { toast } from "sonner";

export default function MorePage() {
  const navigate = useNavigate();
  const menuItems = [
    {
      icon: Images,
      title: "Galeri",
      description: "Lihat foto dan video Persiraja",
      action: "gallery"
    },
    {
      icon: Star,
      title: "Beri Rating",
      description: "Bantu kami dengan memberikan rating di Play Store",
      action: "rating"
    },
    {
      icon: HelpCircle,
      title: "Bantuan & FAQ",
      description: "Temukan jawaban untuk pertanyaan Anda",
      action: "help"
    },
    {
      icon: Shield,
      title: "Kebijakan Privasi",
      description: "Pelajari bagaimana kami melindungi data Anda",
      action: "privacy"
    },
    {
      icon: Globe,
      title: "Tentang Kami",
      description: "Pelajari lebih lanjut tentang aplikasi ini",
      action: "about"
    }
  ];

  const handleMenuClick = (action: string) => {
    console.log(`Clicked: ${action}`);
    if (action === "about") {
      navigate("/about");
    } else if (action === "gallery") {
      navigate("/gallery");
    } else {
      toast.info(`${action} clicked`, {
        description: "Fitur akan segera tersedia"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 md:pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Lainnya</h1>
          <p className="text-muted-foreground text-lg">
            Pengaturan, bantuan, dan fitur tambahan
          </p>
        </div>
        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleMenuClick(item.action)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
