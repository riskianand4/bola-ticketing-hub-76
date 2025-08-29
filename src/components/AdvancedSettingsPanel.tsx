import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Smartphone, 
  Globe, 
  Wifi, 
  WifiOff, 
  Download, 
  Trash2,
  RefreshCw,
  Settings,
  Bell,
  Eye,
  Contrast,
  Volume2,
  Keyboard,
  MousePointer
} from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  voiceControl: boolean;
  clickSounds: boolean;
  vibration: boolean;
}

interface PerformanceSettings {
  cacheSize: number;
  offlineMode: boolean;
  backgroundSync: boolean;
  imageOptimization: boolean;
  autoUpdate: boolean;
  dataCompression: boolean;
}

export function AdvancedSettingsPanel() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    keyboardNavigation: true,
    screenReader: false,
    voiceControl: false,
    clickSounds: false,
    vibration: true
  });

  const [performance, setPerformance] = useState<PerformanceSettings>({
    cacheSize: 50,
    offlineMode: true,
    backgroundSync: true,
    imageOptimization: true,
    autoUpdate: true,
    dataCompression: true
  });

  useEffect(() => {
    // Check online status
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Check PWA support
    setSupportsPWA('serviceWorker' in navigator && 'PushManager' in window);

    // Check if app is installed
    window.addEventListener('beforeinstallprompt', () => {
      setIsInstalled(false);
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-advanced.js')
        .then((registration) => {
          setSwRegistration(registration);
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Load settings from localStorage
    loadSettings();

    // Calculate cache size
    calculateCacheSize();

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const loadSettings = () => {
    const savedAccessibility = localStorage.getItem('accessibility-settings');
    const savedPerformance = localStorage.getItem('performance-settings');

    if (savedAccessibility) {
      setAccessibility(JSON.parse(savedAccessibility));
    }

    if (savedPerformance) {
      setPerformance(JSON.parse(savedPerformance));
    }

    // Apply accessibility settings
    applyAccessibilitySettings(savedAccessibility ? JSON.parse(savedAccessibility) : accessibility);
  };

  const saveSettings = (type: 'accessibility' | 'performance', settings: any) => {
    localStorage.setItem(`${type}-settings`, JSON.stringify(settings));
    
    if (type === 'accessibility') {
      applyAccessibilitySettings(settings);
    }
  };

  const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.style.setProperty('--contrast-filter', 'contrast(150%)');
    } else {
      root.style.removeProperty('--contrast-filter');
    }

    // Large text
    if (settings.largeText) {
      root.style.setProperty('--base-font-size', '18px');
    } else {
      root.style.setProperty('--base-font-size', '16px');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.setAttribute('data-keyboard-nav', 'true');
    } else {
      root.removeAttribute('data-keyboard-nav');
    }
  };

  const calculateCacheSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = estimate.usage ? Math.round(estimate.usage / 1024 / 1024) : 0;
        setCacheSize(usedMB);
      } catch (error) {
        console.error('Error calculating cache size:', error);
      }
    }
  };

  const clearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear localStorage (except settings)
      const settingsKeys = ['accessibility-settings', 'performance-settings'];
      const itemsToKeep: { [key: string]: string } = {};
      
      settingsKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) itemsToKeep[key] = value;
      });
      
      localStorage.clear();
      
      Object.entries(itemsToKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      await calculateCacheSize();
      toast.success("Cache berhasil dibersihkan");
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error("Gagal membersihkan cache");
    }
  };

  const installPWA = async () => {
    // This would be triggered by the beforeinstallprompt event
    toast.info("Fitur install PWA akan segera tersedia");
  };

  const updateServiceWorker = async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        toast.success("Service Worker berhasil diperbarui");
      } catch (error) {
        console.error('Error updating service worker:', error);
        toast.error("Gagal memperbarui Service Worker");
      }
    }
  };

  const updateAccessibility = (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...accessibility, [key]: value };
    setAccessibility(newSettings);
    saveSettings('accessibility', newSettings);
  };

  const updatePerformance = (key: keyof PerformanceSettings, value: boolean | number) => {
    const newSettings = { ...performance, [key]: value };
    setPerformance(newSettings);
    saveSettings('performance', newSettings);
  };

  const exportSettings = () => {
    const allSettings = {
      accessibility,
      performance,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `persiraja-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Pengaturan berhasil diekspor");
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        if (imported.accessibility) {
          setAccessibility(imported.accessibility);
          saveSettings('accessibility', imported.accessibility);
        }
        
        if (imported.performance) {
          setPerformance(imported.performance);
          saveSettings('performance', imported.performance);
        }
        
        toast.success("Pengaturan berhasil diimpor");
      } catch (error) {
        toast.error("File pengaturan tidak valid");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status Koneksi</p>
                <p className="font-semibold">{isOnline ? "Online" : "Offline"}</p>
              </div>
              {isOnline ? 
                <Wifi className="h-5 w-5 text-success" /> : 
                <WifiOff className="h-5 w-5 text-destructive" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PWA Status</p>
                <p className="font-semibold">{supportsPWA ? "Didukung" : "Tidak Didukung"}</p>
              </div>
              <Smartphone className={`h-5 w-5 ${supportsPWA ? "text-success" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Size</p>
                <p className="font-semibold">{cacheSize} MB</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearCache}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PWA Installation */}
      {supportsPWA && !isInstalled && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Install aplikasi ini untuk pengalaman yang lebih baik</span>
            <Button size="sm" onClick={installPWA}>
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Accessibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aksesibilitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Kontras Tinggi</Label>
                <p className="text-sm text-muted-foreground">Tingkatkan kontras warna</p>
              </div>
              <Switch
                checked={accessibility.highContrast}
                onCheckedChange={(checked) => updateAccessibility('highContrast', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Teks Besar</Label>
                <p className="text-sm text-muted-foreground">Perbesar ukuran teks</p>
              </div>
              <Switch
                checked={accessibility.largeText}
                onCheckedChange={(checked) => updateAccessibility('largeText', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Kurangi Animasi</Label>
                <p className="text-sm text-muted-foreground">Matikan animasi dan transisi</p>
              </div>
              <Switch
                checked={accessibility.reducedMotion}
                onCheckedChange={(checked) => updateAccessibility('reducedMotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Navigasi Keyboard</Label>
                <p className="text-sm text-muted-foreground">Aktifkan navigasi dengan keyboard</p>
              </div>
              <Switch
                checked={accessibility.keyboardNavigation}
                onCheckedChange={(checked) => updateAccessibility('keyboardNavigation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Suara Klik</Label>
                <p className="text-sm text-muted-foreground">Feedback suara untuk interaksi</p>
              </div>
              <Switch
                checked={accessibility.clickSounds}
                onCheckedChange={(checked) => updateAccessibility('clickSounds', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Getaran</Label>
                <p className="text-sm text-muted-foreground">Haptic feedback</p>
              </div>
              <Switch
                checked={accessibility.vibration}
                onCheckedChange={(checked) => updateAccessibility('vibration', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Performa & Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode Offline</Label>
                <p className="text-sm text-muted-foreground">Simpan data untuk akses offline</p>
              </div>
              <Switch
                checked={performance.offlineMode}
                onCheckedChange={(checked) => updatePerformance('offlineMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Background Sync</Label>
                <p className="text-sm text-muted-foreground">Sinkronisasi otomatis di background</p>
              </div>
              <Switch
                checked={performance.backgroundSync}
                onCheckedChange={(checked) => updatePerformance('backgroundSync', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Optimasi Gambar</Label>
                <p className="text-sm text-muted-foreground">Kompres gambar secara otomatis</p>
              </div>
              <Switch
                checked={performance.imageOptimization}
                onCheckedChange={(checked) => updatePerformance('imageOptimization', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Update</Label>
                <p className="text-sm text-muted-foreground">Update aplikasi secara otomatis</p>
              </div>
              <Switch
                checked={performance.autoUpdate}
                onCheckedChange={(checked) => updatePerformance('autoUpdate', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Kompresi Data</Label>
                <p className="text-sm text-muted-foreground">Kurangi penggunaan data</p>
              </div>
              <Switch
                checked={performance.dataCompression}
                onCheckedChange={(checked) => updatePerformance('dataCompression', checked)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={updateServiceWorker}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update SW
            </Button>
            <Button variant="outline" size="sm" onClick={clearCache}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="outline" size="sm" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: 'none' }}
                id="import-settings"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('import-settings')?.click()}
              >
                <Globe className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle>Kompatibilitas Browser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Service Worker</span>
              <Badge variant={('serviceWorker' in navigator) ? "default" : "destructive"}>
                {('serviceWorker' in navigator) ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Push API</span>
              <Badge variant={('PushManager' in window) ? "default" : "destructive"}>
                {('PushManager' in window) ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Cache API</span>
              <Badge variant={('caches' in window) ? "default" : "destructive"}>
                {('caches' in window) ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>IndexedDB</span>
              <Badge variant={('indexedDB' in window) ? "default" : "destructive"}>
                {('indexedDB' in window) ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}