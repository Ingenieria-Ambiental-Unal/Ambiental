/* ==============================================================================
   PORTAL WEB OFICIAL · INGENIERÍA AMBIENTAL · FACULTAD DE MINAS · UNAL MEDELLÍN
   Módulo Mi Avance · Lector e intérprete de Historia Académica SIA
   Procesa y estructura el texto copiado del SIA (Ctrl+A, Ctrl+C).
   Ejecución 100% en el navegador (Client-Side). No envía datos a ningún servidor.
   Plan 3529 · 174 créditos totales exigidos · Todos los derechos reservados © 2026.
   ============================================================================== */

const CREDITOS_PLAN = 174;

const TIPOLOGIAS = [
  { clave: 'FUND. OBLIGATORIA', nombre: 'Fundamentación obligatoria', grupo: 'fundamentacion', exigidos: 57 },
  { clave: 'FUND. OPTATIVA', nombre: 'Fundamentación optativa', grupo: 'fundamentacion', exigidos: 7 },
  { clave: 'DISCIPLINAR OBLIGATORIA', nombre: 'Disciplinar obligatoria', grupo: 'disciplinar', exigidos: 48 },
  { clave: 'DISCIPLINAR OPTATIVA', nombre: 'Disciplinar optativa', grupo: 'disciplinar', exigidos: 21 },
  { clave: 'LIBRE ELECCIÓN', nombre: 'Libre elección', grupo: 'libre', exigidos: 35 },
  { clave: 'TRABAJO DE GRADO', nombre: 'Trabajo de grado', grupo: 'disciplinar', exigidos: 6 },
  { clave: 'NIVELACIÓN', nombre: 'Nivelación', grupo: 'fundamentacion', exigidos: 0 },
];

const quitarTildes = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const entero = (t) => parseInt(t, 10);

// "2026-1S" -> { anio: 2026, num: 1 }
function leerPeriodo(texto) {
  const m = /^(\d{4})-(\d)/.exec(texto);
  return m ? { anio: entero(m[1]), num: entero(m[2]) } : null;
}
const clavePeriodo = (p) => p.anio * 10 + p.num;
const etiquetaPeriodo = (p) => `${p.anio}-${p.num}S`;
function siguientePeriodo(p) { return p.num >= 2 ? { anio: p.anio + 1, num: 1 } : { anio: p.anio, num: 2 }; }
function avanzarPeriodo(p, n) { let r = p; for (let i = 0; i < n; i += 1) r = siguientePeriodo(r); return r; }

// Normaliza el nombre de la tipología del SIA
function normalizarTipologia(texto) {
  const t = quitarTildes(texto).toUpperCase().replace(/\s+/g, ' ').trim();
  if (t.startsWith('NIVELACION')) return 'NIVELACIÓN';
  if (t.startsWith('LIBRE')) return 'LIBRE ELECCIÓN';
  if (t.startsWith('TRABAJO')) return 'TRABAJO DE GRADO';
  if (t.startsWith('FUND') && t.includes('OPTAT')) return 'FUND. OPTATIVA';
  if (t.startsWith('FUND')) return 'FUND. OBLIGATORIA';
  if (t.startsWith('DISCIPLINAR') && t.includes('OPTAT')) return 'DISCIPLINAR OPTATIVA';
  if (t.startsWith('DISCIPLINAR')) return 'DISCIPLINAR OBLIGATORIA';
  return t;
}

// Regex para cada fila de materia
const FILA_MATERIA = /\((\d{6,7}(?:-[A-Z0-9]+)?)\)\s+(\d{1,2})\s+([A-ZÁÉÍÓÚÑ'][A-ZÁÉÍÓÚÑ'.\/ ]*?)\s+(\d{4}-\d[A-Z]?)\s+([A-Za-zÁÉÍÓÚáéíóúñÑüÜ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑüÜ]+){0,3}?)(?:\s+(\d(?:[.,]\d)?|\bAP\b))?\s+(APROBADA|REPROBADA|CANCELADA|CONVALIDADA|VALIDADA|INSCRITA|CURSANDO|EN\s+CURSO|[A-ZÁÉÍÓÚÑ]{4,})/gi;

function leerMaterias(texto) {
  const materias = [];
  const encabezado = /CALIFICACI[ÓO]N/i.exec(texto);
  let desde = encabezado ? encabezado.index + encabezado[0].length : 0;
  FILA_MATERIA.lastIndex = 0;
  let m;
  while ((m = FILA_MATERIA.exec(texto)) !== null) {
    const antes = texto.slice(desde, m.index);
    const nombre = antes.split(/[\t\n\r]/).map((s) => s.trim()).filter(Boolean).pop() || '';
    const periodo = leerPeriodo(m[4]);
    if (periodo) {
      let nota = null;
      if (m[6]) {
        if (/^AP$/i.test(m[6])) nota = 5.0;
        else nota = parseFloat(m[6].replace(',', '.'));
      }
      materias.push({
        nombre: nombre.replace(/\s+/g, ' '),
        codigo: m[1],
        creditos: entero(m[2]),
        tipologia: normalizarTipologia(m[3]),
        periodo,
        convocatoria: m[5].trim(),
        nota,
        estado: m[7].toUpperCase().replace(/\s+/g, ' '),
      });
    }
    desde = m.index + m[0].length;
  }
  return materias;
}

function leerResumen(texto) {
  const resumen = {};
  const bloque = texto.split(/Resumen de cr[ée]ditos/i)[1];
  if (!bloque) return resumen;
  const lineas = bloque.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const regexNum = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
  const regexNumTab = /^(\d+)\t+(\d+)\t+(\d+)\t+(\d+)\t+(\d+)$/;

  for (let i = 0; i < lineas.length; i += 1) {
    const l = lineas[i];
    const tNorm = normalizarTipologia(l.split('\t')[0]);
    const esTipo = TIPOLOGIAS.some((t) => t.clave === tNorm) || tNorm === 'TOTAL' || tNorm === 'TOTAL ESTUDIANTE';
    if (esTipo) {
      let nums = null;
      const partes = l.split('\t').map((s) => s.trim()).filter(Boolean);
      if (partes.length >= 6) {
        nums = partes.slice(1, 6).map(entero);
      } else if (i + 1 < lineas.length) {
        const sig = lineas[i + 1];
        const m = regexNum.exec(sig) || regexNumTab.exec(sig);
        if (m) nums = [entero(m[1]), entero(m[2]), entero(m[3]), entero(m[4]), entero(m[5])];
        else if (i + 5 < lineas.length) {
          const cinco = lineas.slice(i + 1, i + 6);
          if (cinco.every((c) => /^\d+$/.test(c))) nums = cinco.map(entero);
        }
      }
      if (nums && nums.length === 5) {
        resumen[tNorm] = {
          exigidos: nums[0],
          aprobados: nums[1],
          pendientes: nums[2],
          inscritos: nums[3],
          cursados: nums[4],
        };
      }
    }
  }
  return resumen;
}

function leerMetricas(texto) {
  const proms = [...texto.matchAll(/(\d(?:[.,]\d)?)\s*(?:\([^)]+\))?\s*(?:Pregrado\s*-\s*)?(Promedio acad[ée]mico|P\.?A\.?P\.?A)/gi)];
  let promedio = null;
  let papa = null;
  proms.forEach((m) => {
    const val = parseFloat(m[1].replace(',', '.'));
    if (/promedio/i.test(m[2])) promedio = val;
    else if (/p\.?a\.?p\.?a/i.test(m[2])) papa = val;
  });

  const pctMatch = /(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:Porcentaje de Avance|Avance)/i.exec(texto) ||
                   /(?:Porcentaje de Avance|Avance)\s*[\r\n\t]+(\d{1,3}(?:[.,]\d+)?)\s*%/i.exec(texto);
  const porcentaje = pctMatch ? parseFloat(pctMatch[1].replace(',', '.')) : null;

  return { promedio, papa, porcentaje };
}

function leerNombre(texto) {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Buscar usuario arriba de Historia Académica
  for (let i = 0; i < Math.min(lineas.length, 12); i += 1) {
    const l = lineas[i];
    if (/historia\s+acad[ée]mica/i.test(l)) {
      if (i > 0) {
        const candidatas = lineas.slice(0, i).filter((c) =>
          !/logo|universidad|portal|servicios|plan\s+de\s+estudios/i.test(c)
        );
        if (candidatas.length > 0) {
          const u = candidatas[candidatas.length - 1];
          if (/^[a-zA-Z0-9_.-]{3,25}$/.test(u)) return u;
        }
      }
      break;
    }
  }
  // Alternativa: buscar código o id de historia
  const histMatch = /Hist\.\s*Acad\.:\s*(\d+)/i.exec(texto);
  if (histMatch) return `Estudiante #${histMatch[1]}`;

  return 'Estudiante';
}

function leerHistoria(texto) {
  const esAmbiental = /(?:3529|INGENIER[IÍ]A\s+AMBIENTAL)/i.test(texto);
  const materias = leerMaterias(texto);
  const resumen = leerResumen(texto);
  const metricas = leerMetricas(texto);
  const nombre = leerNombre(texto);

  // Acreditación de inglés:
  // Se exigen 4 niveles (Inglés I a IV) o 0 créditos pendientes en Nivelación cuando el plan incluye inglés.
  const inglesAprobadas = materias.filter((m) =>
    /INGL[EÉ]S\s+(?:I\b|II\b|III\b|IV\b|[1-4]\b)/i.test(m.nombre) &&
    ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes((m.estado || '').toUpperCase())
  );
  const nivel4Aprobado = materias.some((m) =>
    /INGL[EÉ]S\s+(?:IV\b|4\b)/i.test(m.nombre) &&
    ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes((m.estado || '').toUpperCase())
  );
  const nivelacionPendientes = resumen['NIVELACIÓN']?.pendientes ?? resumen['NIVELACION']?.pendientes;
  const inglesAcreditado = (nivelacionPendientes === 0 && (resumen['NIVELACIÓN']?.aprobados > 0 || inglesAprobadas.length > 0)) ||
    nivel4Aprobado || inglesAprobadas.length >= 4;

  return {
    esAmbiental,
    nombre,
    materias,
    resumen,
    papa: metricas.papa,
    promedio: metricas.promedio,
    porcentajeSIA: metricas.porcentaje,
    inglesAcreditado,
  };
}

function calcularAvance(historia, ritmoManual = null) {
  const exigidos = historia.resumen?.TOTAL?.exigidos || CREDITOS_PLAN;
  const aprobadosPorCodigo = new Map();
  const cerradosSet = new Set();
  const periodosConNota = new Set();

  historia.materias.forEach((m) => {
    if (m.periodo) {
      if (m.nota !== null || ['APROBADA', 'REPROBADA', 'VALIDADA', 'CONVALIDADA'].includes(m.estado)) {
        periodosConNota.add(clavePeriodo(m.periodo));
      }
      cerradosSet.add(clavePeriodo(m.periodo));
    }
    if (['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(m.estado) && m.tipologia !== 'NIVELACIÓN') {
      const prev = aprobadosPorCodigo.get(m.codigo) || 0;
      aprobadosPorCodigo.set(m.codigo, Math.max(prev, m.creditos));
    }
  });

  const aprobadosMaterias = [...aprobadosPorCodigo.values()].reduce((a, b) => a + b, 0);
  const aprobados = historia.resumen?.TOTAL?.aprobados ?? aprobadosMaterias;
  const inscritos = historia.resumen?.TOTAL?.inscritos ?? 0;
  const pendientes = historia.resumen?.TOTAL?.pendientes ?? Math.max(0, exigidos - aprobados);
  const porcentaje = exigidos > 0 ? Math.min(100, Math.round(((aprobados / exigidos) * 100) * 10) / 10) : 0;
  const nivel = Math.max(1, Math.min(100, Math.floor(porcentaje)));

  // Periodos históricos cerrados (orden cronológico)
  const clavesOrdenadas = [...cerradosSet].sort((a, b) => a - b);
  const historialCerrado = clavesOrdenadas.map((c) => {
    const delPeriodo = historia.materias.filter((m) => m.periodo && clavePeriodo(m.periodo) === c);
    const periodo = delPeriodo[0]?.periodo || { anio: Math.floor(c / 10), num: c % 10 };
    const aprobadosPeriodo = delPeriodo
      .filter((m) => ['APROBADA', 'VALIDADA', 'CONVALIDADA'].includes(m.estado) && m.tipologia !== 'NIVELACIÓN')
      .reduce((acc, m) => acc + m.creditos, 0);
    const reprobadosPeriodo = delPeriodo
      .filter((m) => m.estado === 'REPROBADA')
      .reduce((acc, m) => acc + m.creditos, 0);
    return {
      periodo,
      aprobados: aprobadosPeriodo,
      reprobados: reprobadosPeriodo,
      materias: delPeriodo,
    };
  });

  // Cálculo de ritmo promedio reciente
  const recientes = historialCerrado.slice(-4);
  const sumaReciente = recientes.reduce((acc, h) => acc + h.aprobados, 0);
  const ritmoCalculado = recientes.length > 0 ? Math.max(8, Math.round(sumaReciente / recientes.length)) : 14;
  const ritmo = ritmoManual ? Math.max(6, Math.min(24, ritmoManual)) : ritmoCalculado;

  // Proyección futura
  let pCursor;
  if (historialCerrado.length > 0) {
    const ultimo = historialCerrado[historialCerrado.length - 1].periodo;
    pCursor = siguientePeriodo(ultimo);
  } else {
    pCursor = { anio: 2026, num: 2 };
  }

  const proyeccion = [];
  let pendientesPorCubrir = pendientes;

  if (inscritos > 0) {
    proyeccion.push({
      periodo: pCursor,
      creditos: inscritos,
      tipo: 'curso',
    });
    pendientesPorCubrir = Math.max(0, pendientesPorCubrir - inscritos);
    pCursor = siguientePeriodo(pCursor);
  }

  while (pendientesPorCubrir > 0) {
    const asignados = Math.min(pendientesPorCubrir, ritmo);
    proyeccion.push({
      periodo: pCursor,
      creditos: asignados,
      tipo: 'proyectado',
    });
    pendientesPorCubrir -= asignados;
    if (pendientesPorCubrir > 0) {
      pCursor = siguientePeriodo(pCursor);
    }
  }

  const graduacion = proyeccion.length > 0 ? proyeccion[proyeccion.length - 1].periodo : (historialCerrado.length > 0 ? historialCerrado[historialCerrado.length - 1].periodo : null);
  const semestresCursados = historialCerrado.length;
  const semestresFaltantes = proyeccion.length;
  const esPrimiparo = semestresCursados === 0 && aprobados === 0;

  return {
    aprobados,
    inscritos,
    pendientes,
    exigidos,
    porcentaje,
    nivel,
    ritmo,
    ritmoCalculado,
    historial: historialCerrado,
    proyeccion,
    graduacion,
    semestresFaltantes,
    semestresCursados,
    completo: pendientes === 0 && exigidos > 0,
    materiasAprobadas: aprobadosPorCodigo.size,
    esPrimiparo,
  };
}

if (typeof window !== 'undefined') {
  window.leerHistoria = leerHistoria;
  window.calcularAvance = calcularAvance;
  window.etiquetaPeriodo = etiquetaPeriodo;
  window.clavePeriodo = clavePeriodo;
  window.TIPOLOGIAS = TIPOLOGIAS;
  window.CREDITOS_PLAN = CREDITOS_PLAN;
}
if (typeof module !== 'undefined') {
  module.exports = { leerHistoria, calcularAvance, etiquetaPeriodo, clavePeriodo, TIPOLOGIAS, CREDITOS_PLAN };
}
