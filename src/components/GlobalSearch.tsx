import { useState, useEffect, useRef } from 'react';
import { Search, Clock, Hash, User, Calendar, MapPin, Shirt, X, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'news' | 'match' | 'player' | 'merchandise' | 'gallery';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  url: string;
  category?: string;
  date?: string;
  price?: number;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
  autoFocus?: boolean;
}

export function GlobalSearch({ 
  placeholder = "Cari berita, pertandingan, pemain...", 
  className,
  onResultClick,
  autoFocus = false 
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounce(query, 300);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('persiraja_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Auto-focus if needed
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [debouncedQuery]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const results: SearchResult[] = [];

      // Search news
      const { data: newsData } = await supabase
        .from('news')
        .select('id, title, excerpt, featured_image, category, published_at, slug')
        .eq('published', true)
        .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(5);

      newsData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'news',
          title: item.title,
          description: item.excerpt,
          image: item.featured_image,
          url: `/news/${item.slug}`,
          category: item.category || 'Berita',
          date: item.published_at
        });
      });

      // Search matches
      const { data: matchData } = await supabase
        .from('matches')
        .select('id, home_team, away_team, match_date, venue, competition, status')
        .or(`home_team.ilike.%${searchQuery}%,away_team.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%,competition.ilike.%${searchQuery}%`)
        .limit(5);

      matchData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'match',
          title: `${item.home_team} vs ${item.away_team}`,
          subtitle: item.competition,
          description: item.venue,
          url: `/matches/${item.id}`,
          category: item.status,
          date: item.match_date
        });
      });

      // Search players
      const { data: playerData } = await supabase
        .from('players')
        .select('id, name, position, nationality, photo_url, player_type')
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      playerData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'player',
          title: item.name,
          subtitle: item.position,
          description: item.nationality,
          image: item.photo_url,
          url: `/players/${item.id}`,
          category: item.player_type
        });
      });

      // Search merchandise
      const { data: merchData } = await supabase
        .from('merchandise')
        .select('id, name, description, price, image_url, category_id')
        .eq('is_available', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      merchData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'merchandise',
          title: item.name,
          description: item.description,
          image: item.image_url,
          url: `/shop?product=${item.id}`,
          price: item.price
        });
      });

      // Search gallery
      const { data: galleryData } = await supabase
        .from('gallery')
        .select('id, title, description, image_url, media_type, event_date')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(3);

      galleryData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'gallery',
          title: item.title,
          description: item.description,
          image: item.image_url,
          url: `/gallery?item=${item.id}`,
          category: item.media_type,
          date: item.event_date
        });
      });

      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('persiraja_search_history', JSON.stringify(newHistory));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    if (value.length >= 1) {
      setLoading(true);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    addToHistory(query);
    setIsOpen(false);
    setQuery('');
    onResultClick?.(result);
    navigate(result.url);
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('persiraja_search_history');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          addToHistory(query);
          navigate(`/news?search=${encodeURIComponent(query)}`);
          setIsOpen(false);
          setQuery('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <Hash className="h-4 w-4" />;
      case 'match': return <Calendar className="h-4 w-4" />;
      case 'player': return <User className="h-4 w-4" />;
      case 'merchandise': return <Shirt className="h-4 w-4" />;
      case 'gallery': return <MapPin className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'news': return 'Berita';
      case 'match': return 'Pertandingan';
      case 'player': return 'Pemain';
      case 'merchandise': return 'Merchandise';
      case 'gallery': return 'Galeri';
      default: return type;
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 h-12 text-base border-2 focus:border-primary"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto border-2">
          <CardContent className="p-0">
            {/* Search Results */}
            {results.length > 0 && (
              <div className="border-b border-border">
                <div className="p-3 text-sm font-medium text-muted-foreground">
                  Hasil Pencarian
                </div>
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors",
                      selectedIndex === index && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={result.title}
                          className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(result.type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                          {result.category && (
                            <span className="text-xs text-muted-foreground">
                              {result.category}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm line-clamp-1 mb-1">
                          {result.title}
                        </h4>
                        
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          {result.date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(result.date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                          {result.price && (
                            <span className="text-sm font-medium text-primary">
                              Rp {result.price.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="p-4 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Mencari...</p>
              </div>
            )}

            {/* No Results */}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Tidak ada hasil untuk "{query}"
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addToHistory(query);
                    navigate(`/news?search=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  Cari di berita
                </Button>
              </div>
            )}

            {/* Search History */}
            {!loading && query.length < 2 && searchHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Pencarian Terakhir
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearHistory}
                    className="text-xs"
                  >
                    Hapus
                  </Button>
                </div>
                {searchHistory.slice(0, 5).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(term)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{term}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!loading && query.length < 2 && searchHistory.length === 0 && (
              <div>
                <div className="p-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">
                    Pencarian Populer
                  </span>
                </div>
                {['Persiraja', 'Liga 1', 'Timnas Indonesia', 'Transfer', 'Jadwal'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleHistoryClick(term)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{term}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}