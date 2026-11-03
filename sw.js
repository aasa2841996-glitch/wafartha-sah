/* خدمة بسيطة: تعرض أحدث نسخة من الإنترنت دائمًا، وتعود لنسخة محفوظة إذا انقطع الاتصال.
   لا تتدخل في الطلبات الخارجية (الخطوط، تلجرام، واجهة البوت) حتى لا تتأخر المنتجات الجديدة. */
const CACHE = "wafartha-v1";

self.addEventListener("install", e => { self.skipWaiting(); });

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("./") : undefined)))
  );
});
