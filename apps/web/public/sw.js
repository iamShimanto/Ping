self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "New notification", body: event.data.text() };
  }

  const { title, body, icon, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/favicon.svg",
      badge: "/favicon.svg",
      data: data || {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { conversationId, type } = event.notification.data || {};

  const targetUrl = conversationId
    ? `/?conversation=${conversationId}`
    : "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing tab if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.postMessage({ type: "NOTIFICATION_CLICK", conversationId, notifType: type });
            return;
          }
        }
        // Open new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
