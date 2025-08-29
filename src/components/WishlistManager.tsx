import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  merchandise_id: string;
  user_id: string;
  created_at: string;
  merchandise: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    is_available: boolean;
  };
}

interface WishlistManagerProps {
  compact?: boolean;
}

export function WishlistManager({ compact = false }: WishlistManagerProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    try {
      // In a real implementation, you would fetch from wishlist table
      // For now, we'll use localStorage as a placeholder
      const savedWishlist = localStorage.getItem(`wishlist_${user?.id}`);
      if (savedWishlist) {
        const items = JSON.parse(savedWishlist);
        setWishlistItems(items);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (merchandiseData: any) => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan ke wishlist');
      return false;
    }

    try {
      const newItem: WishlistItem = {
        id: Date.now().toString(),
        merchandise_id: merchandiseData.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        merchandise: merchandiseData
      };

      const updatedWishlist = [...wishlistItems, newItem];
      setWishlistItems(updatedWishlist);
      
      // Save to localStorage (in real app, save to database)
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
      
      toast.success('Ditambahkan ke wishlist');
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Gagal menambahkan ke wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
      setWishlistItems(updatedWishlist);
      
      // Save to localStorage (in real app, save to database)
      localStorage.setItem(`wishlist_${user?.id}`, JSON.stringify(updatedWishlist));
      
      toast.success('Dihapus dari wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Gagal menghapus dari wishlist');
    }
  };

  const isInWishlist = (merchandiseId: string) => {
    return wishlistItems.some(item => item.merchandise_id === merchandiseId);
  };

  const moveToCart = (item: WishlistItem) => {
    addItem({
      id: item.merchandise.id,
      name: item.merchandise.name,
      price: item.merchandise.price,
      image: item.merchandise.image_url || "/placeholder.svg"
    });
    removeFromWishlist(item.id);
    toast.success('Dipindahkan ke keranjang');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPriceChange = (item: WishlistItem) => {
    // In a real app, you would track price history
    // For demo, we'll simulate some items having price changes
    const random = Math.random();
    if (random < 0.2) {
      return { type: 'decrease', amount: 10000, percentage: 5 };
    } else if (random < 0.3) {
      return { type: 'increase', amount: 5000, percentage: 2 };
    }
    return null;
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Wishlist ({wishlistItems.length})</h3>
          <Button variant="outline" size="sm">
            Lihat Semua
          </Button>
        </div>
        
        {wishlistItems.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <img 
              src={item.merchandise.image_url || "/placeholder.svg"} 
              alt={item.merchandise.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.merchandise.name}</p>
              <p className="text-sm text-primary">{formatPrice(item.merchandise.price)}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => moveToCart(item)}
              disabled={!item.merchandise.is_available}
            >
              <ShoppingCart className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Wishlist Saya ({wishlistItems.length})
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <Card className="text-center p-12">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Wishlist Kosong</h3>
          <p className="text-muted-foreground mb-6">
            Anda belum menambahkan produk ke wishlist. Mulai jelajahi produk favorit Anda!
          </p>
          <Button onClick={() => window.location.href = '/shop'}>
            Jelajahi Produk
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const priceChange = getPriceChange(item);
            
            return (
              <Card key={item.id} className="group hover:shadow-md transition-shadow">
                <div className="relative">
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img 
                      src={item.merchandise.image_url || "/placeholder.svg"} 
                      alt={item.merchandise.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  {priceChange && (
                    <Badge 
                      className={`absolute top-2 left-2 ${
                        priceChange.type === 'decrease' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {priceChange.type === 'decrease' ? '-' : '+'}
                      {priceChange.percentage}%
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.merchandise.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(item.merchandise.price)}
                      </span>
                      {priceChange && (
                        <span className={`text-sm ${
                          priceChange.type === 'decrease' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {priceChange.type === 'decrease' ? 'Turun' : 'Naik'} {formatPrice(priceChange.amount)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Ditambahkan {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => moveToCart(item)}
                      disabled={!item.merchandise.is_available || item.merchandise.stock_quantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.merchandise.is_available && item.merchandise.stock_quantity > 0 
                        ? 'Tambah ke Keranjang' 
                        : 'Stok Habis'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // Export the hook functions for use by other components
  return {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistItems,
    loading
  };
}

// Custom hook for wishlist functionality
export function useWishlist() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      }
    }
  }, [user]);

  const addToWishlist = async (merchandiseData: any) => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan ke wishlist');
      return false;
    }

    const isAlreadyInWishlist = wishlistItems.some(item => item.merchandise_id === merchandiseData.id);
    if (isAlreadyInWishlist) {
      toast.info('Produk sudah ada di wishlist');
      return false;
    }

    try {
      const newItem: WishlistItem = {
        id: Date.now().toString(),
        merchandise_id: merchandiseData.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        merchandise: merchandiseData
      };

      const updatedWishlist = [...wishlistItems, newItem];
      setWishlistItems(updatedWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
      
      toast.success('Ditambahkan ke wishlist');
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Gagal menambahkan ke wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (merchandiseId: string) => {
    try {
      const updatedWishlist = wishlistItems.filter(item => item.merchandise_id !== merchandiseId);
      setWishlistItems(updatedWishlist);
      localStorage.setItem(`wishlist_${user?.id}`, JSON.stringify(updatedWishlist));
      
      toast.success('Dihapus dari wishlist');
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Gagal menghapus dari wishlist');
      return false;
    }
  };

  const toggleWishlist = async (merchandiseData: any) => {
    const isInWishlist = wishlistItems.some(item => item.merchandise_id === merchandiseData.id);
    
    if (isInWishlist) {
      return await removeFromWishlist(merchandiseData.id);
    } else {
      return await addToWishlist(merchandiseData);
    }
  };

  const isInWishlist = (merchandiseId: string) => {
    return wishlistItems.some(item => item.merchandise_id === merchandiseId);
  };

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount: wishlistItems.length
  };
}