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
import { Users2, Edit, Plus, Trash2, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Player {
  id: string;
  name: string;
  position: string;
  jersey_number: number | null;
  nationality: string | null;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  player_type: string;
  role_title: string | null;
  experience_years: number | null;
  achievements: string[] | null;
  sort_order: number | null;
  created_at: string;
}

const positions = [
  'Kiper',
  'Bek Kanan',
  'Bek Tengah',
  'Bek Kiri',
  'Bek Sayap Kanan',
  'Bek Sayap Kiri',
  'Gelandang Bertahan',
  'Gelandang Tengah',
  'Gelandang Serang',
  'Gelandang Sayap Kanan',
  'Gelandang Sayap Kiri',
  'Penyerang Tengah',
  'Penyerang Sayap'
];

export const PlayerManagement = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [currentType, setCurrentType] = useState<'player' | 'coach' | 'management'>('player');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    jersey_number: '',
    nationality: '',
    date_of_birth: '',
    height: '',
    weight: '',
    bio: '',
    photo_url: '',
    is_active: true,
    player_type: 'player',
    role_title: '',
    experience_years: '',
    achievements: [] as string[],
    sort_order: ''
  });

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('player_type', currentType)
        .order(currentType === 'player' ? 'jersey_number' : 'sort_order', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      console.error('Error fetching players:', error);
      toast.error('Gagal memuat data pemain');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const playerData = {
        name: formData.name,
        position: formData.position,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        nationality: formData.nationality || null,
        date_of_birth: formData.date_of_birth || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        bio: formData.bio || null,
        photo_url: formData.photo_url || null,
        is_active: formData.is_active,
        player_type: formData.player_type,
        role_title: formData.role_title || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        achievements: formData.achievements.length > 0 ? formData.achievements : null,
        sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0
      };

      if (editingPlayer) {
        const { error } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', editingPlayer.id);
        
        if (error) throw error;
        toast.success('Pemain berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('players')
          .insert([playerData]);
        
        if (error) throw error;
        toast.success('Pemain berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingPlayer(null);
      resetForm();
      fetchPlayers();
    } catch (error: any) {
      console.error('Error saving player:', error);
      toast.error('Gagal menyimpan data pemain');
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      position: player.position,
      jersey_number: player.jersey_number?.toString() || '',
      nationality: player.nationality || '',
      date_of_birth: player.date_of_birth || '',
      height: player.height?.toString() || '',
      weight: player.weight?.toString() || '',
      bio: player.bio || '',
      photo_url: player.photo_url || '',
      is_active: player.is_active,
      player_type: player.player_type,
      role_title: player.role_title || '',
      experience_years: player.experience_years?.toString() || '',
      achievements: player.achievements || [],
      sort_order: player.sort_order?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pemain ini?')) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Pemain berhasil dihapus');
      fetchPlayers();
    } catch (error: any) {
      console.error('Error deleting player:', error);
      toast.error('Gagal menghapus pemain');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Pemain ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchPlayers();
    } catch (error: any) {
      console.error('Error updating player status:', error);
      toast.error('Gagal mengubah status pemain');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      jersey_number: '',
      nationality: '',
      date_of_birth: '',
      height: '',
      weight: '',
      bio: '',
      photo_url: '',
      is_active: true,
      player_type: currentType,
      role_title: '',
      experience_years: '',
      achievements: [] as string[],
      sort_order: ''
    });
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, player_type: currentType }));
  }, [currentType]);

  useEffect(() => {
    fetchPlayers();
  }, [currentType]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    fetchPlayers();
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
      {/* Type Selector */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant={currentType === 'player' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setCurrentType('player')}
        >
          Pemain
        </Button>
        <Button 
          variant={currentType === 'coach' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setCurrentType('coach')}
        >
          Pelatih
        </Button>
        <Button 
          variant={currentType === 'management' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setCurrentType('management')}
        >
          Manajemen
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-xl md:text-3xl font-bold">
          Kelola {currentType === 'player' ? 'Pemain' : currentType === 'coach' ? 'Pelatih' : 'Manajemen'}
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setEditingPlayer(null); }}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlayer ? `Edit ${currentType === 'player' ? 'Pemain' : currentType === 'coach' ? 'Pelatih' : 'Manajemen'}` : 
                 `Tambah ${currentType === 'player' ? 'Pemain' : currentType === 'coach' ? 'Pelatih' : 'Manajemen'}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {currentType === 'player' ? 'Nama Pemain' : currentType === 'coach' ? 'Nama Pelatih' : 'Nama'}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Nama lengkap ${currentType === 'player' ? 'pemain' : currentType === 'coach' ? 'pelatih' : 'manajemen'}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Posisi</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currentType === 'player' && (
                  <div>
                    <Label htmlFor="jersey_number">Nomor Punggung</Label>
                    <Input
                      id="jersey_number"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.jersey_number}
                      onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality">Kebangsaan</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Indonesia"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Tinggi (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="150"
                    max="220"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="175"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Berat (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="40"
                    max="120"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="photo_url">URL Foto</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <Label htmlFor="bio">Biografi</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Biografi singkat pemain"
                  rows={3}
                />
              </div>

              {/* Additional fields for coaches and management */}
              {(currentType === 'coach' || currentType === 'management') && (
                <>
                  <div>
                    <Label htmlFor="role_title">Jabatan</Label>
                    <Input
                      id="role_title"
                      value={formData.role_title}
                      onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                      placeholder="Pelatih Kepala / General Manager"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience_years">Pengalaman (tahun)</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sort_order">Urutan Tampil</Label>
                      <Input
                        id="sort_order"
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">
                  {currentType === 'player' ? 'Pemain aktif' : currentType === 'coach' ? 'Pelatih aktif' : 'Aktif'}
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingPlayer ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {players.map((player) => (
          <Card key={player.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {player.photo_url ? (
                    <img 
                      src={player.photo_url} 
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Users2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    {player.jersey_number && (
                      <p className="text-sm text-muted-foreground">#{player.jersey_number}</p>
                    )}
                  </div>
                </div>
                {player.is_active ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700">
                    Non-aktif
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium">Posisi:</span> {player.position}
                </div>
                {player.nationality && (
                  <div className="text-sm">
                    <span className="font-medium">Kebangsaan:</span> {player.nationality}
                  </div>
                )}
                {player.date_of_birth && (
                  <div className="text-sm">
                    <span className="font-medium">Usia:</span> {calculateAge(player.date_of_birth)} tahun
                  </div>
                )}
                {(player.height || player.weight) && (
                  <div className="text-sm">
                    <span className="font-medium">Fisik:</span> 
                    {player.height && ` ${player.height}cm`}
                    {player.height && player.weight && ' / '}
                    {player.weight && ` ${player.weight}kg`}
                  </div>
                )}
              </div>

              {player.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{player.bio}</p>
              )}

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(player)}
                  className="flex-1 text-xs h-7"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(player.id, player.is_active)}
                  className={`h-7 w-7 p-0 ${player.is_active ? 'text-yellow-600' : 'text-green-600'}`}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(player.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-12">
          <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada pemain</h3>
          <p className="text-muted-foreground mb-4">
            Mulai dengan menambahkan pemain pertama
          </p>
        </div>
      )}
    </div>
  );
};