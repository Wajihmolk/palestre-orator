/* Les fichiers de cours sélectionnés par l’utilisateur ne passent jamais par ce service worker. */
const VERSION = "palestre-app-v2.3.0";
const MEDIA = "palestre-media-v2.3";
const SHELL = [
  "./", "./index.html", "./app.css", "./core.js", "./capsules.js", "./app.js", "./manifest.webmanifest",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-512.png",
  "./o1.html", "./etude.css", "./etude.js", "./etude-cours.js", "./o1-revision.html",
  "./o1.css", "./o1-demo.js", "./o1-daily-content.js", "./o1-media.js", "./o1.js", "./o1-exam.js"
];
const shellURLs = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
const mediaRoot = new URL("videos/", self.registration.scope).href;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll([...shellURLs].map(url=>new Request(url,{cache:"reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key !== VERSION && (key.startsWith("palestre-app-") || key.startsWith("palestre-v2.")))
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function serveMedia(request, url) {
  const cached = await (await caches.open(MEDIA)).match(url);
  if (!cached) return fetch(request);
  const range = request.headers.get("Range");
  if (!range) return cached;
  const bytes = await cached.arrayBuffer();
  const total = bytes.byteLength;
  const requested = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  const invalid = () => new Response(null,{status:416,headers:{"Content-Range":"bytes */"+total}});
  if (!requested || (!requested[1] && !requested[2])) return invalid();
  const suffix = !requested[1];
  const first = suffix ? Math.max(0,total-Number(requested[2])) : Number(requested[1]);
  const last = suffix || !requested[2] ? total-1 : Math.min(total-1,Number(requested[2]));
  if (first>=total || last<first || !Number.isSafeInteger(first) || !Number.isSafeInteger(last)) return invalid();
  return new Response(bytes.slice(first,last+1),{status:206,headers:{
    "Content-Type":cached.headers.get("Content-Type")||"video/mp4",
    "Accept-Ranges":"bytes",
    "Content-Range":"bytes "+first+"-"+last+"/"+total,
    "Content-Length":String(last-first+1)
  }});
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const parsed = new URL(request.url);
  parsed.search = "";
  const url = parsed.href;
  if (url.startsWith(mediaRoot) && /\/o1-[a-z0-9-]+\.mp4$/.test(url)) {
    event.respondWith(serveMedia(request,url));
  } else if (shellURLs.has(url)) {
    event.respondWith(caches.open(VERSION).then(cache => cache.match(url)).then(hit => hit || fetch(request)));
  }
});
self.addEventListener("message", event => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
