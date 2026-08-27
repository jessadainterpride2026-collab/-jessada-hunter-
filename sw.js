// JESSADA HUNTER — Service Worker
// แคชเฉพาะ "เปลือกแอป" (หน้าตา/โลโก้/ไฟล์ตั้งค่า) เพื่อให้เปิดแอปได้แม้ไม่มีเน็ต
// ฟีเจอร์วิเคราะห์กราฟยังต้องต่อเน็ตเสมอ เพราะต้องเรียก API ภายนอก

const CACHE_NAME = "jessada-hunter-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // อย่าไปยุ่งกับ request ที่ไม่ใช่ GET (เช่น POST ไปเรียก API วิเคราะห์กราฟ) ปล่อยผ่านตามปกติ
  if (req.method !== "GET") return;

  // อย่า cache request ข้ามโดเมน (เช่น เรียก Anthropic API หรือฟอนต์) ปล่อยให้ต่อเน็ตตามปกติ
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
