import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  Search,
  Tag,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { CategoryPills } from "@/components/ui/category-pills";
import { useDebounce } from "@/utils/performance";

interface FilterOptions {
  categories: Array<{ id: string; name: string; count: number }>;
  dateRanges: Array<{ id: string; label: string; value: [Date, Date] | null }>;
  sortOptions: Array<{ id: string; label: string; field: string; direction: "asc" | "desc" }>;
  statusOptions: Array<{ id: string; label: string; value: string }>;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  entityType: "news" | "merchandise" | "tickets" | "matches" | "users";
  showRealTimeStats?: boolean;
}

export function AdvancedFilters({ 
  onFiltersChange, 
  entityType, 
  showRealTimeStats = false 
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    dateRange: "all",
    sortBy: "newest",
    status: "all",
    priceRange: [0, 1000000],
    availability: "all",
    featured: false,
    published: "all"
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    dateRanges: [],
    sortOptions: [],
    statusOptions: []
  });

  const [realtimeStats, setRealtimeStats] = useState({
    totalItems: 0,
    activeItems: 0,
    recentActivity: 0,
    lastUpdate: new Date()
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    loadFilterOptions();
    if (showRealTimeStats) {
      loadRealtimeStats();
      const interval = setInterval(loadRealtimeStats, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [entityType, showRealTimeStats]);

  useEffect(() => {
    const updatedFilters = { ...filters, search: debouncedSearch };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [debouncedSearch]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const loadFilterOptions = async () => {
    try {
      let categories: any[] = [];
      let statusOptions: any[] = [];
      
      switch (entityType) {
        case "news":
          // Get news categories
          const { data: newsData } = await supabase
            .from("news")
            .select("category")
            .eq("published", true);
          
          const newsCategoryCount = newsData?.reduce((acc: any, item) => {
            const cat = item.category || "Berita";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {});

          categories = [
            { id: "all", name: "Semua Kategori", count: newsData?.length || 0 },
            ...Object.entries(newsCategoryCount || {}).map(([name, count]) => ({
              id: name.toLowerCase(),
              name,
              count: count as number
            }))
          ];

          statusOptions = [
            { id: "all", label: "Semua Status", value: "all" },
            { id: "published", label: "Dipublikasi", value: "true" },
            { id: "draft", label: "Draft", value: "false" }
          ];
          break;

        case "merchandise":
          // Get merchandise categories
          const { data: merchCategories } = await supabase
            .from("merchandise_categories")
            .select("*");

          const { data: merchData } = await supabase
            .from("merchandise")
            .select("category_id, is_available");

          const merchCategoryCount = merchData?.reduce((acc: any, item) => {
            const catId = item.category_id || "uncategorized";
            acc[catId] = (acc[catId] || 0) + 1;
            return acc;
          }, {});

          categories = [
            { id: "all", name: "Semua Kategori", count: merchData?.length || 0 },
            ...merchCategories?.map(cat => ({
              id: cat.id,
              name: cat.name,
              count: merchCategoryCount[cat.id] || 0
            })) || []
          ];

          statusOptions = [
            { id: "all", label: "Semua Status", value: "all" },
            { id: "available", label: "Tersedia", value: "true" },
            { id: "unavailable", label: "Tidak Tersedia", value: "false" }
          ];
          break;

        case "tickets":
          statusOptions = [
            { id: "all", label: "Semua Status", value: "all" },
            { id: "available", label: "Tersedia", value: "available" },
            { id: "sold_out", label: "Sold Out", value: "sold_out" }
          ];
          break;

        case "matches":
          statusOptions = [
            { id: "all", label: "Semua Status", value: "all" },
            { id: "scheduled", label: "Terjadwal", value: "scheduled" },
            { id: "live", label: "Live", value: "live" },
            { id: "finished", label: "Selesai", value: "finished" }
          ];
          break;

        case "users":
          statusOptions = [
            { id: "all", label: "Semua Pengguna", value: "all" },
            { id: "active", label: "Aktif", value: "active" },
            { id: "inactive", label: "Tidak Aktif", value: "inactive" }
          ];
          break;
      }

      const dateRanges = [
        { id: "all", label: "Semua Waktu", value: null },
        { id: "today", label: "Hari Ini", value: [new Date(), new Date()] as [Date, Date] },
        { id: "week", label: "7 Hari Terakhir", value: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()] as [Date, Date] },
        { id: "month", label: "30 Hari Terakhir", value: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()] as [Date, Date] },
        { id: "quarter", label: "3 Bulan Terakhir", value: [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()] as [Date, Date] }
      ];

      const sortOptions = [
        { id: "newest", label: "Terbaru", field: "created_at", direction: "desc" as const },
        { id: "oldest", label: "Terlama", field: "created_at", direction: "asc" as const },
        { id: "name_asc", label: "Nama A-Z", field: "name", direction: "asc" as const },
        { id: "name_desc", label: "Nama Z-A", field: "name", direction: "desc" as const },
        ...(entityType === "merchandise" ? [
          { id: "price_low", label: "Harga Terendah", field: "price", direction: "asc" as const },
          { id: "price_high", label: "Harga Tertinggi", field: "price", direction: "desc" as const }
        ] : []),
        ...(entityType === "news" ? [
          { id: "views", label: "Paling Banyak Dilihat", field: "views", direction: "desc" as const },
          { id: "likes", label: "Paling Banyak Disukai", field: "likes", direction: "desc" as const }
        ] : [])
      ];

      setFilterOptions({
        categories,
        dateRanges,
        sortOptions,
        statusOptions
      });
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const loadRealtimeStats = async () => {
    try {
      let totalItems = 0;
      let recentActivity = 0;
      let activeItems = 0;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      switch (entityType) {
        case "news":
          const { count: newsTotal } = await supabase.from("news").select("*", { count: "exact", head: true });
          const { count: newsRecent } = await supabase.from("news").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo);
          const { count: newsActive } = await supabase.from("news").select("*", { count: "exact", head: true }).eq("published", true);
          totalItems = newsTotal || 0;
          recentActivity = newsRecent || 0;
          activeItems = newsActive || 0;
          break;
        case "merchandise":
          const { count: merchTotal } = await supabase.from("merchandise").select("*", { count: "exact", head: true });
          const { count: merchRecent } = await supabase.from("merchandise").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo);
          const { count: merchActive } = await supabase.from("merchandise").select("*", { count: "exact", head: true }).eq("is_available", true);
          totalItems = merchTotal || 0;
          recentActivity = merchRecent || 0;
          activeItems = merchActive || 0;
          break;
        case "users":
          const { count: userTotal } = await supabase.from("profiles").select("*", { count: "exact", head: true });
          const { count: userRecent } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo);
          totalItems = userTotal || 0;
          recentActivity = userRecent || 0;
          activeItems = userTotal || 0;
          break;
        default:
          break;
      }

      setRealtimeStats({
        totalItems,
        activeItems,
        recentActivity,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error("Error loading realtime stats:", error);
    }
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: "",
      category: "all",
      dateRange: "all",
      sortBy: "newest",
      status: "all",
      priceRange: [0, 1000000],
      availability: "all",
      featured: false,
      published: "all"
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category !== "all") count++;
    if (filters.dateRange !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.featured) count++;
    if (filters.published !== "all") count++;
    return count;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Pencarian
            </CardTitle>
            {showRealTimeStats && (
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Total: {realtimeStats.totalItems}</span>
                <span>Aktif: {realtimeStats.activeItems}</span>
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {realtimeStats.recentActivity} baru (1 jam)
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} filter aktif
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Filter {showAdvanced ? "Sederhana" : "Lanjutan"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <SearchInput
              placeholder={`Cari ${entityType}...`}
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              onClear={() => updateFilter("search", "")}
            />
          </div>

          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                    {option.direction === "asc" ? 
                      <SortAsc className="h-4 w-4" /> : 
                      <SortDesc className="h-4 w-4" />
                    }
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.statusOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        {filterOptions.categories.length > 0 && (
          <CategoryPills
            categories={filterOptions.categories}
            selectedCategory={filters.category}
            onCategoryChange={(category) => updateFilter("category", category)}
          />
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <Label>Rentang Waktu</Label>
                <Select value={filters.dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih rentang waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.dateRanges.map((range) => (
                      <SelectItem key={range.id} value={range.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {range.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range (for merchandise) */}
              {entityType === "merchandise" && (
                <div>
                  <Label>Rentang Harga</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) => updateFilter("priceRange", [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) => updateFilter("priceRange", [filters.priceRange[0], parseInt(e.target.value) || 1000000])}
                    />
                  </div>
                </div>
              )}

              {/* Featured Toggle */}
              {(entityType === "news" || entityType === "merchandise") && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={filters.featured}
                    onCheckedChange={(checked) => updateFilter("featured", checked)}
                  />
                  <Label htmlFor="featured">Hanya yang Unggulan</Label>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}