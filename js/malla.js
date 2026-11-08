/* =============================================
   MÓDULO MALLA CURRICULAR
   Datos (carpeta data/malla):
   - componentes.json: componentes y agrupaciones (con sus créditos)
   - plan.json: qué va en cada semestre (códigos o casillas de optativa / libre elección)
   - asignaturas.json: catálogo con créditos, prerrequisitos y agrupación
   Las relaciones se calculan aquí a partir de los códigos: nada está repetido en los datos.
   ============================================= */

const POR_PAGINA = 12;
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const ICONO_WHATSAPP = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.07 7.71C8.89 7.71 8.6 7.78 8.36 8.04C8.11 8.3 7.41 8.96 7.41 10.3C7.41 11.63 8.38 12.92 8.52 13.1C8.66 13.29 10.42 16 13.12 17.17C15.36 18.14 15.82 17.95 16.31 17.9C16.8 17.86 17.88 17.26 18.11 16.63C18.33 16 18.33 15.46 18.26 15.35C18.2 15.24 18.01 15.18 17.73 15.04C17.45 14.9 16.08 14.23 15.83 14.13C15.57 14.04 15.39 13.99 15.2 14.27C15.02 14.55 14.49 15.18 14.33 15.36C14.17 15.55 14.01 15.57 13.73 15.43C13.45 15.29 12.27 14.9 10.87 13.65C9.78 12.68 9.05 11.48 8.84 11.12C8.63 10.76 8.82 10.56 8.96 10.42C9.09 10.29 9.25 10.08 9.39 9.92C9.53 9.76 9.58 9.64 9.67 9.46C9.76 9.27 9.72 9.11 9.65 8.97C9.58 8.83 9.07 7.58 8.86 7.07C8.66 6.58 8.45 6.64 8.3 6.63C8.15 6.63 7.97 6.63 7.78 6.63"/></svg>`;

let hoverCodigoActual = null;

const estado = {
  componentes: [],
  agrupaciones: [],
  plan: [],
  asignaturas: new Map(),   // codigo -> asignatura
  dependientes: new Map(),  // codigo -> códigos que lo piden como prerrequisito
  seleccion: null,          // código de la asignatura abierta en el detalle
  componente: null,         // pestaña activa del catálogo
  agrupacion: null,         // agrupación activa del catálogo
  tipo: 'todas',            // todas | obligatorias | optativas
  pagina: 1,
};

const buscarComponente = (id) => estado.componentes.find((c) => c.id === id);
const buscarAgrupacion = (id) => estado.agrupaciones.find((a) => a.id === id);
const colorDe = (asignatura) => buscarComponente(buscarAgrupacion(asignatura.agrupacion).componente).color;
const creditosTexto = (creditos) => (creditos ?? '—');


/* ---------- Carga ---------- */

function prepararDatos([componentes, plan, asignaturas]) {
  estado.componentes = componentes.componentes;
  estado.agrupaciones = componentes.agrupaciones;
  estado.plan = plan;
  asignaturas.forEach((a) => estado.asignaturas.set(a.codigo, a));

  // Inverso de "prerrequisitos": de qué materias es requisito cada una
  asignaturas.forEach((a) => a.prerrequisitos.forEach((p) => {
    if (!estado.dependientes.has(p)) estado.dependientes.set(p, []);
    estado.dependientes.get(p).push(a.codigo);
  }));

  const totalCreditos = plan.reduce((suma, s) => suma + s.creditos, 0);
  $('#malla-antetitulo').textContent = `${plan.length} semestres · ${totalCreditos} créditos`;
}

/* ==============================================================================
   ESTADO DE PROGRESO DEL ESTUDIANTE (MÓDULO MI AVANCE)
   ============================================================================== */

const estadoProgreso = {
  activo: true,
  historia: null,
  aprobadasPlan: 0,
  totalPlanAsignaturas: 0,
  creditosAprobadosPlan: 0,
  porcentajePlan: 0,
  materiasPorCodigo: new Map(),
  bolsasCumplidas: new Set(),
};

const baseCodigo = (c) => String(c || '').split('-')[0].trim();

function crearIndiceProgreso(historia) {
  estadoProgreso.materiasPorCodigo.clear();
  estadoProgreso.bolsasCumplidas.clear();

  (historia.materias || []).forEach((m) => {
    const raw = String(m.codigo || '').trim();
    const base = baseCodigo(raw);
    const est = (m.estado || '').toUpperCase();
    const esAprobada = ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(est);

    const actual = estadoProgreso.materiasPorCodigo.get(raw);
    if (!actual || (!['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(actual.estado) && esAprobada)) {
      estadoProgreso.materiasPorCodigo.set(raw, m);
      if (base) estadoProgreso.materiasPorCodigo.set(base, m);
    }
  });

  calcularBolsasCumplidas(historia);
  actualizarMetricasPlan();
}

function consultarProgresoMateria(codigo) {
  if (!estadoProgreso.activo || !estadoProgreso.historia) return null;
  const raw = String(codigo || '').trim();
  const base = baseCodigo(raw);
  return estadoProgreso.materiasPorCodigo.get(raw) || estadoProgreso.materiasPorCodigo.get(base) || null;
}

function calcularBolsasCumplidas(historia) {
  estadoProgreso.bolsasCumplidas.clear();

  const creditosPorBolsa = {
    'ciencias-basicas': 0,
    'basicas-ingenieria': 0,
    'tecnologias-manejo-ambiental': 0,
    'ciencias-medioambientales': 0,
    'optativas-profesionales': 0,
    'libre-eleccion': 0,
  };

  const discOptativasPool = ['basicas-ingenieria', 'tecnologias-manejo-ambiental', 'ciencias-medioambientales', 'optativas-profesionales'];
  let discOptativasNoAsignadas = 0;

  for (const m of (historia.materias || [])) {
    if (!['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes((m.estado || '').toUpperCase())) continue;
    const tip = (m.tipologia || '').toUpperCase();
    const cr = m.creditos || 0;

    const a = estado.asignaturas.get(m.codigo) || estado.asignaturas.get(baseCodigo(m.codigo));
    if (a && !a.obligatoria && creditosPorBolsa[a.agrupacion] !== undefined) {
      creditosPorBolsa[a.agrupacion] += cr;
    } else if (tip.includes('LIBRE')) {
      creditosPorBolsa['libre-eleccion'] += cr;
    } else if (tip.includes('FUND. OPTATIVA')) {
      creditosPorBolsa['ciencias-basicas'] += cr;
    } else if (tip.includes('DISCIPLINAR OPTATIVA')) {
      discOptativasNoAsignadas += cr;
    }
  }

  if (historia.resumen) {
    if (historia.resumen['LIBRE ELECCIÓN']?.aprobados) {
      creditosPorBolsa['libre-eleccion'] = Math.max(creditosPorBolsa['libre-eleccion'], historia.resumen['LIBRE ELECCIÓN'].aprobados);
    }
    if (historia.resumen['FUND. OPTATIVA']?.aprobados) {
      creditosPorBolsa['ciencias-basicas'] = Math.max(creditosPorBolsa['ciencias-basicas'], historia.resumen['FUND. OPTATIVA'].aprobados);
    }
    if (historia.resumen['DISCIPLINAR OPTATIVA']?.aprobados) {
      const sumaDisc = discOptativasPool.reduce((acc, k) => acc + creditosPorBolsa[k], 0);
      const totalDisc = historia.resumen['DISCIPLINAR OPTATIVA'].aprobados;
      if (totalDisc > sumaDisc) {
        discOptativasNoAsignadas = Math.max(discOptativasNoAsignadas, totalDisc - sumaDisc);
      }
    }
  }

  const disponibles = { ...creditosPorBolsa };
  let extraDisc = discOptativasNoAsignadas;

  for (const s of estado.plan) {
    s.items.forEach((item, pos) => {
      if (item.tipo === 'bolsa') {
        const ag = item.agrupacion;
        let cump = false;
        if (disponibles[ag] >= item.creditos) {
          disponibles[ag] -= item.creditos;
          cump = true;
        } else if (discOptativasPool.includes(ag) && extraDisc >= item.creditos) {
          extraDisc -= item.creditos;
          cump = true;
        }
        if (cump) {
          estadoProgreso.bolsasCumplidas.add(`b-${s.semestre}-${pos}`);
        }
      }
    });
  }
}

function actualizarMetricasPlan() {
  let obligatoriasAprobadas = 0;
  let totalObligatorias = 0;
  let creditosAprobados = 0;

  for (const s of estado.plan) {
    for (const item of s.items) {
      if (item.tipo === 'asignatura') {
        totalObligatorias++;
        const prog = consultarProgresoMateria(item.codigo);
        if (prog && ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes((prog.estado || '').toUpperCase())) {
          obligatoriasAprobadas++;
          creditosAprobados += (item.creditos || 0);
        }
      }
    }
  }

  for (const s of estado.plan) {
    s.items.forEach((item, pos) => {
      if (item.tipo === 'bolsa' && estadoProgreso.bolsasCumplidas.has(`b-${s.semestre}-${pos}`)) {
        creditosAprobados += (item.creditos || 0);
      }
    });
  }

  Object.assign(estadoProgreso, {
    aprobadasPlan: obligatoriasAprobadas,
    totalPlanAsignaturas: totalObligatorias,
    creditosAprobadosPlan: creditosAprobados,
    porcentajePlan: Math.min(100, Math.round((creditosAprobados / 174) * 100)),
  });
}

function cargarProgresoUsuario() {
  let textoHistoria = '';
  let nombreUsuario = '';

  try {
    const guardado = JSON.parse(localStorage.getItem('ambiental.avance.v1') || '{}');
    if (guardado.texto) {
      textoHistoria = guardado.texto;
      nombreUsuario = guardado.nombre || '';
    }
  } catch {}

  if (textoHistoria && typeof leerHistoria === 'function') {
    try {
      const historia = leerHistoria(textoHistoria);
      if (historia && (historia.materias?.length || Object.keys(historia.resumen || {}).length)) {
        estadoProgreso.historia = historia;
        if (!nombreUsuario && historia.nombre) nombreUsuario = historia.nombre;
        crearIndiceProgreso(historia);
      }
    } catch (e) {
      console.warn('Error procesando historia en la malla de Ambiental:', e);
    }
  }

  actualizarBannerSesion(nombreUsuario);
}

function actualizarBannerSesion(nombreUsuario) {
  const bannerSesion = $('#malla-sesion');
  const bannerInvitado = $('#malla-invitado');
  if (!bannerSesion) return;

  if (estadoProgreso.historia) {
    bannerSesion.hidden = false;
    if (bannerInvitado) bannerInvitado.hidden = true;

    const elNombre = $('#malla-usuario-nombre');
    const elResumen = $('#malla-resumen-texto');

    if (elNombre) elNombre.textContent = nombreUsuario || estadoProgreso.historia.nombre || 'Estudiante';
    if (elResumen) {
      const totalCrAprob = estadoProgreso.historia.resumen?.TOTAL?.aprobados || estadoProgreso.creditosAprobadosPlan;
      const pct = Math.round(((totalCrAprob / 174) * 100) * 10) / 10;
      elResumen.innerHTML = `Llevas <strong>${totalCrAprob} de 174 créditos</strong> aprobados (${pct}%) · <strong>${estadoProgreso.aprobadasPlan}</strong> asignaturas aprobadas en la malla oficial.`;
    }
  } else {
    bannerSesion.hidden = true;
    if (bannerInvitado) bannerInvitado.hidden = false;
  }
}

function iniciarControlesSesion() {
  const btnToggle = document.getElementById('btn-toggle-sombreado');
  if (!btnToggle) return;

  btnToggle.addEventListener('click', () => {
    estadoProgreso.activo = !estadoProgreso.activo;
    btnToggle.classList.toggle('is-activo', estadoProgreso.activo);
    btnToggle.setAttribute('aria-pressed', estadoProgreso.activo ? 'true' : 'false');
    const label = btnToggle.querySelector('.malla-sesion__btn-toggle-label');
    if (label) label.textContent = estadoProgreso.activo ? 'Sombrear aprobadas' : 'Sombreado desactivado';

    if (estadoProgreso.historia) {
      crearIndiceProgreso(estadoProgreso.historia);
    }
    pintarLeyenda();
    pintarMalla();
    pintarCatalogo();
  });
}

Promise.all([cargarDatos('malla/componentes'), cargarDatos('malla/plan'), cargarDatos('malla/asignaturas')])
  .then((datos) => {
    prepararDatos(datos);
    cargarProgresoUsuario();
    iniciarControlesSesion();
    pintarLeyenda();
    pintarMalla();
    iniciarCatalogo();
    leerDireccion();
  })
  .catch((error) => mostrarErrorDeCarga($('#malla-rejilla'), error));


/* ---------- Convenciones ---------- */

function pintarLeyenda() {
  const componentes = estado.componentes
    .map((c) => `<li><span class="leyenda__punto" style="--color: ${c.color}"></span>${esc(c.nombre)}</li>`)
    .join('');
  $('#leyenda').innerHTML = `
    ${componentes}
    <li><span class="leyenda__aro" style="--color: #f59e0b"></span>Prerrequisito (te pide)</li>
    <li><span class="leyenda__aro" style="--color: var(--turquesa)"></span>Te abre (se abre después)</li>`;
}


/* ---------- Malla ---------- */

function casillaAsignatura(codigo) {
  const a = estado.asignaturas.get(codigo);
  if (!a) {
    return `
    <li>
      <button class="materia" type="button" data-codigo="${esc(codigo)}"
        style="--color: var(--verde-bosque)" aria-label="${esc(codigo)}">
        <span class="materia__nombre">${esc(codigo)}</span>
        <span class="materia__cred">—</span>
        <span class="materia__codigo">${esc(codigo)}</span>
      </button>
    </li>`;
  }
  const wppIndicador = a.whatsapp ? `<span class="materia__wpp-punto" title="Grupo de WhatsApp disponible">💬</span>` : '';

  let claseEstado = '';
  let estadoAria = '';
  let tagProgreso = '';

  const prog = consultarProgresoMateria(codigo);
  if (prog) {
    if (['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(prog.estado)) {
      claseEstado = 'materia--aprobada';
      estadoAria = ', Aprobada';
      tagProgreso = `<span class="materia__tag-aprobada" title="Aprobada (Nota: ${prog.nota !== null ? prog.nota : 'AP'})">✓</span>`;
    } else if (['INSCRITA', 'CURSANDO', 'EN CURSO'].includes(prog.estado) || (!prog.estado && !prog.nota)) {
      claseEstado = 'materia--en-curso';
      estadoAria = ', En curso';
      tagProgreso = `<span class="materia__tag-curso" title="En curso este periodo">▶</span>`;
    }
  }

  return `
    <li>
      <button class="materia ${claseEstado} ${a.whatsapp ? 'materia--con-wpp' : ''}" type="button" data-codigo="${esc(codigo)}" data-agrupacion="${esc(a.agrupacion)}"
        style="--color: ${colorDe(a)}" aria-label="${esc(a.nombre)}, ${a.creditos} créditos${estadoAria}${a.whatsapp ? ', con grupo de WhatsApp' : ''}">
        <span class="materia__nombre">${esc(a.nombre)}</span>
        <span class="materia__cred">${a.creditos}</span>
        <span class="materia__codigo">${esc(a.codigo)}${tagProgreso}${wppIndicador}</span>
      </button>
    </li>`;
}

function casillaBolsa(bolsa, semestre, posicion) {
  const agrupacion = buscarAgrupacion(bolsa.agrupacion);
  const color = buscarComponente(agrupacion.componente).color;
  const idBolsa = `b-${semestre}-${posicion}`;

  let claseEstado = '';
  let estadoAria = '';
  let tagProgreso = '';

  if (estadoProgreso.activo && estadoProgreso.bolsasCumplidas.has(idBolsa)) {
    claseEstado = 'materia--aprobada materia--bolsa-cumplida';
    estadoAria = ', Requisito cubierto con tus materias cursadas';
    tagProgreso = `<span class="materia__tag-aprobada" title="Créditos cubiertos">✓</span>`;
  }

  const textoCodigo = bolsa.agrupacion === 'libre-eleccion' ? 'a tu elección' : 'ver opciones';

  return `
    <li>
      <button class="materia materia--bolsa ${claseEstado}" type="button" data-bolsa="${esc(bolsa.agrupacion)}"
        data-id="${idBolsa}" data-agrupacion="${esc(bolsa.agrupacion)}"
        data-creditos="${bolsa.creditos}" data-nombre="${esc(bolsa.nombre)}"
        style="--color: ${color}" aria-label="${esc(bolsa.nombre)}, ${bolsa.creditos} créditos${estadoAria}">
        <span class="materia__nombre">${esc(bolsa.nombre)}</span>
        <span class="materia__cred">${bolsa.creditos}</span>
        <span class="materia__codigo">${tagProgreso}${textoCodigo}</span>
      </button>
    </li>`;
}

function pintarMalla() {
  $('#malla-rejilla').innerHTML = `
    <div class="rejilla" id="rejilla">
      ${estado.plan.map((semestre) => `
        <section class="semestre" aria-label="Semestre ${ROMANOS[semestre.semestre - 1]}">
          <div class="semestre__cabeza">
            <h3>Semestre ${ROMANOS[semestre.semestre - 1]}</h3>
            <p>Créditos ${semestre.creditos}</p>
          </div>
          <ul class="semestre__lista">
            ${semestre.items.map((item, i) => item.tipo === 'asignatura'
              ? casillaAsignatura(item.codigo)
              : casillaBolsa(item, semestre.semestre, i)).join('')}
          </ul>
        </section>`).join('')}
    </div>`;

  const rejilla = $('#rejilla');

  rejilla.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.materia');
    if (!boton) return;
    if (boton.dataset.codigo) seleccionar(boton.dataset.codigo);
    else seleccionarBolsa(boton);
  });

  // Al pasar el cursor por encima de cualquier asignatura, marca sus prerrequisitos y lo que te abre
  rejilla.addEventListener('pointerover', (evento) => {
    const boton = evento.target.closest('.materia[data-codigo]');
    if (!boton) return;
    const codigo = boton.dataset.codigo;
    if (codigo === hoverCodigoActual) return;
    hoverCodigoActual = codigo;
    marcarRelaciones(codigo);
  });

  rejilla.addEventListener('pointerout', (evento) => {
    const boton = evento.target.closest('.materia[data-codigo]');
    if (!boton) return;
    const proximoBoton = evento.relatedTarget?.closest?.('.materia[data-codigo]');
    if (proximoBoton) {
      if (proximoBoton.dataset.codigo !== hoverCodigoActual) {
        hoverCodigoActual = proximoBoton.dataset.codigo;
        marcarRelaciones(hoverCodigoActual);
      }
      return;
    }
    // Salió del botón o pasó a un espacio no interactivo
    hoverCodigoActual = null;
    marcarRelaciones(estado.seleccion);
  });

  rejilla.addEventListener('pointerleave', () => {
    hoverCodigoActual = null;
    marcarRelaciones(estado.seleccion);
  });
}

// Marca en la malla la materia elegida o sobre la que está el cursor, sus prerrequisitos y las materias que abre
function marcarRelaciones(codigo) {
  const rejilla = $('#rejilla');
  if (!rejilla) return;
  rejilla.classList.toggle('hay-seleccion', Boolean(codigo));
  $$('.materia', rejilla).forEach((boton) => boton.classList.remove('es-seleccion', 'es-prerreq', 'es-dependiente'));
  if (!codigo) return;

  const asignatura = estado.asignaturas.get(codigo);
  if (!asignatura) return;

  const marcar = (cod, clase) => $$(`.materia[data-codigo="${CSS.escape(cod)}"]`, rejilla).forEach((b) => b.classList.add(clase));
  marcar(codigo, 'es-seleccion');
  asignatura.prerrequisitos.forEach((p) => marcar(p, 'es-prerreq'));
  (estado.dependientes.get(codigo) || []).forEach((d) => marcar(d, 'es-dependiente'));
}


/* ---------- Detalle ---------- */

const fichaMateria = (codigo, clase = '') => {
  const a = estado.asignaturas.get(codigo);
  return `
    <li><button class="ficha-materia ${clase}" type="button" data-ir="${esc(codigo)}" style="--color: ${colorDe(a)}">
      ${esc(a.nombre)} <small>${esc(a.codigo)}</small>
    </button></li>`;
};

function textoAvance(requisito) {
  const nombre = requisito.componente === 'fundamentacion' ? 'Fundamentación' : 'Formación Disciplinar o Profesional';
  return `${requisito.porcentaje} % de avance en el componente de ${nombre}`;
}

function pintarDetalle(contenidoHtml, color) {
  const detalle = $('#detalle');
  detalle.style.setProperty('--color', color);
  detalle.innerHTML = `<button class="detalle__cerrar" type="button" aria-label="Cerrar detalle">✕</button>${contenidoHtml}`;
  detalle.hidden = false;
  document.body.classList.add('con-detalle');
}

function cerrarDetalle() {
  estado.seleccion = null;
  hoverCodigoActual = null;
  $('#detalle').hidden = true;
  document.body.classList.remove('con-detalle');
  if ($('#rejilla')) marcarRelaciones(null);
  guardarDireccion();
}

function seleccionar(codigo, { desplazar = false } = {}) {
  const a = estado.asignaturas.get(codigo);
  if (!a) return;
  estado.seleccion = codigo;

  const agrupacion = buscarAgrupacion(a.agrupacion);
  const componente = buscarComponente(agrupacion.componente);
  const dependientes = estado.dependientes.get(codigo) || [];
  const semestre = a.semestre ? `Semestre ${ROMANOS[a.semestre - 1]}` : 'Optativa · sin semestre fijo';

  const bloqueWhatsapp = a.whatsapp ? `
    <div class="detalle__bloque detalle__bloque--whatsapp">
      <h4>Comunidad de WhatsApp</h4>
      <a class="detalle__whatsapp-boton" href="${esc(a.whatsapp)}" target="_blank" rel="noopener noreferrer">
        ${ICONO_WHATSAPP}
        <span>Unirse al grupo de WhatsApp</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>` : '';

  pintarDetalle(`
    <div class="detalle__cabeza">
      <p class="detalle__codigo">Código ${esc(a.codigo)}</p>
      <h3>${esc(a.nombre)}</h3>
      <ul class="etiquetas">
        <li class="etiqueta etiqueta--cred">${creditosTexto(a.creditos)} ${a.creditos === 1 ? 'crédito' : 'créditos'}</li>
        <li class="etiqueta etiqueta--comp">${esc(componente.nombre)}</li>
        <li class="etiqueta">${esc(agrupacion.nombre)}</li>
        <li class="etiqueta">${a.obligatoria ? 'Obligatoria' : 'Optativa'}</li>
        <li class="etiqueta">${esc(semestre)}</li>
        ${a.whatsapp ? `<li class="etiqueta etiqueta--wpp"><a href="${esc(a.whatsapp)}" target="_blank" rel="noopener noreferrer" title="Abrir grupo de WhatsApp">${ICONO_WHATSAPP} WhatsApp</a></li>` : ''}
      </ul>
    </div>
    <div class="detalle__cuerpo">
      ${bloqueWhatsapp}
      <div class="detalle__bloque">
        <h4>Prerrequisitos</h4>
        ${a.prerrequisitos.length
          ? `<ul class="fichas">${a.prerrequisitos.map((p) => fichaMateria(p, 'ficha-materia--prerreq')).join('')}</ul>`
          : '<p class="detalle__vacio">No tiene prerrequisitos.</p>'}
        ${a.requisitosAvance ? `<ul class="detalle__avance">${a.requisitosAvance.map((r) => `<li>${esc(textoAvance(r))}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="detalle__bloque">
        <h4>Es prerrequisito de</h4>
        ${dependientes.length
          ? `<ul class="fichas">${dependientes.map((d) => fichaMateria(d)).join('')}</ul>`
          : '<p class="detalle__vacio">No es prerrequisito de otra asignatura.</p>'}
      </div>
      ${a.porConfirmar ? `<p class="detalle__confirmar"><strong>Dato por confirmar.</strong> ${esc(a.porConfirmar)}</p>` : ''}
    </div>`, colorDe(a));

  marcarRelaciones(codigo);
  if (desplazar) {
    $(`.materia[data-codigo="${CSS.escape(codigo)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  guardarDireccion();
}

// Casilla de "Optativa de…" o "Libre elección": explica de qué se trata y lleva a la lista de opciones
function seleccionarBolsa(boton) {
  const agrupacion = buscarAgrupacion(boton.dataset.bolsa);
  const componente = buscarComponente(agrupacion.componente);
  const esLibre = agrupacion.id === 'libre-eleccion';

  estado.seleccion = null;
  marcarRelaciones(null);
  $$('.materia--bolsa.es-seleccion').forEach((b) => b.classList.remove('es-seleccion'));
  boton.classList.add('es-seleccion');

  pintarDetalle(`
    <div class="detalle__cabeza">
      <p class="detalle__codigo">Casilla de la malla</p>
      <h3>${esc(boton.dataset.nombre)}</h3>
      <ul class="etiquetas">
        <li class="etiqueta etiqueta--cred">${esc(boton.dataset.creditos)} créditos</li>
        <li class="etiqueta etiqueta--comp">${esc(componente.nombre)}</li>
        ${esLibre ? '' : `<li class="etiqueta">${esc(agrupacion.nombre)}</li>`}
      </ul>
    </div>
    <div class="detalle__cuerpo">
      <p class="detalle__vacio">${esLibre
        ? 'Esta casilla corresponde al componente de libre elección: no tiene una asignatura fija en la malla.'
        : `Aquí se cursa una optativa de la agrupación «${esc(agrupacion.nombre)}». El programa exige ${agrupacion.exigidos} créditos en total en esta agrupación; la lista con sus prerrequisitos está más abajo.`}</p>
      ${esLibre ? '' : '<button class="detalle__boton" type="button" data-ver-opciones>Ver las opciones</button>'}
    </div>`, componente.color);

  $('#detalle').dataset.bolsa = boton.dataset.bolsa;
  guardarDireccion();
}

$('#detalle').addEventListener('click', (evento) => {
  if (evento.target.closest('.detalle__cerrar')) return cerrarDetalle();

  const ir = evento.target.closest('[data-ir]');
  if (ir) return seleccionar(ir.dataset.ir, { desplazar: true });

  if (evento.target.closest('[data-ver-opciones]')) {
    const agrupacion = buscarAgrupacion($('#detalle').dataset.bolsa);
    estado.componente = agrupacion.componente;
    estado.agrupacion = agrupacion.id;
    estado.tipo = 'optativas';
    estado.pagina = 1;
    pintarCatalogo();
    $('#asignaturas').scrollIntoView({ behavior: 'smooth' });
    guardarDireccion();
  }
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !$('#detalle').hidden) cerrarDetalle();
});


/* ---------- Catálogo por componente (paginado) ---------- */

function iniciarCatalogo() {
  estado.componente = estado.componentes[0].id;
  estado.agrupacion = null;

  $('#pestanas').setAttribute('role', 'tablist');
  $('#pestanas').addEventListener('click', (evento) => {
    const pestana = evento.target.closest('[data-componente]');
    if (!pestana) return;
    estado.componente = pestana.dataset.componente;
    estado.agrupacion = null;
    estado.tipo = 'todas';
    estado.pagina = 1;
    pintarCatalogo();
    guardarDireccion();
  });

  $('#agrupaciones').addEventListener('click', (evento) => {
    const pildora = evento.target.closest('[data-agrupacion]');
    if (!pildora) return;
    estado.agrupacion = pildora.dataset.agrupacion;
    estado.tipo = 'todas';
    estado.pagina = 1;
    pintarCatalogo();
    guardarDireccion();
  });

  $('#resumen-agrupacion').addEventListener('click', (evento) => {
    const filtro = evento.target.closest('[data-tipo]');
    if (!filtro) return;
    estado.tipo = filtro.dataset.tipo;
    estado.pagina = 1;
    pintarCatalogo();
    guardarDireccion();
  });

  $('#catalogo').addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('[data-codigo]');
    if (tarjeta) seleccionar(tarjeta.dataset.codigo);
  });

  $('#paginacion').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pagina]');
    if (!boton || boton.disabled) return;
    estado.pagina = Number(boton.dataset.pagina);
    pintarCatalogo();
    $('#asignaturas-titulo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    guardarDireccion();
  });

  pintarCatalogo();
}

// Obligatorias primero (por semestre) y luego las optativas por nombre
function ordenar(a, b) {
  if (a.obligatoria !== b.obligatoria) return a.obligatoria ? -1 : 1;
  if (a.obligatoria) return (a.semestre ?? 99) - (b.semestre ?? 99) || a.nombre.localeCompare(b.nombre, 'es');
  return a.nombre.localeCompare(b.nombre, 'es');
}

function pintarCatalogo() {
  // Pestañas de componente
  $('#pestanas').innerHTML = estado.componentes.map((c) => `
    <button class="pestana" type="button" role="tab" data-componente="${esc(c.id)}"
      aria-selected="${c.id === estado.componente}" style="--color: ${c.color}">${esc(c.nombre)}</button>`).join('');

  // Agrupaciones del componente elegido
  const delComponente = estado.agrupaciones.filter((a) => a.componente === estado.componente);
  if (!delComponente.some((a) => a.id === estado.agrupacion)) estado.agrupacion = delComponente[0].id;
  $('#agrupaciones').innerHTML = delComponente.length > 1
    ? delComponente.map((a) => `
        <button class="pildora" type="button" data-agrupacion="${esc(a.id)}"
          aria-pressed="${a.id === estado.agrupacion}">${esc(a.nombre)}</button>`).join('')
    : '';

  const agrupacion = buscarAgrupacion(estado.agrupacion);
  const todas = [...estado.asignaturas.values()].filter((a) => a.agrupacion === agrupacion.id).sort(ordenar);
  const hayAmbas = todas.some((a) => a.obligatoria) && todas.some((a) => !a.obligatoria);
  if (!hayAmbas) estado.tipo = 'todas';
  const filtradas = todas.filter((a) =>
    estado.tipo === 'todas' || (estado.tipo === 'obligatorias' ? a.obligatoria : !a.obligatoria));

  // Resumen de créditos de la agrupación (los números del programa curricular)
  const filtro = hayAmbas ? `
    <span class="filtro" role="group" aria-label="Tipo de asignatura">
      ${[['todas', 'Todas'], ['obligatorias', 'Obligatorias'], ['optativas', 'Optativas']].map(([id, texto]) =>
        `<button type="button" data-tipo="${id}" aria-pressed="${estado.tipo === id}">${texto}</button>`).join('')}
    </span>` : '';
  $('#resumen-agrupacion').innerHTML = agrupacion.exigidos === undefined ? '' : `
    <div class="resumen">
      <span><strong>${esc(agrupacion.nombre)}</strong> · créditos exigidos: <strong>${agrupacion.exigidos}</strong></span>
      <span class="resumen__oblig">Obligatorios: ${agrupacion.obligatorios}</span>
      <span class="resumen__optat">Optativos: ${agrupacion.optativos}</span>
      ${filtro}
    </div>`;

  // Página actual
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  estado.pagina = Math.min(Math.max(1, estado.pagina), totalPaginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = filtradas.slice(inicio, inicio + POR_PAGINA);

  $('#catalogo').innerHTML = agrupacion.id === 'libre-eleccion'
    ? `<li class="catalogo__vacio">El componente de libre elección no tiene asignaturas fijas: se cursa en las casillas «Libre elección» de la malla.</li>`
    : visibles.map((a) => {
        const prog = consultarProgresoMateria(a.codigo);
        const tagCatalogo = prog && ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(prog.estado)
          ? ' · <span style="color:#10B981;font-weight:700">✓ Aprobada</span>'
          : (prog && ['INSCRITA', 'CURSANDO', 'EN CURSO'].includes(prog.estado)
              ? ' · <span style="color:#00bcc8;font-weight:700">▶ En curso</span>'
              : '');

        return `
        <li>
          <button class="tarjeta" type="button" data-codigo="${esc(a.codigo)}" style="--color: ${colorDe(a)}">
            <span class="tarjeta__nombre">${esc(a.nombre)}</span>
            <span class="tarjeta__pie">
              <span><span class="tarjeta__tipo">${a.obligatoria ? 'Obligatoria' : 'Optativa'}</span> · ${esc(a.codigo)}${tagCatalogo}${a.whatsapp ? ' · <span class="tarjeta__wpp" title="Tiene grupo de WhatsApp">💬 WhatsApp</span>' : ''}</span>
              <span class="tarjeta__cred" title="Créditos">${creditosTexto(a.creditos)}</span>
            </span>
          </button>
        </li>`;
      }).join('');

  pintarPaginacion(totalPaginas, filtradas.length, inicio, visibles.length);
}

// 1 … 4 5 [6] 7 8 … 12
function paginasVisibles(actual, total) {
  const conjunto = new Set([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...conjunto].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const salida = [];
  ordenadas.forEach((n, i) => {
    const hueco = i ? n - ordenadas[i - 1] : 1;
    if (hueco === 2) salida.push(n - 1);     // si falta una sola página, se muestra en vez de "…"
    else if (hueco > 2) salida.push('…');
    salida.push(n);
  });
  return salida;
}

function pintarPaginacion(total, cantidad, inicio, enPagina) {
  const nav = $('#paginacion');
  if (!cantidad || estado.agrupacion === 'libre-eleccion') { nav.innerHTML = ''; return; }

  const info = `<p class="pag__info">Mostrando ${inicio + 1}–${inicio + enPagina} de ${cantidad} asignaturas</p>`;
  if (total === 1) { nav.innerHTML = info; return; }

  nav.innerHTML = `
    <button class="pag__boton" type="button" data-pagina="${estado.pagina - 1}" ${estado.pagina === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>
    ${paginasVisibles(estado.pagina, total).map((n) => n === '…'
      ? '<span class="pag__puntos" aria-hidden="true">…</span>'
      : `<button class="pag__boton" type="button" data-pagina="${n}" ${n === estado.pagina ? 'aria-current="page"' : ''} aria-label="Página ${n}">${n}</button>`).join('')}
    <button class="pag__boton" type="button" data-pagina="${estado.pagina + 1}" ${estado.pagina === total ? 'disabled' : ''} aria-label="Página siguiente">›</button>
    ${info}`;
}


/* ---------- Dirección (para compartir el estado de la página) ---------- */

function guardarDireccion() {
  const parametros = new URLSearchParams();
  if (estado.seleccion) parametros.set('materia', estado.seleccion);
  parametros.set('componente', estado.componente);
  parametros.set('agrupacion', estado.agrupacion);
  if (estado.tipo !== 'todas') parametros.set('tipo', estado.tipo);
  if (estado.pagina > 1) parametros.set('pagina', estado.pagina);
  history.replaceState(null, '', `#${parametros}`);
}

function leerDireccion() {
  const parametros = new URLSearchParams(location.hash.slice(1));
  const agrupacion = buscarAgrupacion(parametros.get('agrupacion'));
  if (agrupacion) {
    estado.componente = agrupacion.componente;
    estado.agrupacion = agrupacion.id;
    estado.tipo = ['obligatorias', 'optativas'].includes(parametros.get('tipo')) ? parametros.get('tipo') : 'todas';
    estado.pagina = Number(parametros.get('pagina')) || 1;
    pintarCatalogo();
  }
  const materia = parametros.get('materia');
  if (materia && estado.asignaturas.has(materia)) seleccionar(materia, { desplazar: true });
}
