const CACHE_NAME = "rovmart-v5";
const CORE = [
  "./",
  "./index.html",
  "./product.html",
  "./about.html",
  "./contact.html",
  "./shipping.html",
  "./returns.html",
  "./privacy.html",
  "./terms.html",
  "./style.css",
  "./config.js",
  "./products.js",
  "./cart.js",
  "./order.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/favicon.svg",
  "./assets/banner.svg",
  "./assets/og-image.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.all(CORE.map(asset => cache.add(asset).catch(() => null))))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
function staticAsset(request) { return /\.(?:css|js|svg|png|jpe?g|webp|gif|ico|webmanifest)$/i.test(new URL(request.url).pathname); }
async function networkFirst(request, fallback) { try { const response = await fetch(request, { cache: "no-store" }); if (response?.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); } return response; } catch (_) { return (await caches.match(request)) || fallback || Response.error(); } }
async function cacheFirst(request) { const cached = await caches.match(request); if (cached) return cached; const response = await fetch(request); if (response?.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); } return response; }
self.addEventListener("fetch", event => { if (event.request.method !== "GET") return; const url = new URL(event.request.url); if (url.origin !== self.location.origin) return; if (event.request.mode === "navigate") { event.respondWith(networkFirst(event.request, caches.match("./index.html"))); return; } if (staticAsset(event.request)) { const p = url.pathname.toLowerCase(); const fresh = /\/(?:config|products|cart|order|app)\.js$/i.test(p) || /\/style\.css$/i.test(p); event.respondWith(fresh ? networkFirst(event.request) : cacheFirst(event.request)); return; } event.respondWith(networkFirst(event.request)); });
