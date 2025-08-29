import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

// Mock interfaces for demo
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
  const [scannerUser, setScannerUser] = useState<ScannerUser | null>({
    id: "1",
    username: "scanner1",
    full_name: "Scanner User",
    is_active: true
  });
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([
    {
      id: "1",
      ticket_order_id: "TK001",
      customer_name: "John Doe",
      ticket_type: "VIP",
      match_info: "Persiraja vs PSM Makassar",
      quantity: 2,
      scanned_at: new Date().toISOString(),
      status: "success"
    }
  ]);
  const [scanStats, setScanStats] = useState<ScanStats>({
    total_scans: 156,
    successful_scans: 142,
    today_scans: 23,
    unique_customers: 89,
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
  const [scanCounter, setScanCounter] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");

  // Mock toast function
  const toast = {
    success: (message: string) => console.log("SUCCESS:", message),
    error: (message: string) => console.log("ERROR:", message),
    info: (message: string) => console.log("INFO:", message)
  };

  useEffect(() => {
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
  }, []);

  // Mock scan function
  const mockScanTicket = async (ticketId: string): Promise<ScanResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation logic
    const isValid = Math.random() > 0.3; // 70% success rate for demo
    
    if (isValid) {
      return {
        success: true,
        message: "Tiket valid dan berhasil di-scan",
        ticket_info: {
          customer_name: "Ahmad Rizki",
          ticket_type: "Tribune Utara",
          match_info: "Persiraja vs Persib Bandung",
          match_date: "2024-08-25",
          quantity: 1,
          scanned_at: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        message: "Tiket tidak valid atau sudah digunakan"
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
      const result = await mockScanTicket(ticketId.trim());
      setLastScanResult(result);

      if (result.success) {
        toast.success(result.message);
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
      }

      setTicketId("");
    } catch (error: any) {
      console.error("Manual scan failed", { ticketId, error });
      toast.error(error.message || "Terjadi kesalahan saat scanning");
    } finally {
      setLoading(false);
    }
  };

  // Improved barcode detection with better mock simulation
  const detectBarcode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(detectBarcode);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Increment scan counter for simulation
      setScanCounter(prev => prev + 1);
      
      // Enhanced mock barcode detection
      const mockBarcodeDetection = () => {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let edgePixels = 0;
        let totalPixels = 0;
        const centerY = Math.floor(canvas.height / 2);
        const scanLineStart = Math.floor(canvas.width * 0.2);
        const scanLineEnd = Math.floor(canvas.width * 0.8);
        
        // Analyze pixels along the scanning line for edge detection
        for (let x = scanLineStart; x < scanLineEnd - 1; x++) {
          const currentPixelIndex = (centerY * canvas.width + x) * 4;
          const nextPixelIndex = (centerY * canvas.width + (x + 1)) * 4;
          
          const currentBrightness = (data[currentPixelIndex] + data[currentPixelIndex + 1] + data[currentPixelIndex + 2]) / 3;
          const nextBrightness = (data[nextPixelIndex] + data[nextPixelIndex + 1] + data[nextPixelIndex + 2]) / 3;
          
          // Detect edges (significant brightness changes)
          if (Math.abs(currentBrightness - nextBrightness) > 30) {
            edgePixels++;
          }
          totalPixels++;
        }
        
        const edgeRatio = edgePixels / totalPixels;
        const timeScanning = Date.now() - lastScanTime;
        
        // Update debug info
        setDebugInfo(`Edges: ${edgePixels}/${totalPixels} (${(edgeRatio * 100).toFixed(1)}%), Time: ${(timeScanning / 1000).toFixed(1)}s, Counter: ${scanCounter}`);
        
        // Simulate barcode detection based on:
        // 1. Sufficient edge transitions (indicating barcode patterns)
        // 2. Enough scanning time (3-8 seconds)
        // 3. Random factor for realism
        if (edgeRatio > 0.15 && timeScanning > 3000 && timeScanning < 15000) {
          // Higher chance of detection with more edges and optimal timing
          const detectionChance = Math.min(0.3 + (edgeRatio * 2), 0.8);
          if (Math.random() < detectionChance) {
            // Generate various mock barcode formats
            const formats = [
              () => "TK" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
              () => "TICKET" + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
              () => Math.floor(Math.random() * 1000000000000).toString(),
              () => "PSJ" + Math.floor(Math.random() * 99999).toString().padStart(5, '0'),
            ];
            return formats[Math.floor(Math.random() * formats.length)]();
          }
        }
        
        return null;
      };

      const detectedCode = mockBarcodeDetection();
      
      if (detectedCode && !isProcessingScan) {
        handleBarcodeDetected(detectedCode);
      }
    } catch (error) {
      console.debug("Barcode detection error:", error);
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(detectBarcode);
  }, [isScanning, lastScanTime, isProcessingScan, scanCounter]);

  const handleBarcodeDetected = useCallback(
    async (result: string) => {
      const currentTime = Date.now();
      const trimmedResult = result.trim();

      // Enhanced debouncing and duplicate detection
      if (
        isProcessingScan ||
        currentTime - lastScanTime < 3000 ||
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
      setTicketId(trimmedResult);

      console.info("Barcode detected", { result: trimmedResult });

      // Stop scanning immediately to prevent multiple triggers
      stopBarcodeScanning();

      setLoading(true);
      setLastScanResult(null);

      try {
        const scanResult = await mockScanTicket(trimmedResult);
        setLastScanResult(scanResult);

        if (scanResult.success) {
          toast.success(`✅ Tiket Valid: ${scanResult.message}`);
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
        toast.error(
          `Kesalahan: ${error.message || "Terjadi kesalahan saat scanning"}`
        );
      } finally {
        setLoading(false);
        // Reset processing state after a delay
        setTimeout(() => {
          setIsProcessingScan(false);
        }, 2000);
      }
    },
    [lastScanTime, lastScannedCode, isProcessingScan]
  );

  const startBarcodeScanning = async () => {
    if (!barcodeSupported) {
      toast.error("Barcode scanning tidak didukung pada perangkat ini");
      return;
    }

    try {
      setIsScanning(true);
      setLastScanTime(Date.now());
      setScanCounter(0);
      setDebugInfo("Starting camera...");
      console.info("Starting barcode scanning");

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === "videoinput");

      if (cameras.length === 0) {
        throw new Error("No camera devices found");
      }

      // Prefer rear camera if available
      const rearCamera = cameras.find(
        device =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );

      const constraints = {
        video: {
          deviceId: rearCamera ? { exact: rearCamera.deviceId } : undefined,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: rearCamera ? undefined : "environment",
        }
      };

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          setDebugInfo("Camera ready, scanning...");
          detectBarcode();
          
          const animateScanning = () => {
            setScanningAnimation(prev => (prev + 1) % 100);
            if (isScanning) {
              setTimeout(animateScanning, 30);
            }
          };
          animateScanning();
        };
      }

      console.info("Camera stream started successfully");
      toast.info("📷 Arahkan kamera ke barcode tiket dan tahan steady");
    } catch (error: any) {
      setIsScanning(false);
      let errorMessage = "Tidak dapat mengakses kamera";

      if (error.name === "NotAllowedError") {
        errorMessage = "Akses kamera ditolak. Silakan izinkan akses kamera di browser.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "Kamera tidak ditemukan pada perangkat ini.";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Kamera tidak didukung pada perangkat ini.";
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
    setScanCounter(0);
    setDebugInfo("");
    console.info("Stopping barcode scanning");

    // Cancel animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
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

                      {isScanning && (
                        <Button
                          onClick={stopBarcodeScanning}
                          variant="outline"
                          className="w-full"
                        >
                          Stop Scanning
                        </Button>
                      )}
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