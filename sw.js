/* Palestre Orator — service worker. Tout le code de l'appli est mis en cache à l'installation ;
   ensuite l'appli fonctionne hors ligne et se met à jour en arrière-plan (version ci-dessous). */
const VERSION = "palestre-v2.0.0";
const SHELL = ["./", "./index.html", "./app.css", "./core.js", "./capsules.js", "./app.js", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-512.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  ev.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
self.addEventListener("message", ev => { if (ev.data === "skipWaiting") self.skipWaiting(); });
