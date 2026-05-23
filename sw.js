// NOVERA Service Worker
// Bu dosyadaki VERSION'ı her deploy'da güncelle → müşteriler otomatik yeni sürümü alır
const VERSION = '20260523-001';
const CACHE = 'novera-' + VERSION;

// Önbelleğe alınacak dosyalar
const PRECACHE = [
  '/',
  '/index.html'
];

// Kurulum: yeni cache oluştur
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Aktivasyon: eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: önce cache, sonra network (stale-while-revalidate)
self.addEventListener('fetch', e => {
  // Firebase ve Cloudinary isteklerini SW'dan geçirme
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('cloudinary') || url.includes('gstatic')) {
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(response => {
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        }).catch(() => cached);
        // Cache varsa anında göster, arka planda güncelle
        return cached || networkFetch;
      })
    )
  );
});
