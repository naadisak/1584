/**
 * Service worker — PWA + offline shell
 *
 * กลยุทธ์
 *   - navigate: network-first (ได้ของใหม่เสมอเมื่อออนไลน์ / ออฟไลน์ใช้ cache)
 *   - static: cache-first แล้วอัปเดต cache เบื้องหลัง
 *   - /api: ไม่แตะ (POST + ต้องสดเสมอ)
 *
 * แก้เลข CACHE_VERSION เมื่ออยากล้าง cache เก่า
 */
const CACHE_VERSION = 'tic-v2';
const CACHE_NAME = 'tic-cache-' + CACHE_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
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

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ห้าม cache API เด็ดขาด (ข้อมูลต้องสด + เป็น POST)
  if (url.pathname.indexOf('/api') !== -1) return;

  // หน้าเว็บ: network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // cache เฉพาะ response ที่สำเร็จ — กันหน้า 404/500 ไปทับของดี
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return res;
        })
        .catch(() =>
          caches.match('./index.html').then((hit) => hit || caches.match('./'))
        )
    );
    return;
  }

  // ไฟล์คงที่: cache-first + อัปเดตเบื้องหลัง
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);

      return hit || network;
    })
  );
});
