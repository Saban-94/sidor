// public/sw.js

// התקנה ראשונית ושמירת קבצים בסיסיים במטמון (אופציונלי לאופליין)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// האזנה להתראות Push מהשרת
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'הזמנה חדשה בסבן 94',
    body: 'בוס, כנס למערכת לבדוק את הפרטים.',
    icon: 'https://iili.io/qstzfVf.jpg'
  };

  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/icon-192x192.png', // האייקון הקטן בשורת המשימות
    vibrate: [300, 100, 300, 100, 300], // רטט חזק
    data: { url: '/admin/dashboard' },
    actions: [
      { action: 'open', title: 'פתח הזמנה' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// טיפול בלחיצה על ההתראה
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
