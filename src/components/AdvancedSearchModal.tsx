import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  User, 
  Calendar, 
  ShoppingBag,
  Newspaper,
  Users,
  MapPin,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'news' | 'player' | 'match' | 'merchandise' | 'ticket';
  url: string;
  date?: string;
  image?: string;
  price?: number;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedSearchModal({ isOpen, onClose }: AdvancedSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState([
    'tiket persiraja',
    'pemain baru',
    'jadwal pertandingan',
    'jersey persiraja',
    'hasil pertandingan'
  ]);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query, activeTab]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    
    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Persiraja Banda Aceh vs Persik Kediri',
          description: 'Pertandingan Liga 2 Indonesia',
          type: 'match' as const,
          url: '/matches/1',
          date: '2024-02-15',
          image: '/placeholder.svg'
        },
        {
          id: '2',
          title: 'Jersey Home Persiraja 2024',
          description: 'Jersey kandang resmi Persiraja musim 2024',
          type: 'merchandise' as const,
          url: '/shop',
          price: 350000,
          image: '/placeholder.svg'
        },
        {
          id: '3',
          title: 'Persiraja Rekrut Pemain Baru',
          description: 'Kabar terbaru mengenai rekrutmen pemain...',
          type: 'news' as const,
          url: '/news/3',
          date: '2024-02-10',
          image: '/placeholder.svg'
        },
        {
          id: '4',
          title: 'Tiket VIP Persiraja vs Persik',
          description: 'Tiket VIP untuk pertandingan kandang',
          type: 'ticket' as const,
          url: '/tickets',
          price: 150000
        },
        {
          id: '5',
          title: 'Fitra Ridwan',
          description: 'Striker andalan Persiraja Banda Aceh',
          type: 'player' as const,
          url: '/players/5',
          image: '/placeholder.svg'
        }
      ].filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = activeTab === 'all' || result.type === activeTab;
        return matchesQuery && matchesType;
      });
      
      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Gagal melakukan pencarian');
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    saveSearch(query);
    navigate(result.url);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="h-4 w-4" />;
      case 'player': return <User className="h-4 w-4" />;
      case 'match': return <Users className="h-4 w-4" />;
      case 'merchandise': return <ShoppingBag className="h-4 w-4" />;
      case 'ticket': return <Calendar className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'news': return 'Berita';
      case 'player': return 'Pemain';
      case 'match': return 'Pertandingan';
      case 'merchandise': return 'Merchandise';
      case 'ticket': return 'Tiket';
      default: return type;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian Lanjutan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari berita, pemain, pertandingan, merchandise..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-base"
              autoFocus
            />
          </div>

          {/* Search Filters */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
              <TabsTrigger value="news" className="text-xs">Berita</TabsTrigger>
              <TabsTrigger value="player" className="text-xs">Pemain</TabsTrigger>
              <TabsTrigger value="match" className="text-xs">Match</TabsTrigger>
              <TabsTrigger value="merchandise" className="text-xs">Shop</TabsTrigger>
              <TabsTrigger value="ticket" className="text-xs">Tiket</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Results or Suggestions */}
          <div className="max-h-96 overflow-y-auto">
            {query.length === 0 ? (
              <div className="space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pencarian Terakhir
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearRecentSearches}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => handleSuggestionClick(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Mencari...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    {result.image && (
                      <img 
                        src={result.image} 
                        alt={result.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getResultIcon(result.type)}
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(result.type)}
                        </Badge>
                        {result.date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(result.date)}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                        {result.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                      {result.price && (
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(result.price)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Tidak ada hasil untuk "{query}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coba kata kunci yang berbeda
                </p>
              </div>
            ) : null}
          </div>

          {/* Quick Actions */}
          {query.length === 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Akses Cepat</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => navigate('/tickets')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Beli Tiket
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => navigate('/shop')}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Merchandise
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => navigate('/matches')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Jadwal Match
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => navigate('/news')}
                >
                  <Newspaper className="h-4 w-4 mr-2" />
                  Berita Terbaru
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}