import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lock,
  Key,
  Database,
  Server,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SecurityIssue {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'rls' | 'auth' | 'data' | 'network' | 'permissions';
  title: string;
  description: string;
  recommendation: string;
  status: 'open' | 'fixed' | 'acknowledged';
  affected_tables?: string[];
}

interface SecurityMetric {
  name: string;
  value: number;
  max: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export function SecurityDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load existing security issues from localStorage (in real app, from database)
      const savedIssues = localStorage.getItem('security_issues');
      if (savedIssues) {
        setIssues(JSON.parse(savedIssues));
      }

      const savedMetrics = localStorage.getItem('security_metrics');
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      } else {
        // Initialize default metrics
        const defaultMetrics: SecurityMetric[] = [
          {
            name: 'RLS Coverage',
            value: 85,
            max: 100,
            status: 'good',
            description: 'Percentage of tables with Row Level Security enabled'
          },
          {
            name: 'Auth Security',
            value: 90,
            max: 100,
            status: 'good',
            description: 'Authentication security score'
          },
          {
            name: 'Data Exposure Risk',
            value: 15,
            max: 100,
            status: 'good',
            description: 'Risk of sensitive data exposure (lower is better)'
          },
          {
            name: 'API Security',
            value: 75,
            max: 100,
            status: 'warning',
            description: 'API endpoint security score'
          },
          {
            name: 'Permission Granularity',
            value: 80,
            max: 100,
            status: 'good',
            description: 'Role-based access control effectiveness'
          }
        ];
        setMetrics(defaultMetrics);
        localStorage.setItem('security_metrics', JSON.stringify(defaultMetrics));
      }

      const lastScanStr = localStorage.getItem('last_security_scan');
      if (lastScanStr) {
        setLastScan(new Date(lastScanStr));
      }

    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Gagal memuat data keamanan');
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    setScanning(true);
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newIssues: SecurityIssue[] = [
        {
          id: '1',
          type: 'high',
          category: 'rls',
          title: 'Tables without RLS enabled',
          description: 'Found 2 tables without Row Level Security policies',
          recommendation: 'Enable RLS and create appropriate policies for all tables',
          status: 'open',
          affected_tables: ['public.website_visitors', 'public.news_views']
        },
        {
          id: '2',
          type: 'medium',
          category: 'auth',
          title: 'Weak password requirements',
          description: 'Current password policy allows weak passwords',
          recommendation: 'Implement stronger password requirements (min 8 chars, special chars, numbers)',
          status: 'open'
        },
        {
          id: '3',
          type: 'low',
          category: 'data',
          title: 'Exposed metadata in API responses',
          description: 'Some API responses contain unnecessary metadata',
          recommendation: 'Filter API responses to only include necessary data',
          status: 'acknowledged'
        },
        {
          id: '4',
          type: 'critical',
          category: 'permissions',
          title: 'Overprivileged service account',
          description: 'Service account has unnecessary permissions',
          recommendation: 'Review and restrict service account permissions to minimum required',
          status: 'open'
        }
      ];

      setIssues(newIssues);
      localStorage.setItem('security_issues', JSON.stringify(newIssues));
      
      const now = new Date();
      setLastScan(now);
      localStorage.setItem('last_security_scan', now.toISOString());

      // Update metrics based on scan results
      const updatedMetrics = metrics.map(metric => {
        switch (metric.name) {
          case 'RLS Coverage':
            return { ...metric, value: 75, status: 'warning' as const };
          case 'API Security':
            return { ...metric, value: 70, status: 'warning' as const };
          default:
            return metric;
        }
      });

      setMetrics(updatedMetrics);
      localStorage.setItem('security_metrics', JSON.stringify(updatedMetrics));

      toast.success('Security scan completed');
    } catch (error) {
      console.error('Error running security scan:', error);
      toast.error('Gagal menjalankan security scan');
    } finally {
      setScanning(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    try {
      const updatedIssues = issues.map(issue => 
        issue.id === issueId 
          ? { ...issue, status: 'fixed' as const }
          : issue
      );
      setIssues(updatedIssues);
      localStorage.setItem('security_issues', JSON.stringify(updatedIssues));
      toast.success('Issue marked as fixed');
    } catch (error) {
      console.error('Error fixing issue:', error);
      toast.error('Gagal memperbarui status issue');
    }
  };

  const acknowledgeIssue = async (issueId: string) => {
    try {
      const updatedIssues = issues.map(issue => 
        issue.id === issueId 
          ? { ...issue, status: 'acknowledged' as const }
          : issue
      );
      setIssues(updatedIssues);
      localStorage.setItem('security_issues', JSON.stringify(updatedIssues));
      toast.success('Issue acknowledged');
    } catch (error) {
      console.error('Error acknowledging issue:', error);
      toast.error('Gagal memperbarui status issue');
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fixed':
        return <Badge className="bg-green-500 text-white">Fixed</Badge>;
      case 'acknowledged':
        return <Badge className="bg-blue-500 text-white">Acknowledged</Badge>;
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rls':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <Key className="h-4 w-4" />;
      case 'data':
        return <EyeOff className="h-4 w-4" />;
      case 'network':
        return <Server className="h-4 w-4" />;
      case 'permissions':
        return <Lock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const openIssues = issues.filter(issue => issue.status === 'open');
  const criticalIssues = issues.filter(issue => issue.type === 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage application security
          </p>
        </div>
        
        <div className="flex gap-3">
          {lastScan && (
            <div className="text-sm text-muted-foreground">
              Last scan: {lastScan.toLocaleDateString()} {lastScan.toLocaleTimeString()}
            </div>
          )}
          <Button 
            onClick={runSecurityScan}
            disabled={scanning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Run Security Scan'}
          </Button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong className="text-red-800 dark:text-red-200">
              {criticalIssues.length} Critical Security Issue{criticalIssues.length > 1 ? 's' : ''} Found
            </strong>
            <br />
            <span className="text-red-700 dark:text-red-300">
              Immediate attention required. These issues pose significant security risks.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {metric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value}{metric.name === 'Data Exposure Risk' ? '%' : '%'}
                  </span>
                  <Badge variant={
                    metric.status === 'good' ? 'default' : 
                    metric.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {metric.status}
                  </Badge>
                </div>
                <Progress 
                  value={metric.name === 'Data Exposure Risk' ? 100 - metric.value : metric.value} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Issues */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({issues.filter(i => i.type === 'critical').length})</TabsTrigger>
          <TabsTrigger value="high">High ({issues.filter(i => i.type === 'high').length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openIssues.length})</TabsTrigger>
          <TabsTrigger value="fixed">Fixed ({issues.filter(i => i.status === 'fixed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {issues.map((issue) => (
            <Card key={issue.id} className={`${getIssueColor(issue.type)} border-2`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIssueIcon(issue.type)}
                    {getCategoryIcon(issue.category)}
                    <div>
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {issue.type} • {issue.category}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Description:</h4>
                  <p className="text-sm">{issue.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">Recommendation:</h4>
                  <p className="text-sm">{issue.recommendation}</p>
                </div>

                {issue.affected_tables && (
                  <div>
                    <h4 className="font-semibold mb-1">Affected Tables:</h4>
                    <div className="flex flex-wrap gap-1">
                      {issue.affected_tables.map((table, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {issue.status === 'open' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => fixIssue(issue.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as Fixed
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeIssue(issue.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="critical">
          {issues.filter(issue => issue.type === 'critical').map((issue) => (
            <Card key={issue.id} className={`${getIssueColor(issue.type)} border-2`}>
              {/* ... same card content as above ... */}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="high">
          {issues.filter(issue => issue.type === 'high').map((issue) => (
            <Card key={issue.id} className={`${getIssueColor(issue.type)} border-2`}>
              {/* ... same card content as above ... */}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="open">
          {openIssues.map((issue) => (
            <Card key={issue.id} className={`${getIssueColor(issue.type)} border-2`}>
              {/* ... same card content as above ... */}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fixed">
          {issues.filter(issue => issue.status === 'fixed').map((issue) => (
            <Card key={issue.id} className={`${getIssueColor(issue.type)} border-2 opacity-75`}>
              {/* ... same card content as above ... */}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading security data...</span>
        </div>
      )}
    </div>
  );
}