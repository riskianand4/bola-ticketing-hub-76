import React, { useState, useEffect } from "react";
import {
  Users,
  BarChart3,
  Newspaper,
  Ticket,
  ShoppingBag,
  Settings,
  Calendar,
  Image as ImageIcon,
  Users2,
  LogOut,
  Bell,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MessageSquare,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminRoute } from "@/components/AdminRoute";
import { UserManagement } from "@/components/UserManagement";
import { MatchManagement } from "@/components/MatchManagement";
import { TicketManagement } from "@/components/TicketManagement";
import { MerchandiseManagement } from "@/components/MerchandiseManagement";
import { NewsManagement } from "@/components/NewsManagement";
import { PlayerManagement } from "@/components/PlayerManagement";
import { GalleryManagement } from "@/components/GalleryManagement";
import { ScannerUserManagement } from "@/components/ScannerUserManagement";
import { SimpleNotificationSystem } from "@/components/SimpleNotificationSystem";
import { LiveCommentaryAdmin } from "@/components/LiveCommentaryAdmin";
import { PromoCodeManagement } from "@/components/PromoCodeManagement";
import { LiveCommentarySelector } from "@/components/LiveCommentarySelector";
import { AdminNotificationSender } from "@/components/AdminNotificationSender";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminMobileBottomNav } from "@/components/layout/AdminMobileBottomNav";
import { useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { userRole } = useRoles();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const isMobile = useIsMobile();
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalTicketsSold: 0,
    totalSales: 0,
    upcomingMatches: 0,
    totalNews: 0,
    totalPlayers: 0,
    totalGalleryItems: 0,
    completedOrders: 0,
    websiteVisitors: 0,
    loading: true,
  });

  const [chartData, setChartData] = useState({
    monthlyRevenue: [],
    ticketSales: [],
    userGrowth: [],
    salesByCategory: [],
    websiteVisits: [],
    loading: true,
  });

  const fetchDashboardData = async () => {
    try {
      // Get current date and season filters
      const currentYear = new Date().getFullYear();
      let startDate = new Date(`${currentYear}-01-01`).toISOString();
      let endDate = new Date(`${currentYear}-12-31`).toISOString();

      if (selectedSeason !== "all") {
        const year = parseInt(selectedSeason);
        startDate = new Date(`${year}-01-01`).toISOString();
        endDate = new Date(`${year}-12-31`).toISOString();
      }

      const [
        usersCount,
        ticketOrdersData,
        merchandiseOrdersData,
        matchesData,
        newsData,
        playersData,
        galleryData,
        visitorsData,
      ] = await Promise.all([
        supabase.rpc("get_total_users"),
        supabase
          .from("ticket_orders")
          .select("quantity, total_amount, created_at")
          .eq("payment_status", "completed")
          .gte("created_at", startDate)
          .lt("created_at", endDate),
        supabase
          .from("merchandise_orders")
          .select("total_amount, created_at")
          .eq("payment_status", "completed")
          .gte("created_at", startDate)
          .lt("created_at", endDate),
        supabase
          .from("matches")
          .select("id, match_date")
          .gte("match_date", new Date().toISOString()),
        supabase.from("news").select("id", { count: "exact", head: true }),
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase
          .from("website_visitors")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate)
          .lt("created_at", endDate),
      ]);

      const totalTicketsSold =
        ticketOrdersData.data?.reduce(
          (sum, order) => sum + order.quantity,
          0
        ) || 0;
      const ticketSales =
        ticketOrdersData.data?.reduce(
          (sum, order) => sum + Number(order.total_amount),
          0
        ) || 0;
      const merchandiseSales =
        merchandiseOrdersData.data?.reduce(
          (sum, order) => sum + Number(order.total_amount),
          0
        ) || 0;
      const completedOrders =
        (ticketOrdersData.data?.length || 0) +
        (merchandiseOrdersData.data?.length || 0);

      setDashboardData({
        totalUsers: usersCount.data || 0,
        totalTicketsSold,
        totalSales: ticketSales + merchandiseSales,
        upcomingMatches: matchesData.data?.length || 0,
        totalNews: newsData.count || 0,
        totalPlayers: playersData.count || 0,
        totalGalleryItems: galleryData.count || 0,
        completedOrders,
        websiteVisitors: visitorsData.count || 0,
        loading: false,
      });

      // Fetch chart data
      await fetchChartData(
        ticketOrdersData.data || [],
        merchandiseOrdersData.data || [],
        startDate,
        endDate
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchChartData = async (
    ticketOrders,
    merchandiseOrders,
    startDate,
    endDate
  ) => {
    try {
      // Determine base year for charts based on selected season
      const now = new Date();
      let baseYear = now.getFullYear();

      if (selectedSeason !== "all") {
        baseYear = parseInt(selectedSeason);
      }

      // Generate monthly revenue data for the selected year or current year
      const monthlyRevenue = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(baseYear, 11 - i, 1);
        const monthStart = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        ).toISOString();
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        const monthTicketRevenue = ticketOrders
          .filter(
            (order) =>
              order.created_at >= monthStart && order.created_at <= monthEnd
          )
          .reduce((sum, order) => sum + Number(order.total_amount), 0);

        const monthMerchandiseRevenue = merchandiseOrders
          .filter(
            (order) =>
              order.created_at >= monthStart && order.created_at <= monthEnd
          )
          .reduce((sum, order) => sum + Number(order.total_amount), 0);

        monthlyRevenue.push({
          month: monthDate.toLocaleDateString("id-ID", { month: "short" }),
          tickets: monthTicketRevenue,
          merchandise: monthMerchandiseRevenue,
          total: monthTicketRevenue + monthMerchandiseRevenue,
        });
      }

      // Generate ticket sales data for last 7 days (or filtered by season)
      const ticketSalesData = [];
      for (let i = 6; i >= 0; i--) {
        let dayDate;
        if (selectedSeason !== "all") {
          // For specific seasons, show data from that year
          dayDate = new Date(baseYear, 11, 31 - i); // December days of selected year
        } else {
          dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        }

        const dayStart = new Date(
          dayDate.getFullYear(),
          dayDate.getMonth(),
          dayDate.getDate()
        ).toISOString();
        const dayEnd = new Date(
          dayDate.getFullYear(),
          dayDate.getMonth(),
          dayDate.getDate(),
          23,
          59,
          59
        ).toISOString();

        const dayTickets = ticketOrders
          .filter(
            (order) =>
              order.created_at >= dayStart && order.created_at <= dayEnd
          )
          .reduce((sum, order) => sum + order.quantity, 0);

        ticketSalesData.push({
          day: dayDate.toLocaleDateString("id-ID", { weekday: "short" }),
          tickets: dayTickets,
        });
      }

      // Get user registration data for the selected season
      const userGrowthData = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(baseYear, 11 - i, 1);
        const monthStart = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        ).toISOString();
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart)
          .lt("created_at", monthEnd);

        userGrowthData.push({
          month: monthDate.toLocaleDateString("id-ID", { month: "short" }),
          users: count || 0,
        });
      }

      // Sales by category
      const totalTicketRevenue = ticketOrders.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0
      );
      const totalMerchandiseRevenue = merchandiseOrders.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0
      );

      const salesByCategory = [
        {
          name: "Tiket",
          value: totalTicketRevenue,
          color: "hsl(var(--primary))",
        },
        {
          name: "Merchandise",
          value: totalMerchandiseRevenue,
          color: "hsl(var(--secondary))",
        },
      ];

      // Get website visit data filtered by season
      const websiteVisitsData = [];
      for (let i = 6; i >= 0; i--) {
        let dayDate;
        if (selectedSeason !== "all") {
          // For specific seasons, show data from that year
          dayDate = new Date(baseYear, 11, 31 - i); // December days of selected year
        } else {
          dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        }

        const dayStart = new Date(
          dayDate.getFullYear(),
          dayDate.getMonth(),
          dayDate.getDate()
        ).toISOString();
        const dayEnd = new Date(
          dayDate.getFullYear(),
          dayDate.getMonth(),
          dayDate.getDate(),
          23,
          59,
          59
        ).toISOString();

        const { count } = await supabase
          .from("website_visitors")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd);

        websiteVisitsData.push({
          day: dayDate.toLocaleDateString("id-ID", { weekday: "short" }),
          visits: count || 0,
        });
      }

      setChartData({
        monthlyRevenue,
        ticketSales: ticketSalesData,
        userGrowth: userGrowthData,
        salesByCategory,
        websiteVisits: websiteVisitsData,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSeason]);

  // Handle tab from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location]);

  const availableSeasons = [
    { value: "all", label: "Semua Data" },
    { value: "2024", label: "Musim 2024" },
    { value: "2023", label: "Musim 2023" },
    { value: "2022", label: "Musim 2022" },
  ];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Kelola Pengguna", icon: Users },
    { id: "scanners", label: "Scanner Users", icon: Users },
    { id: "news", label: "Kelola Berita", icon: Newspaper },
    { id: "matches", label: "Kelola Pertandingan", icon: Calendar },
    { id: "commentary", label: "Live Commentary", icon: MessageSquare },
    { id: "notifications", label: "Push Notifications", icon: Bell },
    { id: "tickets", label: "Kelola Tiket", icon: Ticket },
    { id: "merchandise", label: "Kelola Merchandise", icon: ShoppingBag },
    { id: "promo-codes", label: "Kode Promo", icon: Tag },
    { id: "players", label: "Kelola Pemain", icon: Users2 },
    { id: "gallery", label: "Kelola Galeri", icon: ImageIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;

      case "scanners":
        return <ScannerUserManagement />;

      case "matches":
        return <MatchManagement />;

      case "tickets":
        return <TicketManagement />;

      case "merchandise":
        return <MerchandiseManagement />;

      case "news":
        return <NewsManagement />;

      case "players":
        return <PlayerManagement />;

      case "gallery":
        return <GalleryManagement />;

      case "commentary":
        return <LiveCommentarySelector />;

      case "notifications":
        return <AdminNotificationSender />;

      case "promo-codes":
        return <PromoCodeManagement />;

      case "dashboard":
        console.log("Rendering dashboard with chartData:", chartData.loading);
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Pilih musim" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeasons.map((season) => (
                    <SelectItem key={season.value} value={season.value}>
                      {season.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Main Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4   h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.totalUsers.toLocaleString()}
                  </div>
         
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Tiket
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.totalTicketsSold.toLocaleString()}
                  </div>
              
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Sales
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : `${(dashboardData.totalSales / 1000000).toFixed(1)}M`}
                  </div>
       
                </CardContent>
              </Card>
              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Matches
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.upcomingMatches}
                  </div>
       
                </CardContent>
              </Card>
            </div>

            {/* Additional Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Berita
                  </CardTitle>
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.totalNews.toLocaleString()}
                  </div>
    
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Pemain
                  </CardTitle>
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.totalPlayers.toLocaleString()}
                  </div>
            
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Galeri
                  </CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.totalGalleryItems.toLocaleString()}
                  </div>
             
                </CardContent>
              </Card>
              <Card className="p-3 sm:p-4  h-28">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Pengunjung
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {dashboardData.loading
                      ? "..."
                      : dashboardData.websiteVisitors.toLocaleString()}
                  </div>
  
                </CardContent>
              </Card>
            </div>
            {/* Charts Section */}
            <div className="space-y-4 lg:space-y-6">
              {/* Revenue Chart - Full width on mobile */}
              <Card className="w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Pendapatan Bulanan{" "}
                    {selectedSeason !== "all" ? `(${selectedSeason})` : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {chartData.loading ? (
                    <div className="h-48 sm:h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        total: {
                          label: "Total",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-48 sm:h-64 w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.monthlyRevenue}
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12 }}
                            interval={isMobile ? 1 : 0}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Charts Grid - Stack on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Pengguna yang Daftar{" "}
                      {selectedSeason !== "all" ? `(${selectedSeason})` : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {chartData.loading ? (
                      <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          users: {
                            label: "Pengguna",
                            color: "hsl(var(--accent))",
                          },
                        }}
                        className="h-48 w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData.userGrowth}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 12 }}
                              interval={isMobile ? 1 : 0}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="users"
                              stroke="hsl(var(--accent))"
                              strokeWidth={3}
                              dot={{ fill: "hsl(var(--accent))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Website Visitors Chart */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Pengunjung Website{" "}
                      {selectedSeason !== "all"
                        ? `(${selectedSeason})`
                        : "(7 Hari)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {chartData.loading ? (
                      <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          visits: {
                            label: "Kunjungan",
                            color: "hsl(var(--secondary))",
                          },
                        }}
                        className="h-48 w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData.websiteVisits}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="visits"
                              stroke="hsl(var(--secondary))"
                              strokeWidth={3}
                              dot={{ fill: "hsl(var(--secondary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Ticket Sales Chart */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Penjualan Tiket{" "}
                      {selectedSeason !== "all"
                        ? `(${selectedSeason})`
                        : "(7 Hari)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {chartData.loading ? (
                      <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          tickets: {
                            label: "Tiket",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-48 w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData.ticketSales}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="tickets" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Sales Distribution */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Distribusi Penjualan{" "}
                      {selectedSeason !== "all" ? `(${selectedSeason})` : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {chartData.loading ? (
                      <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          tiket: {
                            label: "Tiket",
                            color: "hsl(var(--primary))",
                          },
                          merchandise: {
                            label: "Merchandise",
                            color: "hsl(var(--secondary))",
                          },
                        }}
                        className="h-48 w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.salesByCategory}
                              cx="50%"
                              cy="50%"
                              outerRadius={isMobile ? 60 : 80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) =>
                                isMobile
                                  ? `${(percent * 100).toFixed(0)}%`
                                  : `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              labelLine={false}
                              fontSize={12}
                            >
                              {chartData.salesByCategory.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">
              Halaman tidak ditemukan
            </h3>
            <p className="text-muted-foreground">
              Fitur ini sedang dalam pengembangan.
            </p>
          </div>
        );
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <div className="flex">
          {!isMobile && (
            <div className="w-64 bg-card border-r overflow-y-auto border-border h-[calc(100vh-4rem)] sticky top-16">
              <nav className="p-4 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-12 text-left px-4"
                      onClick={() => setActiveTab(item.id)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Main Content */}
          <div
            className={cn(
              "flex-1 p-3 sm:p-6 overflow-x-hidden",
              isMobile ? "pb-20" : ""
            )}
          >
            {renderContent()}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <AdminMobileBottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>
    </AdminRoute>
  );
};

export default AdminDashboard;
