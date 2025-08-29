import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Edit, Plus, Trash2, Calendar, Eye, Video, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string | null;
  event_date: string | null;
  created_at: string;
  media_type: 'photo' | 'video';
  video_url?: string | null;
  thumbnail_url?: string | null;  
  duration?: string | null;
}

const categories = [
  'Pertandingan',
  'Latihan',
  'Event',
  'Behind the Scenes',
  'Fasilitas',
  'Supporter',
  'Achievement',
  'Lainnya'
];

export const GalleryManagement = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    thumbnail_url: '',
    duration: '',
    category: '',
    event_date: '',
    media_type: 'photo' as 'photo' | 'video'
  });

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGalleryItems((data || []).map(item => ({
        ...item,
        media_type: item.media_type as 'photo' | 'video'
      })));
    } catch (error: any) {
      console.error('Error fetching gallery items:', error);
      toast.error('Gagal memuat data galeri');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url,
        video_url: formData.video_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        duration: formData.duration || null,
        category: formData.category || null,
        event_date: formData.event_date || null,
        media_type: formData.media_type
      };

      if (editingItem) {
        const { error } = await supabase
          .from('gallery')
          .update(itemData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Item galeri berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('gallery')
          .insert([itemData]);
        
        if (error) throw error;
        toast.success('Item galeri berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchGalleryItems();
    } catch (error: any) {
      console.error('Error saving gallery item:', error);
      toast.error('Gagal menyimpan item galeri');
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      image_url: item.image_url,
      video_url: item.video_url || '',
      thumbnail_url: item.thumbnail_url || '',
      duration: item.duration || '',
      category: item.category || '',
      event_date: item.event_date || '',
      media_type: item.media_type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus item galeri ini?')) return;
    
    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Item galeri berhasil dihapus');
      fetchGalleryItems();
    } catch (error: any) {
      console.error('Error deleting gallery item:', error);
      toast.error('Gagal menghapus item galeri');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      thumbnail_url: '',
      duration: '',
      category: '',
      event_date: '',
      media_type: activeTab
    });
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;
    
    const colorMap: { [key: string]: string } = {
      'Pertandingan': 'bg-red-50 text-red-700',
      'Latihan': 'bg-blue-50 text-blue-700',
      'Event': 'bg-purple-50 text-purple-700',
      'Behind the Scenes': 'bg-green-50 text-green-700',
      'Fasilitas': 'bg-yellow-50 text-yellow-700',
      'Supporter': 'bg-orange-50 text-orange-700',
      'Achievement': 'bg-pink-50 text-pink-700',
      'Lainnya': 'bg-gray-50 text-gray-700'
    };

    return (
      <Badge variant="outline" className={colorMap[category] || 'bg-gray-50 text-gray-700'}>
        {category}
      </Badge>
    );
  };

  useEffect(() => {
    fetchGalleryItems();
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
        <h2 className="text-xl md:text-3xl font-bold">Kelola Galeri</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setEditingItem(null); }}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah {activeTab === 'photo' ? 'Foto' : 'Video'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? `Edit ${editingItem.media_type === 'photo' ? 'Foto' : 'Video'}` 
                  : `Tambah ${activeTab === 'photo' ? 'Foto' : 'Video'}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="media_type">Tipe Media</Label>
                <Select 
                  value={formData.media_type} 
                  onValueChange={(value: 'photo' | 'video') => setFormData({ ...formData, media_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe media" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="photo">Foto</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Judul foto"
                  required
                />
              </div>

              {formData.media_type === 'photo' ? (
                <div>
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="video_url">URL Video</Label>
                    <Input
                      id="video_url"
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="thumbnail_url">URL Thumbnail</Label>
                    <Input
                      id="thumbnail_url"
                      type="url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://example.com/thumbnail.jpg"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Durasi</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="MM:SS (contoh: 05:30)"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event_date">Tanggal Event</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi foto"
                  rows={3}
                />
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

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'photo' | 'video')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Foto
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {galleryItems.filter(item => item.media_type === 'photo').map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getCategoryBadge(item.category)}
                  </div>
                </div>
                <CardContent className="p-3 md:p-4">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Dibuat: {format(new Date(item.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    {item.event_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Event: {format(new Date(item.event_date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
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
                      onClick={() => window.open(item.image_url, '_blank')}
                      className="h-7 w-7 p-0 text-blue-600"
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
          
          {galleryItems.filter(item => item.media_type === 'photo').length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada foto</h3>
              <p className="text-muted-foreground mb-4">
                Mulai dengan menambahkan foto pertama ke galeri
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {galleryItems.filter(item => item.media_type === 'video').map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={item.thumbnail_url || item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-4">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    {getCategoryBadge(item.category)}
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {item.duration}
                    </div>
                  )}
                </div>
                <CardContent className="p-3 md:p-4">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Dibuat: {format(new Date(item.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    {item.event_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Event: {format(new Date(item.event_date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
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
                      onClick={() => window.open(item.video_url || item.image_url, '_blank')}
                      className="h-7 w-7 p-0 text-blue-600"
                    >
                      <Play className="h-3 w-3" />
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
          
          {galleryItems.filter(item => item.media_type === 'video').length === 0 && (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada video</h3>
              <p className="text-muted-foreground mb-4">
                Mulai dengan menambahkan video pertama ke galeri
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};