// Service worker: la app abre sin conexión y guarda las teselas ya vistas.
const VERSION = "explora-v1";
const APP = [
  "./", "index.html", "css/styles.css", "manifest.webmanifest", "icons/icono.svg",
  "js/app.js", "js/config.js", "js/estado.js", "js/geo.js", "js/api.js",
  "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css", "data/regiones.json",
];
const MAX_TESELAS = 1500;

self.addEventListener("install", (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
));

async function recortar(cache) {
  const ks = await cache.keys();
  for (let i = 0; i < ks.length - MAX_TESELAS; i++) await cache.delete(ks[i]);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.includes("/api/")) return;              // la API siempre va a la red
  const esTesela = /basemaps\.cartocdn\.com|arcgisonline\.com/.test(url.host);
  if (esTesela) {                                          // teselas: caché primero
    e.respondWith(caches.open(`${VERSION}-teselas`).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === "opaque") { c.put(req, r.clone()); recortar(c); }
      return r;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App y datos: red primero (para tener datos frescos), caché si no hay conexión.
  e.respondWith(fetch(req).then((r) => {
    const copia = r.clone();
    caches.open(VERSION).then((c) => c.put(req, copia));
    return r;
  }).catch(() => caches.match(req)));
});
