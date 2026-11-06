/* =============================================
   MÓDULO INFORMACIÓN GENERAL Y GUÍA ESTUDIANTIL
   - Carga de datos desde data/info.json
   - Citas de Inscripción (Nuevo modelo oficial DNINFOA)
   - P.A.P.A. y Simulador interactivo integrado
   - Bolsa de créditos, Horas de corresponsabilidad y Trámites
   - Búsqueda en vivo y filtrado instantáneo
   - Acordeón interactivo de Preguntas Frecuentes
   ============================================= */

let datosInfo = null;
let categoriaActiva = 'calendario';
let terminoBusqueda = '';

// Estado para la calculadora de P.A.P.A. (integrada en la sección P.A.P.A.)
let calcEstado = {
  papaActual: 3.85,
  creditosAcumulados: 40,
  materias: [
    { nombre: 'Programación Orientada a Objetos', creditos: 4, nota: 4.2 },
    { nombre: 'Estructuras de Datos', creditos: 3, nota: 4.0 },
    { nombre: 'Cálculo Integral', creditos: 4, nota: 3.5 },
    { nombre: 'Física de Oscilaciones y Ondas', creditos: 4, nota: 3.8 }
  ]
};

// Iconos vectoriales (con dimensiones fijas para evitar distorsión)
const ICONOS = {
  todo: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  calendario: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  grafica: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  bolsa: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  manos: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  documento: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  faq: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  reloj: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  estrella: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  alerta: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  externo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
};

// Carga inicial
cargarDatos('info')
  .then((datos) => {
    datosInfo = datos;
    inicializar();
  })
  .catch((err) => {
    mostrarErrorDeCarga($('#info-contenido'), err);
  });

function inicializar() {
  pintarCifras();
  pintarTabs();
  pintarEnlaces();
  pintarAsesoria();
  configurarBuscador();
  renderizarVista();
}

/* ---------- 1. Cifras clave en portada ---------- */

function pintarCifras() {
  const contenedor = $('#info-cifras');
  if (!contenedor || !datosInfo.cifras) return;

  contenedor.innerHTML = datosInfo.cifras
    .map((c) => `<li>${esc(c.valor)}<small>${esc(c.texto)}</small></li>`)
    .join('');
}

/* ---------- 2. Pestañas de categorías ---------- */

function pintarTabs() {
  if (datosInfo.categorias?.length && !datosInfo.categorias.some((c) => c.id === categoriaActiva)) categoriaActiva = datosInfo.categorias[0].id;
  const contenedor = $('#contenedor-tabs');
  if (!contenedor || !datosInfo.categorias) return;

  contenedor.innerHTML = datosInfo.categorias
    .map((cat) => `
      <li>
        <button type="button" class="info-tab-btn ${cat.id === categoriaActiva ? 'activo' : ''}" data-cat="${cat.id}">
          ${ICONOS[cat.icono] || ''}
          ${esc(cat.nombre)}
        </button>
      </li>
    `).join('');

  contenedor.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-tab-btn');
    if (!btn) return;
    categoriaActiva = btn.dataset.cat;
    $$('.info-tab-btn', contenedor).forEach((b) => b.classList.toggle('activo', b === btn));
    renderizarVista();
  });
}

/* ---------- 3. Buscador en vivo ---------- */

function configurarBuscador() {
  const input = $('#input-busqueda');
  const btnLimpiar = $('#btn-limpiar-busqueda');
  if (!input) return;

  input.addEventListener('input', () => {
    terminoBusqueda = input.value.trim().toLowerCase();
    if (btnLimpiar) {
      btnLimpiar.hidden = terminoBusqueda.length === 0;
    }
    renderizarVista();
  });

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      input.value = '';
      terminoBusqueda = '';
      btnLimpiar.hidden = true;
      input.focus();
      renderizarVista();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });
}

/* ---------- 4. Renderizado principal ---------- */

function renderizarVista() {
  const contenedor = $('#info-contenido');
  const conteoEl = $('#resultado-conteo');
  if (!contenedor || !datosInfo) return;

  const guiasFiltradas = filtrarGuias();
  const faqsFiltradas = filtrarFAQs();
  const glosarioFiltrado = filtrarGlosario();

  const hayBusqueda = terminoBusqueda.length > 0;
  // Con una búsqueda activa se busca en todas las secciones y ninguna pestaña queda marcada
  $$('.info-tab-btn').forEach((b) => b.classList.toggle('activo', !hayBusqueda && b.dataset.cat === categoriaActiva));
  const totalResultados = guiasFiltradas.length + faqsFiltradas.length + glosarioFiltrado.length;

  if (conteoEl) {
    if (hayBusqueda) {
      conteoEl.innerHTML = `Mostrando <strong>${totalResultados}</strong> resultados para "<em>${esc(terminoBusqueda)}</em>"`;
    } else {
      conteoEl.textContent = '';
    }
  }

  if (hayBusqueda && totalResultados === 0) {
    contenedor.innerHTML = `
      <div class="info-sin-resultados">
        ${ICONOS.alerta}
        <h3>No encontramos resultados</h3>
        <p>No se encontraron temas o preguntas para "<strong>${esc(terminoBusqueda)}</strong>". Intenta con términos como <em>citas</em>, <em>DNINFOA</em>, <em>PAPA</em>, <em>bolsa</em> o <em>corresponsabilidad</em>.</p>
        <button type="button" id="btn-resetear-busqueda">Ver todas las guías</button>
      </div>`;
    $('#btn-resetear-busqueda')?.addEventListener('click', () => {
      $('#input-busqueda').value = '';
      terminoBusqueda = '';
      $('#btn-limpiar-busqueda').hidden = true;
      renderizarVista();
    });
    return;
  }

  let htmlPartes = [];

  // Si estamos en la categoría 'faq', mostramos directamente todas las FAQs
  if (categoriaActiva === 'faq' && !hayBusqueda) {
    htmlPartes.push(generarHtmlFaq(datosInfo.faq));
    if (glosarioFiltrado.length > 0) htmlPartes.push(generarHtmlGlosario(glosarioFiltrado));
    contenedor.innerHTML = htmlPartes.join('');
    activarEventosFaq();
    return;
  }

  // Renderizado de Guías
  guiasFiltradas.forEach((guia) => {
    htmlPartes.push(generarHtmlGuia(guia));

    // Si la guía es P.A.P.A., incrustamos la calculadora interactiva justo aquí
    if (guia.categoria === 'papa' && categoriaActiva === 'papa') {
      htmlPartes.push(generarHtmlCalculadora());
    }
  });

  // Mostrar FAQs relevantes según la categoría activa
  if (faqsFiltradas.length > 0) {
    {
      htmlPartes.push(generarHtmlFaq(faqsFiltradas));
    }
  }

  // Glosario en vista global o cuando coincide con la búsqueda
  if (glosarioFiltrado.length > 0 && hayBusqueda) {
    htmlPartes.push(generarHtmlGlosario(glosarioFiltrado));
  }

  contenedor.innerHTML = htmlPartes.join('');

  activarEventosFaq();
  activarEventosCalculadora();
}

/* ---------- 5. Filtros de datos ---------- */

function filtrarGuias() {
  return datosInfo.guias.filter((guia) => {
    const coincideCat = guia.categoria === categoriaActiva;
    if (!coincideCat && !terminoBusqueda) return false;

    if (!terminoBusqueda) return coincideCat;

    const textoCompleto = [
      guia.titulo,
      guia.subtitulo,
      guia.etiqueta,
      guia.consejo,
      ...(guia.puntosClave ? guia.puntosClave.map((p) => `${p.titulo} ${p.texto}`) : []),
      ...(guia.gruposPrelacion ? guia.gruposPrelacion.map((g) => `${g.nombre} ${g.descripcion}`) : []),
      ...(guia.factoresIpa ? guia.factoresIpa.map((f) => `${f.titulo} ${f.detalle}`) : []),
      ...(guia.pasos ? guia.pasos.map((p) => `${p.titulo} ${p.desc}`) : []),
      ...(guia.reglasDiaCita || []),
      ...(guia.lugaresPago || []),
      ...(guia.tramitesComunes ? guia.tramitesComunes.map((t) => `${t.titulo} ${t.desc}`) : [])
    ].join(' ').toLowerCase();

    return textoCompleto.includes(terminoBusqueda);
  });
}

function filtrarFAQs() {
  return datosInfo.faq.filter((item) => {
    const coincideCat = categoriaActiva === 'faq' || item.categoria === categoriaActiva;
    if (!coincideCat && !terminoBusqueda) return false;

    if (!terminoBusqueda) return coincideCat;

    const texto = `${item.pregunta} ${item.respuesta} ${item.categoria}`.toLowerCase();
    return texto.includes(terminoBusqueda);
  });
}

function filtrarGlosario() {
  if (!datosInfo.glosario) return [];
  if (!terminoBusqueda) return categoriaActiva === 'faq' ? datosInfo.glosario : [];

  return datosInfo.glosario.filter((item) => {
    const texto = `${item.sigla} ${item.definicion}`.toLowerCase();
    return texto.includes(terminoBusqueda);
  });
}

/* ---------- 6. Generadores de HTML Moderno y Modular ---------- */

function generarHtmlGuia(guia) {
  if (guia.calendario) return generarHtmlCalendario(guia);
  let subseccionesHtml = '';

  // 1. Enlace CTA externo oficial (ej. citaciones DNINFOA)
  if (guia.enlaceExterno) {
    subseccionesHtml += `
      <a href="${esc(guia.enlaceExterno.url)}" target="_blank" rel="noopener" class="info-cta-btn">
        ${ICONOS.calendario}
        ${esc(guia.enlaceExterno.texto)}
        ${ICONOS.externo}
      </a>
    `;
  }

  // 2. Grid de puntos clave tipo dashboard
  if (guia.puntosClave && guia.puntosClave.length > 0) {
    subseccionesHtml += `
      <div class="info-puntos-grid">
        ${guia.puntosClave.map((p) => `
          <div class="info-punto-card">
            <div class="info-punto-card__cabecera">
              <span class="info-punto-card__icono">${ICONOS[p.icono] || ICONOS.check}</span>
              <h4>${esc(p.titulo)}</h4>
            </div>
            <p>${esc(p.texto)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 3. Los 4 Grupos de Prelación (DNINFOA)
  if (guia.gruposPrelacion && guia.gruposPrelacion.length > 0) {
    subseccionesHtml += `
      <h4 class="info-subseccion-titulo">${ICONOS.calendario} Los 4 Grupos de Prelación Oficiales</h4>
      <div class="info-grupos-grid">
        ${guia.gruposPrelacion.map((g) => `
          <div class="info-grupo-item">
            <div class="info-grupo-item__top">
              <span class="info-grupo-numero">${esc(g.numero)}</span>
              <strong class="info-grupo-nombre">${esc(g.nombre)}</strong>
            </div>
            <p class="info-grupo-desc">${esc(g.descripcion)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 4. Factores del Índice de Prioridad (IPA)
  if (guia.factoresIpa && guia.factoresIpa.length > 0) {
    subseccionesHtml += `
      <h4 class="info-subseccion-titulo">${ICONOS.estrella} ¿Cómo sumar puntos en el IPA (Grupo 4)?</h4>
      <div class="info-factores-grid">
        ${guia.factoresIpa.map((f) => `
          <div class="info-factor-card">
            <h5>${esc(f.titulo)}</h5>
            <p>${esc(f.detalle)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 5. Flujos / Pasos visuales (1 -> 2 -> 3 -> 4)
  if (guia.pasos && guia.pasos.length > 0) {
    subseccionesHtml += `
      <h4 class="info-subseccion-titulo">${ICONOS.reloj} Ciclo paso a paso</h4>
      <div class="info-pasos-track">
        ${guia.pasos.map((p) => `
          <div class="info-paso-card">
            <span class="info-paso-numero">${esc(p.paso)}</span>
            <h5>${esc(p.titulo)}</h5>
            <p>${esc(p.desc)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 6. Reglas para el día de la cita
  if (guia.reglasDiaCita && guia.reglasDiaCita.length > 0) {
    subseccionesHtml += `
      <h4 class="info-subseccion-titulo">${ICONOS.check} Reglas de oro para el día de tu cita</h4>
      <ul class="info-reglas-lista">
        ${guia.reglasDiaCita.map((r) => `
          <li class="info-regla-item">
            ${ICONOS.check}
            <span>${esc(r)}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // 7. Lugares de pago de corresponsabilidad
  if (guia.lugaresPago && guia.lugaresPago.length > 0) {
    subseccionesHtml += `
      <h4 class="info-subseccion-titulo">${ICONOS.manos} Dependencias habilitadas en la Sede Medellín</h4>
      <div class="info-chips-rejilla">
        ${guia.lugaresPago.map((l) => `
          <div class="info-chip-card">${esc(l)}</div>
        `).join('')}
      </div>
    `;
  }

  // 8. Trámites comunes
  if (guia.tramitesComunes && guia.tramitesComunes.length > 0) {
    subseccionesHtml += `
      <h4 class="info-subseccion-titulo">${ICONOS.documento} Trámites académicos frecuentes</h4>
      <div class="info-chips-rejilla">
        ${guia.tramitesComunes.map((t) => `
          <div class="info-chip-card">
            ${t.url && /^https?:\/\//.test(t.url)
              ? `<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(t.titulo)}</strong></a>`
              : `<strong>${esc(t.titulo)}</strong>`}
            <span>${esc(t.desc)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 9. Cajas de fórmula
  if (guia.formula) {
    subseccionesHtml += `
      <div class="formula-caja">
        <span class="formula-texto">${esc(guia.formula)}</span>
      </div>
    `;
  }

  // 10. Tablas comparativas
  if (guia.tabla) {
    subseccionesHtml += `
      <div class="info-tabla-wrap">
        <table class="info-tabla">
          <thead>
            <tr>${guia.tabla.cabecera.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${guia.tabla.filas.map((fila) => `
              <tr>${fila.map((celda) => `<td>${celda}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 11. Consejo de supervivencia
  if (guia.consejo) {
    subseccionesHtml += `
      <div class="info-consejo">
        ${ICONOS.alerta}
        <p><strong>Consejo clave:</strong> ${esc(guia.consejo)}</p>
      </div>
    `;
  }

  // 12. Enlace oficial institucional para ampliar la información
  if (guia.enlaceOficial) {
    subseccionesHtml += `
      <div class="info-guia-footer">
        <a href="${esc(guia.enlaceOficial.url)}" target="_blank" rel="noopener" class="info-enlace-oficial">
          ${ICONOS.documento}
          <span>${esc(guia.enlaceOficial.texto)}</span>
          ${ICONOS.externo}
        </a>
      </div>
    `;
  }

  return `
    <article class="info-tarjeta" id="${esc(guia.id)}" data-cat="${esc(guia.categoria)}">
      ${heroGuia(guia)}
      <div class="info-cuerpo">
        ${subseccionesHtml}
      </div>
    </article>
  `;
}

function generarHtmlFaq(faqs) {
  return `
    <section class="faq-seccion" id="faq-seccion">
      <div class="faq-cabecera">
        <h3 class="faq-titulo">Preguntas Frecuentes</h3>
        <button type="button" class="faq-controles-btn" id="btn-toggle-todos-faq">
          Expandir todas
        </button>
      </div>

      <div class="faq-lista">
        ${faqs.map((faq) => `
          <div class="faq-item" data-id="${esc(faq.id)}">
            <button type="button" class="faq-pregunta" aria-expanded="false">
              <span class="faq-pregunta-texto">
                <span class="faq-tag faq-tag--${esc(faq.categoria)}">${esc(faq.categoria)}</span>
                ${esc(faq.pregunta)}
              </span>
              <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="faq-respuesta">
              <p>${faq.respuesta}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function generarHtmlGlosario(glosario) {
  return `
    <section class="glosario-seccion">
      <h3 class="glosario-titulo">Glosario y Siglas UNAL</h3>
      <div class="glosario-rejilla">
        ${glosario.map((g) => `
          <div class="glosario-tarjeta">
            <h4 class="glosario-sigla">${esc(g.sigla)}</h4>
            <p class="glosario-definicion">${esc(g.definicion)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/* ---------- 7. Calculadora Interactiva de P.A.P.A. ---------- */

function calcularPAPAProyectado() {
  const papaPrevio = Math.max(0, Math.min(5, Number(calcEstado.papaActual) || 0));
  const credsPrevios = Math.max(0, Number(calcEstado.creditosAcumulados) || 0);

  let puntosSemestre = 0;
  let credsSemestre = 0;

  calcEstado.materias.forEach((m) => {
    const c = Math.max(0, Number(m.creditos) || 0);
    const n = Math.max(0, Math.min(5, Number(m.nota) || 0));
    puntosSemestre += c * n;
    credsSemestre += c;
  });

  const puntosPrevios = papaPrevio * credsPrevios;
  const credsTotales = credsPrevios + credsSemestre;
  const nuevoPAPA = credsTotales > 0 ? (puntosPrevios + puntosSemestre) / credsTotales : 0;
  const pappiSemestre = credsSemestre > 0 ? puntosSemestre / credsSemestre : 0;
  const diff = nuevoPAPA - papaPrevio;

  return {
    nuevoPAPA: Number(nuevoPAPA.toFixed(2)),
    pappi: Number(pappiSemestre.toFixed(2)),
    credsTotales,
    credsSemestre,
    diff: Number(diff.toFixed(2))
  };
}

function generarHtmlCalculadora() {
  const res = calcularPAPAProyectado();
  const diffSigno = res.diff > 0 ? `+${res.diff.toFixed(2)} ▲` : res.diff < 0 ? `${res.diff.toFixed(2)} ▼` : `0.00 =`;
  const diffClase = res.diff > 0 ? 'calc-resultado__diff--sube' : res.diff < 0 ? 'calc-resultado__diff--baja' : 'calc-resultado__diff--igual';

  let diagnostico = '';
  if (res.nuevoPAPA >= 4.2) {
    diagnostico = 'Excelente rendimiento. Un promedio alto te acerca al estímulo por mejores promedios (depende del ranking de tu programa, no de un PAPA fijo).';
  } else if (res.nuevoPAPA >= 3.8) {
    diagnostico = 'Muy buen promedio. Mantienes una trayectoria académica sólida y competitiva.';
  } else if (res.nuevoPAPA >= 3.2) {
    diagnostico = 'Zona segura de permanencia. Mantén el ritmo en las materias clave.';
  } else if (res.nuevoPAPA >= 3.0) {
    diagnostico = 'Alerta académica: Te encuentras cerca del límite de 3.00. Prioriza tus materias con mayor número de créditos.';
  } else {
    diagnostico = 'Riesgo de pérdida de cupo: El P.A.P.A. proyectado está por debajo del mínimo de 3.00.';
  }

  return `
    <section class="calculadora-card" id="calculadora-papa">
      <div class="calculadora-card__cabecera">
        <h3 class="calculadora-card__titulo">Simulador de P.A.P.A. del Semestre</h3>
        <p class="calculadora-card__intro">Calcula cómo impactarán las notas de este semestre en tu P.A.P.A. acumulado y proyecta tu PAPPI en tiempo real.</p>
      </div>

      <div class="calculadora-grid">
        <div class="calculadora-inputs">
          <div class="calculadora-inicial">
            <div class="campo-calc">
              <label for="calc-input-papa">P.A.P.A. Actual</label>
              <input type="number" id="calc-input-papa" min="0" max="5" step="0.01" value="${calcEstado.papaActual}">
              <small>De 0.00 a 5.00</small>
            </div>
            <div class="campo-calc">
              <label for="calc-input-creditos">Créditos Cursados Acumulados</label>
              <input type="number" id="calc-input-creditos" min="0" max="250" step="1" value="${calcEstado.creditosAcumulados}">
              <small>Histórico sin contar este semestre</small>
            </div>
          </div>

          <div class="calc-materias-titulo">
            <h4>Materias de este semestre</h4>
          </div>

          <div class="calc-materias-lista" id="calc-materias-lista">
            ${calcEstado.materias.map((m, idx) => `
              <div class="calc-materia-fila" data-indice="${idx}">
                <input type="text" class="calc-materia-nombre" value="${esc(m.nombre)}" placeholder="Nombre de asignatura">
                <input type="number" class="calc-materia-creditos" min="1" max="8" value="${m.creditos}" title="Créditos">
                <input type="number" class="calc-materia-nota" min="0" max="5" step="0.1" value="${m.nota}" title="Nota esperada">
                <button type="button" class="calc-btn-eliminar" title="Eliminar fila" aria-label="Eliminar materia">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            `).join('')}
          </div>

          <div class="calc-acciones-fila">
            <button type="button" class="calc-btn-secundario" id="calc-btn-agregar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar Asignatura
            </button>
            <button type="button" class="calc-btn-secundario" id="calc-btn-reset">
              Restablecer valores
            </button>
          </div>
        </div>

        <div class="calc-panel-resultado">
          <span class="calc-resultado__etiqueta">Nuevo P.A.P.A. Proyectado</span>
          <div class="calc-resultado__numero-wrap">
            <span class="calc-resultado__numero" id="calc-res-papa">${res.nuevoPAPA.toFixed(2)}</span>
            <span class="calc-resultado__diff ${diffClase}" id="calc-res-diff">${diffSigno}</span>
          </div>

          <div class="calc-resultado__detalles">
            <div class="calc-detalle-item">
              <span>PAPPI Periodo</span>
              <strong id="calc-res-pappi">${res.pappi.toFixed(2)}</strong>
            </div>
            <div class="calc-detalle-item">
              <span>Créditos Semestre</span>
              <strong id="calc-res-creds-sem">${res.credsSemestre}</strong>
            </div>
            <div class="calc-detalle-item">
              <span>Total Créditos</span>
              <strong id="calc-res-creds-totales">${res.credsTotales}</strong>
            </div>
            <div class="calc-detalle-item">
              <span>Estado Cupo</span>
              <strong style="color: ${res.nuevoPAPA >= 3.0 ? '#86efac' : '#fca5a5'};">${res.nuevoPAPA >= 3.0 ? 'Activo' : 'Riesgo'}</strong>
            </div>
          </div>

          <div class="calc-resultado__diagnostico" id="calc-res-diagnostico">
            ${diagnostico}
          </div>
        </div>
      </div>
    </section>
  `;
}

function activarEventosCalculadora() {
  const inputPapa = $('#calc-input-papa');
  const inputCreds = $('#calc-input-creditos');
  const btnAgregar = $('#calc-btn-agregar');
  const btnReset = $('#calc-btn-reset');
  const listaMaterias = $('#calc-materias-lista');

  if (!inputPapa || !listaMaterias) return;

  const recalcularYActualizarUI = () => {
    const res = calcularPAPAProyectado();
    const papaEl = $('#calc-res-papa');
    const diffEl = $('#calc-res-diff');
    const pappiEl = $('#calc-res-pappi');
    const credsSemEl = $('#calc-res-creds-sem');
    const credsTotEl = $('#calc-res-creds-totales');
    const diagEl = $('#calc-res-diagnostico');

    if (papaEl) papaEl.textContent = res.nuevoPAPA.toFixed(2);
    if (diffEl) {
      diffEl.textContent = res.diff > 0 ? `+${res.diff.toFixed(2)} ▲` : res.diff < 0 ? `${res.diff.toFixed(2)} ▼` : `0.00 =`;
      diffEl.className = `calc-resultado__diff ${res.diff > 0 ? 'calc-resultado__diff--sube' : res.diff < 0 ? 'calc-resultado__diff--baja' : 'calc-resultado__diff--igual'}`;
    }
    if (pappiEl) pappiEl.textContent = res.pappi.toFixed(2);
    if (credsSemEl) credsSemEl.textContent = res.credsSemestre;
    if (credsTotEl) credsTotEl.textContent = res.credsTotales;

    if (diagEl) {
      if (res.nuevoPAPA >= 4.2) {
        diagEl.textContent = 'Excelente rendimiento. Un promedio alto te acerca al estímulo por mejores promedios (depende del ranking de tu programa, no de un PAPA fijo).';
      } else if (res.nuevoPAPA >= 3.8) {
        diagEl.textContent = 'Muy buen promedio. Mantienes una trayectoria académica sólida y competitiva.';
      } else if (res.nuevoPAPA >= 3.2) {
        diagEl.textContent = 'Zona segura de permanencia. Mantén el ritmo en las materias clave.';
      } else if (res.nuevoPAPA >= 3.0) {
        diagEl.textContent = 'Alerta académica: Te encuentras cerca del límite de 3.00. Prioriza tus materias con mayor número de créditos.';
      } else {
        diagEl.textContent = 'Riesgo de pérdida de cupo: El P.A.P.A. proyectado está por debajo del mínimo de 3.00.';
      }
    }
  };

  inputPapa.addEventListener('input', () => {
    calcEstado.papaActual = parseFloat(inputPapa.value) || 0;
    recalcularYActualizarUI();
  });

  inputCreds.addEventListener('input', () => {
    calcEstado.creditosAcumulados = parseInt(inputCreds.value, 10) || 0;
    recalcularYActualizarUI();
  });

  listaMaterias.addEventListener('input', (e) => {
    const fila = e.target.closest('.calc-materia-fila');
    if (!fila) return;
    const idx = parseInt(fila.dataset.indice, 10);
    const nombre = fila.querySelector('.calc-materia-nombre').value;
    const creditos = parseFloat(fila.querySelector('.calc-materia-creditos').value) || 0;
    const nota = parseFloat(fila.querySelector('.calc-materia-nota').value) || 0;

    calcEstado.materias[idx] = { nombre, creditos, nota };
    recalcularYActualizarUI();
  });

  listaMaterias.addEventListener('click', (e) => {
    const btnEliminar = e.target.closest('.calc-btn-eliminar');
    if (!btnEliminar) return;
    const fila = btnEliminar.closest('.calc-materia-fila');
    const idx = parseInt(fila.dataset.indice, 10);
    calcEstado.materias.splice(idx, 1);
    renderizarVista();
  });

  btnAgregar?.addEventListener('click', () => {
    calcEstado.materias.push({
      nombre: `Nueva Asignatura ${calcEstado.materias.length + 1}`,
      creditos: 3,
      nota: 4.0
    });
    renderizarVista();
  });

  btnReset?.addEventListener('click', () => {
    calcEstado = {
      papaActual: 3.85,
      creditosAcumulados: 40,
      materias: [
        { nombre: 'Programación Orientada a Objetos', creditos: 4, nota: 4.2 },
        { nombre: 'Estructuras de Datos', creditos: 3, nota: 4.0 },
        { nombre: 'Cálculo Integral', creditos: 4, nota: 3.5 },
        { nombre: 'Física de Oscilaciones y Ondas', creditos: 4, nota: 3.8 }
      ]
    };
    renderizarVista();
  });
}

/* ---------- 8. Eventos de Preguntas Frecuentes ---------- */

function activarEventosFaq() {
  const lista = $('.faq-lista');
  const btnToggleTodos = $('#btn-toggle-todos-faq');
  if (!lista) return;

  lista.addEventListener('click', (e) => {
    const btnPregunta = e.target.closest('.faq-pregunta');
    if (!btnPregunta) return;
    const item = btnPregunta.closest('.faq-item');
    const estabaAbierto = item.classList.contains('abierto');
    item.classList.toggle('abierto', !estabaAbierto);
    btnPregunta.setAttribute('aria-expanded', !estabaAbierto);
  });

  btnToggleTodos?.addEventListener('click', () => {
    const items = $$('.faq-item', lista);
    const algunoCerrado = items.some((it) => !it.classList.contains('abierto'));
    items.forEach((it) => {
      it.classList.toggle('abierto', algunoCerrado);
      const btn = it.querySelector('.faq-pregunta');
      if (btn) btn.setAttribute('aria-expanded', algunoCerrado);
    });
    btnToggleTodos.textContent = algunoCerrado ? 'Colapsar todas' : 'Expandir todas';
  });
}

/* ---------- 9. Enlaces Oficiales ---------- */

function pintarEnlaces() {
  const contenedor = $('#contenedor-enlaces');
  if (!contenedor || !datosInfo.enlaces) return;

  contenedor.innerHTML = datosInfo.enlaces
    .map((enl) => `
      <a href="${esc(enl.url)}" target="_blank" rel="noopener" class="enlace-card">
        <div>
          <h4 class="enlace-card__titulo">
            ${esc(enl.titulo)}
            ${ICONOS.externo}
          </h4>
          <p class="enlace-card__desc">${esc(enl.descripcion)}</p>
        </div>
      </a>
    `).join('');
}

/* ---------- Asesoría (parte inferior de la página) ---------- */

function pintarAsesoria() {
  const a = datosInfo?.asesoria, caja = $('#info-asesoria');
  if (!a || !caja) return;
  caja.innerHTML = `
    <h2>${esc(a.titulo)}</h2>
    <p>${esc(a.texto)}</p>
    <a class="info-asesoria__correo" href="mailto:${esc(a.correo)}">${esc(a.correo)}</a>
    <ul class="info-asesoria__datos">
      <li>Representación Estudiantil de Ingeniería Ambiental (Emmanuel Florez Rodriguez): <a href="https://wa.me/573245639125" target="_blank" rel="noopener noreferrer"><strong>💬 WhatsApp (+57) 324 563 9125</strong></a> (<a href="mailto:emflorezr@unal.edu.co">emflorezr@unal.edu.co</a>)</li>
      <li>Portal web desarrollado por Santiago Escobar Arias (<a href="mailto:saescobara@unal.edu.co">saescobara@unal.edu.co</a> · <a href="https://www.instagram.com/s_escobar__/" target="_blank" rel="noopener noreferrer">@s_escobar__</a>)</li>
      <li>Teléfono Facultad de Minas: ${esc(a.telefono)}</li>
      <li>${esc(a.direccion)}</li>
      <li><a href="${esc(a.solicitudes)}" target="_blank" rel="noopener noreferrer">Solicitudes estudiantiles de la Facultad de Minas</a></li>
    </ul>`;
}


/* ---------- Calendario académico (versión web) ---------- */

const DIA_MS = 86400000;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const aFecha = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
const fechaCorta = (iso) => { const f = aFecha(iso); return { dia: f.getDate(), mes: MESES[f.getMonth()], anio: f.getFullYear() }; };

// Estado de una fila según la fecha de hoy en el dispositivo
function estadoCalendario(fila, hoy) {
  if (!fila.fin) return { clave: 'sinfecha', texto: 'Sin fecha', detalle: 'Verifica el calendario oficial' };
  const fin = aFecha(fila.fin), ini = fila.inicio ? aFecha(fila.inicio) : null;
  const dias = Math.round((fin - hoy) / DIA_MS);
  if (dias < 0) return { clave: 'fin', texto: 'Finalizó', detalle: '' };
  if (ini && hoy < ini) return { clave: 'prox', texto: 'Próximamente', detalle: `Inicia en ${Math.round((ini - hoy) / DIA_MS)} día(s)`, dias };
  const detalle = dias === 0 ? 'Hoy es el último día' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`;
  return { clave: dias <= 7 ? 'urge' : 'vigente', texto: dias <= 7 ? 'Por vencer' : 'Vigente', detalle, dias };
}

function bloqueFecha(iso, etiqueta) {
  if (!iso) return '';
  const f = fechaCorta(iso);
  return `<span class="cal-fecha"><small>${etiqueta}</small><strong>${f.dia} ${f.mes}</strong><em>${f.anio}</em></span>`;
}

function progresoCalendario(fila, hoy) {
  if (!fila.inicio || !fila.fin) return '';
  const a = aFecha(fila.inicio), b = aFecha(fila.fin);
  const pct = Math.max(0, Math.min(100, Math.round(((hoy - a) / Math.max(b - a, 1)) * 100)));
  return `<span class="cal-barra" aria-hidden="true"><span style="width:${pct}%"></span></span>`;
}

function filaCalendario(fila, hoy) {
  const e = estadoCalendario(fila, hoy);
  return `
    <li class="cal-fila cal-fila--${e.clave}" data-estado="${e.clave === 'fin' ? 'fin' : e.clave === 'sinfecha' ? 'sinfecha' : 'activo'}">
      <div class="cal-fila__titulo">
        <strong>${esc(fila.actividad)}</strong>
        ${fila.nota ? `<small>${esc(fila.nota)}</small>` : ''}
        ${fila.aplica ? `<span class="cal-periodo">Aplica a ${esc(fila.aplica)}</span>` : ''}
      </div>
      <div class="cal-fila__estado">
        <span class="cal-sello cal-sello--${e.clave}">${esc(e.texto)}</span>
        ${e.detalle ? `<small>${esc(e.detalle)}</small>` : ''}
      </div>
      <div class="cal-fila__fechas">
        ${bloqueFecha(fila.inicio, 'Desde')}${bloqueFecha(fila.fin, fila.inicio ? 'Hasta' : 'Fecha límite')}
        ${progresoCalendario(fila, hoy)}
      </div>
    </li>`;
}

function generarHtmlCalendario(guia) {
  const cal = guia.calendario;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const filas = cal.grupos.flatMap((g) => g.filas);
  const proximos = filas.map((f) => ({ f, e: estadoCalendario(f, hoy) }))
    .filter((x) => x.e.dias !== undefined && x.e.clave !== 'prox' && x.e.clave !== 'fin')
    .sort((a, b) => a.e.dias - b.e.dias).slice(0, 3);
  const cuenta = (clave) => filas.filter((f) => (clave === 'todos') || estadoCalendario(f, hoy).clave === 'fin' === (clave === 'fin')).length;

  return `
    <article class="info-tarjeta cal" id="${esc(guia.id)}" data-cat="${esc(guia.categoria)}">
      ${heroGuia(guia)}
      <div class="info-cuerpo">

      ${proximos.length ? `
      <h4 class="info-subseccion-titulo">${ICONOS.reloj} Próximos vencimientos</h4>
      <ul class="cal-proximos">
        ${proximos.map(({ f, e }) => `
          <li class="cal-proximo cal-proximo--${e.clave}">
            <span class="cal-proximo__dias"><strong>${e.dias}</strong><small>${e.dias === 1 ? 'día' : 'días'}</small></span>
            <span class="cal-proximo__texto"><strong>${esc(f.actividad)}</strong><small>Hasta el ${fechaCorta(f.fin).dia} ${fechaCorta(f.fin).mes} ${fechaCorta(f.fin).anio}</small></span>
          </li>`).join('')}
      </ul>` : ''}

      <div class="cal-filtros" role="group" aria-label="Filtrar el calendario">
        <button type="button" class="cal-filtro" data-cal-filtro="todos" aria-pressed="true">Todas <span>${cuenta('todos')}</span></button>
        <button type="button" class="cal-filtro" data-cal-filtro="activo" aria-pressed="false">Vigentes <span>${filas.filter((f) => ['vigente', 'urge', 'prox'].includes(estadoCalendario(f, hoy).clave)).length}</span></button>
        <button type="button" class="cal-filtro" data-cal-filtro="fin" aria-pressed="false">Finalizadas <span>${cuenta('fin')}</span></button>
      </div>

      ${cal.grupos.map((g) => `
        <section class="cal-grupo">
          <h4 class="info-subseccion-titulo">${ICONOS.calendario} ${esc(g.titulo)}</h4>
          <ul class="cal-lista">${g.filas.map((f) => filaCalendario(f, hoy)).join('')}</ul>
        </section>`).join('')}

      <p class="cal-nota">${esc(cal.nota)}</p>
      <div class="info-guia-footer">
        <a href="${esc(cal.fuente.url)}" target="_blank" rel="noopener noreferrer" class="info-enlace-oficial">
          ${ICONOS.documento}<span>${esc(cal.fuente.texto)}</span>${ICONOS.externo}
        </a>
      </div>
      </div>
    </article>`;
}

// Filtros del calendario (delegación: el contenido se vuelve a pintar)
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-cal-filtro]');
  if (!b) return;
  const raiz = b.closest('.cal'), f = b.dataset.calFiltro;
  $$('.cal-filtro', raiz).forEach((x) => x.setAttribute('aria-pressed', x === b));
  $$('.cal-fila', raiz).forEach((li) => { li.hidden = !(f === 'todos' || li.dataset.estado === f); });
  $$('.cal-grupo', raiz).forEach((g) => { g.hidden = !$$('.cal-fila:not([hidden])', g).length; });
});


/* ---------- Encabezado moderno de cada tarjeta ---------- */

const ICONO_CATEGORIA = { citas: 'calendario', papa: 'grafica', creditos: 'bolsa', corresponsabilidad: 'manos', calendario: 'calendario', solicitudes: 'documento' };

function heroGuia(guia) {
  return `
    <header class="info-hero">
      <span class="info-hero__icono" aria-hidden="true">${ICONOS[ICONO_CATEGORIA[guia.categoria]] || ICONOS.documento}</span>
      <div class="info-hero__texto">
        <span class="info-hero__badge">${esc(guia.etiqueta)}</span>
        <h3 class="info-hero__titulo">${esc(guia.titulo)}</h3>
        <p class="info-hero__subtitulo">${esc(guia.subtitulo)}</p>
      </div>
    </header>`;
}
