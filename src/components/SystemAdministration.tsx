import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Mail, 
  Smartphone,
  Globe,
  Lock,
  Key,
  Server,
  Activity,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SystemSetting {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'security' | 'email' | 'payment' | 'notification';
  description: string;
  sensitive?: boolean;
}

interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
  last_sign_in: string;
  email_confirmed: boolean;
  status: 'active' | 'suspended' | 'pending';
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  user_id?: string;
  metadata?: any;
}

export function SystemAdministration() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as const
  });

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSettings(),
        loadUsers(),
        loadSystemLogs()
      ]);
    } catch (error) {
      console.error('Error loading system data:', error);
      toast.error('Gagal memuat data sistem');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Load from localStorage (in real app, from database)
      const savedSettings = localStorage.getItem('system_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        const defaultSettings: SystemSetting[] = [
          {
            key: 'site_name',
            value: 'Persiraja Ticketing Hub',
            type: 'string',
            category: 'general',
            description: 'Name of the application displayed to users'
          },
          {
            key: 'maintenance_mode',
            value: 'false',
            type: 'boolean',
            category: 'general',
            description: 'Enable maintenance mode to restrict access'
          },
          {
            key: 'max_login_attempts',
            value: '5',
            type: 'number',
            category: 'security',
            description: 'Maximum login attempts before account lockout'
          },
          {
            key: 'session_timeout',
            value: '3600',
            type: 'number',
            category: 'security',
            description: 'Session timeout in seconds'
          },
          {
            key: 'password_min_length',
            value: '8',
            type: 'number',
            category: 'security',
            description: 'Minimum password length requirement'
          },
          {
            key: 'smtp_host',
            value: 'smtp.gmail.com',
            type: 'string',
            category: 'email',
            description: 'SMTP server hostname'
          },
          {
            key: 'smtp_port',
            value: '587',
            type: 'number',
            category: 'email',
            description: 'SMTP server port'
          },
          {
            key: 'smtp_username',
            value: '',
            type: 'string',
            category: 'email',
            description: 'SMTP username',
            sensitive: true
          },
          {
            key: 'smtp_password',
            value: '',
            type: 'string',
            category: 'email',
            description: 'SMTP password',
            sensitive: true
          },
          {
            key: 'xendit_api_key',
            value: '',
            type: 'string',
            category: 'payment',
            description: 'Xendit API key for payment processing',
            sensitive: true
          },
          {
            key: 'notification_email_enabled',
            value: 'true',
            type: 'boolean',
            category: 'notification',
            description: 'Enable email notifications'
          },
          {
            key: 'notification_push_enabled',
            value: 'true',
            type: 'boolean',
            category: 'notification',
            description: 'Enable push notifications'
          }
        ];
        setSettings(defaultSettings);
        localStorage.setItem('system_settings', JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Mock user data (in real app, from Supabase auth)
      const mockUsers: UserAccount[] = [
        {
          id: '1',
          email: 'admin@persiraja.com',
          full_name: 'System Administrator',
          role: 'super_admin',
          created_at: '2024-01-01T00:00:00Z',
          last_sign_in: '2024-02-15T10:30:00Z',
          email_confirmed: true,
          status: 'active'
        },
        {
          id: '2',
          email: 'editor@persiraja.com',
          full_name: 'Content Editor',
          role: 'admin',
          created_at: '2024-01-15T00:00:00Z',
          last_sign_in: '2024-02-14T15:45:00Z',
          email_confirmed: true,
          status: 'active'
        },
        {
          id: '3',
          email: 'user@example.com',
          full_name: 'Test User',
          role: 'user',
          created_at: '2024-02-01T00:00:00Z',
          last_sign_in: '2024-02-13T09:20:00Z',
          email_confirmed: true,
          status: 'active'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSystemLogs = async () => {
    try {
      // Mock system logs
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          category: 'auth',
          message: 'User login successful',
          user_id: '1',
          metadata: { ip: '192.168.1.1', user_agent: 'Chrome/91.0' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'warning',
          category: 'security',
          message: 'Multiple failed login attempts detected',
          metadata: { ip: '192.168.1.100', attempts: 4 }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'error',
          category: 'payment',
          message: 'Payment processing failed',
          metadata: { error: 'Network timeout', transaction_id: 'TXN123' }
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const updatedSettings = settings.map(setting =>
        setting.key === key ? { ...setting, value } : setting
      );
      setSettings(updatedSettings);
      localStorage.setItem('system_settings', JSON.stringify(updatedSettings));
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Gagal mengupdate setting');
    }
  };

  const createUser = async () => {
    try {
      if (!newUserForm.email || !newUserForm.password || !newUserForm.full_name) {
        toast.error('Please fill all required fields');
        return;
      }

      const newUser: UserAccount = {
        id: Date.now().toString(),
        email: newUserForm.email,
        full_name: newUserForm.full_name,
        role: newUserForm.role,
        created_at: new Date().toISOString(),
        last_sign_in: '',
        email_confirmed: false,
        status: 'pending'
      };

      setUsers([...users, newUser]);
      setNewUserForm({ email: '', password: '', full_name: '', role: 'user' });
      setShowCreateUser(false);
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Gagal membuat user');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, role: newRole as any } : user
      );
      setUsers(updatedUsers);
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Gagal mengupdate role user');
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, status: 'suspended' as const } : user
      );
      setUsers(updatedUsers);
      toast.success('User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Gagal suspend user');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-500 text-white"><Crown className="h-3 w-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500 text-white"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'user':
        return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateApiKey = () => {
    const apiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return apiKey;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            System Administration
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage system settings, users, and monitor system health
          </p>
        </div>
        
        <Button onClick={loadSystemData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong className="text-green-800">System Status: Operational</strong>
          <br />
          All services are running normally. Last system check: {new Date().toLocaleString('id-ID')}
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="security">Security Center</TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="notification">Notifications</TabsTrigger>
            </TabsList>

            {['general', 'security', 'email', 'payment', 'notification'].map((category) => (
              <TabsContent key={category} value={category}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{category} Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settings
                      .filter(setting => setting.category === category)
                      .map((setting) => (
                        <div key={setting.key} className="space-y-2">
                          <Label htmlFor={setting.key} className="flex items-center justify-between">
                            <span>{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            {setting.sensitive && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </Label>
                          
                          {setting.type === 'boolean' ? (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={setting.key}
                                checked={setting.value === 'true'}
                                onCheckedChange={(checked) => updateSetting(setting.key, checked.toString())}
                              />
                              <span className="text-sm text-muted-foreground">
                                {setting.value === 'true' ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          ) : setting.type === 'number' ? (
                            <Input
                              id={setting.key}
                              type="number"
                              value={setting.value}
                              onChange={(e) => updateSetting(setting.key, e.target.value)}
                            />
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                id={setting.key}
                                type={setting.sensitive ? 'password' : 'text'}
                                value={setting.value}
                                onChange={(e) => updateSetting(setting.key, e.target.value)}
                                placeholder={setting.sensitive ? '••••••••••' : undefined}
                              />
                              {setting.key.includes('api_key') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSetting(setting.key, generateApiKey())}
                                >
                                  Generate
                                </Button>
                              )}
                              {setting.value && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(setting.value)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">User Accounts ({users.length})</h3>
            
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newUserForm.full_name}
                      onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserForm.role} onValueChange={(value: any) => setNewUserForm({...newUserForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createUser} className="flex-1">Create User</Button>
                    <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Role</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Last Sign In</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {user.last_sign_in ? formatDateTime(user.last_sign_in) : 'Never'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {user.status === 'active' && (
                              <Button size="sm" variant="outline" onClick={() => suspendUser(user.id)}>
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getLogLevelBadge(log.level)}
                        <Badge variant="outline">{log.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.metadata && (
                        <pre className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Center Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Two-Factor Auth</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Password Policy</span>
                    <Badge className="bg-green-500 text-white">Strong</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Session Management</span>
                    <Badge className="bg-green-500 text-white">Secure</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">RLS Policies</span>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Encryption</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Backup</span>
                    <Badge className="bg-green-500 text-white">Daily</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Network Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">HTTPS/SSL</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">CORS Policy</span>
                    <Badge className="bg-green-500 text-white">Configured</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rate Limiting</span>
                    <Badge className="bg-yellow-500 text-white">Basic</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading system data...</span>
        </div>
      )}
    </div>
  );
}