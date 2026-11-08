/* ==============================================================================
   PORTAL WEB OFICIAL · INGENIERÍA AMBIENTAL · UNAL SEDE MEDELLÍN
   MÓDULO MI AVANCE — Interfaz y Lógica de Progreso
   Lee la historia académica guardada en localStorage (ambiental.avance.v1),
   dibuja la pantalla de avance del estudiante: nivel, proyección de graduación,
   mapa de semestres (Ruta), misiones por componente y bitácora académica.
   Todos los derechos reservados © 2026.
   ============================================================================== */

(() => {
  'use strict';

  const CLAVE_GUARDADO = 'ambiental.avance.v1';

  // Usar helpers globales o fallbacks locales seguros
  const $ = (sel, r = document) => (typeof window.$ === 'function' ? window.$(sel, r) : r.querySelector(sel));
  const $$ = (sel, r = document) => (typeof window.$$ === 'function' ? window.$$(sel, r) : [...r.querySelectorAll(sel)]);
  const esc = (t) => (typeof window.esc === 'function' ? window.esc(t) : String(t ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
  const clavePeriodo = (p) => (typeof window.clavePeriodo === 'function' ? window.clavePeriodo(p) : (p && p.anio && p.num ? p.anio * 10 + p.num : 0));
  const etiquetaPeriodo = (p) => (typeof window.etiquetaPeriodo === 'function' ? window.etiquetaPeriodo(p) : (p && p.anio && p.num ? `${p.anio}-${p.num}S` : ''));

  const guardado = {
    leer() {
      try {
        return JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) || null;
      } catch {
        return null;
      }
    },
    escribir(datos) {
      try {
        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
        return true;
      } catch {
        return false;
      }
    },
    borrar() {
      try {
        localStorage.removeItem(CLAVE_GUARDADO);
        return true;
      } catch {
        return false;
      }
    },
  };

  const estado = {
    texto: '',
    historia: null,
    avance: null,
    pestana: 'ruta',
    filtroPeriodo: 'todos',
    filtroEstado: 'todos',
    busquedaBitacora: '',
    nombre: '',
    ritmo: null,
  };

  const formatear = (n, dec = 0) =>
    Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const GRUPOS_COMPONENTE = {
    fundamentacion: { nombre: 'Fundamentación', color: 'var(--fundamentacion, #028090)' },
    disciplinar: { nombre: 'Formación disciplinar o profesional', color: 'var(--disciplinar, #2c563e)' },
    libre: { nombre: 'Libre elección', color: 'var(--libre, #b45309)' },
  };

  const RANGOS_NIVEL = [
    [1, 'Explorador(a) de cuencas y ecosistemas iniciales'],
    [16, 'Analista de calidad ambiental y fisicoquímica hídrica'],
    [31, 'Gestor(a) de recursos naturales y saneamiento básico'],
    [51, 'Modelador(a) hidroclimático y sistemas de información ambiental'],
    [71, 'Especialista en evaluación de impacto y bioingeniería'],
    [86, 'Director(a) de sostenibilidad, ordenamiento territorial y mitigación climática'],
    [100, 'Ingeniero(a) Ambiental graduado(a) · Facultad de Minas'],
  ];

  function rangoNivel(nivel) {
    let r = RANGOS_NIVEL[0][1];
    RANGOS_NIVEL.forEach(([desde, nom]) => {
      if (nivel >= desde) r = nom;
    });
    return r;
  }

  function faltanParaSiguienteNivel(avance) {
    if (avance.nivel >= 100 || !avance.exigidos) return null;
    const meta = Math.ceil(((avance.nivel + 1) * avance.exigidos) / 100 - 1e-9);
    return Math.max(1, meta - avance.aprobados);
  }

  /* ---------- Tarjeta HUD del Jugador ---------- */
  function pintarJugador(avance, historia) {
    const pasoXp = Math.min(100, (avance.aprobados / (avance.exigidos || 1)) * 100);
    const pasoCurso = Math.min(100 - pasoXp, (avance.inscritos / (avance.exigidos || 1)) * 100);
    const faltan = faltanParaSiguienteNivel(avance);
    const inglesBadge = historia.inglesAcreditado
      ? `<span class="badge-ingles" title="Requisito de inglés acreditado">✓ Inglés acreditado</span>`
      : '';

    return `
      <section class="panel jugador" aria-label="Ficha del jugador">
        <div class="jugador__avatar">
          <svg class="anillo" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="anillo__pista" cx="60" cy="60" r="54" pathLength="100"></circle>
            <circle class="anillo__curso" cx="60" cy="60" r="54" pathLength="100" style="--ini: ${pasoXp}; --len: ${pasoCurso}"></circle>
            <circle class="anillo__valor" cx="60" cy="60" r="54" pathLength="100" style="--pct: ${pasoXp}"></circle>
          </svg>
          <div class="jugador__escudo-wrap">
            <img src="img/logo-ambiental.png" alt="Escudo de Ingeniería Ambiental" class="jugador__escudo" width="80" height="80">
          </div>
          <span class="jugador__nivel${String(avance.nivel).length > 2 ? ' jugador__nivel--3' : ''}">
            <small>NIVEL</small><b data-cuenta="${avance.nivel}">${avance.nivel}</b>
          </span>
        </div>

        <div class="jugador__datos">
          <div class="jugador__fila-sup">
            <p class="etiqueta-hud">ESTUDIANTE</p>
            ${inglesBadge}
          </div>
          <label class="jugador__nombre-wrap">
            <span class="visualmente-oculto">Tu nombre</span>
            <input class="jugador__nombre" id="nombre-jugador" type="text" maxlength="40" value="${esc(estado.nombre || historia.nombre || 'Estudiante')}" placeholder="Escribe tu nombre">
          </label>
          <p class="jugador__rango">
            <span class="jugador__rango-texto">${esc(rangoNivel(avance.nivel))}</span>
          </p>
          <p class="jugador__programa">Ingeniería Ambiental · Facultad de Minas · UNAL Medellín</p>

          <div class="xp" role="img" aria-label="${avance.aprobados} de ${avance.exigidos} créditos aprobados">
            <div class="xp__barra">
              <span class="xp__relleno" style="--ancho: ${pasoXp}%"></span>
              <span class="xp__curso" style="--inicio: ${pasoXp}%; --ancho: ${pasoCurso}%"></span>
            </div>
            <div class="xp__texto">
              <span><b>${avance.aprobados}</b> / ${avance.exigidos} créditos aprobados</span>
              <span>${formatear(avance.porcentaje, 1)} %</span>
            </div>
          </div>

          ${faltan ? `<p class="xp__siguiente">A <b>${faltan}</b> ${faltan === 1 ? 'crédito' : 'créditos'} del nivel <b>${avance.nivel + 1}</b></p>` : '<p class="xp__siguiente">¡Nivel máximo alcanzado! 100% de créditos cubiertos</p>'}
        </div>

        <div class="jugador__acciones">
          <button type="button" class="btn-juego btn-juego--mini" id="btn-compartir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>Compartir tarjeta</span>
          </button>
        </div>
      </section>`;
  }

  /* ---------- Estadísticas Clave ---------- */
  function pintarEstadisticas(avance, historia) {
    const casillas = [
      { etiqueta: 'Créditos aprobados', valor: avance.aprobados, sufijo: `/${avance.exigidos}`, tono: 'verde' },
      { etiqueta: 'Por cursar', valor: avance.pendientes, tono: 'ambar' },
      { etiqueta: 'Inscritos ahora', valor: avance.inscritos, tono: 'turquesa' },
      { etiqueta: 'P.A.P.A', valor: historia.papa, decimales: 1, tono: 'verde' },
      { etiqueta: 'Materias aprobadas', valor: avance.materiasAprobadas, tono: 'turquesa' },
      { etiqueta: 'Semestres cursados', valor: avance.semestresCursados, tono: 'ambar' },
    ].filter((c) => c.valor !== null && c.valor !== undefined);

    return `
      <ul class="estadisticas" aria-label="Estadísticas de la carrera">
        ${casillas.map((c) => `
          <li class="estadistica estadistica--${c.tono}">
            <span class="estadistica__valor">
              <b data-cuenta="${c.valor}" data-decimales="${c.decimales || 0}">${formatear(c.valor, c.decimales || 0)}</b>
              ${c.sufijo ? `<small>${c.sufijo}</small>` : ''}
            </span>
            <span class="estadistica__etiqueta">${esc(c.etiqueta)}</span>
          </li>`).join('')}
      </ul>`;
  }

  /* ---------- Graduación Estimada y Ritmo de Créditos ---------- */
  function pintarGraduacion(avance) {
    const etiqueta = avance.graduacion ? etiquetaPeriodo(avance.graduacion) : '';
    const cuerpo = avance.completo
      ? `<p class="meta__valor meta__valor--listo">¡Créditos del plan 100% cumplidos!</p>
         <p class="meta__texto">Ya cubriste los 174 créditos exigidos del plan. Revisa con la Dirección de Área Curricular de Medio Ambiente los trámites de grado.</p>`
      : `<p class="meta__valor">${esc(etiqueta)}</p>
         <p class="meta__texto">Según tu ritmo de <b id="ritmo-valor">${avance.ritmo}</b> créditos por semestre, te faltan aproximadamente <b>${avance.semestresFaltantes}</b> semestre${avance.semestresFaltantes === 1 ? '' : 's'}${avance.inscritos > 0 ? ' (contando el que tienes en curso)' : ''}.</p>
         <label class="meta__ritmo" for="ritmo">
           <span>Simula un ritmo diferente:</span>
           <input type="range" id="ritmo" min="6" max="24" step="1" value="${avance.ritmo}">
           <span class="meta__ritmo-escala"><span>6 cr</span><span>15 cr</span><span>24 cr</span></span>
         </label>
         ${avance.ritmo !== avance.ritmoCalculado ? `<button type="button" class="boton-juego boton-juego--suave boton-juego--mini" id="ritmo-reiniciar">Restablecer mi ritmo calculado (${avance.ritmoCalculado} cr)</button>` : ''}`;

    return `
      <section class="panel meta" aria-label="Graduación estimada">
        <div class="panel__cabecera">
          <p class="panel__titulo">Proyección · Graduación estimada</p>
        </div>
        ${cuerpo}
        <p class="meta__aviso">Esta estimación se calcula según tu ritmo semestral promedio reciente. Depende de la oferta de cursos, prerrequisitos académicos y el Trabajo de Grado.</p>
      </section>`;
  }

  /* ---------- Pestaña 1: Ruta (Mapa Semestral) ---------- */
  function pintarMapa(avance) {
    const maximo = Math.max(24, avance.ritmo, ...avance.historial.map((h) => h.aprobados + h.reprobados), ...avance.proyeccion.map((p) => p.creditos));
    const alto = (c) => `${Math.max(4, (c / maximo) * 100)}%`;
    const columnas = [
      ...avance.historial.map((h) => ({ periodo: h.periodo, tipo: 'hecho', aprobados: h.aprobados, reprobados: h.reprobados })),
      ...avance.proyeccion.map((p) => ({ periodo: p.periodo, tipo: p.tipo, aprobados: p.creditos, reprobados: 0 })),
    ];

    return `
      <section class="panel mapa" aria-label="Mapa de semestres">
        <p class="panel__titulo">Mapa de niveles · créditos por semestre</p>
        <div class="mapa__scroll" tabindex="0">
          <ol class="mapa__lista" style="--columnas: ${columnas.length}">
            ${columnas.map((c, i) => `
              <li class="mapa__col mapa__col--${c.tipo}" style="--i: ${i}">
                <span class="mapa__cr">${c.aprobados + c.reprobados} cr</span>
                <span class="mapa__barra">
                  <span class="mapa__tramo mapa__tramo--ok" style="height: ${alto(c.aprobados)}"></span>
                  ${c.reprobados ? `<span class="mapa__tramo mapa__tramo--mal" style="height: ${alto(c.reprobados)}"></span>` : ''}
                </span>
                <span class="mapa__periodo">${esc(etiquetaPeriodo(c.periodo))}</span>
                <span class="mapa__marca">${c.tipo === 'hecho' ? '✓' : c.tipo === 'curso' ? '▶' : '◇'}</span>
              </li>`).join('')}
          </ol>
        </div>
        <ul class="mapa__leyenda">
          <li><span class="mapa__dot mapa__dot--ok"></span>Aprobados</li>
          <li><span class="mapa__dot mapa__dot--mal"></span>Reprobados</li>
          <li><span class="mapa__dot mapa__dot--curso"></span>En curso</li>
          <li><span class="mapa__dot mapa__dot--proy"></span>Proyectados</li>
        </ul>
      </section>`;
  }

  /* ---------- Pestaña 2: Misiones por Componente ---------- */
  function pintarMisiones(avance, historia) {
    const r = historia.resumen || {};
    const filas = TIPOLOGIAS.map((t) => ({ ...t, datos: r[t.clave] })).filter((f) => f.datos && f.clave !== 'NIVELACIÓN');

    return `
      <section class="panel misiones" aria-label="Misiones por componente">
        <p class="panel__titulo">Misiones curriculares · créditos por componente</p>
        <ul class="misiones__lista">
          ${filas.map((f) => {
            const apr = f.datos.aprobados || 0;
            const exi = f.datos.exigidos || f.exigidos;
            const ins = f.datos.inscritos || 0;
            const pct = exi ? Math.min(100, Math.round((apr / exi) * 100)) : 100;
            const pctIns = exi ? Math.min(100 - pct, Math.round((ins / exi) * 100)) : 0;
            const cump = apr >= exi && exi > 0;
            return `
              <li class="mision" style="--color: ${GRUPOS_COMPONENTE[f.grupo]?.color || 'var(--verde-bosque)'}">
                <div class="mision__cabecera">
                  <span class="mision__nombre">${esc(f.nombre)}</span>
                  <span class="mision__cifra">${apr} / ${exi} cr ${cump ? '<b class="mision__check">✓ Cumplida</b>' : ''}</span>
                </div>
                <div class="mision__barra">
                  <span class="mision__relleno" style="width: ${pct}%"></span>
                  ${pctIns > 0 ? `<span class="mision__curso" style="left: ${pct}%; width: ${pctIns}%"></span>` : ''}
                </div>
              </li>`;
          }).join('')}
        </ul>
      </section>`;
  }

  /* ---------- Pestaña 3: Bitácora Académica ---------- */
  function pintarBitacora(historia) {
    const periodos = [...new Set(historia.materias.map((m) => m.periodo ? clavePeriodo(m.periodo) : 0))]
      .filter(Boolean)
      .sort((a, b) => b - a);

    const filtradas = historia.materias.filter((m) => {
      if (estado.filtroPeriodo !== 'todos' && m.periodo && clavePeriodo(m.periodo) !== parseInt(estado.filtroPeriodo, 10)) return false;
      if (estado.filtroEstado !== 'todos') {
        const est = (m.estado || '').toUpperCase();
        if (estado.filtroEstado === 'aprobadas' && !['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(est)) return false;
        if (estado.filtroEstado === 'reprobadas' && est !== 'REPROBADA') return false;
        if (estado.filtroEstado === 'curso' && !['INSCRITA', 'CURSANDO', 'EN CURSO'].includes(est) && (m.nota !== null || !m.periodo)) return false;
      }
      if (estado.busquedaBitacora) {
        const q = estado.busquedaBitacora.toLowerCase();
        const coincide = m.nombre.toLowerCase().includes(q) || String(m.codigo).toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });

    return `
      <section class="panel bitacora" aria-label="Bitácora de materias">
        <div class="bitacora__filtros">
          <input type="search" id="busqueda-bitacora" class="bitacora__buscar" placeholder="Buscar por asignatura o código..." value="${esc(estado.busquedaBitacora)}">
          <select id="filtro-periodo" class="bitacora__select">
            <option value="todos">Todos los periodos</option>
            ${periodos.map((c) => `<option value="${c}" ${String(c) === String(estado.filtroPeriodo) ? 'selected' : ''}>${etiquetaPeriodo({ anio: Math.floor(c / 10), num: c % 10 })}</option>`).join('')}
          </select>
          <select id="filtro-estado" class="bitacora__select">
            <option value="todos" ${estado.filtroEstado === 'todos' ? 'selected' : ''}>Todos los estados</option>
            <option value="aprobadas" ${estado.filtroEstado === 'aprobadas' ? 'selected' : ''}>Aprobadas</option>
            <option value="reprobadas" ${estado.filtroEstado === 'reprobadas' ? 'selected' : ''}>Reprobadas</option>
            <option value="curso" ${estado.filtroEstado === 'curso' ? 'selected' : ''}>En curso</option>
          </select>
        </div>

        <div class="bitacora__tabla-wrap">
          <table class="bitacora__tabla">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Código</th>
                <th>Asignatura</th>
                <th>Cr</th>
                <th>Tipología</th>
                <th>Nota</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filtradas.length === 0 ? `<tr><td colspan="7" class="bitacora__vacio">No hay materias que coincidan con los filtros.</td></tr>` : ''}
              ${filtradas.map((m) => {
                const est = (m.estado || '').toUpperCase();
                const claseEstado = ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(est) ? 'ok' : est === 'REPROBADA' ? 'mal' : 'curso';
                return `
                  <tr class="bitacora__fila bitacora__fila--${claseEstado}">
                    <td>${esc(m.periodo ? etiquetaPeriodo(m.periodo) : '—')}</td>
                    <td><code>${esc(m.codigo)}</code></td>
                    <td><strong>${esc(m.nombre)}</strong></td>
                    <td>${m.creditos}</td>
                    <td><small>${esc(m.tipologia)}</small></td>
                    <td><b>${m.nota !== null ? formatear(m.nota, 1) : '—'}</b></td>
                    <td><span class="bitacora__tag bitacora__tag--${claseEstado}">${esc(m.estado || 'EN CURSO')}</span></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  const PESTANAS = [
    { id: 'ruta', texto: 'Ruta (Niveles)' },
    { id: 'misiones', texto: 'Misiones (Componentes)' },
    { id: 'bitacora', texto: 'Bitácora Académica' },
  ];

  function activarPestana(juego, id, animar = true) {
    const botones = $$('.pestana-juego', juego);
    const paneles = $$('.pestana-panel', juego);
    if (!botones.some((b) => b.dataset.pestana === id)) id = 'ruta';
    estado.pestana = id;

    botones.forEach((b) => {
      const activa = b.dataset.pestana === id;
      b.classList.toggle('is-activa', activa);
      b.setAttribute('aria-selected', activa ? 'true' : 'false');
      b.tabIndex = activa ? 0 : -1;
      if (activa) {
        const barra = $('.pestanas-juego__indicador', juego);
        if (barra) {
          barra.style.setProperty('--x', `${b.offsetLeft}px`);
          barra.style.setProperty('--w', `${b.offsetWidth}px`);
        }
      }
    });

    paneles.forEach((p) => {
      const activo = p.dataset.pestana === id;
      p.hidden = !activo;
      if (activo && animar) {
        p.classList.remove('entra');
        void p.offsetWidth;
        p.classList.add('entra');
      }
    });
  }

  /* ---------- Render Principal ---------- */
  function render() {
    const contenedor = $('#avance-juego');
    if (!contenedor) return;

    if (!estado.historia) {
      contenedor.hidden = true;
      return;
    }

    contenedor.hidden = false;
    const avance = estado.avance;
    const historia = estado.historia;

    const noEsAmbientalAviso = !historia.esAmbiental
      ? `<aside class="aviso-carrera" role="alert">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           <p><strong>Atención:</strong> La historia académica cargada no parece corresponder al plan de <strong>Ingeniería Ambiental (Plan 3529)</strong>. Los créditos y proyecciones pueden variar.</p>
         </aside>`
      : '';

    contenedor.innerHTML = `
      ${noEsAmbientalAviso}
      ${pintarJugador(avance, historia)}
      ${pintarEstadisticas(avance, historia)}
      ${pintarGraduacion(avance)}

      <div class="pestanas-juego" role="tablist" aria-label="Secciones de Mi avance">
        ${PESTANAS.map((t) => `
          <button type="button" class="pestana-juego" role="tab" id="pest-${t.id}" data-pestana="${t.id}" aria-controls="panel-${t.id}">
            <span>${t.texto}</span>
          </button>`).join('')}
        <span class="pestanas-juego__indicador" aria-hidden="true"></span>
      </div>

      <div class="pestana-panel" role="tabpanel" id="panel-ruta" data-pestana="ruta" aria-labelledby="pest-ruta">${pintarMapa(avance)}</div>
      <div class="pestana-panel" role="tabpanel" id="panel-misiones" data-pestana="misiones" aria-labelledby="pest-misiones" hidden>${pintarMisiones(avance, historia)}</div>
      <div class="pestana-panel" role="tabpanel" id="panel-bitacora" data-pestana="bitacora" aria-labelledby="pest-bitacora" hidden>${pintarBitacora(historia)}</div>`;

    animarContadores(contenedor);
    enlazarEventos(contenedor);
  }

  function animarContadores(contenedor) {
    const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    contenedor.querySelectorAll('[data-cuenta]').forEach((el) => {
      const meta = parseFloat(el.dataset.cuenta);
      const dec = parseInt(el.dataset.decimales || '0', 10);
      if (reducido || Number.isNaN(meta) || meta === 0) return;
      const t0 = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / 900);
        el.textContent = formatear(meta * (1 - (1 - k) ** 3), dec);
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }

  /* ---------- Modal / Tarjeta para Compartir ---------- */
  function compartirTarjeta() {
    const nombre = estado.nombre || estado.historia?.nombre || 'Estudiante de Ambiental';
    const nivel = estado.avance?.nivel || 1;
    const rango = rangoNivel(nivel);
    const papas = estado.historia?.papa ? ` | PAPA: ${formatear(estado.historia.papa, 1)}` : '';
    const textoCompartir = `🌱 ¡Mi avance en Ingeniería Ambiental UNAL Medellín!\n` +
      `👤 ${nombre}\n` +
      `🎖️ Nivel: ${nivel}/100 — ${rango}\n` +
      `📊 Créditos aprobados: ${estado.avance.aprobados}/${estado.avance.exigidos} (${formatear(estado.avance.porcentaje, 1)}%)\n` +
      `🎯 Proyección de graduación: ${estado.avance.graduacion ? etiquetaPeriodo(estado.avance.graduacion) : 'En camino'}${papas}\n` +
      `Facultad de Minas · Universidad Nacional de Colombia`;

    if (navigator.share) {
      navigator.share({
        title: 'Mi Avance · Ingeniería Ambiental UNAL',
        text: textoCompartir,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(textoCompartir).then(() => {
        alert('¡Resumen de avance copiado al portapapeles! Puedes pegarlo en tus chats o redes.');
      }).catch(() => {
        prompt('Copia tu tarjeta de avance:', textoCompartir);
      });
    }
  }

  /* ---------- Eventos de UI ---------- */
  function enlazarEventos(contenedor) {
    // Pestañas
    $$('.pestana-juego', contenedor).forEach((btn, i, todos) => {
      btn.addEventListener('click', () => activarPestana(contenedor, btn.dataset.pestana));
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const siguiente = todos[(i + (e.key === 'ArrowRight' ? 1 : todos.length - 1)) % todos.length];
        siguiente.focus();
        activarPestana(contenedor, siguiente.dataset.pestana);
      });
    });
    activarPestana(contenedor, estado.pestana, false);

    // Slider de ritmo
    const slider = contenedor.querySelector('#ritmo');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        estado.ritmo = val;
        estado.avance = calcularAvance(estado.historia, estado.ritmo);
        const ritVal = contenedor.querySelector('#ritmo-valor');
        if (ritVal) ritVal.textContent = val;
        guardado.escribir({ texto: estado.texto, nombre: estado.nombre, ritmo: estado.ritmo });
        render();
      });
    }

    const btnReiniciarRitmo = contenedor.querySelector('#ritmo-reiniciar');
    if (btnReiniciarRitmo) {
      btnReiniciarRitmo.addEventListener('click', () => {
        estado.ritmo = null;
        estado.avance = calcularAvance(estado.historia, null);
        guardado.escribir({ texto: estado.texto, nombre: estado.nombre, ritmo: null });
        render();
      });
    }

    // Nombre editable
    const inputNombre = contenedor.querySelector('#nombre-jugador');
    if (inputNombre) {
      inputNombre.addEventListener('change', (e) => {
        estado.nombre = e.target.value.trim();
        guardado.escribir({ texto: estado.texto, nombre: estado.nombre, ritmo: estado.ritmo });
      });
    }

    // Compartir
    const btnCompartir = contenedor.querySelector('#btn-compartir');
    if (btnCompartir) {
      btnCompartir.addEventListener('click', compartirTarjeta);
    }

    // Filtros de Bitácora
    enlazarFiltrosBitacora(contenedor);
  }

  function enlazarFiltrosBitacora(contenedor) {
    const inputBusqueda = contenedor.querySelector('#busqueda-bitacora');
    if (inputBusqueda) {
      inputBusqueda.addEventListener('input', (e) => {
        estado.busquedaBitacora = e.target.value;
        const tabla = contenedor.querySelector('.bitacora__tabla-wrap');
        if (tabla) {
          const temp = document.createElement('div');
          temp.innerHTML = pintarBitacora(estado.historia);
          const nuevoWrap = temp.querySelector('.bitacora__tabla-wrap');
          if (nuevoWrap) tabla.innerHTML = nuevoWrap.innerHTML;
        }
      });
    }

    const selectPeriodo = contenedor.querySelector('#filtro-periodo');
    if (selectPeriodo) {
      selectPeriodo.addEventListener('change', (e) => {
        estado.filtroPeriodo = e.target.value;
        const panelBitacora = contenedor.querySelector('#panel-bitacora');
        if (panelBitacora) {
          panelBitacora.innerHTML = pintarBitacora(estado.historia);
          enlazarFiltrosBitacora(contenedor);
        }
      });
    }

    const selectEstado = contenedor.querySelector('#filtro-estado');
    if (selectEstado) {
      selectEstado.addEventListener('change', (e) => {
        estado.filtroEstado = e.target.value;
        const panelBitacora = contenedor.querySelector('#panel-bitacora');
        if (panelBitacora) {
          panelBitacora.innerHTML = pintarBitacora(estado.historia);
          enlazarFiltrosBitacora(contenedor);
        }
      });
    }
  }

  function procesarTexto(raw, guardar = true) {
    const errorEl = $('#entrada-error');
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    if (!raw || !raw.trim()) {
      if (errorEl) {
        errorEl.textContent = 'Por favor pega el contenido de tu historia académica del SIA.';
        errorEl.hidden = false;
      }
      return false;
    }

    try {
      const historia = leerHistoria(raw);
      if (!historia || (!historia.materias.length && !Object.keys(historia.resumen).length)) {
        if (errorEl) {
          errorEl.textContent = 'No se reconocieron asignaturas ni datos válidos en el texto. Asegúrate de copiar desde el módulo Historia Académica del SIA con Ctrl+A y Ctrl+C.';
          errorEl.hidden = false;
        }
        return false;
      }

      estado.texto = raw;
      estado.historia = historia;
      if (!estado.nombre && historia.nombre && historia.nombre !== 'Estudiante') {
        estado.nombre = historia.nombre;
      }
      estado.avance = calcularAvance(historia, estado.ritmo);

      if (guardar) {
        guardado.escribir({
          texto: estado.texto,
          nombre: estado.nombre,
          ritmo: estado.ritmo,
        });
      }

      render();
      const entrada = $('#entrada');
      if (entrada) entrada.open = false;

      return true;
    } catch (err) {
      console.error(err);
      if (errorEl) {
        errorEl.textContent = 'Ocurrió un error al procesar el texto copiado. Verifica que esté completo.';
        errorEl.hidden = false;
      }
      return false;
    }
  }

  function iniciar() {
    const btnGuardar = $('#btn-guardar');
    const btnBorrar = $('#btn-borrar');
    const textarea = $('#historia-texto');

    if (btnGuardar && textarea) {
      btnGuardar.addEventListener('click', () => {
        procesarTexto(textarea.value, true);
      });
    }

    if (btnBorrar) {
      btnBorrar.addEventListener('click', () => {
        if (confirm('¿Deseas borrar tus datos locales de avance en este navegador?')) {
          guardado.borrar();
          estado.texto = '';
          estado.historia = null;
          estado.avance = null;
          estado.nombre = '';
          estado.ritmo = null;
          if (textarea) textarea.value = '';
          const juego = $('#avance-juego');
          if (juego) juego.hidden = true;
          const entrada = $('#entrada');
          if (entrada) entrada.open = true;
        }
      });
    }

    // Cargar si ya había datos guardados
    const previo = guardado.leer();
    if (previo && previo.texto) {
      estado.nombre = previo.nombre || '';
      estado.ritmo = previo.ritmo || null;
      if (textarea) textarea.value = previo.texto;
      procesarTexto(previo.texto, false);
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
