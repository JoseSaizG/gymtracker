/* Service worker: guarda la app en el teléfono para que funcione sin internet. */
const CACHE = "gymtracker-v10";
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "exercises.js",
  "manifest.webmanifest",
  "fonts/oswald-latin.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero para todo (sin la caché HTTP del navegador), así la página y su código
// siempre son de la misma versión. Sin conexión, o si la red tarda más de 4 s, usa la copia guardada.
function fromNetwork(req) {
  return fetch(req, { cache: "no-cache" }).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req.mode === "navigate" ? "index.html" : req, copy));
    }
    return res;
  });
}
function fromCache(req) {
  return caches.match(req.mode === "navigate" ? "index.html" : req, { ignoreSearch: true });
}
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(new Promise((resolve) => {
    let settled = false;
    const done = (r) => { if (!settled && r) { settled = true; resolve(r); } };
    const timer = setTimeout(() => fromCache(req).then(done), 4000);
    fromNetwork(req)
      .then((res) => { clearTimeout(timer); done(res); })
      .catch(() => { clearTimeout(timer); fromCache(req).then((hit) => done(hit || Response.error())); });
  }));
});
