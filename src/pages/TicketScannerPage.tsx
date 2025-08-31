import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  LogOut,
  Scan,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  QrCode,
  History,
  BarChart3,
  Calendar,
  Users,
  FileText,
  Camera,
  Hand,
  TrendingUp,
  Clock,
  Shield,
  Info,
  Flashlight,
  FlashlightOff,
  Volume2,
  VolumeX,
} from "lucide-react";

interface ScannerUser {
  id: string;
  username: string;
  full_name: string;
  is_active: boolean;
}

interface ScanResult {
  success: boolean;
  message: string;
  ticket_info?: {
    customer_name: string;
    ticket_type: string;
    match_info: string;
    match_date: string;
    quantity: number;
    scanned_at?: string;
  };
}

interface ScanHistoryItem {
  id: string;
  ticket_order_id: string;
  customer_name: string;
  ticket_type: string;
  match_info: string;
  quantity: number;
  scanned_at: string;
  status: "success" | "failed";
}

interface ScanStats {
  total_scans: number;
  successful_scans: number;
  today_scans: number;
  unique_customers: number;
}

export default function TicketScannerPage() {
  const [scannerUser, setScannerUser] = useState<ScannerUser | null>(null);
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats>({
    total_scans: 0,
    successful_scans: 0,
    today_scans: 0,
    unique_customers: 0,
  });
  const [scanMethod, setScanMethod] = useState<"manual" | "barcode">("manual");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeSupported, setBarcodeSupported] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [scanningAnimation, setScanningAnimation] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  // ZXing barcode reader
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Audio feedback
  const playSound = useCallback((type: 'success' | 'error' | 'scan') => {
    if (!soundEnabled) return;
    
    const audio = new Audio();
    const frequency = type === 'success' ? 800 : type === 'error' ? 300 : 600;
    const duration = type === 'scan' ? 100 : 200;
    
    // Create audio context for beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.debug('Audio feedback not available:', error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    // Check scanner user authentication
    const storedUser = localStorage.getItem('scanner_user');
    if (storedUser) {
      setScannerUser(JSON.parse(storedUser));
    }
    
    // Initialize ZXing reader
    readerRef.current = new BrowserMultiFormatReader();
    
    // Check camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setBarcodeSupported(false);
      console.warn("Camera API not available on this device");
    }

    // Check secure context
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setBarcodeSupported(false);
      toast.error("Kamera butuh HTTPS atau pakai localhost.");
    }
    
    // Check camera permissions
    checkCameraPermission();
    
    // Load available cameras
    loadAvailableCameras();
    
    // Load scan history
    loadScanHistory();
    
    return () => {
      // Cleanup will be handled in stopBarcodeScanning
      stopBarcodeScanning();
    };
  }, []);
  
  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state);
      
      result.addEventListener('change', () => {
        setCameraPermission(result.state);
      });
    } catch (error) {
      console.debug('Permission API not available:', error);
    }
  };
  
  const loadAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      
      // Select rear camera by default
      const rearCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      );
      
      if (rearCamera) {
        setSelectedCameraId(rearCamera.deviceId);
      } else if (cameras.length > 0) {
        setSelectedCameraId(cameras[0].deviceId);
      }
    } catch (error) {
      console.debug('Could not enumerate devices:', error);
    }
  };
  
  const loadScanHistory = async () => {
    try {
      // For now, just initialize empty history
      // Real implementation would load from database when relations are fixed
      setScanHistory([]);
    } catch (error) {
      console.debug('Could not load scan history:', error);
    }
  };

  // Real ticket validation function
  const validateTicket = async (ticketOrderId: string): Promise<ScanResult> => {
    try {
      // Check if ticket order exists and is valid
      const { data: ticketOrder, error: orderError } = await supabase
        .from('ticket_orders')
        .select('*')
        .eq('id', ticketOrderId)
        .eq('payment_status', 'paid')
        .single();
        
      if (orderError || !ticketOrder) {
        return {
          success: false,
          message: "Tiket tidak ditemukan atau belum dibayar"
        };
      }
      
      // Check if ticket has already been scanned
      const { data: existingScan, error: scanError } = await supabase
        .from('ticket_scans')
        .select('*')
        .eq('ticket_order_id', ticketOrderId)
        .single();
        
      if (!scanError && existingScan) {
        return {
          success: false,
          message: `Tiket sudah pernah di-scan pada ${new Date(existingScan.scanned_at).toLocaleString('id-ID')}`
        };
      }
      
      // Record the scan
      const { error: insertError } = await supabase
        .from('ticket_scans')
        .insert({
          ticket_order_id: ticketOrderId,
          scanner_user_id: scannerUser?.id
        });
        
      if (insertError) {
        console.error('Failed to record scan:', insertError);
        return {
          success: false,
          message: "Gagal merekam scanning tiket"
        };
      }
      
      return {
        success: true,
        message: "Tiket valid dan berhasil di-scan",
        ticket_info: {
          customer_name: ticketOrder.customer_name,
          ticket_type: "General", // Default ticket type
          match_info: "Persiraja Match", // Default match info
          match_date: new Date().toISOString().split('T')[0],
          quantity: ticketOrder.quantity,
          scanned_at: new Date().toISOString()
        }
      };
      
    } catch (error: any) {
      console.error('Ticket validation error:', error);
      return {
        success: false,
        message: "Terjadi kesalahan saat validasi tiket"
      };
    }
  };

  const handleLogout = () => {
    toast.success("Logout berhasil");
    console.log("User logged out");
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketId.trim()) {
      toast.error("ID Tiket harus diisi");
      return;
    }

    setLoading(true);
    setLastScanResult(null);

    try {
      const result = await validateTicket(ticketId.trim());
      setLastScanResult(result);

      if (result.success) {
        toast.success(result.message);
        playSound('success');
        
        // Update scan history with new scan
        const newScan: ScanHistoryItem = {
          id: Date.now().toString(),
          ticket_order_id: ticketId,
          customer_name: result.ticket_info?.customer_name || "Unknown",
          ticket_type: result.ticket_info?.ticket_type || "Unknown",
          match_info: result.ticket_info?.match_info || "Unknown",
          quantity: result.ticket_info?.quantity || 1,
          scanned_at: new Date().toISOString(),
          status: "success"
        };
        setScanHistory(prev => [newScan, ...prev]);
        
        // Update stats
        setScanStats(prev => ({
          ...prev,
          total_scans: prev.total_scans + 1,
          successful_scans: prev.successful_scans + 1,
          today_scans: prev.today_scans + 1
        }));
      } else {
        toast.error(result.message);
        playSound('error');
      }

      setTicketId("");
    } catch (error: any) {
      console.error("Manual scan failed", { ticketId, error });
      toast.error(error.message || "Terjadi kesalahan saat scanning");
    } finally {
      setLoading(false);
    }
  };

  // Real ZXing barcode detection
  const detectBarcode = useCallback(async () => {
    if (!readerRef.current || !videoRef.current || !isScanning) return;

    try {
      setDebugInfo("Scanning for barcodes...");
      
      const result = await readerRef.current.decodeOnceFromVideoDevice(
        selectedCameraId || undefined,
        videoRef.current
      );
      
      if (result && result.getText()) {
        handleBarcodeDetected(result.getText());
      }
    } catch (error: any) {
      // Handle different ZXing exceptions
      if (error.name === 'NotFoundException') {
        // No barcode found - this is normal, continue scanning
        setDebugInfo("No barcode detected, continuing...");
        if (isScanning) {
          setTimeout(detectBarcode, 100); // Try again after 100ms
        }
      } else if (error.name === 'ChecksumException') {
        setDebugInfo("Barcode checksum error, retrying...");
        if (isScanning) {
          setTimeout(detectBarcode, 100);
        }
      } else if (error.name === 'FormatException') {
        setDebugInfo("Barcode format error, retrying...");
        if (isScanning) {
          setTimeout(detectBarcode, 100);
        }
      } else {
        console.debug("Barcode detection error:", error);
        setDebugInfo(`Scan error: ${error.message}`);
        if (isScanning) {
          setTimeout(detectBarcode, 200);
        }
      }
    }
  }, [isScanning, selectedCameraId]);

  const handleBarcodeDetected = useCallback(
    async (result: string) => {
      const currentTime = Date.now();
      const trimmedResult = result.trim();

      // Enhanced debouncing and duplicate detection
      if (
        isProcessingScan ||
        currentTime - lastScanTime < 2000 ||
        trimmedResult === lastScannedCode
      ) {
        console.debug("Barcode scan ignored", {
          result: trimmedResult,
          isProcessing: isProcessingScan,
          timeSince: currentTime - lastScanTime,
          isDuplicate: trimmedResult === lastScannedCode,
        });
        return;
      }

      // Prevent further scans
      setIsProcessingScan(true);
      setLastScannedCode(trimmedResult);
      setLastScanTime(currentTime);
      setTicketId(trimmedResult);

      console.info("Barcode detected", { result: trimmedResult });
      playSound('scan');

      // Stop scanning immediately to prevent multiple triggers
      stopBarcodeScanning();

      setLoading(true);
      setLastScanResult(null);

      try {
        const scanResult = await validateTicket(trimmedResult);
        setLastScanResult(scanResult);

        if (scanResult.success) {
          toast.success(`✅ Tiket Valid: ${scanResult.message}`);
          playSound('success');
          
          console.info("Barcode scan successful", {
            result: trimmedResult,
            message: scanResult.message,
          });
          
          // Update history and stats
          const newScan: ScanHistoryItem = {
            id: Date.now().toString(),
            ticket_order_id: trimmedResult,
            customer_name: scanResult.ticket_info?.customer_name || "Unknown",
            ticket_type: scanResult.ticket_info?.ticket_type || "Unknown",
            match_info: scanResult.ticket_info?.match_info || "Unknown",
            quantity: scanResult.ticket_info?.quantity || 1,
            scanned_at: new Date().toISOString(),
            status: "success"
          };
          setScanHistory(prev => [newScan, ...prev]);
          
          setScanStats(prev => ({
            ...prev,
            total_scans: prev.total_scans + 1,
            successful_scans: prev.successful_scans + 1,
            today_scans: prev.today_scans + 1
          }));
        } else {
          toast.error(`❌ Tiket Invalid: ${scanResult.message}`);
          playSound('error');
          
          console.warn("Barcode scan failed", {
            result: trimmedResult,
            message: scanResult.message,
          });
        }

        setTicketId("");
      } catch (error: any) {
        console.error("Barcode scan processing error", {
          result: trimmedResult,
          error,
        });
        playSound('error');
        toast.error(
          `Kesalahan: ${error.message || "Terjadi kesalahan saat scanning"}`
        );
      } finally {
        setLoading(false);
        // Reset processing state after a delay
        setTimeout(() => {
          setIsProcessingScan(false);
        }, 3000);
      }
    },
    [lastScanTime, lastScannedCode, isProcessingScan, playSound]
  );

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if ((capabilities as any).torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (error) {
      console.debug('Torch toggle failed:', error);
      toast.error('Gagal mengaktifkan/menonaktifkan senter');
    }
  }, [torchEnabled, torchSupported]);

  const startBarcodeScanning = async () => {
    if (!barcodeSupported) {
      toast.error("Barcode scanning tidak didukung pada perangkat ini");
      return;
    }

    if (!readerRef.current) {
      toast.error("Scanner belum siap, silakan refresh halaman");
      return;
    }

    try {
      setIsScanning(true);
      setLastScanTime(Date.now());
      setDebugInfo("Starting camera...");
      console.info("Starting barcode scanning");

      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true });

      // Use selected camera or auto-select
      const cameraId = selectedCameraId || undefined;
      
      // Start ZXing reader
      await readerRef.current.decodeFromVideoDevice(
        cameraId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            handleBarcodeDetected(result.getText());
          }
          // Errors are handled by ZXing internally for continuous scanning
        }
      );

      // Check torch support
      try {
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          setTorchSupported(!!(capabilities as any).torch);
        }
      } catch (error) {
        console.debug('Torch capability check failed:', error);
      }

      // Start scanning animation
      const animateScanning = () => {
        setScanningAnimation(prev => (prev + 1) % 100);
        if (isScanning) {
          setTimeout(animateScanning, 50);
        }
      };
      animateScanning();

      console.info("ZXing barcode scanning started successfully");
      toast.info("📷 Arahkan kamera ke barcode/QR code tiket");
      setCameraPermission('granted');
      
    } catch (error: any) {
      setIsScanning(false);
      let errorMessage = "Tidak dapat mengakses kamera";

      if (error.name === "NotAllowedError") {
        errorMessage = "Akses kamera ditolak. Silakan izinkan akses kamera di browser.";
        setCameraPermission('denied');
      } else if (error.name === "NotFoundError") {
        errorMessage = "Kamera tidak ditemukan pada perangkat ini.";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Kamera tidak didukung pada perangkat ini.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Kamera tidak mendukung pengaturan yang diminta.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error("Failed to start barcode scanning", { error });
      toast.error(errorMessage);
    }
  };

  const stopBarcodeScanning = () => {
    setIsScanning(false);
    setScanningAnimation(0);
    setDebugInfo("");
    setTorchEnabled(false);
    console.info("Stopping barcode scanning");

    // Stop ZXing reader scanning
    if (readerRef.current && videoRef.current) {
      try {
        // Create a new reader instance to properly reset
        readerRef.current = new BrowserMultiFormatReader();
      } catch (error) {
        console.debug('Error resetting reader:', error);
      }
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    console.debug("Camera streams stopped successfully");
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getScanStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getScanStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="mb-2">
        {success ? "VALID" : "INVALID"}
      </Badge>
    );
  };

  if (!scannerUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg border border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-primary rounded-full shadow-lg">
                    <QrCode className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                </div>
                <div>
                  <CardTitle className="text-md text-primary">
                    Persiraja Ticket Scanner
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {scannerUser.full_name || scannerUser.username}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="scanner" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border shadow-lg">
            <TabsTrigger
              value="scanner"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Scan className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <History className="h-4 w-4" />
              Riwayat
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            {/* Quick Guide */}
            <Card className="shadow-lg border border-border bg-card border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">Panduan Cepat Scanning</h3>
                    <p className="text-xs text-muted-foreground">
                      1. Pilih metode "Barcode" 
                      2. Tekan "Mulai Scan" 
                      3. Arahkan kamera ke barcode dan tahan steady (3-8 detik)
                      4. Pastikan barcode terlihat jelas di area scanning
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scanner Methods */}
              <Card className="shadow-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5" />
                    Metode Scanning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={scanMethod === "manual" ? "default" : "outline"}
                      onClick={() => {
                        setScanMethod("manual");
                        if (isScanning) stopBarcodeScanning();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Hand className="h-4 w-4" />
                      Manual
                    </Button>
                    <Button
                      variant={scanMethod === "barcode" ? "default" : "outline"}
                      onClick={() => setScanMethod("barcode")}
                      disabled={!barcodeSupported}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Barcode
                    </Button>
                  </div>

                  {scanMethod === "manual" ? (
                    <form onSubmit={handleScan} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ticketId">ID Tiket</Label>
                        <Input
                          id="ticketId"
                          type="text"
                          value={ticketId}
                          onChange={(e) => setTicketId(e.target.value)}
                          placeholder="Masukkan ID tiket..."
                          disabled={loading}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? "Scanning..." : "Scan Tiket"}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-48 object-cover"
                        />
                        
                        {/* Hidden canvas for barcode processing */}
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        
                        {!isScanning && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                            <Button
                              onClick={startBarcodeScanning}
                              disabled={!barcodeSupported}
                              className="flex items-center gap-2 mb-2"
                            >
                              <Camera className="h-4 w-4" />
                              Mulai Scan
                            </Button>
                            <p className="text-white text-xs text-center px-4">
                              Pastikan kamera memiliki akses dan barcode terlihat jelas
                            </p>
                          </div>
                        )}
                        
                        {isScanning && (
                          <>
                            {/* Enhanced scanning overlay */}
                            <div className="absolute inset-0 border-2 border-red-500 rounded-lg">
                              {/* Animated scanning line */}
                              <div 
                                className="absolute left-4 right-4 h-1 bg-red-500 shadow-lg transition-all duration-100"
                                style={{ 
                                  top: `${20 + (scanningAnimation * 0.6)}%`,
                                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)',
                                  background: 'linear-gradient(90deg, transparent, #ef4444, transparent)'
                                }}
                              />
                              
                              {/* Enhanced corner indicators */}
                              <div className="absolute top-4 left-4 w-8 h-8 border-t-3 border-l-3 border-red-500"></div>
                              <div className="absolute top-4 right-4 w-8 h-8 border-t-3 border-r-3 border-red-500"></div>
                              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-3 border-l-3 border-red-500"></div>
                              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-3 border-r-3 border-red-500"></div>
                              
                              {/* Center focus area */}
                              <div className="absolute inset-x-8 top-1/3 bottom-1/3 border border-white/30 rounded"></div>
                            </div>
                            
                            {/* Enhanced scanning instructions */}
                            <div className="absolute bottom-4 left-4 right-4 text-center">
                              <div className="bg-black/80 rounded-lg px-4 py-3">
                                <p className="text-white text-sm font-medium mb-1">
                                  Arahkan ke barcode dan tahan steady
                                </p>
                                <p className="text-white/70 text-xs mb-2">
                                  Jarak optimal: 10-20cm dari barcode
                                </p>
                                {debugInfo && (
                                  <p className="text-green-400 text-xs font-mono">
                                    {debugInfo}
                                  </p>
                                )}
                                <div className="flex items-center justify-center gap-1 mt-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        {/* Camera and Sound Controls */}
                        <div className="flex gap-2">
                          {availableCameras.length > 1 && (
                            <select 
                              value={selectedCameraId} 
                              onChange={(e) => setSelectedCameraId(e.target.value)}
                              className="flex-1 text-xs p-2 border rounded bg-background"
                              disabled={isScanning}
                            >
                              {availableCameras.map(camera => (
                                <option key={camera.deviceId} value={camera.deviceId}>
                                  {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="px-3"
                          >
                            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          </Button>
                          
                          {torchSupported && isScanning && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleTorch}
                              className="px-3"
                            >
                              {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                        
                        {isScanning && (
                          <Button
                            onClick={stopBarcodeScanning}
                            variant="outline"
                            className="w-full"
                          >
                            Stop Scanning
                          </Button>
                        )}
                        
                        {!barcodeSupported && (
                          <div className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded">
                            Kamera tidak didukung atau perlu HTTPS
                          </div>
                        )}
                        
                        {cameraPermission === 'denied' && (
                          <div className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded">
                            Akses kamera ditolak. Refresh halaman dan izinkan akses kamera.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scan Result */}
              <Card className="shadow-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Hasil Scan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lastScanResult ? (
                    <div className="space-y-4">
                      {getScanStatusBadge(lastScanResult.success)}

                      <div className="flex items-start gap-3">
                        {getScanStatusIcon(lastScanResult.success)}
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-2">
                            {lastScanResult.message}
                          </p>

                          {lastScanResult.ticket_info && (
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="font-medium">Nama:</span>
                                  <p>
                                    {lastScanResult.ticket_info.customer_name}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Tipe Tiket:
                                  </span>
                                  <p>
                                    {lastScanResult.ticket_info.ticket_type}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Pertandingan:
                                  </span>
                                  <p>{lastScanResult.ticket_info.match_info}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Jumlah:</span>
                                  <p>{lastScanResult.ticket_info.quantity}</p>
                                </div>
                              </div>
                              {lastScanResult.ticket_info.scanned_at && (
                                <div>
                                  <span className="font-medium">
                                    Waktu Scan:
                                  </span>
                                  <p>
                                    {new Date(
                                      lastScanResult.ticket_info.scanned_at
                                    ).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada hasil scan</p>
                      <p className="text-sm">
                        Scan tiket untuk melihat hasilnya
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Riwayat Scan Tiket
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scanHistory.length > 0 ? (
                  <div className="space-y-4">
                    {scanHistory.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getScanStatusIcon(scan.status === "success")}
                          <div>
                            <p className="font-medium">{scan.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {scan.match_info} • {scan.ticket_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {scan.ticket_order_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-1">
                            {scan.quantity}x
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(scan.scanned_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada riwayat scan</p>
                    <p className="text-sm">
                      Scan tiket akan muncul di sini
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg border border-border bg-card hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {scanStats.total_scans}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Scan
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {scanStats.successful_scans}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scan Berhasil
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {scanStats.today_scans}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scan Hari Ini
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {scanStats.unique_customers}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Customer Unik
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tingkat Berhasil</span>
                      <span className="text-2xl font-bold text-green-500">
                        {scanStats.total_scans > 0 
                          ? Math.round((scanStats.successful_scans / scanStats.total_scans) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${scanStats.total_scans > 0 
                            ? (scanStats.successful_scans / scanStats.total_scans) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {scanStats.successful_scans} dari {scanStats.total_scans} scan berhasil
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Aktivitas Hari Ini
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Scan Hari Ini</span>
                      <span className="text-2xl font-bold text-blue-500">
                        {scanStats.today_scans}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Aktif sejak login</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Tanggal: {new Date().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Bar */}
        <Card className="shadow-lg border border-border bg-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Scanner Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>Secure Connection</span>
                </div>
              </div>
              <div>
                Last Updated: {new Date().toLocaleTimeString("id-ID")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}