const webpush = require('web-push');
const { getDB } = require('../config/database');

class PushNotificationService {
  constructor() {
    this.isConfigured = false;
    this.configure();
  }

  configure() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL;

    if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
      webpush.setVapidDetails(
        `mailto:${vapidEmail}`,
        vapidPublicKey,
        vapidPrivateKey
      );
      this.isConfigured = true;
      console.log('Push notification service configured');
    } else {
      console.warn('Push notification service not configured - missing VAPID keys');
    }
  }

  async subscribeUser(userId, subscription) {
    if (!this.isConfigured) {
      throw new Error('Push notification service not configured');
    }

    try {
      const db = getDB();
      
      // Store or update subscription
      await db.query(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at) 
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, endpoint) 
        DO UPDATE SET 
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          updated_at = NOW(),
          is_active = true
      `, [
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]);

      console.log(`Push subscription saved for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  async unsubscribeUser(userId, endpoint) {
    try {
      const db = getDB();
      
      await db.query(
        'UPDATE push_subscriptions SET is_active = false WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
      );

      console.log(`Push subscription removed for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error removing push subscription:', error);
      throw error;
    }
  }

  async sendNotification(userId, payload) {
    if (!this.isConfigured) {
      console.warn('Push notification service not configured');
      return false;
    }

    try {
      const db = getDB();
      
      // Get user's active subscriptions
      const result = await db.query(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return false;
      }

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/persiraja-logo.png',
        badge: '/icons/persiraja-logo.png',
        data: payload.data || {},
        actions: payload.actions || []
      });

      // Send to all user's devices
      const promises = result.rows.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);
          console.log(`Push notification sent to ${subscription.endpoint}`);
        } catch (error) {
          console.error('Error sending push notification:', error);
          
          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.query(
              'UPDATE push_subscriptions SET is_active = false WHERE endpoint = $1',
              [subscription.endpoint]
            );
          }
        }
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  async sendBulkNotification(userIds, payload) {
    if (!this.isConfigured) {
      console.warn('Push notification service not configured');
      return false;
    }

    try {
      const promises = userIds.map(userId => 
        this.sendNotification(userId, payload)
      );

      await Promise.all(promises);
      console.log(`Bulk notification sent to ${userIds.length} users`);
      return true;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  async sendToAllUsers(payload, excludeUserIds = []) {
    if (!this.isConfigured) {
      console.warn('Push notification service not configured');
      return false;
    }

    try {
      const db = getDB();
      
      let query = 'SELECT DISTINCT user_id FROM push_subscriptions WHERE is_active = true';
      let params = [];
      
      if (excludeUserIds.length > 0) {
        query += ' AND user_id != ANY($1)';
        params.push(excludeUserIds);
      }

      const result = await db.query(query, params);
      const userIds = result.rows.map(row => row.user_id);

      await this.sendBulkNotification(userIds, payload);
      console.log(`Broadcast notification sent to ${userIds.length} users`);
      return true;
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      throw error;
    }
  }

  // Predefined notification templates
  async sendMatchNotification(matchData) {
    return this.sendToAllUsers({
      title: 'Pertandingan Dimulai!',
      body: `${matchData.home_team} vs ${matchData.away_team}`,
      icon: '/icons/persiraja-logo.png',
      data: {
        type: 'match',
        match_id: matchData.id,
        url: `/matches/${matchData.id}`
      }
    });
  }

  async sendNewsNotification(newsData) {
    return this.sendToAllUsers({
      title: 'Berita Terbaru',
      body: newsData.title,
      icon: '/icons/persiraja-logo.png',
      data: {
        type: 'news',
        news_id: newsData.id,
        url: `/news/${newsData.id}`
      }
    });
  }

  async sendTicketConfirmation(userId, ticketData) {
    return this.sendNotification(userId, {
      title: 'Tiket Terkonfirmasi',
      body: `Tiket untuk ${ticketData.match_title} sudah siap`,
      icon: '/icons/persiraja-logo.png',
      data: {
        type: 'ticket',
        ticket_id: ticketData.id,
        url: `/tickets/${ticketData.id}`
      }
    });
  }
}

module.exports = new PushNotificationService();