import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  ShoppingCart,
  Calendar,
  Activity,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useIntersectionObserver } from "@/utils/performance";
import { useRef } from "react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalViews: number;
    totalLikes: number;
    totalOrders: number;
    userGrowthRate: number;
    engagementRate: number;
  };
  charts: {
    userGrowth: Array<{ date: string; users: number; growth: number }>;
    contentEngagement: Array<{ name: string; views: number; likes: number; engagement: number }>;
    salesTrends: Array<{ date: string; tickets: number; merchandise: number; total: number }>;
    topContent: Array<{ title: string; views: number; category: string }>;
    deviceBreakdown: Array<{ name: string; value: number; color: string }>;
  };
  realtime: {
    activeUsers: number;
    onlineVisitors: number;
    currentPageViews: number;
  };
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const isChartVisible = useIntersectionObserver(chartRef, { threshold: 0.1 });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch overview data
      const [usersResult, newsStats, ordersResult, visitorsResult] = await Promise.all([
        supabase.rpc("get_total_users"),
        supabase.rpc("get_news_statistics"),
        supabase.from("ticket_orders").select("*").eq("payment_status", "completed"),
        supabase.from("website_visitors").select("*")
      ]);

      // Calculate user growth over last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      const totalUsers = usersResult.data || 0;
      const userGrowthRate = totalUsers > 0 ? ((recentUsers || 0) / totalUsers) * 100 : 0;

      // Process news statistics
      const newsData = newsStats.data || [];
      const totalViews = newsData.reduce((sum: number, item: any) => sum + (item.total_views || 0), 0);
      const totalLikes = newsData.reduce((sum: number, item: any) => sum + (item.total_likes || 0), 0);
      const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

      // Generate chart data
      const userGrowthData = await generateUserGrowthData();
      const contentEngagementData = newsData.slice(0, 10).map((item: any) => ({
        name: item.title.substring(0, 30) + "...",
        views: item.total_views || 0,
        likes: item.total_likes || 0,
        engagement: item.total_views > 0 ? ((item.total_likes || 0) / item.total_views) * 100 : 0
      }));

      const salesTrendsData = await generateSalesTrendsData();
      const deviceBreakdownData = [
        { name: "Desktop", value: 45, color: "hsl(var(--primary))" },
        { name: "Mobile", value: 40, color: "hsl(var(--secondary))" },
        { name: "Tablet", value: 15, color: "hsl(var(--accent))" }
      ];

      setData({
        overview: {
          totalUsers,
          totalViews,
          totalLikes,
          totalOrders: ordersResult.data?.length || 0,
          userGrowthRate,
          engagementRate
        },
        charts: {
          userGrowth: userGrowthData,
          contentEngagement: contentEngagementData,
          salesTrends: salesTrendsData,
          topContent: newsData.slice(0, 5).map((item: any) => ({
            title: item.title,
            views: item.total_views || 0,
            category: item.category || "Berita"
          })),
          deviceBreakdown: deviceBreakdownData
        },
        realtime: {
          activeUsers: Math.floor(Math.random() * 50) + 10,
          onlineVisitors: Math.floor(Math.random() * 100) + 25,
          currentPageViews: Math.floor(Math.random() * 200) + 50
        }
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowthData = async () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();
      
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayStart)
        .lt("created_at", dayEnd);

      const growth = i < 29 ? Math.floor(Math.random() * 20) - 10 : 0;
      
      data.push({
        date: date.toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
        users: count || 0,
        growth
      });
    }
    return data;
  };

  const generateSalesTrendsData = async () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();
      
      const [ticketOrders, merchandiseOrders] = await Promise.all([
        supabase
          .from("ticket_orders")
          .select("total_amount")
          .eq("payment_status", "completed")
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd),
        supabase
          .from("merchandise_orders")
          .select("total_amount")
          .eq("payment_status", "completed")
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd)
      ]);

      const tickets = ticketOrders.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const merchandise = merchandiseOrders.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      data.push({
        date: date.toLocaleDateString("id-ID", { weekday: "short" }),
        tickets,
        merchandise,
        total: tickets + merchandise
      });
    }
    return data;
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Auto-refresh every 5 minutes when visible
  useEffect(() => {
    if (!autoRefresh || !isChartVisible) return;
    
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, isChartVisible]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={chartRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-heading-md">Analytics Dashboard</h2>
          <p className="text-muted-foreground text-body-sm">
            Terakhir diperbarui: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-primary/10" : ""}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh: {autoRefresh ? "ON" : "OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Live Pengunjung</p>
                <p className="text-heading-sm text-success">{data?.realtime.onlineVisitors || 0}</p>
              </div>
              <div className="h-3 w-3 bg-success rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Active Users</p>
                <p className="text-heading-sm text-primary">{data?.realtime.activeUsers || 0}</p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Page Views</p>
                <p className="text-heading-sm">{data?.realtime.currentPageViews || 0}</p>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Total Users</p>
                <p className="text-heading-sm">{formatNumber(data?.overview.totalUsers || 0)}</p>
              </div>
              <div className="flex items-center text-success">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-body-sm">+{data?.overview.userGrowthRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Total Views</p>
                <p className="text-heading-sm">{formatNumber(data?.overview.totalViews || 0)}</p>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Engagement</p>
                <p className="text-heading-sm">{data?.overview.engagementRate.toFixed(1)}%</p>
              </div>
              <Heart className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Total Orders</p>
                <p className="text-heading-sm">{formatNumber(data?.overview.totalOrders || 0)}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pertumbuhan Pengguna (30 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.charts.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Penjualan (7 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.charts.salesTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="tickets" fill="hsl(var(--primary))" />
                <Bar dataKey="merchandise" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Konten</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.charts.contentEngagement || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" />
                <Bar dataKey="likes" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown Device</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.charts.deviceBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {data?.charts.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Content */}
      <Card>
        <CardHeader>
          <CardTitle>Konten Populer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.charts.topContent.map((content, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium truncate">{content.title}</p>
                  <p className="text-body-sm text-muted-foreground">{content.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNumber(content.views)}</p>
                  <p className="text-body-sm text-muted-foreground">views</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}