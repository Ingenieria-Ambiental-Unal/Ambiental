/* ==============================================================================
   PORTAL WEB · INGENIERÍA AMBIENTAL · UNAL SEDE MEDELLÍN
   Botón "Instalar app": crea el acceso directo en el celular o el computador.
   Autoría: Santiago Escobar Arias · saescobara@unal.edu.co
   Todos los derechos reservados © 2026. Ver LICENSE.
   ============================================================================== */
(() => {
  'use strict';
    const yaInstalada = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Service worker: hace que el navegador reconozca la web como app y permite ver lo último guardado sin internet
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  if (yaInstalada()) return;

  let oferta = null;                                   // evento beforeinstallprompt (Chrome, Edge, Android)
  const ua = navigator.userAgent || '';
  const esIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const esMovil = esIOS || /Android/i.test(ua);

  const ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></svg>';

  function ocultarBotones() { document.querySelectorAll('[data-instalar]').forEach((b) => b.remove()); }

  function ayuda() {
    let pasos;
    if (esIOS) {
      pasos = ['Abre esta página en <b>Safari</b>.', 'Toca el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).', 'Elige <b>Añadir a pantalla de inicio</b> y toca <b>Añadir</b>.'];
    } else if (esMovil) {
      pasos = ['Toca el menú <b>⋮</b> del navegador.', 'Elige <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.', 'Confirma con <b>Instalar</b>.'];
    } else {
      pasos = ['En Chrome o Edge, busca el icono de <b>instalar</b> en la barra de direcciones (a la derecha).', 'O abre el menú <b>⋮</b> y elige <b>Instalar Ambiental UNAL</b> (o <b>Guardar y compartir → Instalar</b>).', 'Si usas Firefox o Safari de escritorio, abre esta página en Chrome o Edge.'];
    }
    const d = document.createElement('dialog');
    d.className = 'instalar-dialogo';
    d.setAttribute('aria-labelledby', 'instalar-titulo');
    d.innerHTML = `
      <p class="instalar-dialogo__etiqueta">Acceso directo</p>
      <h2 class="instalar-dialogo__titulo" id="instalar-titulo">Instala la app</h2>
      <ol class="instalar-dialogo__pasos">${pasos.map((p) => `<li>${p}</li>`).join('')}</ol>
      <button type="button" class="instalar-dialogo__cerrar">Entendido</button>`;
    document.body.appendChild(d);
    const cerrar = () => { d.close(); d.remove(); };
    d.querySelector('.instalar-dialogo__cerrar').addEventListener('click', cerrar);
    d.addEventListener('click', (e) => { if (e.target === d) cerrar(); });
    d.addEventListener('close', () => d.remove());
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }

  async function instalar() {
    if (!oferta) { ayuda(); return; }
    const evento = oferta;
    oferta = null;
    try {
      evento.prompt();
      const { outcome } = await evento.userChoice;
      if (outcome === 'accepted') ocultarBotones();
    } catch (_) { ayuda(); }
  }

  function crearBoton() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'instalar-btn';
    b.setAttribute('data-instalar', '');
    b.innerHTML = `${ICONO}<span>Instalar app</span>`;
    b.addEventListener('click', instalar);
    return b;
  }

  function colocarBotones() {
    // Pie de página (todas las páginas)
    const redes = document.querySelector('.pie__marca-central');
    if (redes && !redes.querySelector('[data-instalar]')) {
      const fila = document.createElement('div');
      fila.className = 'instalar-fila';
      fila.appendChild(crearBoton());
      redes.appendChild(fila);
    }
    // Portada del inicio
    const hero = document.querySelector('body[data-pagina="inicio"] .portada__contenido');
    if (hero && !hero.querySelector('[data-instalar]')) {
      const fila = document.createElement('div');
      fila.className = 'instalar-fila instalar-fila--portada';
      fila.appendChild(crearBoton());
      hero.appendChild(fila);
    }
  }

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); oferta = e; });
  window.addEventListener('appinstalled', () => { oferta = null; ocultarBotones(); });

  colocarBotones();
})();
