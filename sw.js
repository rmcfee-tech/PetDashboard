// sw.js
// App-shell caching so Pet Dashboard works fully offline once installed.
// Strategy: cache-first for the shell (HTML/CSS/JS/icons/sample data),
// falling back to network, so the app boots even with no connection at all.
// Bump CACHE_NAME whenever shell files change to invalidate old caches.

const CACHE_NAME = "pet-dashboard-v7";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/layout.css",
  "./css/cards.css",
  "./css/forms.css",
  "./css/mobile.css",
  "./css/dark.css",
  "./js/app.js",
  "./js/router.js",
  "./js/state.js",
  "./js/storage.js",
  "./js/theme.js",
  "./js/utils.js",
  "./js/reminders.js",
  "./js/calendar.js",
  "./js/charts.js",
  "./js/dataExport.js",
  "./js/ui/nav.js",
  "./js/ui/syncBanner.js",
  "./js/ui/recordEditor.js",
  "./js/ui/icons.js",
  "./js/ui/toast.js",
  "./js/ui/quickAdd.js",
  "./js/ui/pageStub.js",
  "./js/ui/dashboard.js",
  "./js/ui/profile.js",
  "./js/ui/health.js",
  "./js/ui/training.js",
  "./js/ui/grooming.js",
  "./js/ui/schedule.js",
  "./js/ui/expenses.js",
  "./js/ui/journal.js",
  "./js/ui/cat.js",
  "./js/ui/daughter.js",
  "./js/ui/development.js",
  "./js/ui/photos.js",
  "./js/ui/reports.js",
  "./js/ui/settings.js",
  "./data/sample-pet.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle same-origin GET requests — never intercept the user's own
  // File System Access API calls, which don't go through fetch() anyway.
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
