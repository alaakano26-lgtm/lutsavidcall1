const LUTSA_VERSION = '8.8.3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { preview: event.data?.text?.() || 'New message' }; }
  const sender = data.senderName || 'Chat';
  const preview = data.preview || 'New message';
  const roomId = data.roomId || '';
  const title = data.title || `${sender} • New message`;
  const sound = data.sound || 'default';
  const options = {
    body: preview,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `room-${roomId}`,
    renotify: true,
    requireInteraction: false,
    vibrate: [120, 80, 120],
    data: { url: data.url || `/?room=${encodeURIComponent(roomId)}`, roomId, sound }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        try { await client.navigate(url); } catch {}
        return client.focus();
      }
    }
    return clients.openWindow(url);
  })());
});
