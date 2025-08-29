import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingBag, Edit, Plus, Trash2, Package, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Merchandise {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_url: string;
  sizes: string[] | null;
  colors: string[] | null;
  category_id: string | null;
  created_at: string;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export const MerchandiseManagement = () => {
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Merchandise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    is_available: true,
    image_url: '',
    sizes: '',
    colors: '',
    category_id: ''
  });

  const fetchMerchandise = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('merchandise')
        .select(`
          *,
          merchandise_categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMerchandise(data || []);
    } catch (error: any) {
      console.error('Error fetching merchandise:', error);
      toast.error('Gagal memuat data merchandise');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('merchandise_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        is_available: formData.is_available,
        image_url: formData.image_url,
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : null,
        colors: formData.colors ? formData.colors.split(',').map(c => c.trim()) : null,
        category_id: formData.category_id === 'none' ? null : formData.category_id || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('merchandise')
          .update(itemData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Merchandise berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('merchandise')
          .insert([itemData]);
        
        if (error) throw error;
        toast.success('Merchandise berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchMerchandise();
    } catch (error: any) {
      console.error('Error saving merchandise:', error);
      toast.error('Gagal menyimpan merchandise');
    }
  };

  const handleEdit = (item: Merchandise) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      stock_quantity: item.stock_quantity.toString(),
      is_available: item.is_available,
      image_url: item.image_url || '',
      sizes: item.sizes ? item.sizes.join(', ') : '',
      colors: item.colors ? item.colors.join(', ') : '',
      category_id: item.category_id || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus merchandise ini?')) return;
    
    try {
      const { error } = await supabase
        .from('merchandise')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Merchandise berhasil dihapus');
      fetchMerchandise();
    } catch (error: any) {
      console.error('Error deleting merchandise:', error);
      toast.error('Gagal menghapus merchandise');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('merchandise')
        .update({ is_available: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Merchandise ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchMerchandise();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast.error('Gagal mengubah status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      is_available: true,
      image_url: '',
      sizes: '',
      colors: '',
      category_id: 'none'
    });
  };

  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Stok Aman</Badge>;
    } else if (stock > 0) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Stok Rendah</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700">Habis</Badge>;
    }
  };

  useEffect(() => {
    fetchMerchandise();
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-xl md:text-3xl font-bold">Kelola Merchandise</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setEditingItem(null); }}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Merchandise' : 'Tambah Merchandise'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Produk</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jersey Away, Syal, dll"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi produk"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category_id">Kategori</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Kategori</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="150000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Stok</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">URL Gambar</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="sizes">Ukuran (pisahkan dengan koma)</Label>
                <Input
                  id="sizes"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="S, M, L, XL, XXL"
                />
              </div>

              <div>
                <Label htmlFor="colors">Warna (pisahkan dengan koma)</Label>
                <Input
                  id="colors"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Merah, Hijau, Biru"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Tersedia untuk dijual</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {merchandise.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 p-3 md:p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm md:text-lg">{item.name}</CardTitle>
                  {item.category && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {item.category.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {getStockBadge(item.stock_quantity)}
                  {!item.is_available && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      Nonaktif
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 md:p-4 pt-0">
              {item.image_url && (
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Harga:</span>
                  <span className="font-semibold">Rp {item.price.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Stok:</span>
                  <span className="text-sm">{item.stock_quantity} unit</span>
                </div>

                {item.sizes && (
                  <div>
                    <span className="text-sm">Ukuran: </span>
                    <span className="text-sm text-muted-foreground">{item.sizes.join(', ')}</span>
                  </div>
                )}

                {item.colors && (
                  <div>
                    <span className="text-sm">Warna: </span>
                    <span className="text-sm text-muted-foreground">{item.colors.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="flex-1 text-xs h-7"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAvailability(item.id, item.is_available)}
                  className={`h-7 w-7 p-0 ${item.is_available ? 'text-yellow-600' : 'text-green-600'}`}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {merchandise.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada merchandise</h3>
          <p className="text-muted-foreground mb-4">
            Mulai dengan menambahkan produk merchandise pertama
          </p>
        </div>
      )}
    </div>
  );
};