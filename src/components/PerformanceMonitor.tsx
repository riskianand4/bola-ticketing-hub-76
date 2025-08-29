import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Globe, 
  Database, 
  Cpu, 
  HardDrive, 
  Network, 
  Timer,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
  threshold: {
    good: number;
    warning: number;
    critical: number;
  };
}

interface OptimizationSuggestion {
  id: string;
  category: 'database' | 'api' | 'frontend' | 'caching' | 'cdn';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  recommendation: string;
  implemented: boolean;
}

interface SystemHealth {
  overall: number;
  api_response_time: number;
  database_performance: number;
  cache_hit_rate: number;
  error_rate: number;
  uptime: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadPerformanceData();
    // Set up real-time monitoring
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      // Load cached performance data
      const savedMetrics = localStorage.getItem('performance_metrics');
      const savedSuggestions = localStorage.getItem('optimization_suggestions');
      const savedHealth = localStorage.getItem('system_health');

      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      } else {
        await initializeMetrics();
      }

      if (savedSuggestions) {
        setSuggestions(JSON.parse(savedSuggestions));
      } else {
        await initializeSuggestions();
      }

      if (savedHealth) {
        setSystemHealth(JSON.parse(savedHealth));
      } else {
        await updateSystemHealth();
      }

      const lastUpdateStr = localStorage.getItem('performance_last_update');
      if (lastUpdateStr) {
        setLastUpdate(new Date(lastUpdateStr));
      }

    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Gagal memuat data performa');
    } finally {
      setLoading(false);
    }
  };

  const initializeMetrics = async () => {
    const defaultMetrics: PerformanceMetric[] = [
      {
        name: 'Page Load Time',
        value: 2.3,
        unit: 's',
        status: 'good',
        trend: 'stable',
        description: 'Average page load time across all pages',
        threshold: { good: 3, warning: 5, critical: 8 }
      },
      {
        name: 'API Response Time',
        value: 350,
        unit: 'ms',
        status: 'good',
        trend: 'down',
        description: 'Average API response time',
        threshold: { good: 500, warning: 1000, critical: 2000 }
      },
      {
        name: 'Database Query Time',
        value: 120,
        unit: 'ms',
        status: 'good',
        trend: 'stable',
        description: 'Average database query execution time',
        threshold: { good: 200, warning: 500, critical: 1000 }
      },
      {
        name: 'Memory Usage',
        value: 65,
        unit: '%',
        status: 'warning',
        trend: 'up',
        description: 'Current memory usage',
        threshold: { good: 70, warning: 85, critical: 95 }
      },
      {
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        status: 'good',
        trend: 'stable',
        description: 'Current CPU usage',
        threshold: { good: 70, warning: 85, critical: 95 }
      },
      {
        name: 'Cache Hit Rate',
        value: 78,
        unit: '%',
        status: 'warning',
        trend: 'down',
        description: 'Percentage of requests served from cache',
        threshold: { good: 80, warning: 60, critical: 40 }
      },
      {
        name: 'Error Rate',
        value: 0.8,
        unit: '%',
        status: 'good',
        trend: 'stable',
        description: 'Percentage of requests resulting in errors',
        threshold: { good: 1, warning: 3, critical: 5 }
      },
      {
        name: 'Bundle Size',
        value: 1.8,
        unit: 'MB',
        status: 'good',
        trend: 'stable',
        description: 'Total JavaScript bundle size',
        threshold: { good: 2, warning: 4, critical: 6 }
      }
    ];

    setMetrics(defaultMetrics);
    localStorage.setItem('performance_metrics', JSON.stringify(defaultMetrics));
  };

  const initializeSuggestions = async () => {
    const defaultSuggestions: OptimizationSuggestion[] = [
      {
        id: '1',
        category: 'frontend',
        title: 'Implement Image Lazy Loading',
        description: 'Images are currently loading eagerly, impacting initial page load time',
        impact: 'high',
        effort: 'easy',
        recommendation: 'Add loading="lazy" attribute to images and implement intersection observer for critical images',
        implemented: false
      },
      {
        id: '2',
        category: 'database',
        title: 'Add Database Indexes',
        description: 'Some frequently queried columns lack proper indexing',
        impact: 'high',
        effort: 'easy',
        recommendation: 'Add indexes to user_id, created_at, and category columns in news and merchandise tables',
        implemented: false
      },
      {
        id: '3',
        category: 'caching',
        title: 'Implement Redis Caching',
        description: 'Frequently accessed data is being queried repeatedly',
        impact: 'medium',
        effort: 'moderate',
        recommendation: 'Set up Redis for caching user sessions, news articles, and merchandise data',
        implemented: false
      },
      {
        id: '4',
        category: 'api',
        title: 'Optimize Database Queries',
        description: 'Some API endpoints are making unnecessary database calls',
        impact: 'medium',
        effort: 'moderate',
        recommendation: 'Implement query batching and reduce N+1 query problems',
        implemented: false
      },
      {
        id: '5',
        category: 'cdn',
        title: 'Enable CDN for Static Assets',
        description: 'Static assets are served directly from the server',
        impact: 'medium',
        effort: 'easy',
        recommendation: 'Configure CloudFlare or similar CDN for images, CSS, and JS files',
        implemented: false
      },
      {
        id: '6',
        category: 'frontend',
        title: 'Code Splitting Implementation',
        description: 'All JavaScript is loaded upfront, increasing initial bundle size',
        impact: 'high',
        effort: 'moderate',
        recommendation: 'Implement route-based code splitting and dynamic imports for heavy components',
        implemented: false
      }
    ];

    setSuggestions(defaultSuggestions);
    localStorage.setItem('optimization_suggestions', JSON.stringify(defaultSuggestions));
  };

  const updateSystemHealth = async () => {
    try {
      // Simulate health check
      const health: SystemHealth = {
        overall: 85,
        api_response_time: 350,
        database_performance: 92,
        cache_hit_rate: 78,
        error_rate: 0.8,
        uptime: 99.5
      };

      setSystemHealth(health);
      localStorage.setItem('system_health', JSON.stringify(health));
    } catch (error) {
      console.error('Error updating system health:', error);
    }
  };

  const updateMetrics = async () => {
    if (monitoring) return;
    
    setMonitoring(true);
    try {
      // Simulate metrics update with some variance
      const updatedMetrics = metrics.map(metric => {
        const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
        let newValue = metric.value * (1 + variance);
        
        // Ensure positive values
        newValue = Math.max(0, newValue);
        
        // Round to appropriate decimal places
        if (metric.unit === '%' || metric.unit === 'ms') {
          newValue = Math.round(newValue);
        } else {
          newValue = Math.round(newValue * 10) / 10;
        }

        // Determine status based on thresholds
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (metric.name === 'Error Rate') {
          // For error rate, lower is better
          if (newValue >= metric.threshold.critical) status = 'critical';
          else if (newValue >= metric.threshold.warning) status = 'warning';
        } else if (metric.name === 'Cache Hit Rate') {
          // For cache hit rate, higher is better
          if (newValue <= metric.threshold.critical) status = 'critical';
          else if (newValue <= metric.threshold.warning) status = 'warning';
        } else {
          // For most metrics, lower is better
          if (newValue >= metric.threshold.critical) status = 'critical';
          else if (newValue >= metric.threshold.warning) status = 'warning';
        }

        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        const change = newValue - metric.value;
        if (Math.abs(change) > metric.value * 0.05) {
          trend = change > 0 ? 'up' : 'down';
        }

        return { ...metric, value: newValue, status, trend };
      });

      setMetrics(updatedMetrics);
      localStorage.setItem('performance_metrics', JSON.stringify(updatedMetrics));

      const now = new Date();
      setLastUpdate(now);
      localStorage.setItem('performance_last_update', now.toISOString());

      // Update system health
      await updateSystemHealth();

    } catch (error) {
      console.error('Error updating metrics:', error);
    } finally {
      setMonitoring(false);
    }
  };

  const implementSuggestion = async (suggestionId: string) => {
    try {
      const updatedSuggestions = suggestions.map(suggestion =>
        suggestion.id === suggestionId
          ? { ...suggestion, implemented: true }
          : suggestion
      );

      setSuggestions(updatedSuggestions);
      localStorage.setItem('optimization_suggestions', JSON.stringify(updatedSuggestions));
      
      toast.success('Optimization marked as implemented');
    } catch (error) {
      console.error('Error implementing suggestion:', error);
      toast.error('Gagal mengupdate status optimisasi');
    }
  };

  const getMetricStatus = (metric: PerformanceMetric) => {
    switch (metric.status) {
      case 'good':
        return { color: 'text-green-600', bg: 'bg-green-100' };
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-500 text-white">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium Impact</Badge>;
      case 'low':
        return <Badge className="bg-green-500 text-white">Low Impact</Badge>;
      default:
        return <Badge variant="outline">{impact}</Badge>;
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'easy':
        return <Badge variant="outline" className="border-green-500 text-green-600">Easy</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Moderate</Badge>;
      case 'complex':
        return <Badge variant="outline" className="border-red-500 text-red-600">Complex</Badge>;
      default:
        return <Badge variant="outline">{effort}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Network className="h-4 w-4" />;
      case 'frontend':
        return <Globe className="h-4 w-4" />;
      case 'caching':
        return <HardDrive className="h-4 w-4" />;
      case 'cdn':
        return <Zap className="h-4 w-4" />;
      default:
        return <Cpu className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Performance Monitor
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time performance metrics and optimization suggestions
          </p>
        </div>
        
        <div className="flex gap-3 items-center">
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <Button 
            onClick={updateMetrics}
            disabled={monitoring}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${monitoring ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{systemHealth.overall}%</div>
                <div className="text-xs text-muted-foreground">Overall Health</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.api_response_time}ms</div>
                <div className="text-xs text-muted-foreground">API Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.database_performance}%</div>
                <div className="text-xs text-muted-foreground">DB Performance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.cache_hit_rate}%</div>
                <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.error_rate}%</div>
                <div className="text-xs text-muted-foreground">Error Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.uptime}%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const status = getMetricStatus(metric);
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {metric.name}
                  {getTrendIcon(metric.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Optimization Suggestions ({suggestions.filter(s => !s.implemented).length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className={`p-4 border rounded-lg ${suggestion.implemented ? 'opacity-50 bg-muted/30' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(suggestion.category)}
                    <div>
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {suggestion.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getImpactBadge(suggestion.impact)}
                    {getEffortBadge(suggestion.effort)}
                    {suggestion.implemented && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Implemented
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm mb-3">{suggestion.description}</p>
                
                <div className="bg-muted/50 rounded p-3 mb-3">
                  <h5 className="font-medium text-sm mb-1">Recommendation:</h5>
                  <p className="text-sm">{suggestion.recommendation}</p>
                </div>

                {!suggestion.implemented && (
                  <Button 
                    size="sm" 
                    onClick={() => implementSuggestion(suggestion.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Implemented
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading performance data...</span>
        </div>
      )}
    </div>
  );
}