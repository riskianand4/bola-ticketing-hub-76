import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
export const RoleDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const {
    userRole
  } = useRoles();
  const checkRolesTable = async () => {
    setLoading(true);
    try {
      // Get all user roles
      const {
        data: allRoles,
        error
      } = await supabase.from('user_roles').select('*').order('user_id');
      if (error) {
        throw error;
      }

      // Group by user_id to see duplicates
      const rolesByUser = allRoles.reduce((acc: any, role: any) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = [];
        }
        acc[role.user_id].push(role);
        return acc;
      }, {});
      setDebugInfo({
        allRoles,
        rolesByUser,
        duplicateUsers: Object.keys(rolesByUser).filter(userId => rolesByUser[userId].length > 1),
        currentUserRole: userRole
      });
      toast.success('Data role berhasil dimuat');
    } catch (error: any) {
      console.error('Error checking roles:', error);
      toast.error('Gagal memuat data role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const cleanupDuplicates = async () => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.rpc('cleanup_duplicate_roles');
      if (error) {
        throw error;
      }
      toast.success('Cleanup duplicate roles berhasil');
      await checkRolesTable(); // Refresh data
    } catch (error: any) {
      console.error('Error cleaning up roles:', error);
      toast.error('Gagal cleanup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  return <Card className="mb-6  bg-neutral-800">
      <CardHeader className="bg-zinc-800">
        <CardTitle className="text-lg flex items-center gap-2">
          🐛 Role Debug Panel
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 bg-zinc-800">
        <div className="flex gap-2">
          <Button onClick={checkRolesTable} disabled={loading} variant="outline" size="sm">
            {loading ? 'Loading...' : 'Check Roles Table'}
          </Button>
          <Button onClick={cleanupDuplicates} disabled={loading} variant="destructive" size="sm">
            {loading ? 'Cleaning...' : 'Cleanup Duplicates'}
          </Button>
        </div>

        {debugInfo && <div className="space-y-3 text-sm">
            <div>
              <p><strong>Current User Role:</strong> 
                <Badge className="ml-2">{debugInfo.currentUserRole || 'none'}</Badge>
              </p>
            </div>
            
            <div>
              <p><strong>Total Roles:</strong> {debugInfo.allRoles?.length || 0}</p>
            </div>
            
            {debugInfo.duplicateUsers?.length > 0 && <div>
                <p className="text-red-600"><strong>Users with Duplicate Roles:</strong></p>
                <ul className="list-disc list-inside pl-4">
                  {debugInfo.duplicateUsers.map((userId: string) => <li key={userId} className="text-xs">
                      {userId.slice(0, 8)}... ({debugInfo.rolesByUser[userId].length} roles)
                    </li>)}
                </ul>
              </div>}
            
            <details className="border rounded p-2">
              <summary className="cursor-pointer font-medium">All Roles Data</summary>
              <pre className="mt-2 text-xs p-2 rounded overflow-auto max-h-40 bg-neutral-700">
                {JSON.stringify(debugInfo.allRoles, null, 2)}
              </pre>
            </details>
          </div>}
      </CardContent>
    </Card>;
};