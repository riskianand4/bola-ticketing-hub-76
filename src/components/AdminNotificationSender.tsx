import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Users, AlertTriangle, Info, CheckCircle, Calendar } from 'lucide-react';

type NotificationType = 'general' | 'match_reminder' | 'goal_alert' | 'ticket_alert' | 'news_alert' | 'merchandise_alert' | 'payment_confirmation';

interface NotificationForm {
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  target: 'all' | 'specific';
  user_ids?: string;
}

export function AdminNotificationSender() {
  const { user } = useAuth();
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'general',
    target: 'all',
  });
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<{ count: number; timestamp: Date } | null>(null);

  const notificationTypes = [
    { value: 'general', label: 'Umum', icon: Info, color: 'bg-blue-500' },
    { value: 'match_reminder', label: 'Pengingat Pertandingan', icon: Calendar, color: 'bg-orange-500' },
    { value: 'goal_alert', label: 'Alert Goal', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'ticket_alert', label: 'Alert Tiket', icon: AlertTriangle, color: 'bg-yellow-500' },
    { value: 'news_alert', label: 'Berita', icon: Info, color: 'bg-purple-500' },
    { value: 'merchandise_alert', label: 'Merchandise', icon: Info, color: 'bg-pink-500' },
    { value: 'payment_confirmation', label: 'Konfirmasi Pembayaran', icon: CheckCircle, color: 'bg-green-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Judul dan pesan tidak boleh kosong');
      return;
    }

    setSending(true);
    try {
      if (form.target === 'all') {
        // Send to all users using bulk notification function
        const { data, error } = await supabase.functions.invoke('send-bulk-notification', {
          body: {
            title: form.title,
            message: form.message,
            notification_type: form.type,
            data: form.action_url ? { action_url: form.action_url } : {},
            target_type: 'all'
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success(`Notifikasi berhasil dikirim ke ${data.sent_count} pengguna`);
        setLastSent({ count: data.sent_count, timestamp: new Date() });
      } else {
        // Send to specific users
        if (!form.user_ids?.trim()) {
          toast.error('Masukkan User ID yang valid');
          return;
        }

        const userIds = form.user_ids.split(',').map(id => id.trim()).filter(Boolean);
        
        const { data, error } = await supabase.functions.invoke('send-bulk-notification', {
          body: {
            title: form.title,
            message: form.message,
            notification_type: form.type,
            data: form.action_url ? { action_url: form.action_url } : {},
            target_type: 'specific',
            user_ids: userIds
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success(`Notifikasi berhasil dikirim ke ${data.sent_count}/${userIds.length} pengguna`);
        setLastSent({ count: data.sent_count, timestamp: new Date() });
      }

      // Reset form
      setForm({
        title: '',
        message: '',
        type: 'general',
        target: 'all',
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(`Gagal mengirim notifikasi: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleQuickNotification = async (type: NotificationType, title: string, message: string) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-notification', {
        body: {
          title,
          message,
          notification_type: type,
          data: {},
          target_type: 'all'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Notifikasi cepat berhasil dikirim ke ${data.sent_count} pengguna`);
      setLastSent({ count: data.sent_count, timestamp: new Date() });
    } catch (error: any) {
      console.error('Error sending quick notification:', error);
      toast.error(`Gagal mengirim notifikasi: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const selectedTypeInfo = notificationTypes.find(t => t.value === form.type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Kirim Notifikasi Push
          </CardTitle>
          {lastSent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Terakhir dikirim ke {lastSent.count} pengguna pada {lastSent.timestamp.toLocaleString('id-ID')}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Judul Notifikasi</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Masukkan judul notifikasi"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.title.length}/50 karakter
                </p>
              </div>

              <div>
                <Label htmlFor="type">Jenis Notifikasi</Label>
                <Select value={form.type} onValueChange={(value: NotificationType) => setForm({ ...form, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Masukkan pesan notifikasi"
                maxLength={200}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.message.length}/200 karakter
              </p>
            </div>

            <div>
              <Label htmlFor="action_url">URL Aksi (Opsional)</Label>
              <Input
                id="action_url"
                value={form.action_url || ''}
                onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                placeholder="https://... (akan dibuka saat notifikasi diklik)"
                type="url"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Target Penerima</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={form.target === 'all'}
                    onChange={(e) => setForm({ ...form, target: e.target.value as 'all' | 'specific' })}
                  />
                  <span>Semua Pengguna</span>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    Broadcast
                  </Badge>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target"
                    value="specific"
                    checked={form.target === 'specific'}
                    onChange={(e) => setForm({ ...form, target: e.target.value as 'all' | 'specific' })}
                  />
                  <span>Pengguna Spesifik</span>
                </label>
              </div>

              {form.target === 'specific' && (
                <div>
                  <Label htmlFor="user_ids">User IDs (pisahkan dengan koma)</Label>
                  <Textarea
                    id="user_ids"
                    value={form.user_ids || ''}
                    onChange={(e) => setForm({ ...form, user_ids: e.target.value })}
                    placeholder="uuid1, uuid2, uuid3..."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Masukkan User ID yang dipisahkan dengan koma
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Notifikasi
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Notifikasi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleQuickNotification('match_reminder', 'Pertandingan Dimulai!', 'Pertandingan Persiraja akan dimulai 30 menit lagi')}
              disabled={sending}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Pengingat Pertandingan
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickNotification('goal_alert', 'GOAL! ⚽', 'Persiraja mencetak gol! Skor sementara 1-0')}
              disabled={sending}
              className="justify-start"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Alert Goal
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickNotification('ticket_alert', 'Tiket Tersedia!', 'Tiket pertandingan besar sudah tersedia. Jangan sampai kehabisan!')}
              disabled={sending}
              className="justify-start"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alert Tiket Baru
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickNotification('news_alert', 'Berita Terbaru', 'Ada berita penting tentang Persiraja. Baca selengkapnya!')}
              disabled={sending}
              className="justify-start"
            >
              <Info className="h-4 w-4 mr-2" />
              Berita Penting
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {(form.title || form.message) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Notifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {form.title || 'Judul Notifikasi'}
                    </p>
                    {selectedTypeInfo && (
                      <Badge variant="outline" className="text-xs">
                        {selectedTypeInfo.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {form.message || 'Pesan notifikasi akan tampil di sini...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Persiraja Ticketing Hub • Sekarang
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}