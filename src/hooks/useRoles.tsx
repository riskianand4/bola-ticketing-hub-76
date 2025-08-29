import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'user' | 'admin' | 'super_admin';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const useRoles = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use the database function that gets the highest priority role
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) {
        console.error('Error fetching user role:', error);
        setError(error.message);
        setUserRole('user'); // Default to user role
      } else {
        setUserRole(data || 'user');
      }
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      setError('Failed to fetch user role');
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      // Start a transaction to ensure data consistency
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Failed to remove existing roles: ${deleteError.message}`);
      }

      // Insert the new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: role 
        });

      if (insertError) {
        throw new Error(`Failed to assign new role: ${insertError.message}`);
      }

      // Refresh the current user's role if they updated their own role
      if (userId === user?.id) {
        await fetchUserRole();
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error in assignRole:', err);
      return { success: false, error: err.message };
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);

  return {
    userRole,
    loading: loading || authLoading,
    error,
    isAdmin,
    isSuperAdmin,
    assignRole,
    refetch: fetchUserRole
  };
};