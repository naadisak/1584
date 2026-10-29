/**
 * Service worker — ทำให้ติดตั้งเป็นแอป (PWA) และเปิดได้แม้เน็ตหลุด
 *
 * กลยุทธ์
 *   - หน้าเว็บ (navigate): เอาจากเน็ตก่อน ถ้าได้ก็อัปเดต cache ไว้ ถ้าเน็ตหลุดค่อยใช้ของเก่า
 *     → ได้เวอร์ชันล่าสุดเสมอเมื่อออนไลน์
 *   - ไฟล์คงที่ (ไอคอน/manifest): cache ก่อน
 *   - /api: ไม่แตะเลย (ต้องสดเสมอ และเป็น POST)
 *
 * เวลาอัปเดตแอปแล้วอยากให้ cache เก่าถูกล้าง ให้เปลี่ยนเลข CACHE_VERSION
 */
const CACHE_VERSION = 'tic-v1';
const CACHE_NAME = 'tic-cache-' + CACHE_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // ไม่ยุ่งกับ POST/PUT หรือ API
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.indexOf('/api') !== -1) return;

  // หน้าเว็บ: network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  // ไฟล์คงที่: cache-first
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request))
  );
});
