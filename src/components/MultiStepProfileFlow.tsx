import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Camera,
  Star,
  Target,
  Gift,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface ProfileStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  required: boolean;
  fields: string[];
}

interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "id" | "en";
  notifications: {
    email: boolean;
    push: boolean;
    match_reminders: boolean;
    news_alerts: boolean;
    merchandise_alerts: boolean;
  };
  privacy: {
    profile_visibility: "public" | "friends" | "private";
    activity_sharing: boolean;
    data_analytics: boolean;
  };
  communication: {
    marketing_emails: boolean;
    product_updates: boolean;
    community_digest: boolean;
  };
}

export function MultiStepProfileFlow() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [steps, setSteps] = useState<ProfileStep[]>([
    {
      id: "basic",
      title: "Informasi Dasar",
      description: "Lengkapi data diri Anda",
      icon: User,
      completed: false,
      required: true,
      fields: ["full_name", "phone"]
    },
    {
      id: "identity",
      title: "Verifikasi Identitas",
      description: "Verifikasi untuk keamanan akun",
      icon: Shield,
      completed: false,
      required: true,
      fields: ["id_number", "emergency_contact"]
    },
    {
      id: "address",
      title: "Alamat & Lokasi",
      description: "Untuk pengiriman dan layanan",
      icon: MapPin,
      completed: false,
      required: false,
      fields: ["address"]
    },
    {
      id: "preferences",
      title: "Preferensi",
      description: "Sesuaikan pengalaman Anda",
      icon: Settings,
      completed: false,
      required: false,
      fields: ["preferences"]
    }
  ]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      // Load preferences (from notification_preferences or create new structure)
      const { data: notifPrefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      setProfile(profileData || {});
      
      // Initialize preferences with defaults
      setPreferences({
        theme: "system",
        language: "id",
        notifications: {
          email: notifPrefs?.news_alerts || true,
          push: notifPrefs?.push_enabled || false,
          match_reminders: notifPrefs?.match_reminders || true,
          news_alerts: notifPrefs?.news_alerts || true,
          merchandise_alerts: notifPrefs?.merchandise_alerts || true,
        },
        privacy: {
          profile_visibility: "public",
          activity_sharing: true,
          data_analytics: true,
        },
        communication: {
          marketing_emails: true,
          product_updates: true,
          community_digest: false,
        }
      });

      // Update step completion status
      updateStepCompletion(profileData || {});
      
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStepCompletion = (profileData: any) => {
    setSteps(prevSteps => prevSteps.map(step => {
      const completed = step.fields.every(field => {
        if (field === "preferences") return true; // Preferences are optional
        return profileData[field] && profileData[field].trim() !== "";
      });
      return { ...step, completed };
    }));
  };

  const saveStepData = async (stepId: string) => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      if (stepId === "preferences") {
        // Save preferences
        await supabase
          .from("notification_preferences")
          .upsert({
            user_id: user.id,
            push_enabled: preferences?.notifications.push || false,
            match_reminders: preferences?.notifications.match_reminders || true,
            news_alerts: preferences?.notifications.news_alerts || true,
            merchandise_alerts: preferences?.notifications.merchandise_alerts || true,
          });
      } else {
        // Save profile data
        await supabase
          .from("profiles")
          .upsert({
            user_id: user.id,
            full_name: profile.full_name,
            phone: profile.phone,
            address: profile.address,
            id_number: profile.id_number,
            emergency_contact: profile.emergency_contact,
          });
      }

      // Update step completion
      updateStepCompletion(profile);
      
      toast.success("Data berhasil disimpan!");
      
      // Auto advance to next step if current step is now complete
      const currentStepData = steps[currentStep];
      const isCurrentStepComplete = currentStepData.fields.every(field => {
        if (field === "preferences") return true;
        return profile[field] && profile[field].trim() !== "";
      });
      
      if (isCurrentStepComplete && currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
      
    } catch (error) {
      console.error("Error saving step data:", error);
      toast.error("Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const calculateOverallProgress = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getNextIncompleteStep = () => {
    return steps.findIndex(step => !step.completed);
  };

  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    
    switch (currentStepData.id) {
      case "basic":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={profile?.full_name || ""}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                placeholder="Masukkan nama lengkap Anda"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input
                id="phone"
                value={profile?.phone || ""}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="08xxxxxxxxxx"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "identity":
        return (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Data ini diperlukan untuk verifikasi identitas dan keamanan akun Anda.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="id_number">Nomor KTP *</Label>
              <Input
                id="id_number"
                value={profile?.id_number || ""}
                onChange={(e) => setProfile({...profile, id_number: e.target.value})}
                placeholder="16 digit nomor KTP"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact">Kontak Darurat *</Label>
              <Textarea
                id="emergency_contact"
                value={profile?.emergency_contact || ""}
                onChange={(e) => setProfile({...profile, emergency_contact: e.target.value})}
                placeholder="Nama dan nomor telepon kontak darurat"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "address":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                value={profile?.address || ""}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi"
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
                <TabsTrigger value="privacy">Privasi</TabsTrigger>
                <TabsTrigger value="communication">Komunikasi</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notifications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifikasi</p>
                    <p className="text-sm text-muted-foreground">Terima notifikasi via email</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications.email || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, email: checked }
                      } : null)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifikasi</p>
                    <p className="text-sm text-muted-foreground">Terima notifikasi push</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications.push || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, push: checked }
                      } : null)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pengingat Pertandingan</p>
                    <p className="text-sm text-muted-foreground">Notifikasi sebelum pertandingan</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications.match_reminders || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, match_reminders: checked }
                      } : null)
                    }
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="privacy" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Berbagi Aktivitas</p>
                    <p className="text-sm text-muted-foreground">Izinkan berbagi aktivitas dengan komunitas</p>
                  </div>
                  <Switch
                    checked={preferences?.privacy.activity_sharing || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        privacy: { ...prev.privacy, activity_sharing: checked }
                      } : null)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics Data</p>
                    <p className="text-sm text-muted-foreground">Bantu kami tingkatkan layanan</p>
                  </div>
                  <Switch
                    checked={preferences?.privacy.data_analytics || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        privacy: { ...prev.privacy, data_analytics: checked }
                      } : null)
                    }
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="communication" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Marketing</p>
                    <p className="text-sm text-muted-foreground">Terima informasi promo dan penawaran</p>
                  </div>
                  <Switch
                    checked={preferences?.communication.marketing_emails || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        communication: { ...prev.communication, marketing_emails: checked }
                      } : null)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Update Produk</p>
                    <p className="text-sm text-muted-foreground">Informasi fitur dan update terbaru</p>
                  </div>
                  <Switch
                    checked={preferences?.communication.product_updates || false}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        communication: { ...prev.communication, product_updates: checked }
                      } : null)
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const nextIncompleteStep = getNextIncompleteStep();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Kelengkapan Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress Keseluruhan</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            {nextIncompleteStep !== -1 && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Langkah selanjutnya:</p>
                  <p className="text-sm text-muted-foreground">{steps[nextIncompleteStep].title}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(nextIncompleteStep)}
                  variant="outline"
                >
                  Lanjutkan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <Button
              key={step.id}
              variant={currentStep === index ? "default" : step.completed ? "secondary" : "outline"}
              onClick={() => setCurrentStep(index)}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
            <div className="relative">
              <StepIcon className="h-5 w-5" />
              {step.completed && (
                <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-success bg-background rounded-full" />
              )}
            </div>
              <div className="text-center">
                <p className="text-xs font-medium">{step.title}</p>
                {step.required && !step.completed && (
                  <Badge variant="destructive" className="text-xs mt-1">Wajib</Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {renderStepContent()}
            
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Sebelumnya
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => saveStepData(steps[currentStep].id)}
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
                
                {currentStep < steps.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    Selanjutnya
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Reward */}
      {overallProgress === 100 && (
        <Card className="border-success bg-success/5">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 bg-success/10 rounded-full flex items-center justify-center">
                <Gift className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success">Selamat!</h3>
                <p className="text-muted-foreground">
                  Profil Anda telah lengkap. Anda sekarang dapat menikmati semua fitur platform.
                </p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                <Star className="h-3 w-3 mr-1" />
                Profil Terverifikasi
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}