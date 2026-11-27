/* Postcard from Italy: offline cache.
   Bump VERSION whenever you upload a new build so phones drop the old copy. */
var VERSION = 'postcard-v71';
var SHELL = ['./', './index.html', './game.html', './napoli.html', './i18n.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || /\.html$/.test(url.pathname);
  if (isPage) {
    /* network first: testers always get the newest build when online; cache key ignores ?stage=N */
    var key = url.pathname.endsWith('/') ? './index.html' : '.' + url.pathname.replace(/^.*\//, '/');
    e.respondWith(fetch(req).then(function (r) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(key, cp); }); return r; }).catch(function () { return caches.match(key); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) { if (r && (r.ok || r.type === 'opaque')) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); } return r; });
  }));
});
