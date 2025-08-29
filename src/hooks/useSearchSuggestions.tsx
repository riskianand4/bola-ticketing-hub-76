import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchSuggestion {
  query: string;
  count: number;
  type: 'trending' | 'popular' | 'recent';
}

export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Get trending topics from news content
      const { data: newsData } = await supabase
        .from('news')
        .select('title, content, category')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(100);

      // Extract keywords and create suggestions
      const keywordCounts = new Map<string, number>();
      
      // Predefined important terms
      const predefinedTerms = [
        'Persiraja', 'Liga 1', 'Timnas Indonesia', 'Transfer', 'Piala AFF',
        'Champions League', 'SKULL', 'Stadion', 'Jadwal', 'Tiket',
        'Merchandise', 'Pemain', 'Pertandingan', 'Galeri'
      ];

      predefinedTerms.forEach(term => {
        keywordCounts.set(term.toLowerCase(), 1);
      });

      // Count occurrences in news
      newsData?.forEach(article => {
        const text = `${article.title} ${article.content}`.toLowerCase();
        
        predefinedTerms.forEach(term => {
          if (text.includes(term.toLowerCase())) {
            const current = keywordCounts.get(term.toLowerCase()) || 0;
            keywordCounts.set(term.toLowerCase(), current + 1);
          }
        });
      });

      // Convert to suggestions array
      const trendingSuggestions = Array.from(keywordCounts.entries())
        .map(([query, count]) => ({
          query: query.charAt(0).toUpperCase() + query.slice(1),
          count,
          type: count > 5 ? 'trending' as const : 'popular' as const
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Add recent searches from localStorage
      const recentSearches = localStorage.getItem('persiraja_search_history');
      if (recentSearches) {
        const recent = JSON.parse(recentSearches).slice(0, 3).map((query: string) => ({
          query,
          count: 0,
          type: 'recent' as const
        }));
        
        setSuggestions([...recent, ...trendingSuggestions]);
      } else {
        setSuggestions(trendingSuggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      
      // Fallback suggestions
      const fallbackSuggestions: SearchSuggestion[] = [
        { query: 'Persiraja', count: 10, type: 'trending' },
        { query: 'Liga 1', count: 8, type: 'trending' },
        { query: 'Timnas Indonesia', count: 6, type: 'trending' },
        { query: 'Transfer', count: 5, type: 'popular' },
        { query: 'Jadwal Pertandingan', count: 4, type: 'popular' },
        { query: 'Tiket', count: 3, type: 'popular' },
        { query: 'Merchandise', count: 2, type: 'popular' },
        { query: 'Galeri', count: 1, type: 'popular' }
      ];
      
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  };

  const addToRecentSearches = (query: string) => {
    const recentSearches = localStorage.getItem('persiraja_search_history');
    const searches = recentSearches ? JSON.parse(recentSearches) : [];
    const updatedSearches = [query, ...searches.filter((s: string) => s !== query)].slice(0, 10);
    localStorage.setItem('persiraja_search_history', JSON.stringify(updatedSearches));
    
    // Update suggestions with new recent search
    fetchSuggestions();
  };

  return {
    suggestions,
    loading,
    addToRecentSearches,
    refreshSuggestions: fetchSuggestions
  };
}