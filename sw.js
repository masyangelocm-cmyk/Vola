// Vola : fonctionne hors ligne après la première ouverture.
// Pour publier une mise à jour, changez VERSION (par exemple vola-v2).
// Le nom du cache commence par "vola-" : cette appli ne touche pas aux caches des autres applis du même compte GitHub.
const VERSION = "vola-v1";
const CORE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf("vola-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !isFont) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
      if (hit) {
        e.waitUntil(net.catch(function () {}));
        return hit;
      }
      return net.catch(function () {
        if (req.mode === "navigate") return caches.match("index.html");
        return Response.error();
      });
    })
  );
});
