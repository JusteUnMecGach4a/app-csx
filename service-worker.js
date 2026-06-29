// Nom unique du cache pour cette version de l'application
const CACHE_NAME = 'csc-bld-v17';

// Liste des ressources essentielles à mettre en cache pour le mode hors-ligne
const ASSETS = [
  'index.html',
  'manifest.json'
];

// Événement d'installation : télécharge et met en cache les ressources de base
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force le service worker à s'activer immédiatement sans attendre que l'ancien se ferme
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Événement d'activation : supprime les anciens caches obsolètes pour libérer de l'espace
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prend le contrôle immédiat de toutes les pages actives
  );
});

// Événement de récupération (Fetch) : tente de récupérer la ressource sur le réseau,
// et bascule sur le cache si le réseau n'est pas disponible (mode hors-ligne)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
