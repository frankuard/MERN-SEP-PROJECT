// Chautari Service Worker — handles Web Push notifications
// This file must live at the root of the public folder so the browser
// registers it at scope '/', giving it full app coverage.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Chautari', body: event.data.text() };
  }

  const title   = data.title   || 'Chautari';
  const options = {
    body:  data.body  || data.message || '',
    icon:  '/favicon.svg',
    badge: '/favicon.svg',
    data:  { link: data.link || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When the user clicks the notification, open / focus the app
// and navigate to the relevant section if a link was provided.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || '/';
  // Build a full URL — link is a tab id like 'events' or a path
  const target = link.startsWith('http') ? link : `${self.location.origin}/student/${link}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open, focus it
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(target);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
