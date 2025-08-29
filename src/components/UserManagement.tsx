import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRoles, type AppRole } from '@/hooks/useRoles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleDebugPanel } from '@/components/RoleDebugPanel';
import { Trash2, Copy, UserCheck, UserX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { AdvancedFilters } from '@/components/AdvancedFilters';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: AppRole;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { assignRole, isSuperAdmin } = useRoles();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use RPC function to get users from auth.users (admin only)
      const { data: authUsers, error: authError } = await supabase.rpc('admin_list_users');
      
      if (authError) {
        console.error('Failed to fetch users from auth.users:', authError);
        toast.error('Failed to fetch users - insufficient permissions');
        return;
      }

      // Get profiles and roles for each user
      const usersWithData = await Promise.all(
        authUsers.map(async (authUser: any) => {
          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();

          // Get the primary role using the RPC function
          const { data: userRole, error: roleError } = await supabase
            .rpc('get_user_role', { _user_id: authUser.id });

          if (roleError) {
            console.error('Error fetching role for user:', authUser.id, roleError);
          }

          return {
            id: authUser.id,
            email: authUser.email || 'No Email',
            full_name: profile?.full_name || 'No Name',
            avatar_url: profile?.avatar_url || '',
            role: userRole || 'user' as AppRole,
            created_at: authUser.created_at
          };
        })
      );

      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      setLoading(true);
      
      const result = await assignRole(userId, newRole);
      
      if (result.success) {
        toast.success(`User role berhasil diubah menjadi ${newRole.replace('_', ' ').toUpperCase()}`);
        
        // Refresh the users list to show updated roles
        await fetchUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleteLoading(userId);
      
      // Call admin RPC to delete user
      const { error } = await supabase.rpc('admin_delete_user' as any, { 
        _user_id: userId 
      });
      
      if (error) {
        console.error('Delete user error:', error);
        toast.error('Gagal menghapus user: ' + error.message);
        return;
      }
      
      toast.success('User berhasil dihapus');
      await fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const copyToClipboard = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      toast.success('UUID berhasil disalin');
    } catch (error) {
      toast.error('Gagal menyalin UUID');
    }
  };

  const handleFiltersChange = (filters: any) => {
    let filtered = [...users];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply role filter
    if (filters.status !== "all") {
      filtered = filtered.filter(user => user.role === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(user => 
        new Date(user.created_at) >= startDate
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "name_asc":
        filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.full_name.localeCompare(a.full_name));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }

    setFilteredUsers(filtered);
  };

  const bulkActions = [
    {
      id: "activate",
      label: "Aktifkan",
      icon: UserCheck,
      action: async (selectedItems: string[]) => {
        // Bulk activate users - would need backend implementation
        console.log("Bulk activate:", selectedItems);
      }
    },
    {
      id: "deactivate", 
      label: "Nonaktifkan",
      icon: UserX,
      action: async (selectedItems: string[]) => {
        // Bulk deactivate users - would need backend implementation
        console.log("Bulk deactivate:", selectedItems);
      }
    },
    {
      id: "delete",
      label: "Hapus",
      icon: Trash2,
      variant: "destructive" as const,
      action: async (selectedItems: string[]) => {
        if (!isSuperAdmin) {
          toast.error("Hanya super admin yang dapat menghapus user");
          return;
        }
        
        for (const userId of selectedItems) {
          await handleDeleteUser(userId);
        }
      }
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Debug Panel - Remove this in production */}
      <RoleDebugPanel />
      
      {/* Advanced Filters */}
      <AdvancedFilters
        onFiltersChange={handleFiltersChange}
        entityType="users"
        showRealTimeStats={true}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedUsers}
        onClearSelection={() => setSelectedUsers([])}
        items={filteredUsers}
        actions={bulkActions}
        searchValue=""
        onSearchChange={() => {}}
        onRefresh={fetchUsers}
        isLoading={loading}
      />
      
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Kelola Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {filteredUsers.map((userItem) => (
              <div 
                key={userItem.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(userItem.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, userItem.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== userItem.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarImage src={userItem.avatar_url} alt={userItem.full_name} />
                    <AvatarFallback className="text-xs">
                      {userItem.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{userItem.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{userItem.email}</p>
                    <button
                      onClick={() => copyToClipboard(userItem.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>ID: {userItem.id.slice(0, 8)}...</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {isSuperAdmin && (
                    <>
                      <Select 
                        value={userItem.role} 
                        onValueChange={(value: AppRole) => handleRoleChange(userItem.id, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-20 sm:w-24 text-xs h-7 sm:h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user" className="text-xs">User</SelectItem>
                          <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                          <SelectItem value="super_admin" className="text-xs">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoading === userItem.id}
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-sm sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm sm:text-base">Hapus User</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm">
                              Apakah Anda yakin ingin menghapus user "{userItem.full_name}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-xs sm:text-sm">Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};