self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A simple pass-through fetch handler is enough to satisfy the PWA requirement
  // We don't need offline support for the prompt, just the fetch handler
  e.respondWith(
    fetch(e.request).catch(() => new Response("Offline"))
  );
});
