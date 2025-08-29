import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Hash, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TrendingTopic {
  topic: string;
  count: number;
  category: string;
}

export function TrendingTopicsSection() {
  const navigate = useNavigate();
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      
      // Get trending topics from news content and titles
      const { data: newsData, error } = await supabase
        .from('news')
        .select('title, content, category')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Generate trending topics from news data
      const topicCounts = new Map<string, { count: number; category: string }>();
      
      // Pre-defined important topics for football
      const predefinedTopics = [
        { topic: 'Persiraja', category: 'Tim' },
        { topic: 'Liga 1', category: 'Kompetisi' },
        { topic: 'Timnas Indonesia', category: 'Tim Nasional' },
        { topic: 'Transfer', category: 'Transfer' },
        { topic: 'Piala AFF', category: 'Kompetisi' },
        { topic: 'Champions League', category: 'Kompetisi' },
        { topic: 'Stadion', category: 'Venue' },
        { topic: 'SKULL', category: 'Supporter' }
      ];

      // Add predefined topics with base count
      predefinedTopics.forEach(({ topic, category }) => {
        topicCounts.set(topic.toLowerCase(), { count: 1, category });
      });

      // Extract topics from news content
      newsData?.forEach(news => {
        const text = `${news.title} ${news.content}`.toLowerCase();
        
        // Check for predefined topics in content
        predefinedTopics.forEach(({ topic, category }) => {
          if (text.includes(topic.toLowerCase())) {
            const current = topicCounts.get(topic.toLowerCase()) || { count: 0, category };
            topicCounts.set(topic.toLowerCase(), { count: current.count + 1, category });
          }
        });

        // Extract hashtag-like patterns
        const hashtagPattern = /#(\w+)/g;
        let match;
        while ((match = hashtagPattern.exec(text)) !== null) {
          const topic = match[1].toLowerCase();
          const current = topicCounts.get(topic) || { count: 0, category: 'Hashtag' };
          topicCounts.set(topic, { count: current.count + 1, category: current.category });
        }
      });

      // Convert to array and sort by count
      const topics = Array.from(topicCounts.entries())
        .map(([topic, data]) => ({
          topic: topic.charAt(0).toUpperCase() + topic.slice(1),
          count: data.count,
          category: data.category
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setTrendingTopics(topics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      
      // Fallback to static topics if fetch fails
      const fallbackTopics = [
        { topic: 'Persiraja', count: 5, category: 'Tim' },
        { topic: 'Liga 1', count: 4, category: 'Kompetisi' },
        { topic: 'Timnas Indonesia', count: 3, category: 'Tim Nasional' },
        { topic: 'Transfer', count: 3, category: 'Transfer' },
        { topic: 'Piala AFF', count: 2, category: 'Kompetisi' },
        { topic: 'SKULL', count: 2, category: 'Supporter' },
        { topic: 'Champions League', count: 2, category: 'Kompetisi' },
        { topic: 'Stadion', count: 1, category: 'Venue' }
      ];
      setTrendingTopics(fallbackTopics);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    // Navigate to news page with search query
    navigate(`/news?search=${encodeURIComponent(topic)}`);
  };

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Topics</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-muted rounded-full w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Trending Topics</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {trendingTopics.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => handleTopicClick(item.topic)}
          >
            <Hash className="h-3 w-3 mr-1" />
            {item.topic}
            {item.count > 1 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                {item.count}
              </span>
            )}
          </Button>
        ))}
      </div>
    </section>
  );
}