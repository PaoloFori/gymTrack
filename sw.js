// Service worker: l'app funziona anche offline dopo la prima visita.
// Cambia VERSION quando pubblichi una nuova versione, così i telefoni si aggiornano.
const VERSION = "gymtrack-v17";
const GIFCACHE = "gymtrack-gif";
const FILES = ["./", "index.html", "manifest.webmanifest", "css/base.css", "css/avatar.css", "css/workout.css", "css/diet.css", "css/stats.css", "js/core/constants.js", "js/core/gifdata.js", "js/core/registry.js", "js/core/utils.js", "js/core/state.js", "js/core/storage.js", "js/core/progress.js", "js/avatar/levels.js", "js/avatar/draw.js", "js/avatar/anim.js", "js/features/gifs.js", "js/features/history.js", "js/features/theme.js", "js/ui/shell.js", "js/ui/charts.js", "js/ui/calendar.js", "js/ui/home.js", "js/ui/sessions.js", "js/ui/session.js", "js/ui/session-sheets.js", "js/ui/analysis.js", "js/ui/profile.js", "js/features/workout/runtime.js", "js/features/workout/ui.js", "js/features/diet/model.js", "js/features/diet/plan.js", "js/features/diet/ui.js", "js/features/diet/source.js", "js/features/diet/sheet.js", "js/features/ai/prompts.js", "js/features/ai/sheet.js", "js/features/import.js", "js/app/actions.js", "js/app/events.js", "js/app/boot.js", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== GIFCACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname === "raw.githubusercontent.com") { // GIF e miniature degli esercizi: una volta viste restano offline
    e.respondWith(caches.open(GIFCACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return; // i font di Google restano in rete
  e.respondWith(
    fetch(req)
      .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cl) => (cl[0] ? cl[0].focus() : self.clients.openWindow("./"))));
});
