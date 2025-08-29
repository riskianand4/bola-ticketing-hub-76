const CACHE_NAME = 'persiraja-notifications-v1';
const urlsToCache = [
  '/persiraja-logo.png',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker caching resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installation complete');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activation complete');
      return self.clients.claim();
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let title = 'Persiraja Ticketing Hub';
  let body = 'Anda memiliki notifikasi baru';
  let icon = '/persiraja-logo.png';
  let badge = '/persiraja-logo.png';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || payload.message || body;
      icon = payload.icon || icon;
      badge = payload.badge || badge;
      data = payload.data || {};
    } catch (e) {
      console.error('Error parsing push data:', e);
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon,
    badge,
    data,
    requireInteraction: data.requireInteraction || false,
    actions: getNotificationActions(data.type),
    tag: data.tag || 'default',
    renotify: true,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Determine URL based on action clicked or notification type
  if (event.action) {
    switch (event.action) {
      case 'view-match':
        url = data.match_id ? `/matches?highlight=${data.match_id}` : '/matches';
        break;
      case 'view-tickets':
        url = data.ticket_id ? `/tickets?highlight=${data.ticket_id}` : '/tickets';
        break;
      case 'view-news':
        url = data.news_id ? `/news/${data.news_id}` : '/news';
        break;
      case 'view-shop':
        url = '/shop';
        break;
      default:
        url = data.action_url || '/';
    }
  } else {
    // Default click behavior based on notification type
    switch (data.type) {
      case 'match_reminder':
      case 'goal_alert':
        url = data.match_id ? `/matches?highlight=${data.match_id}` : '/matches';
        break;
      case 'ticket_alert':
        url = data.ticket_id ? `/tickets?highlight=${data.ticket_id}` : '/tickets';
        break;
      case 'news_alert':
        url = data.news_id ? `/news/${data.news_id}` : '/news';
        break;
      case 'merchandise_alert':
        url = '/shop';
        break;
      case 'payment_confirmation':
        url = '/profile';
        break;
      default:
        url = data.action_url || '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // If no client is open, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'match_reminder':
    case 'goal_alert':
      return [
        {
          action: 'view-match',
          title: 'Lihat Pertandingan',
          icon: '/persiraja-logo.png'
        }
      ];
    case 'ticket_alert':
      return [
        {
          action: 'view-tickets',
          title: 'Lihat Tiket',
          icon: '/persiraja-logo.png'
        }
      ];
    case 'news_alert':
      return [
        {
          action: 'view-news',
          title: 'Baca Berita',
          icon: '/persiraja-logo.png'
        }
      ];
    case 'merchandise_alert':
      return [
        {
          action: 'view-shop',
          title: 'Lihat Produk',
          icon: '/persiraja-logo.png'
        }
      ];
    default:
      return [];
  }
}

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Handle offline notifications when connection is restored
      handleOfflineNotifications()
    );
  }
});

async function handleOfflineNotifications() {
  try {
    // This would typically fetch missed notifications from the server
    console.log('Handling offline notifications...');
    
    // For now, just log that we're ready to handle offline sync
    // In a real implementation, you would:
    // 1. Fetch missed notifications from the server
    // 2. Show them to the user
    // 3. Update the local cache
  } catch (error) {
    console.error('Error handling offline notifications:', error);
  }
}

// Fetch event - serve cached resources when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});