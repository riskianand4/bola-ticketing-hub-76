import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, BellOff, Check, Trash2, Calendar, Goal, Ticket, Newspaper, ShoppingBag, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { createRealtimeSubscription } from '@/utils/realtimeHelper';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  data: any;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export function NotificationDropdown() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
    }
  }, [isAuthenticated, user?.id]);

  // Set up real-time listener for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const cleanup = createRealtimeSubscription(
      'notification-dropdown',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('Notification dropdown realtime event:', payload);
        
        if (payload.eventType === 'INSERT') {
          // New notification received in dropdown
          setNotifications(prev => [payload.new as Notification, ...prev.slice(0, 9)]);
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === payload.new.id 
                ? { ...notif, ...payload.new as Notification }
                : notif
            )
          );
        }
      }
    );

    return cleanup;
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      toast.success('Semua notifikasi ditandai sebagai dibaca');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai semua notifikasi sebagai dibaca');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      toast.success('Notifikasi berhasil dihapus');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_reminder':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'goal_alert':
        return <Goal className="h-4 w-4 text-green-500" />;
      case 'ticket_alert':
        return <Ticket className="h-4 w-4 text-blue-500" />;
      case 'news_alert':
        return <Newspaper className="h-4 w-4 text-purple-500" />;
      case 'merchandise_alert':
        return <ShoppingBag className="h-4 w-4 text-pink-500" />;
      case 'payment_confirmation':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Close dropdown
    setOpen(false);

    // Navigate based on action URL or type
    const { action_url, match_id, news_id, ticket_id } = notification.data || {};

    if (action_url) {
      window.open(action_url, '_self');
      return;
    }

    // Default navigation based on type
    switch (notification.notification_type) {
      case 'match_reminder':
      case 'goal_alert':
        if (match_id) {
          window.open(`/match/${match_id}`, '_self');
        } else {
          window.open('/matches', '_self');
        }
        break;
      case 'news_alert':
        if (news_id) {
          window.open(`/news/${news_id}`, '_self');
        } else {
          window.open('/news', '_self');
        }
        break;
      case 'ticket_alert':
        window.open('/tickets', '_self');
        break;
      case 'merchandise_alert':
        window.open('/shop', '_self');
        break;
      case 'payment_confirmation':
        window.open('/profile?tab=tickets', '_self');
        break;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifikasi</h4>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Tandai Semua
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.is_read ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.notification_type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd MMM, HH:mm', { locale: id })}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}