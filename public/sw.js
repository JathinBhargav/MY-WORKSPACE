// Workspace Background Thread Notification Engine (Service Worker)

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // Fallback to text message if data is not JSON
    data = { body: event.data ? event.data.text() : "A tracked task requires your attention." };
  }
  
  const title = data.title || "Workspace Task Sync";
  const options = {
    body: data.body || "A tracked task requires your attention.",
    icon: "https://cdn-icons-png.flaticon.com/512/3208/3208743.png", // Web-safe high-contrast workspace logo
    badge: "https://cdn-icons-png.flaticon.com/512/3208/3208743.png",
    tag: "task-urgency-reminder", // Grouping tag to prevent duplicate banner stacks
    requireInteraction: data.urgency === 'URGENT', // Keep open until explicitly dismissed for urgent items
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Navigate to the primary workspace dashboard upon notification banner click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
