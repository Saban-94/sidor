// public/sw.js

const CACHE_NAME = 'saban-os-v2-cache';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/order-notification.mp3' // צליל ההתראה
];

// התקנת ה-Service Worker ושימור קבצים בסיסיים
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// האזנה להתראות Push מהשרת (Supabase/Firebase)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'הזמנה חדשה!',
    body: 'בוס, נכנסה הזמנה חדשה למערכת.',
    icon: 'https://iili.io/qstzfVf.jpg'
  };

  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/admin/dashboard'
    }
  };

  // הצגת ההתראה
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// לחיצה על ההתראה - פתיחת האפליקציה
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
