/* Service worker del portal · Ambiental UNAL Medellín
   Estrategia: primero la red (siempre ves lo último que publicamos) y, si no hay internet,
   la última copia guardada. No toca nada de otros dominios (Supabase, fuentes, etc.). */
const CACHE = 'ambientalunal-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith((async () => {
    try {
      const respuesta = await fetch(peticion);
      if (respuesta && respuesta.ok && respuesta.type === 'basic') {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(peticion, copia)).catch(() => {});
      }
      return respuesta;
    } catch (error) {
      const guardada = await caches.match(peticion, { ignoreSearch: true });
      if (guardada) return guardada;
      if (peticion.mode === 'navigate') {
        const inicio = await caches.match('/index.html', { ignoreSearch: true });
        if (inicio) return inicio;
      }
      throw error;
    }
  })());
});
