import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  label?: string;
}

interface CategoryPillsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
  scrollable?: boolean;
}

export function CategoryPills({
  categories,
  selectedCategory,
  onCategoryChange,
  className,
  scrollable = true
}: CategoryPillsProps) {
  return (
    <div className={cn(
      scrollable 
        ? "overflow-x-auto pb-2 scrollbar-hide" 
        : "flex flex-wrap justify-center",
      className
    )}>
      <div className={cn(
        "flex gap-2",
        scrollable ? "min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center" : "flex-wrap"
      )}>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className="rounded-full whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0 transition-all duration-200"
          >
            {category.label || category.name}
          </Button>
        ))}
      </div>
      
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}