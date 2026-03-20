const CACHE_NAME = "art-prompt-generator-v2-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./prompts-dse.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./docs/product-how-to.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  try {
    const u = new URL(request.url);
    if (u.pathname.includes("/api/")) return;
  } catch (_) {}
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match("./index.html"));
    })
  );
});

/** Web Push：由伺服器送來的訊息 */
self.addEventListener("push", (event) => {
  let data = { title: "VA Star-Getter", body: "練拆奪星王 · 新提示" };
  if (event.data) {
    try {
      const j = event.data.json();
      data = { title: j.title || data.title, body: j.body || j.message || data.body };
    } catch {
      try {
        const t = event.data.text();
        if (t) data.body = t;
      } catch (_) {}
    }
  }
  const url = self.registration.scope + "index.html";
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icon.svg",
      badge: "./icon.svg",
      tag: "va-star-getter",
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope + "index.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
