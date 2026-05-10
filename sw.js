const CACHE_NAME = 'fingoal-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './gdrive_sync.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
