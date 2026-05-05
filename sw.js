const CACHE_NAME = 'stem-volume-v1.3'; // バージョンを上げて強制リセット
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './wood_maruta.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js' // JSZipもオフライン用にキャッシュ
];

// インストール時にキャッシュを保存
self.addEventListener('install', event => {
  self.skipWaiting(); // 新しいバージョンがあれば即座に待機状態をスキップ
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// アクティベート時に古いキャッシュを完全消去
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 即座にコントロールを開始
  );
});

// ネットワークファースト戦略（オンライン時は常に最新、オフライン時はキャッシュ）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // ネットワークから取得成功したら、キャッシュも更新しておく
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン（圏外）の場合はキャッシュを返す
        return caches.match(event.request);
      })
  );
});
