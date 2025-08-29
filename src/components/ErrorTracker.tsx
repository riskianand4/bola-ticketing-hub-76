import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Bug, 
  Code, 
  Network,
  Database,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface ErrorPattern {
  id: string;
  type: 'syntax' | 'logic' | 'runtime' | 'network' | 'database' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file?: string;
  line?: number;
  count: number;
  first_seen: string;
  last_seen: string;
  status: 'active' | 'resolved' | 'ignored';
  suggested_fix?: string;
}

interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  response_time?: number;
  last_checked: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  change: number; // percentage change from last check
}

export function ErrorTracker() {
  const [errors, setErrors] = useState<ErrorPattern[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    initializeErrorTracking();
    // Run health checks every minute
    const interval = setInterval(runHealthChecks, 60000);
    return () => clearInterval(interval);
  }, []);

  const initializeErrorTracking = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadErrorPatterns(),
        runHealthChecks(),
        loadSystemMetrics()
      ]);
    } catch (error) {
      console.error('Error initializing error tracker:', error);
      toast.error('Gagal menginisialisasi error tracker');
    } finally {
      setLoading(false);
    }
  };

  const loadErrorPatterns = async () => {
    try {
      // Load from localStorage (in real app, from error logging service)
      const savedErrors = localStorage.getItem('error_patterns');
      if (savedErrors) {
        setErrors(JSON.parse(savedErrors));
      } else {
        // Initialize with common error patterns
        const commonErrors: ErrorPattern[] = [
          {
            id: '1',
            type: 'network',
            severity: 'medium',
            message: 'Network request timeout',
            file: 'src/hooks/useAuth.tsx',
            line: 45,
            count: 12,
            first_seen: '2024-02-10T08:00:00Z',
            last_seen: '2024-02-15T14:30:00Z',
            status: 'active',
            suggested_fix: 'Add retry logic with exponential backoff'
          },
          {
            id: '2',
            type: 'logic',
            severity: 'high',
            message: 'Undefined property access in payment processing',
            file: 'src/pages/PaymentPage.tsx',
            line: 89,
            count: 5,
            first_seen: '2024-02-14T10:00:00Z',
            last_seen: '2024-02-15T12:15:00Z',
            status: 'active',
            suggested_fix: 'Add null checks before property access'
          },
          {
            id: '3',
            type: 'database',
            severity: 'critical',
            message: 'RLS policy violation in user data access',
            file: 'src/components/UserManagement.tsx',
            line: 120,
            count: 3,
            first_seen: '2024-02-15T09:30:00Z',
            last_seen: '2024-02-15T11:45:00Z',
            status: 'active',
            suggested_fix: 'Review and fix RLS policies for user_roles table'
          },
          {
            id: '4',
            type: 'syntax',
            severity: 'low',
            message: 'Unused import statement',
            file: 'src/components/NewsCard.tsx',
            line: 8,
            count: 1,
            first_seen: '2024-02-15T15:00:00Z',
            last_seen: '2024-02-15T15:00:00Z',
            status: 'active',
            suggested_fix: 'Remove unused import to reduce bundle size'
          }
        ];
        setErrors(commonErrors);
        localStorage.setItem('error_patterns', JSON.stringify(commonErrors));
      }
    } catch (error) {
      console.error('Error loading error patterns:', error);
    }
  };

  const runHealthChecks = async () => {
    try {
      const checks: HealthCheck[] = [
        {
          component: 'Database Connection',
          status: 'healthy',
          message: 'All database connections are responding normally',
          response_time: 45,
          last_checked: new Date().toISOString()
        },
        {
          component: 'Authentication Service',
          status: 'healthy',
          message: 'Supabase auth service is operational',
          response_time: 120,
          last_checked: new Date().toISOString()
        },
        {
          component: 'Payment Gateway',
          status: 'warning',
          message: 'Xendit API response time is elevated',
          response_time: 2500,
          last_checked: new Date().toISOString()
        },
        {
          component: 'File Storage',
          status: 'healthy',
          message: 'Supabase storage is functioning normally',
          response_time: 200,
          last_checked: new Date().toISOString()
        },
        {
          component: 'Edge Functions',
          status: 'healthy',
          message: 'All edge functions are responsive',
          response_time: 350,
          last_checked: new Date().toISOString()
        },
        {
          component: 'Real-time Features',
          status: 'critical',
          message: 'WebSocket connections experiencing issues',
          response_time: undefined,
          last_checked: new Date().toISOString()
        }
      ];

      setHealthChecks(checks);
    } catch (error) {
      console.error('Error running health checks:', error);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const currentMetrics: SystemMetric[] = [
        {
          name: 'Error Rate',
          value: 0.8,
          unit: '%',
          status: 'good',
          change: -0.2
        },
        {
          name: 'Critical Errors',
          value: 1,
          unit: 'count',
          status: 'warning',
          change: 0
        },
        {
          name: 'Response Time',
          value: 450,
          unit: 'ms',
          status: 'good',
          change: -50
        },
        {
          name: 'Uptime',
          value: 99.8,
          unit: '%',
          status: 'good',
          change: 0.1
        }
      ];

      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const scanForErrors = async () => {
    setScanning(true);
    try {
      // Simulate error scanning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add some new detected errors
      const newErrors: ErrorPattern[] = [
        {
          id: Date.now().toString(),
          type: 'runtime',
          severity: 'medium',
          message: 'Memory leak detected in component unmount',
          file: 'src/components/HeroSlider.tsx',
          line: 65,
          count: 1,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          status: 'active',
          suggested_fix: 'Clean up event listeners and timers in useEffect cleanup'
        }
      ];

      setErrors(prev => [...newErrors, ...prev]);
      toast.success('Error scan completed - 1 new issue found');
    } catch (error) {
      console.error('Error during scan:', error);
      toast.error('Gagal menjalankan error scan');
    } finally {
      setScanning(false);
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      const updatedErrors = errors.map(error =>
        error.id === errorId ? { ...error, status: 'resolved' as const } : error
      );
      setErrors(updatedErrors);
      localStorage.setItem('error_patterns', JSON.stringify(updatedErrors));
      toast.success('Error marked as resolved');
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast.error('Gagal menyelesaikan error');
    }
  };

  const ignoreError = async (errorId: string) => {
    try {
      const updatedErrors = errors.map(error =>
        error.id === errorId ? { ...error, status: 'ignored' as const } : error
      );
      setErrors(updatedErrors);
      localStorage.setItem('error_patterns', JSON.stringify(updatedErrors));
      toast.success('Error marked as ignored');
    } catch (error) {
      console.error('Error ignoring issue:', error);
      toast.error('Gagal mengignore error');
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'syntax':
        return <Code className="h-4 w-4" />;
      case 'logic':
        return <Bug className="h-4 w-4" />;
      case 'runtime':
        return <Activity className="h-4 w-4" />;
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-500 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500 text-white">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'unknown':
        return <Badge variant="outline">Unknown</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-green-500" />;
    return <Activity className="h-3 w-3 text-gray-500" />;
  };

  const activeErrors = errors.filter(error => error.status === 'active');
  const criticalErrors = errors.filter(error => error.severity === 'critical' && error.status === 'active');
  const criticalServices = healthChecks.filter(check => check.status === 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8 text-primary" />
            Error Tracker & System Health
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor errors, system health, and performance metrics
          </p>
        </div>
        
        <Button onClick={scanForErrors} disabled={scanning}>
          <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan for Errors'}
        </Button>
      </div>

      {/* Critical Alerts */}
      {(criticalErrors.length > 0 || criticalServices.length > 0) && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong className="text-red-800 dark:text-red-200">Critical Issues Detected</strong>
            <br />
            <span className="text-red-700 dark:text-red-300">
              {criticalErrors.length} critical errors and {criticalServices.length} failing services require immediate attention.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {metric.name}
                {getChangeIcon(metric.change)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </span>
                  <Badge variant={
                    metric.status === 'good' ? 'default' : 
                    metric.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {metric.status}
                  </Badge>
                </div>
                {metric.change !== 0 && (
                  <p className="text-xs text-muted-foreground">
                    {metric.change > 0 ? '+' : ''}{metric.change}% from last check
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Health Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthChecks.map((check, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{check.component}</h4>
                  {getStatusBadge(check.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{check.message}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {check.response_time && (
                    <span>Response: {check.response_time}ms</span>
                  )}
                  <span>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatDateTime(check.last_checked)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Patterns ({activeErrors.length} active)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errors.map((error) => (
              <div 
                key={error.id} 
                className={`p-4 border rounded-lg ${
                  error.status === 'resolved' ? 'opacity-50 bg-green-50 dark:bg-green-950/10' :
                  error.status === 'ignored' ? 'opacity-50 bg-gray-50 dark:bg-gray-950/10' :
                  error.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                  error.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                  ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getErrorIcon(error.type)}
                    <div>
                      <h4 className="font-semibold">{error.message}</h4>
                      <p className="text-sm text-muted-foreground">
                        {error.file}:{error.line} • Count: {error.count}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getSeverityBadge(error.severity)}
                    <Badge variant={
                      error.status === 'resolved' ? 'default' :
                      error.status === 'ignored' ? 'outline' : 'destructive'
                    }>
                      {error.status}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  <div className="flex gap-4">
                    <span>First seen: {formatDateTime(error.first_seen)}</span>
                    <span>Last seen: {formatDateTime(error.last_seen)}</span>
                  </div>
                </div>

                {error.suggested_fix && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-3 mb-3">
                    <h5 className="font-medium text-sm mb-1 text-blue-800 dark:text-blue-200">
                      Suggested Fix:
                    </h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {error.suggested_fix}
                    </p>
                  </div>
                )}

                {error.status === 'active' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => resolveError(error.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => ignoreError(error.id)}
                    >
                      Ignore
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading error tracking data...</span>
        </div>
      )}
    </div>
  );
}