import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineContent, setShowOfflineContent] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Koneksi internet kembali tersedia");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Koneksi internet terputus");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleShowOfflineContent = () => {
    setShowOfflineContent(true);
    // In a real app, this would load cached content
    toast.info("Menampilkan konten yang tersimpan secara lokal");
  };

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 mx-4">
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong className="text-orange-800 dark:text-orange-200">Koneksi Terputus</strong>
            <br />
            <span className="text-orange-700 dark:text-orange-300">
              Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
            </span>
          </div>
          <div className="flex gap-2 ml-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleShowOfflineContent}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Lihat Konten Tersimpan
            </Button>
            <Button 
              size="sm" 
              onClick={handleRefresh}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Coba Lagi
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {showOfflineContent && (
        <div className="mt-2 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Konten Offline Tersedia:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Berita yang sudah pernah dibaca</li>
            <li>• Data profil Anda</li>
            <li>• Riwayat tiket yang sudah dibeli</li>
            <li>• Keranjang belanja (akan disinkronkan saat online)</li>
          </ul>
        </div>
      )}
    </div>
  );
}