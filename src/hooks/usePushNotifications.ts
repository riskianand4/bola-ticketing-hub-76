import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  match_reminders: boolean;
  goal_alerts: boolean;
  ticket_alerts: boolean;
  news_alerts: boolean;
  merchandise_alerts: boolean;
  push_enabled: boolean;
  push_token?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PushNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  data: Record<string, any>;
  scheduled_for?: string;
  push_sent: boolean;
  is_read: boolean;
  created_at: string;
}

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs: Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'> = {
          user_id: user.id,
          match_reminders: true,
          goal_alerts: true,
          ticket_alerts: true,
          news_alerts: true,
          merchandise_alerts: true,
          push_enabled: false,
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
        } else {
          setPreferences(newPrefs);
        }
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      return reg;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }, [isSupported]);

  // Request permission for notifications
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications tidak didukung di browser ini');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        toast.success('Notifikasi berhasil diaktifkan');
        return true;
      } else {
        toast.error('Izin notifikasi ditolak');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Gagal meminta izin notifikasi');
      return false;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted' || !user?.id) {
      return false;
    }

    try {
      const reg = registration || await registerServiceWorker();
      if (!reg) return false;

      // For now, we'll just enable push notifications in the database
      // In a real implementation, you would generate a VAPID key pair
      // and subscribe to push service here
      
      const { error } = await supabase
        .from('notification_preferences')
        .update({ 
          push_enabled: true,
          push_token: 'web-push-enabled' // Placeholder token
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error enabling push notifications:', error);
        toast.error('Gagal mengaktifkan push notifications');
        return false;
      }

      await loadPreferences();
      toast.success('Push notifications berhasil diaktifkan');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Gagal mengaktifkan push notifications');
      return false;
    }
  }, [isSupported, permission, user?.id, registration, registerServiceWorker, loadPreferences]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ 
          push_enabled: false,
          push_token: null
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling push notifications:', error);
        toast.error('Gagal menonaktifkan push notifications');
        return false;
      }

      await loadPreferences();
      toast.success('Push notifications berhasil dinonaktifkan');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Gagal menonaktifkan push notifications');
      return false;
    }
  }, [user?.id, loadPreferences]);

  // Update notification preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>): Promise<boolean> => {
    if (!user?.id || !preferences) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        toast.error('Gagal mengupdate preferensi notifikasi');
        return false;
      }

      await loadPreferences();
      toast.success('Preferensi notifikasi berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Gagal mengupdate preferensi notifikasi');
      return false;
    }
  }, [user?.id, preferences, loadPreferences]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      toast.error('Notifications tidak diizinkan');
      return;
    }

    try {
      const notification = new Notification('Test Notification', {
        body: 'Ini adalah test notification dari Persiraja Ticketing Hub',
        icon: '/persiraja-logo.png',
        badge: '/persiraja-logo.png',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
      toast.success('Test notification berhasil dikirim');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Gagal mengirim test notification');
    }
  }, [isSupported, permission]);

  // Initialize when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadPreferences();
      registerServiceWorker();
    }
  }, [isAuthenticated, user?.id, loadPreferences, registerServiceWorker]);

  return {
    isSupported,
    permission,
    preferences,
    loading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updatePreferences,
    sendTestNotification,
    isEnabled: preferences?.push_enabled || false,
  };
};