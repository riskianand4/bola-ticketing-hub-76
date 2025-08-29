import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { useWishlist } from "@/components/WishlistManager";
import { LoadingCard } from "@/components/ui/loading-spinner";
import { SearchInput } from "@/components/ui/search-input";
import { CategoryPills } from "@/components/ui/category-pills";
import { ProductCard } from "@/components/ui/product-card";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('shop-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'merchandise' },
        () => fetchProducts()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'merchandise_categories' },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('merchandise_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        const allCategories = [
          { id: "all", name: "Semua Produk" },
          ...(data || [])
        ];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('merchandise')
        .select(`
          *,
          merchandise_categories(name)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "/placeholder.svg"
      });
      toast.success("Produk ditambahkan ke keranjang!", {
        description: "Lihat keranjang belanja Anda"
      });
    }
  };

  const handleToggleWishlist = async (product: any) => {
    await toggleWishlist(product);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background pt-14 sm:pt-16 md:pt-20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-heading-lg mb-2 sm:mb-4 px-2">
            Persiraja Official Store
          </h1>
          <p className="text-muted-foreground text-body px-4">
            Koleksi merchandise resmi Persiraja Banda Aceh
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 space-md">
          {/* Search Bar */}
          <SearchInput
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price-low">Harga: Rendah ke Tinggi</SelectItem>
                <SelectItem value="price-high">Harga: Tinggi ke Rendah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid-responsive-2 gap-3 sm:gap-4 lg:gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <LoadingCard key={index} className="aspect-square" />
            ))}
          </div>
        ) : (
          <div className="grid-responsive-2 gap-3 sm:gap-4 lg:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={() => handleToggleWishlist(product)}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && sortedProducts.length === 0 && (
          <div className="col-span-full">
            <EmptyStateCard
              icon={Package}
              title={searchQuery || selectedCategory !== "all" ? "Tidak ada produk ditemukan" : "Belum ada produk tersedia"}
              description={
                searchQuery || selectedCategory !== "all" 
                  ? "Coba ubah filter pencarian atau kata kunci Anda" 
                  : "Admin sedang menyiapkan produk-produk menarik untuk Anda. Silakan cek lagi nanti!"
              }
              actionLabel={searchQuery || selectedCategory !== "all" ? "Reset Filter" : undefined}
              onAction={
                searchQuery || selectedCategory !== "all" 
                  ? () => {
                      setSearchQuery(""); 
                      setSelectedCategory("all");
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}