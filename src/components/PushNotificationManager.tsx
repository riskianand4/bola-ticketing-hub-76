
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { createRealtimeSubscription } from '@/utils/realtimeHelper';

// Extend window interface for global notification function
declare global {
  interface Window {
    addNotification?: (title: string, message: string, type?: string) => void;
  }
}

interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  data: Record<string, any>;
  created_at: string;
}

export function PushNotificationManager() {
  const { user, isAuthenticated } = useAuth();
  const { isSupported, permission, isEnabled } = usePushNotifications();
  const [isListening, setIsListening] = useState(false);

  // Listen for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Prevent duplicate listeners
    if (isListening) {
      return;
    }

    // Setting up notification listener for authenticated user
    setIsListening(true);

    const cleanup = createRealtimeSubscription(
      'notifications-listener',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        // New notification received via realtime
        console.log('New notification received:', payload.new);
        handleNewNotification(payload.new as NotificationPayload);
      }
    );

    return () => {
      console.log('Cleaning up notification listener');
      cleanup();
      setIsListening(false);
    };
  }, [isAuthenticated, user?.id]); // Removed isListening and isEnabled from dependencies

  const handleNewNotification = (notification: NotificationPayload) => {
    console.log('Processing notification:', notification);

    // Always show toast notification first (this is the alert that appears briefly)
    showToastAlert(notification);

    // Show browser notification if supported and permission granted
    if (isSupported && permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/persiraja-logo.png',
          badge: '/persiraja-logo.png',
          tag: `notification-${notification.id}`,
          requireInteraction: false, // Don't require interaction for browser notifications
          silent: false,
          data: {
            id: notification.id,
            type: notification.notification_type,
            ...notification.data,
          },
        });

        browserNotification.onclick = () => {
          console.log('Browser notification clicked:', notification);
          handleNotificationClick(notification);
          browserNotification.close();
        };

        // Auto close browser notification after 5 seconds
        setTimeout(() => browserNotification.close(), 5000);
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  };

  const showToastAlert = (notification: NotificationPayload) => {
    const type = getToastType(notification.notification_type);
    
    // Show a brief toast alert (this will auto-dismiss after a few seconds)
    switch (type) {
      case 'success':
        toast.success('Notifikasi Baru!', {
          description: `${notification.title} - Klik bell untuk detail`,
          duration: 3000, // 3 seconds
        });
        break;
      case 'warning':
        toast.warning('Notifikasi Baru!', {
          description: `${notification.title} - Klik bell untuk detail`,
          duration: 3000,
        });
        break;
      case 'error':
        toast.error('Notifikasi Baru!', {
          description: `${notification.title} - Klik bell untuk detail`,
          duration: 3000,
        });
        break;
      default:
        toast.info('Notifikasi Baru!', {
          description: `${notification.title} - Klik bell untuk detail`,
          duration: 3000,
        });
    }
  };

  const getToastType = (type: string): 'info' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'goal_alert':
        return 'success';
      case 'ticket_alert':
      case 'match_reminder':
        return 'warning';
      case 'payment_confirmation':
        return 'success';
      case 'merchandise_alert':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleNotificationClick = (notification: NotificationPayload) => {
    // Mark notification as read
    markNotificationAsRead(notification.id);

    // Navigate based on notification type and data
    const { action_url, type, match_id, news_id, ticket_id } = notification.data;

    if (action_url) {
      window.open(action_url, '_self');
      return;
    }

    // Default navigation based on type
    switch (notification.notification_type) {
      case 'match_reminder':
      case 'goal_alert':
        if (match_id) {
          window.open(`/matches?highlight=${match_id}`, '_self');
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
        if (ticket_id) {
          window.open(`/tickets?highlight=${ticket_id}`, '_self');
        } else {
          window.open('/tickets', '_self');
        }
        break;
      case 'merchandise_alert':
        window.open('/shop', '_self');
        break;
      case 'payment_confirmation':
        window.open('/profile', '_self');
        break;
      default:
        // Focus the window without navigation
        window.focus();
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // This component doesn't render anything visible
  // It just manages the push notification logic
  return null;
}
