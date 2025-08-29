import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: {
    id: string;
    title: string;
    excerpt?: string;
    featured_image?: string;
    published_at: string;
    category?: string;
    profiles?: { full_name?: string };
  };
  onLike?: (articleId: string) => void;
  className?: string;
  featured?: boolean;
}

export function NewsCard({ article, onLike, className, featured = false }: NewsCardProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) {
      onLike(article.id);
    }
  };

  if (featured) {
    return (
      <Card className={cn("group card-interactive", className)}>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-video lg:aspect-square bg-muted overflow-hidden rounded-t-lg lg:rounded-l-lg lg:rounded-t-none">
              <img 
                src={article.featured_image || "/placeholder.svg"} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-md sm:p-lg flex flex-col justify-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-body-sm w-fit">
                  {article.category || 'Berita'}
                </Badge>
                <span className="text-caption">
                  {new Date(article.published_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              <h2 className="text-heading-md group-hover:text-primary transition-colors leading-tight mb-3 sm:mb-4">
                {article.title}
              </h2>
              <p className="text-muted-foreground text-body mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                {article.excerpt}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-caption">
                  Oleh {article.profiles?.full_name || 'Admin'}
                </span>
                <div className="flex items-center gap-1 text-caption">
                  <Clock className="h-3 w-3" />
                  3 min
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("group card-interactive h-full", className)}>
      <CardContent className="p-0">
        <div className="aspect-video bg-muted rounded-t-lg mb-3 sm:mb-4 overflow-hidden">
          <img 
            src={article.featured_image || "/placeholder.svg"} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-sm sm:p-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
            <Badge variant="secondary" className="text-xs w-fit">
              {article.category || 'Berita'}
            </Badge>
            <span className="text-caption">
              {new Date(article.published_at).toLocaleDateString('id-ID')}
            </span>
          </div>
          <h3 className="font-bold text-body sm:text-body-lg mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {article.title}
          </h3>
          <p className="text-muted-foreground text-body-sm mb-3 line-clamp-2 sm:line-clamp-3">
            {article.excerpt}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-caption truncate">
              Oleh {article.profiles?.full_name || 'Admin'}
            </span>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1 text-caption">
                <Clock className="h-3 w-3 flex-shrink-0" />
                3 min
              </div>
              {onLike && (
                <Button 
                  variant="ghost" 
                  size="xs"
                  onClick={handleLike}
                  className="h-6 w-6 p-0 hover:text-red-500 flex-shrink-0 rounded-full"
                >
                  <Heart className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}