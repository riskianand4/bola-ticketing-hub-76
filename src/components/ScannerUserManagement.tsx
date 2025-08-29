import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { Plus, User, Shield, Edit, Trash2, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScannerUser {
  id: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export const ScannerUserManagement = () => {
  const { isSuperAdmin } = useRoles();
  const [scannerUsers, setScannerUsers] = useState<ScannerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ScannerUser | null>(null);
  
  // Form states
  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    full_name: ''
  });
  
  const [editFormData, setEditFormData] = useState({
    username: '',
    full_name: '',
    is_active: true
  });
  
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const fetchScannerUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scanner_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scanner users:', error);
        toast.error('Gagal mengambil data scanner users');
        return;
      }

      setScannerUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScannerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.username.trim() || !createFormData.password.trim()) {
      toast.error('Username dan password harus diisi');
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.rpc('admin_create_scanner_user', {
        _username: createFormData.username.trim(),
        _password: createFormData.password,
        _full_name: createFormData.full_name.trim() || null
      });

      if (error) {
        console.error('Error creating scanner user:', error);
        toast.error('Gagal membuat scanner user: ' + error.message);
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.success('Scanner user berhasil dibuat');
        // Add notification
        if ((window as any).addNotification) {
          (window as any).addNotification(
            'Scanner User Dibuat', 
            `User ${createFormData.username} berhasil ditambahkan`,
            'success'
          );
        }
        setCreateFormData({ username: '', password: '', full_name: '' });
        setIsCreateDialogOpen(false);
        fetchScannerUsers();
      } else {
        toast.error(result?.message || 'Gagal membuat scanner user');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat membuat scanner user');
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user: ScannerUser) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      full_name: user.full_name || '',
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !editFormData.username.trim()) {
      toast.error('Username harus diisi');
      return;
    }

    setUpdating(true);

    try {
      const { data, error } = await supabase.rpc('admin_update_scanner_user', {
        _user_id: selectedUser.id,
        _username: editFormData.username.trim(),
        _full_name: editFormData.full_name.trim() || null,
        _is_active: editFormData.is_active
      });

      if (error) {
        console.error('Error updating scanner user:', error);
        toast.error('Gagal memperbarui scanner user: ' + error.message);
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.success('Scanner user berhasil diperbarui');
        // Add notification
        if ((window as any).addNotification) {
          (window as any).addNotification(
            'Scanner User Diperbarui', 
            `User ${editFormData.username} berhasil diperbarui`,
            'success'
          );
        }
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchScannerUsers();
      } else {
        toast.error(result?.message || 'Gagal memperbarui scanner user');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memperbarui scanner user');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = (user: ScannerUser) => {
    setSelectedUser(user);
    setPasswordFormData({ password: '', confirmPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    if (!passwordFormData.password.trim()) {
      toast.error('Password baru harus diisi');
      return;
    }

    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setUpdating(true);

    try {
      const { data, error } = await supabase.rpc('admin_update_scanner_user', {
        _user_id: selectedUser.id,
        _username: selectedUser.username,
        _password: passwordFormData.password
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error('Gagal mengubah password: ' + error.message);
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.success('Password berhasil diubah');
        setIsPasswordDialogOpen(false);
        setSelectedUser(null);
        setPasswordFormData({ password: '', confirmPassword: '' });
      } else {
        toast.error(result?.message || 'Gagal mengubah password');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat mengubah password');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleting(userId);

    try {
      const { data, error } = await supabase.rpc('admin_delete_scanner_user', {
        _user_id: userId
      });

      if (error) {
        console.error('Error deleting scanner user:', error);
        toast.error('Gagal menghapus scanner user: ' + error.message);
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.success('Scanner user berhasil dihapus');
        // Add notification  
        if ((window as any).addNotification) {
          (window as any).addNotification(
            'Scanner User Dihapus', 
            `User berhasil dihapus dari sistem`,
            'warning'
          );
        }
        fetchScannerUsers();
      } else {
        toast.error(result?.message || 'Gagal menghapus scanner user');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat menghapus scanner user');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchScannerUsers();
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Shield className="mx-auto h-12 w-12 mb-4" />
            <p>Hanya Super Admin yang dapat mengakses manajemen Scanner User</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Memuat data scanner users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Manajemen Scanner User
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola akun untuk scanner tiket
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Buat Scanner User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Scanner User Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateScannerUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">Username *</Label>
                  <Input
                    id="create-username"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Masukkan username"
                    disabled={creating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password *</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Masukkan password"
                    disabled={creating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-full_name">Nama Lengkap</Label>
                  <Input
                    id="create-full_name"
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Masukkan nama lengkap (opsional)"
                    disabled={creating}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? 'Membuat...' : 'Buat Scanner User'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {scannerUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="mx-auto h-12 w-12 mb-4" />
            <p>Belum ada scanner user yang dibuat</p>
            <p className="text-sm">Klik tombol "Buat Scanner User" untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total Scanner Users: {scannerUsers.length}
            </div>
            
            <div className="grid gap-4">
              {scannerUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{user.username}</h4>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {user.full_name}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Dibuat: {new Date(user.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {isSuperAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={updating || deleting === user.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangePassword(user)}
                          disabled={updating || deleting === user.id}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={updating || deleting === user.id}
                            >
                              {deleting === user.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Scanner User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus scanner user "{user.username}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scanner User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Masukkan username"
                disabled={updating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-full_name">Nama Lengkap</Label>
              <Input
                id="edit-full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Masukkan nama lengkap"
                disabled={updating}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, is_active: checked }))}
                disabled={updating}
              />
              <Label htmlFor="edit-is_active">Akun Aktif</Label>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updating} className="flex-1">
                {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updating}
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru *</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordFormData.password}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Masukkan password baru"
                disabled={updating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Konfirmasi password baru"
                disabled={updating}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updating} className="flex-1">
                {updating ? 'Mengubah...' : 'Ganti Password'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={updating}
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};