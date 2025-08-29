import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Ticket, Edit, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TicketType {
  id: string;
  ticket_type: string;
  description: string;
  price: number;
  total_quantity: number;
  available_quantity: number;
  match_id: string | null;
  created_at: string;
  match?: {
    home_team: string;
    away_team: string;
    match_date: string;
    status: string;
  };
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
}

export const TicketManagement = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [formData, setFormData] = useState({
    ticket_type: '',
    description: '',
    price: '',
    total_quantity: '',
    available_quantity: '',
    match_id: ''
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          matches (
            home_team,
            away_team,
            match_date,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error('Gagal memuat data tiket');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('id, home_team, away_team, match_date, status')
        .eq('status', 'scheduled') // Hanya pertandingan yang dijadwalkan
        .gte('match_date', new Date().toISOString()) // Hanya pertandingan mendatang
        .order('match_date', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const ticketData = {
        ticket_type: formData.ticket_type,
        description: formData.description,
        price: parseFloat(formData.price),
        total_quantity: parseInt(formData.total_quantity),
        available_quantity: parseInt(formData.available_quantity),
        match_id: formData.match_id === 'none' ? null : formData.match_id || null
      };

      if (editingTicket) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', editingTicket.id);
        
        if (error) throw error;
        toast.success('Tiket berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert([ticketData]);
        
        if (error) throw error;
        toast.success('Tiket berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingTicket(null);
      resetForm();
      fetchTickets();
    } catch (error: any) {
      console.error('Error saving ticket:', error);
      toast.error('Gagal menyimpan tiket');
    }
  };

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setFormData({
      ticket_type: ticket.ticket_type,
      description: ticket.description || '',
      price: ticket.price.toString(),
      total_quantity: ticket.total_quantity.toString(),
      available_quantity: ticket.available_quantity.toString(),
      match_id: ticket.match_id || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tiket ini?')) return;
    
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Tiket berhasil dihapus');
      fetchTickets();
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      toast.error('Gagal menghapus tiket');
    }
  };

  const resetForm = () => {
    setFormData({
      ticket_type: '',
      description: '',
      price: '',
      total_quantity: '',
      available_quantity: '',
      match_id: 'none'
    });
  };

  const getAvailabilityBadge = (available: number, total: number, matchData?: any) => {
    // Cek jika pertandingan sudah selesai
    if (matchData && matchData.status === 'finished') {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">Kadaluarsa</Badge>;
    }
    
    const percentage = (available / total) * 100;
    if (percentage > 50) {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Tersedia</Badge>;
    } else if (percentage > 10) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Terbatas</Badge>;
    } else if (percentage > 0) {
      return <Badge variant="outline" className="bg-red-50 text-red-700">Hampir Habis</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">Habis</Badge>;
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchMatches();
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
        <h2 className="text-xl md:text-3xl font-bold">Kelola Tiket</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setEditingTicket(null); }}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? 'Edit Tiket' : 'Tambah Tiket'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ticket_type">Jenis Tiket</Label>
                <Input
                  id="ticket_type"
                  value={formData.ticket_type}
                  onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                  placeholder="VIP, Tribun Utara, dll"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi tiket"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="match_id">Pertandingan (Opsional)</Label>
                <Select value={formData.match_id} onValueChange={(value) => setFormData({ ...formData, match_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pertandingan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tiket Umum</SelectItem>
                    {matches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.home_team} vs {match.away_team} - {new Date(match.match_date).toLocaleDateString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="50000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_quantity">Total Kuota</Label>
                  <Input
                    id="total_quantity"
                    type="number"
                    min="1"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="available_quantity">Kuota Tersedia</Label>
                  <Input
                    id="available_quantity"
                    type="number"
                    min="0"
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingTicket ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 p-3 md:p-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm md:text-lg">{ticket.ticket_type}</CardTitle>
                  {ticket.match && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {ticket.match.home_team} vs {ticket.match.away_team}
                      </p>
                      {ticket.match.status === 'finished' && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600">
                          Selesai
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {getAvailabilityBadge(ticket.available_quantity, ticket.total_quantity, ticket.match)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 md:p-4 pt-0">
              {ticket.description && (
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Harga:</span>
                  <span className="font-semibold">Rp {ticket.price.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Kuota:</span>
                  <span className="text-sm">{ticket.available_quantity} / {ticket.total_quantity}</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(ticket.available_quantity / ticket.total_quantity) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(ticket)}
                  className="flex-1 text-xs h-7"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(ticket.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada tiket</h3>
          <p className="text-muted-foreground mb-4">
            Mulai dengan menambahkan tiket pertandingan atau tiket umum
          </p>
        </div>
      )}
    </div>
  );
};