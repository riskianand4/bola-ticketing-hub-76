import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { ChangeEmailDialog } from "@/components/dialogs/ChangeEmailDialog";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/dialogs/DeleteAccountDialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Ticket, 
  Settings, 
  Camera,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Loader2
} from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  id_number?: string;
  emergency_contact?: string;
  email_notifications: boolean;
  push_notifications: boolean;
}

interface TicketOrder {
  id: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  order_date: string;
  customer_name: string;
  tickets: {
    ticket_type: string;
    matches?: {
      home_team: string;
      away_team: string;
      match_date: string;
      venue?: string;
    };
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ticketOrders, setTicketOrders] = useState<TicketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  
  // Dialog states
  const [showChangeEmailDialog, setShowChangeEmailDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  // Profile completion calculation
  const calculateProfileCompletion = (profile: Profile | null) => {
    if (!profile) return 0;
    const fields = [
      profile.full_name,
      profile.phone,
      profile.address,
      profile.id_number,
      profile.emergency_contact
    ];
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const profileComplete = calculateProfileCompletion(profile);

  const incompleteFields = profile ? [
    { field: "full_name", label: "Nama Lengkap", completed: !!profile.full_name },
    { field: "phone", label: "Nomor Telepon", completed: !!profile.phone },
    { field: "address", label: "Alamat", completed: !!profile.address },
    { field: "id_number", label: "Nomor KTP", completed: !!profile.id_number },
    { field: "emergency_contact", label: "Kontak Darurat", completed: !!profile.emergency_contact },
  ].filter(field => !field.completed) : [];

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
      loadTicketOrders();
    }
  }, [isAuthenticated, user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create initial profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            full_name: user?.user_metadata?.full_name || '',
            email_notifications: true,
            push_notifications: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_orders')
        .select(`
          *,
          tickets (
            ticket_type,
            matches (
              home_team,
              away_team,
              match_date,
              venue
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error loading ticket orders:', error);
        return;
      }

      setTicketOrders(data || []);
    } catch (error) {
      console.error('Error in loadTicketOrders:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          id_number: profile.id_number,
          emergency_contact: profile.emergency_contact,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profil berhasil diperbarui",
        description: "Perubahan telah disimpan.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Gagal memperbarui profil",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleNotificationToggle = async (type: 'email_notifications' | 'push_notifications', value: boolean) => {
    if (!profile || !user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [type]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, [type]: value });
      toast({
        title: "Pengaturan notifikasi diperbarui",
        description: `${type === 'email_notifications' ? 'Email' : 'Push'} notifikasi ${value ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
    } catch (error) {
      console.error('Error updating notification setting:', error);
      toast({
        title: "Gagal memperbarui pengaturan",
        description: "Terjadi kesalahan saat menyimpan pengaturan.",
        variant: "destructive",
      });
    }
  };

  const handleChangeEmail = () => {
    setShowChangeEmailDialog(true);
  };

  const handleChangePassword = () => {
    setShowChangePasswordDialog(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success">Lunas</Badge>;
      case "pending":
        return <Badge variant="secondary">Menunggu</Badge>;
      case "failed":
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Anda harus login untuk mengakses halaman profil.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-10 md:pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Completion Alert */}
        {profileComplete < 100 && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              <div className="flex items-center justify-between">
                <span>Profil Anda {profileComplete}% lengkap. Lengkapi untuk dapat membeli tiket.</span>
                <Button size="sm" variant="outline" className="ml-4" onClick={() => setIsEditing(true)}>
                  Lengkapi Sekarang
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 self-start">
            <CardHeader className="text-center">
              <ProfilePhotoUpload
                currentPhotoUrl={profile.avatar_url}
                onPhotoUpdate={(url) => setProfile(prev => prev ? {...prev, avatar_url: url} : null)}
                userInitials={profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'U'}
              />
              <CardTitle className="text-xl">{profile.full_name || 'Nama tidak diset'}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Profil Lengkap</span>
                    <span>{profileComplete}%</span>
                  </div>
                  <Progress value={profileComplete} className="h-2" />
                </div>
                
                {incompleteFields.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium mb-2">Data yang belum lengkap:</p>
                    <ul className="space-y-1">
                      {incompleteFields.map((field, index) => (
                        <li key={index} className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                          {field.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="tickets">Tiket Saya</TabsTrigger>
                <TabsTrigger value="settings">Pengaturan</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Informasi Pribadi</CardTitle>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={updating}
                    >
                      {isEditing ? "Batal" : "Edit"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nama Lengkap</Label>
                          <Input
                            id="name"
                            value={profile.full_name || ''}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={user.email || ''}
                            disabled={true}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Nomor Telepon</Label>
                          <Input
                            id="phone"
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="idNumber">Nomor KTP *</Label>
                          <Input
                            id="idNumber"
                            value={profile.id_number || ''}
                            onChange={(e) => setProfile({ ...profile, id_number: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Masukkan nomor KTP"
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Alamat</Label>
                          <Input
                            id="address"
                            value={profile.address || ''}
                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="emergencyContact">Kontak Darurat *</Label>
                          <Input
                            id="emergencyContact"
                            value={profile.emergency_contact || ''}
                            onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Nama dan nomor telepon kontak darurat"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={updating}>
                            {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Simpan Perubahan
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                            Batal
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                <div className="space-y-4">
                  {ticketOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">
                              {order.tickets?.matches 
                                ? `${order.tickets.matches.home_team} vs ${order.tickets.matches.away_team}`
                                : order.tickets?.ticket_type || 'Tiket'
                              }
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {order.tickets?.matches?.match_date 
                                  ? formatDate(order.tickets.matches.match_date)
                                  : formatDate(order.order_date)
                                }
                              </div>
                              {order.tickets?.matches?.venue && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {order.tickets.matches.venue}
                                </div>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(order.payment_status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Jumlah Tiket:</p>
                            <p className="text-sm text-muted-foreground">{order.quantity} tiket</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Harga:</p>
                            <p className="text-sm text-secondary font-bold">{formatPrice(order.total_amount)}</p>
                          </div>
                        </div>
                        
                        {order.payment_status === "completed" && (
                          <div className="flex gap-2 mt-4">
                            <Button size="sm">Lihat QR Code</Button>
                            <Button size="sm" variant="outline">Download Tiket</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {ticketOrders.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Anda belum memiliki tiket</p>
                        <Button className="mt-4" onClick={() => navigate('/tickets')}>
                          Beli Tiket Sekarang
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="space-y-6">
                  <NotificationPreferences />
                  <Card>
                    <CardHeader>
                      <CardTitle>Notifikasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Terima update via email</p>
                        </div>
                        <Switch
                          checked={profile.email_notifications}
                          onCheckedChange={(checked) => handleNotificationToggle('email_notifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Notifikasi real-time di browser</p>
                        </div>
                        <Switch
                          checked={profile.push_notifications}
                          onCheckedChange={(checked) => handleNotificationToggle('push_notifications', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Keamanan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" onClick={handleChangeEmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Ubah Email
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={handleChangePassword}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Ubah Password
                      </Button>
                      <Button variant="destructive" className="w-full justify-start" onClick={handleDeleteAccount}>
                        <User className="h-4 w-4 mr-2" />
                        Hapus Akun
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <ChangeEmailDialog
        open={showChangeEmailDialog}
        onOpenChange={setShowChangeEmailDialog}
      />
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      />
      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
        userEmail={user.email || ''}
        userId={user.id}
      />
    </div>
  );
}