import React from "react";
import { ArrowLeft, Users, ShoppingBag, Image as ImageIcon, Users2, Settings, ListVideoIcon, Bell, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AdminRoute } from "@/components/AdminRoute";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminMorePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const moreItems = [
    { 
      id: "users", 
      label: "Kelola Pengguna", 
      icon: Users,
      description: "Manage user accounts and permissions"
    },
    { 
      id: "commentary", 
      label: "Kelola Live Comentary", 
      icon: ListVideoIcon,
      description: "Manage Live Comentary"
    },
    { 
      id: "promo-codes", 
      label: "Kelola Promo", 
      icon: Tag,
      description: "Manage Promo and Discounts"
    },
    { 
      id: "merchandise", 
      label: "Kelola Merchandise", 
      icon: ShoppingBag,
      description: "Manage products and inventory"
    },
    { 
      id: "gallery", 
      label: "Kelola Galeri", 
      icon: ImageIcon,
      description: "Manage photo gallery and media"
    },
    { 
      id: "notifications", 
      label: "Kelola notification", 
      icon: Bell,
      description: "Manage notification"
    },
    { 
      id: "scanners", 
      label: "Kelola Scanner", 
      icon: ImageIcon,
      description: "Manage User Scanner "
    },
    { 
      id: "players", 
      label: "Kelola Pemain", 
      icon: Users2,
      description: "Manage team players and profiles"
    },
    { 
      id: "settings", 
      label: "Pengaturan", 
      icon: Settings,
      description: "Application settings and configuration"
    },
  ];

  const handleItemClick = (itemId: string) => {
    navigate(`/admin?tab=${itemId}`);
  };

  const handleBackClick = () => {
    navigate('/admin');
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center px-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBackClick}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <img 
              src="/icons/persiraja-logo.png" 
              alt="Persiraja Logo" 
              className="h-8 w-8"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground">Menu Lainnya</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </header>

        <div className="p-2 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <Card 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleItemClick(item.id)}
                >
                  <CardContent className="flex items-center space-x-4 p-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground">
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminMorePage;