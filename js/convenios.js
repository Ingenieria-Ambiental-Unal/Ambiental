/* =============================================
   MÓDULO CONVENIOS Y BENEFICIOS
   Datos (carpeta data/convenios):
   - indice.json: tipos y la ficha corta de cada convenio (se pide al abrir la página)
   - <id>.json: el detalle y los pasos de cada uno (se pide solo cuando la persona lo abre)
   ============================================= */

const estado = { indice: null, filtro: 'todos', abierto: null };

// Íconos propios y genéricos (no son los logos de las empresas)
const ICONOS = {
  fantasma: '<path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/>',
  birrete: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>',
  funcion: '<path d="M15 4h-2a3 3 0 0 0-3 3v10a3 3 0 0 1-3 3H6"/><path d="M6 11h8M14 14l5 5M19 14l-5 5"/>',
  documento: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  cubo: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  codigo: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
  nota: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
};
const icono = (nombre) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre] || ''}</svg>`;
const FLECHA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const EXTERNO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

const tipoDe = (id) => estado.indice.tipos.find((t) => t.id === id);
// Solo se enlazan direcciones http(s)
const urlSegura = (url) => (/^https?:\/\//i.test(url) ? url : '#');


/* ---------- Filtros ---------- */

function pintarFiltros() {
  const { tipos, convenios } = estado.indice;
  const opciones = [{ id: 'todos', nombre: 'Todos', total: convenios.length },
    ...tipos.map((t) => ({ id: t.id, nombre: t.nombre, total: convenios.filter((c) => c.tipo === t.id).length }))];

  $('#filtros').innerHTML = opciones.map((o) => `
    <button class="filtro" type="button" data-filtro="${esc(o.id)}" aria-pressed="${o.id === estado.filtro}">
      ${esc(o.nombre)} <span class="filtro__total">${o.total}</span>
    </button>`).join('');

  const tipo = tipoDe(estado.filtro);
  $('#filtros-nota').textContent = tipo ? tipo.descripcion : 'Los convenios son acuerdos de la Universidad; los beneficios son programas de las empresas para estudiantes.';
}

$('#filtros').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-filtro]');
  if (!boton) return;
  estado.filtro = boton.dataset.filtro;
  pintarFiltros();
  pintarLista();
});


/* ---------- Lista desplegable ---------- */

function pintarLista() {
  const visibles = estado.indice.convenios.filter((c) => estado.filtro === 'todos' || c.tipo === estado.filtro);
  // Si el abierto ya no se ve con este filtro, se cierra
  if (estado.abierto && !visibles.some((c) => c.id === estado.abierto)) estado.abierto = null;

  $('#lista').innerHTML = visibles.map((c) => {
    const abierto = c.id === estado.abierto;
    return `
      <li class="item ${abierto ? 'item--abierto' : ''}" id="item-${esc(c.id)}" style="--color: ${esc(c.color)}">
        <h3 class="item__titulo">
          <button class="item__boton" type="button" data-id="${esc(c.id)}" aria-expanded="${abierto}" aria-controls="panel-${esc(c.id)}">
            <span class="item__icono">${icono(c.icono)}</span>
            <span class="item__texto">
              <span class="item__etiquetas">
                <span class="etiqueta etiqueta--${esc(c.tipo)}">${esc(tipoDe(c.tipo).nombre)}</span>
                <span class="item__categoria">${esc(c.categoria)}</span>
              </span>
              <span class="item__nombre">${esc(c.nombre)}</span>
              <span class="item__resumen">${esc(c.resumen)}</span>
            </span>
            <span class="item__flecha">${FLECHA}</span>
          </button>
        </h3>
        <div class="item__panel" id="panel-${esc(c.id)}" role="region" aria-labelledby="item-${esc(c.id)}" ${abierto ? '' : 'hidden'}></div>
      </li>`;
  }).join('');

  if (estado.abierto) pintarDetalle(estado.abierto);
}

$('#lista').addEventListener('click', (evento) => {
  const boton = evento.target.closest('.item__boton');
  if (boton) alternar(boton.dataset.id);
});

function alternar(id, { desplazar = false } = {}) {
  estado.abierto = estado.abierto === id ? null : id;
  history.replaceState(null, '', estado.abierto ? `#${estado.abierto}` : location.pathname + location.search);

  $$('.item').forEach((item) => {
    const abierto = item.id === `item-${estado.abierto}`;
    item.classList.toggle('item--abierto', abierto);
    $('.item__boton', item).setAttribute('aria-expanded', abierto);
    $('.item__panel', item).hidden = !abierto;
  });
  if (estado.abierto) {
    pintarDetalle(estado.abierto);
    if (desplazar) $(`#item-${CSS.escape(estado.abierto)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


/* ---------- Detalle (se pide al abrir) ---------- */

const lista = (items, clase = '') => `<ul class="${clase}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function pintarDetalle(id) {
  const panel = $(`#panel-${CSS.escape(id)}`);
  if (!panel) return;
  panel.innerHTML = '<p class="cargando">Cargando…</p>';

  cargarDatos(`convenios/${id}`)
    .then((d) => {
      if (estado.abierto !== id) return;                 // la persona abrió otro mientras cargaba
      panel.innerHTML = `
        <p class="detalle__que">${esc(d.queEs)}</p>

        <div class="detalle__datos">
          <section class="bloque">
            <h4>Quién puede usarlo</h4>${lista(d.quienes)}
          </section>
          <section class="bloque">
            <h4>Qué incluye</h4>${lista(d.incluye)}
          </section>
          <section class="bloque">
            <h4>Qué necesitas</h4>${lista(d.requisitos)}
          </section>
        </div>

        <section class="pasos-bloque">
          <h4>Cómo activarlo</h4>
          <ol class="pasos">
            ${d.pasos.map((p) => `
              <li class="paso">
                <div><strong>${esc(p.titulo)}</strong><p>${esc(p.texto)}</p></div>
              </li>`).join('')}
          </ol>
        </section>

        ${d.video || d.afiche ? `
          <div class="detalle__multimedia">
            ${d.video ? `
              <section class="detalle__video-bloque">
                <h4>${esc(d.video.titulo || 'Tutorial oficial en video')}</h4>
                <div class="detalle__video-contenedor">
                  <iframe src="https://www.youtube-nocookie.com/embed/${esc(d.video.embedId)}" title="${esc(d.video.titulo || 'Tutorial en video')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
                </div>
              </section>` : ''}
            ${d.afiche ? `
              <aside class="detalle__afiche-bloque">
                <h4>Afiche informativo</h4>
                <a class="detalle__afiche-enlace" href="${esc(d.afiche)}" target="_blank" rel="noopener noreferrer" title="Ver afiche completo">
                  <img class="detalle__afiche-img" src="${esc(d.afiche)}" alt="Afiche Kiro UNAL" loading="lazy">
                  <span class="detalle__afiche-pie">Click para ver afiche completo</span>
                </a>
              </aside>` : ''}
          </div>` : ''}

        <div class="enlaces">
          ${d.enlaces.map((e) => `
            <a class="boton ${e.principal ? 'boton--principal' : ''}" href="${esc(urlSegura(e.url))}" target="_blank" rel="noopener noreferrer">
              ${esc(e.texto)}${EXTERNO}
            </a>`).join('')}
        </div>

        ${d.soporte ? `
          <p class="soporte"><strong>Soporte:</strong> ${esc(d.soporte.texto)}${d.soporte.correo
            ? ` <a href="mailto:${esc(d.soporte.correo)}">${esc(d.soporte.correo)}</a>.` : ''}</p>` : ''}

        ${d.consejos?.length ? `<section class="consejos"><h4>Consejos</h4>${lista(d.consejos)}</section>` : ''}

        ${d.porConfirmar?.length ? `
          <aside class="por-confirmar">
            <h4>Por confirmar</h4>${lista(d.porConfirmar)}
          </aside>` : ''}

        <p class="fuentes">Fuentes: ${d.fuentes.map((f) =>
          `<a href="${esc(urlSegura(f.url))}" target="_blank" rel="noopener noreferrer">${esc(f.titulo)}</a>`).join(' · ')}</p>`;
    })
    .catch((error) => mostrarErrorDeCarga(panel, error));
}


// Si cambia el enlace (#id) con la página ya abierta, se abre ese convenio
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (!estado.indice || id === estado.abierto || !estado.indice.convenios.some((c) => c.id === id)) return;
  if (!$(`#item-${CSS.escape(id)}`)) {            // está oculto por el filtro: se muestran todos
    estado.filtro = 'todos';
    pintarFiltros();
    pintarLista();
  }
  alternar(id, { desplazar: true });
});


/* ---------- Inicio ---------- */

cargarDatos('convenios/indice')
  .then((indice) => {
    estado.indice = indice;
    const deLaDireccion = location.hash.slice(1);
    if (indice.convenios.some((c) => c.id === deLaDireccion)) estado.abierto = deLaDireccion;
    pintarFiltros();
    pintarLista();
    if (estado.abierto) $(`#item-${CSS.escape(estado.abierto)}`)?.scrollIntoView({ block: 'start' });
  })
  .catch((error) => mostrarErrorDeCarga($('#lista'), error));
