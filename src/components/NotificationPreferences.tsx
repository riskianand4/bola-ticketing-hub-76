import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, BellOff, TestTube, Settings, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function NotificationPreferences() {
  const { isAuthenticated } = useAuth();
  const {
    isSupported,
    permission,
    preferences,
    loading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updatePreferences,
    sendTestNotification,
    isEnabled,
  } = usePushNotifications();

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pengaturan Notifikasi
          </CardTitle>
          <CardDescription>
            Silakan login terlebih dahulu untuk mengatur notifikasi
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pengaturan Notifikasi
          </CardTitle>
          <CardDescription>Memuat pengaturan...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }
      await subscribeToPush();
    } else {
      await unsubscribeFromPush();
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    if (!preferences) return;
    updatePreferences({ [key]: value });
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-success text-success-foreground">Diizinkan</Badge>;
      case 'denied':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary" className="text-[9px]">Belum Diatur</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Pengaturan Notifikasi
        </CardTitle>
        <CardDescription>
          Kelola preferensi notifikasi push untuk mendapatkan update terbaru
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Support & Permission Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Status Browser</Label>
              <p className="text-xs text-muted-foreground">
                {isSupported ? 'Push notifications didukung' : 'Push notifications tidak didukung'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isSupported ? "default" : "secondary"} className="text-[9px]">
                {isSupported ? 'Didukung' : 'Tidak Didukung'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Izin Notifikasi</Label>
              <p className="text-xs text-muted-foreground w-52 sm:w-full">
                Status izin browser untuk menampilkan notifikasi
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs ">
              {getPermissionBadge()}
            </div>
          </div>
        </div>

        <Separator />

        {/* Push Notifications Master Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-enabled" className="text-sm font-medium">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Aktifkan untuk menerima notifikasi push di browser
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={isEnabled}
              onCheckedChange={handlePushToggle}
              disabled={!isSupported}
            />
          </div>

          {isEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestNotification}
              className="w-full"
              disabled={permission !== 'granted'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Kirim Test Notification
            </Button>
          )}
        </div>

        <Separator />

        {/* Notification Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-sm font-medium">Jenis Notifikasi</Label>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="match-reminders" className="text-sm">
                  Pengingat Pertandingan
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi 30 menit sebelum pertandingan dimulai
                </p>
              </div>
              <Switch
                id="match-reminders"
                checked={preferences?.match_reminders || false}
                onCheckedChange={(checked) => handlePreferenceChange('match_reminders', checked)}
                disabled={!isEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="goal-alerts" className="text-sm">
                  Alert Goal & Kartu
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi saat ada goal, kartu merah/kuning
                </p>
              </div>
              <Switch
                id="goal-alerts"
                checked={preferences?.goal_alerts || false}
                onCheckedChange={(checked) => handlePreferenceChange('goal_alerts', checked)}
                disabled={!isEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="ticket-alerts" className="text-sm">
                  Alert Tiket
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi ketersediaan tiket & konfirmasi pembelian
                </p>
              </div>
              <Switch
                id="ticket-alerts"
                checked={preferences?.ticket_alerts || false}
                onCheckedChange={(checked) => handlePreferenceChange('ticket_alerts', checked)}
                disabled={!isEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="news-alerts" className="text-sm">
                  Berita & Pengumuman
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi berita terbaru dan pengumuman penting
                </p>
              </div>
              <Switch
                id="news-alerts"
                checked={preferences?.news_alerts || false}
                onCheckedChange={(checked) => handlePreferenceChange('news_alerts', checked)}
                disabled={!isEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="merchandise-alerts" className="text-sm">
                  Merchandise
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi produk baru dan restock merchandise
                </p>
              </div>
              <Switch
                id="merchandise-alerts"
                checked={preferences?.merchandise_alerts || false}
                onCheckedChange={(checked) => handlePreferenceChange('merchandise_alerts', checked)}
                disabled={!isEnabled}
              />
            </div>
          </div>
        </div>

        {!isSupported && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BellOff className="h-4 w-4" />
              <p className="text-sm font-medium">Browser Tidak Didukung</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Browser Anda tidak mendukung push notifications. 
              Silakan gunakan browser modern seperti Chrome, Firefox, atau Safari.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}