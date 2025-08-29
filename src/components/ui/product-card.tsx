import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    created_at: string;
    merchandise_categories?: { name: string };
  };
  onAddToCart: (productId: string) => void;
  onToggleWishlist: () => void;
  className?: string;
}

export function ProductCard({ product, onAddToCart, onToggleWishlist, className }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Card className={cn("group card-interactive overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-muted aspect-square">
          <img 
            src={product.image_url || "/placeholder.svg"} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Badges */}
          {isNew && (
            <Badge className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-primary text-xs px-1.5 sm:px-2">
              Baru
            </Badge>
          )}
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Badge variant="destructive" className="text-xs">
                Stok Habis
              </Badge>
            </div>
          )}
          
          {/* Wishlist Button */}
          <Button
            size="xs"
            variant="ghost"
            className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-white/90 hover:bg-white shadow-sm rounded-full"
            onClick={onToggleWishlist}
          >
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
          </Button>
        </div>

        {/* Product Info */}
        <div className="p-sm space-y-2">
          {/* Product Name */}
          <h3 className="font-semibold text-body-sm leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[2.8rem]">
            {product.name}
          </h3>

          <p className="text-caption line-clamp-2 hidden sm:block">
            {product.description}
          </p>

          <div className="hidden sm:flex items-center gap-1">
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {product.merchandise_categories?.name || 'Produk'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-sm sm:text-base">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="text-caption hidden sm:block">
            Stok: {product.stock_quantity} item
          </div>

          <Button 
            size="touch"
            className="w-full font-medium" 
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product.id)}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="sm:hidden">
              {isOutOfStock ? "Habis" : "Beli"}
            </span>
            <span className="hidden sm:inline">
              {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}