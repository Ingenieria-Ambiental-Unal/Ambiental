/* ==============================================================================
   PORTAL WEB OFICIAL · INGENIERÍA AMBIENTAL · UNAL SEDE MEDELLÍN
   Arquitectura de software, maquetación y desarrollo integral por:
   Santiago Escobar Arias · Representante Estudiantil de Sistemas e Informática
   Adaptado e impulsado con la Representación Estudiantil de Ingeniería Ambiental:
   Emmanuel Florez Rodriguez · Representante Estudiantil de Ingeniería Ambiental
   Facultad de Minas — Universidad Nacional de Colombia, Sede Medellín
   Contacto Repre: emflorezr@unal.edu.co | WhatsApp: (+57) 324 563 9125
   Todos los derechos reservados © 2026.
   ============================================================================== */

/* ---------- sofIA: Asistente Virtual Inteligente de Ingeniería Ambiental UNAL ----------
   Avatar: Versión holográfica inspirada en Cortana de HALO (IA institucional UNAL).
   Consultas integradas:
   - Calendario académico completo (todas las actividades y fechas oficiales de Minas)
   - Malla curricular y prerrequisitos de las asignaturas de Ingeniería Ambiental
   - Grupos de WhatsApp de estudio por materia
   - Carpeta de Google Drive con material de estudio y parciales
   - Convenios y auxilios de Bienestar Universitario
   - Rutas de transporte intercampus
   - Semilleros y comunidades estudiantiles (AMET, POLYGESTA, MINKA, Oceánicos)
   - Normativas: P.A.P.A., Citas SIA (4 Grupos DNINFOA), Bolsa de créditos
   - Redirecciones a SGS Minas, SIA y contacto directo con la Representación.
   Tono: Amiga de la juventud, empática, clara, sin rodeos y sin exceso de emojis. */

(function moduloSofia() {
  'use strict';

  if (typeof document === 'undefined') return;
  const esPaginaDescanso = document.body?.dataset?.pagina === 'descanso' || (window.location?.pathname || '').endsWith('descanso.html');
  if (esPaginaDescanso) return;

  /* ==========================================================================
     1. CONSTANTES Y ENLACES OFICIALES
     ========================================================================== */

  const ENLACES_OFICIALES = {
    driveAmbiental: 'https://drive.google.com/drive/folders/1YukBqotbcPo7iUBFZiXW-5hwcQx68Tz4',
    sia: 'https://sia.unal.edu.co/',
    sgsMinas: 'https://minas.medellin.unal.edu.co/estudiantes/gestion-de-asuntos-estudiantiles/gae-solicitudes-estudiantiles',
    bienestarMinas: 'https://bienestaruniversitario.medellin.unal.edu.co/secciones/gestion-y-fomento',
    wppRepre: 'https://wa.me/573245639125',
    telefonoRepre: '(+57) 324 563 9125',
    correoRepre: 'emflorezr@unal.edu.co',
    nombreRepre: 'Emmanuel Florez Rodriguez',
    canalWppAmbiental: 'https://chat.whatsapp.com/FtnBLL7oNl8F8ZXSAc7JKa?mode=gi_t',
    igAmbiental: 'https://www.instagram.com/ambiental_unalmed?dlrf=bTdhbWR0cWthNHlv&utm_source=qr',
  };

  /* ==========================================================================
     2. ESTADO Y CACHÉ LOCAL
     ========================================================================== */

  const estadoSofia = {
    cargado: false,
    cargando: false,
    abierto: false,
    mensajes: [],
    datos: {
      asignaturas: [],
      plan: [],
      componentes: null,
      info: null,
      convenios: [],
      grupos: [],
      intercampus: null,
      programa: null,
      perfil: null,
    },
    indices: {
      materiasPorCodigo: new Map(),
      materiasPorNombre: new Map(),
      aliasMaterias: new Map(),
      fechasCalendario: [],
      conveniosPorId: new Map(),
      gruposPorNombre: new Map(),
    },
  };

  /* ==========================================================================
     3. UTILIDADES DE TEXTO Y NORMALIZACIÓN ROBUSTA
     ========================================================================== */

  function normalizar(texto) {
    if (!texto) return '';
    return texto
      .toString()
      .toLowerCase()
      .replace(/p\.a\.p\.a\.?/gi, 'papa')
      .replace(/p\.a\.p\.p\.i\.?/gi, 'pappi')
      .replace(/i\.p\.a\.?/gi, 'ipa')
      .replace(/p\s+a\s+p\s+a\b/gi, 'papa')
      .replace(/p\s+a\s+p\s+p\s+i\b/gi, 'pappi')
      .replace(/i\s+p\s+a\b/gi, 'ipa')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const PALABRAS_VACIAS = new Set([
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u',
    'en', 'a', 'para', 'por', 'con', 'sin', 'sobre', 'que', 'como', 'cual', 'cuales',
    'donde', 'cuando', 'quien', 'quienes', 'es', 'son', 'me', 'mi', 'te', 'se', 'su',
    'sus', 'al', 'del', 'dime', 'saber', 'quiero', 'favor', 'cuentame', 'explica'
  ]);

  function extraerTerminos(texto) {
    return normalizar(texto)
      .split(' ')
      .filter((palabra) => palabra.length > 1 && !PALABRAS_VACIAS.has(palabra));
  }

  function distanciaLevenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matriz = [];
    for (let i = 0; i <= b.length; i++) matriz[i] = [i];
    for (let j = 0; j <= a.length; j++) matriz[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matriz[i][j] = matriz[i - 1][j - 1];
        } else {
          matriz[i][j] = Math.min(
            matriz[i - 1][j - 1] + 1,
            matriz[i][j - 1] + 1,
            matriz[i - 1][j] + 1
          );
        }
      }
    }
    return matriz[b.length][a.length];
  }

  function similitudCadenas(a, b) {
    const na = normalizar(a);
    const nb = normalizar(b);
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.85;

    const maxLen = Math.max(na.length, nb.length);
    if (maxLen === 0) return 1;
    const dist = distanciaLevenshtein(na, nb);
    return Math.max(0, 1 - dist / maxLen);
  }

  /* ==========================================================================
     4. CARGA E INDEXACIÓN
     ========================================================================== */

  async function cargarJsonLocal(ruta) {
    if (typeof window.cargarDatos === 'function') {
      try {
        return await window.cargarDatos(ruta);
      } catch (_) {}
    }
    const respuesta = await fetch(`data/${ruta}.json`);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return await respuesta.json();
  }

  async function inicializarBaseConocimiento() {
    if (estadoSofia.cargado || estadoSofia.cargando) return;
    estadoSofia.cargando = true;

    try {
      const [asignaturas, plan, componentes, info, conveniosIndice, grupos, intercampus, perfil, programa] =
        await Promise.allSettled([
          cargarJsonLocal('malla/asignaturas'),
          cargarJsonLocal('malla/plan'),
          cargarJsonLocal('malla/componentes'),
          cargarJsonLocal('info'),
          cargarJsonLocal('convenios/indice'),
          cargarJsonLocal('grupos'),
          cargarJsonLocal('intercampus'),
          cargarJsonLocal('perfil'),
          cargarJsonLocal('programa'),
        ]);

      if (asignaturas.status === 'fulfilled') estadoSofia.datos.asignaturas = asignaturas.value || [];
      if (plan.status === 'fulfilled') estadoSofia.datos.plan = plan.value || [];
      if (componentes.status === 'fulfilled') estadoSofia.datos.componentes = componentes.value || null;
      if (info.status === 'fulfilled') estadoSofia.datos.info = info.value || null;
      if (conveniosIndice.status === 'fulfilled') estadoSofia.datos.convenios = conveniosIndice.value?.convenios || [];
      if (grupos.status === 'fulfilled') estadoSofia.datos.grupos = grupos.value || [];
      if (intercampus.status === 'fulfilled') estadoSofia.datos.intercampus = intercampus.value || null;
      if (perfil.status === 'fulfilled') estadoSofia.datos.perfil = perfil.value || null;
      if (programa.status === 'fulfilled') estadoSofia.datos.programa = programa.value || null;

      indexarConocimiento();
      estadoSofia.cargado = true;
    } catch (error) {
      console.warn('sofIA: no se pudo cargar la base local', error);
    } finally {
      estadoSofia.cargando = false;
    }
  }

  function indexarConocimiento() {
    const { indices, datos } = estadoSofia;

    datos.asignaturas.forEach((asig) => {
      indices.materiasPorCodigo.set(asig.codigo, asig);
      const normNombre = normalizar(asig.nombre);
      indices.materiasPorNombre.set(normNombre, asig);
    });

    const ALIAS_MATERIAS = [
      [['calculo 1', 'calculo diferencial', 'diferencial'], 'Cálculo Diferencial'],
      [['geometria vectorial', 'vectorial'], 'Geometría Vectorial y Analítica'],
      [['algebra lineal', 'lineal'], 'Álgebra Lineal'],
      [['calculo 2', 'calculo integral', 'integral'], 'Cálculo Integral'],
      [['calculo 3', 'varias variables', 'calculo en varias variables'], 'Cálculo en Varias Variables'],
      [['ecuaciones', 'ecuaciones diferenciales', 'ed'], 'Ecuaciones Diferenciales'],
      [['metodos numericos', 'numericos'], 'Métodos Numéricos'],
      [['estadistica 1', 'estadistica'], 'Estadística I'],
      [['quimica general', 'quimica 1', 'quimica'], 'Química General'],
      [['biologia general', 'biologia'], 'Biología General'],
      [['fisica 1', 'mecanica', 'fisica mecanica'], 'Física Mecánica'],
      [['geologia fisica', 'geologia'], 'Geología Física'],
      [['ecologia', 'ecologia general'], 'Ecología General'],
      [['microbiologia', 'microbiologia general'], 'Microbiología General'],
      [['quimica organica', 'organica'], 'Química Orgánica'],
      [['biologia evolutiva', 'evolutiva'], 'Biología Evolutiva'],
      [['fisica 2', 'electricidad', 'electricidad y magnetismo'], 'Física de Electricidad y Magnetismo'],
      [['fisica 3', 'oscilaciones', 'ondas y optica', 'ondas'], 'Física de Oscilaciones Ondas y Óptica'],
      [['programacion', 'fundamentos de programacion', 'python'], 'Fundamentos de Programación'],
      [['economia de recursos naturales', 'economia ambiental', 'economia de recursos naturales y del medio ambiente'], 'Economía de Recursos Naturales y del Medio Ambiente'],
      [['cultura y medio ambiente', 'cultura ambiental'], 'Cultura y Medio Ambiente'],
      [['introduccion a la ingenieria ambiental', 'intro ambiental', 'introduccion ambiental'], 'Introducción a la Ingeniería Ambiental'],
      [['mecanica de fluidos', 'fluidos'], 'Mecánica de Fluidos'],
      [['termodinamica', 'termodinamica general', 'termo'], 'Termodinámica General'],
      [['fenomenos de transporte', 'transporte'], 'Fenómenos de Transporte'],
      [['fenomenos criticos'], 'Fenómenos Críticos'],
      [['planificacion integral y ordenamiento del territorio', 'ordenamiento territorial', 'planificacion territorial', 'pot'], 'Planificación Integral y Ordenamiento del Territorio'],
      [['gestion y evaluacion ambiental', 'eia', 'evaluacion de impacto ambiental', 'licencias ambientales', 'evaluacion ambiental'], 'Gestión y Evaluación Ambiental'],
      [['contaminacion ambiental', 'contaminacion'], 'Contaminación Ambiental'],
      [['derecho ambiental', 'legislacion ambiental'], 'Derecho Ambiental'],
      [['valoracion economica del impacto ambiental', 'valoracion economica'], 'Valoración Económica del Impacto Ambiental'],
      [['introduccion a la modelacion ambiental', 'modelacion ambiental', 'modelacion', 'simulacion ambiental'], 'Introducción a la Modelación Ambiental'],
      [['analisis de datos ambientales', 'datos ambientales'], 'Análisis de Datos Ambientales'],
      [['diseno ambiental'], 'Diseño Ambiental'],
      [['fundamentos de sistemas de informacion geografica', 'sig', 'sistemas de informacion geografica', 'gis', 'arcgis', 'qgis'], 'Fundamentos de Sistemas de Información Geográfica'],
      [['hidrologia', 'hidro'], 'Hidrología'],
      [['hidraulica'], 'Hidráulica'],
      [['biogeoquimica'], 'Biogeoquímica'],
      [['suelos y medio ambiente', 'suelos'], 'Suelos y Medio Ambiente'],
      [['geomorfologia'], 'Geomorfología'],
      [['geografia fisica y humana', 'geografia'], 'Geografía Física y Humana'],
      [['ambiente urbano'], 'Ambiente Urbano'],
      [['fundamentos de proyectos en ingenieria', 'proyectos 1', 'fundamentos de proyectos'], 'Fundamentos de Proyectos en Ingeniería'],
      [['estructuracion y evaluacion de proyectos de ingenieria', 'proyectos 2', 'evaluacion de proyectos'], 'Estructuración y Evaluación de Proyectos de Ingeniería'],
      [['proyecto integrado de ingenieria', 'proyecto integrado'], 'Proyecto Integrado de Ingeniería'],
      [['hidraulica fluvial', 'fluvial'], 'Hidráulica Fluvial'],
      [['limnologia'], 'Limnología'],
      [['ingenieria de los recursos hidraulicos', 'recursos hidraulicos'], 'Ingeniería de los Recursos Hidráulicos'],
      [['quimica ambiental de suelos', 'quimica de suelos'], 'Química Ambiental de Suelos'],
      [['manejo y conservacion de suelos', 'conservacion de suelos'], 'Manejo y Conservación de Suelos'],
      [['microbiologia de rehabilitacion de suelos', 'rehabilitacion de suelos'], 'Microbiología de Rehabilitación de Suelos'],
      [['fisica atmosferica', 'atmosfera'], 'Física Atmosférica'],
      [['gestion de la calidad del aire', 'calidad del aire', 'aire'], 'Gestión de la Calidad del Aire'],
      [['climatologia', 'clima'], 'Climatología'],
      [['quimica atmosferica'], 'Química Atmosférica'],
      [['oceanografia', 'oceanos'], 'Oceanografía'],
      [['ingenieria de puertos y costas', 'puertos y costas'], 'Ingeniería de Puertos y Costas'],
      [['geologia marina'], 'Geología Marina'],
      [['campo marino de suelos', 'campo marino'], 'Campo Marino de Suelos'],
      [['acueductos y alcantarillados', 'acueductos', 'alcantarillados'], 'Acueductos y Alcantarillados'],
      [['tratamiento de aguas', 'tratamiento de agua', 'plantas de tratamiento', 'ptar', 'ptap'], 'Tratamiento de Aguas'],
      [['biorremediacion'], 'Biorremediación'],
      [['residuos solidos', 'residuos', 'basuras'], 'Residuos Sólidos'],
      [['conflictos ambientales', 'conflicto ambiental'], 'Conflictos Ambientales'],
      [['evaluacion economica y social de proyectos'], 'Evaluación Económica y Social de Proyectos'],
      [['sistemas de gestion ambiental empresarial', 'gestion ambiental empresarial', 'iso 14001', 'sga'], 'Sistemas de Gestión Ambiental Empresarial'],
      [['estrategias de gestion y gerencia de proyectos en ingenieria'], 'Estrategias de Gestión y Gerencia de Proyectos en Ingeniería'],
      [['gestion de proyectos de desarrollo y metodologia general ajustada', 'mga'], 'Gestión De Proyectos De Desarrollo y Metodología General Ajustada'],
      [['proyectos de innovacion y desarrollo'], 'Proyectos de Innovación y Desarrollo'],
      [['toma de decision para el diseno en ingenieria'], 'Toma de Decisión para el Diseño en Ingeniería'],
      [['fundamentos de ciclo de vida para ingenieria', 'ciclo de vida', 'acv', 'analisis de ciclo de vida'], 'Fundamentos de Ciclo de Vida Para Ingeniería'],
      [['trabajo de grado', 'tesis', 'grado', 'pasantia', 'practica de extension', 'practica'], 'Trabajo de Grado'],
    ];

    ALIAS_MATERIAS.forEach(([aliases, nombreReal]) => {
      const match = datos.asignaturas.find((a) => normalizar(a.nombre) === normalizar(nombreReal));
      if (match) {
        aliases.forEach((alias) => indices.aliasMaterias.set(normalizar(alias), match));
      }
    });

    // Indexar todas las filas del calendario académico oficial
    if (datos.info?.guias) {
      const guiaCal = datos.info.guias.find((g) => g.id === 'calendario-academico');
      if (guiaCal?.calendario?.grupos) {
        guiaCal.calendario.grupos.forEach((grupo) => {
          if (Array.isArray(grupo.filas)) {
            grupo.filas.forEach((fila) => {
              indices.fechasCalendario.push({
                actividad: fila.actividad,
                actividadNorm: normalizar(fila.actividad),
                aplica: fila.aplica,
                inicio: fila.inicio,
                fin: fila.fin,
                nota: fila.nota || '',
              });
            });
          }
        });
      }
    }

    datos.convenios.forEach((c) => indices.conveniosPorId.set(normalizar(c.id || c.nombre), c));
    datos.grupos.forEach((g) => indices.gruposPorNombre.set(normalizar(g.nombre), g));
  }

  /* ==========================================================================
     5. MOTOR DE INTENCIONES
     ========================================================================== */

  function buscarAsignaturaPorTexto(preguntaNorm) {
    const { indices, datos } = estadoSofia;

    for (const [alias, asig] of indices.aliasMaterias.entries()) {
      if (new RegExp(`\\b${alias}\\b`).test(preguntaNorm)) {
        return asig;
      }
    }

    for (const [codigo, asig] of indices.materiasPorCodigo.entries()) {
      const codLimpio = normalizar(codigo);
      if (preguntaNorm.includes(codLimpio) || codLimpio.includes(preguntaNorm)) {
        return asig;
      }
    }

    for (const asig of datos.asignaturas) {
      const nombreNorm = normalizar(asig.nombre);
      if (preguntaNorm.includes(nombreNorm)) {
        return asig;
      }
    }

    let mejorMateria = null;
    let mejorScore = 0;
    const terminosPregunta = extraerTerminos(preguntaNorm);

    datos.asignaturas.forEach((asig) => {
      const terminosMateria = extraerTerminos(asig.nombre);
      let matches = 0;
      terminosMateria.forEach((tm) => {
        if (terminosPregunta.some((tp) => tp === tm || similitudCadenas(tp, tm) > 0.82)) {
          matches++;
        }
      });
      const score = matches / Math.max(terminosMateria.length, 1);
      if (score > 0.55 && score > mejorScore) {
        mejorScore = score;
        mejorMateria = asig;
      }
    });

    return mejorMateria;
  }

  function responderPregunta(preguntaUsuario) {
    const preguntaNorm = normalizar(preguntaUsuario);
    const { indices, datos } = estadoSofia;

    // ------------------------------------------------------------------------
    // 1. Saludos y Presentación
    // ------------------------------------------------------------------------
    if (/^(hola|buenos dias|buenas tardes|buenas noches|hey|que tal|buenas|holi|hola sofia)\b/.test(preguntaNorm) && preguntaNorm.split(' ').length <= 4) {
      return {
        texto: `¡Hola! Qué gusto saludarte. Soy sofIA, tu compañera virtual de **Ingeniería Ambiental**.
        
Pregúntame con confianza lo que necesites sobre materias, prerrequisitos, grupos de WhatsApp de estudio, fechas clave del calendario, la Carpeta de Recursos en Drive, convenios o trámites de la Facultad. ¿En qué te doy una mano hoy?`,
        chips: ['Prerrequisitos de materias', 'Drive de recursos de estudio', 'Fechas de cancelación', 'WhatsApp de una materia'],
      };
    }

    if (/quien eres|quien te creo|que eres|como te llamas|presentate/.test(preguntaNorm)) {
      return {
        texto: `Soy sofIA, tu asistente virtual estudiantil de **Ingeniería Ambiental** de la UNAL Medellín.

Mi avatar es una versión holográfica inspirada en la inteligencia de Cortana, diseñada para darte respuestas precisas al instante. Articulada con el apoyo de la Representación Estudiantil para ayudarte a consultar mallas, fechas, WhatsApps de estudio, convenios, rutas de transporte y normativas académicas sin rodeos.`,
        chips: ['Ver Malla Curricular', 'Drive de recursos de estudio', 'Calendario académico'],
      };
    }

    if (/gracias|muchas gracias|genial|excelente|bacano|super|te quiero|vale gracias/.test(preguntaNorm) && preguntaNorm.split(' ').length <= 4) {
      return {
        texto: `¡De nada! Recuerda que aquí estoy para cualquier duda que tengas en el semestre. ¡Mucho ánimo con las materias!`,
        chips: ['Prerrequisitos de materias', 'Calendario académico', 'Drive de recursos de estudio'],
      };
    }

    // ------------------------------------------------------------------------
    // 2. Malla Curricular en general / "Malla curricular" / "Otras asignaturas"
    // ------------------------------------------------------------------------
    if (preguntaNorm === 'malla curricular' || preguntaNorm === 'ver malla curricular' || preguntaNorm === 'ver en la malla interactiva' || preguntaNorm === 'otras asignaturas') {
      return {
        texto: `En nuestra [Malla Curricular](malla.html) interactiva puedes explorar los 10 semestres del plan de estudios de Ingeniería Ambiental:

- **Semáforo de prerrequisitos:** Al hacer clic en cualquier asignatura se iluminan en amarillo sus requisitos previos y en verde las materias que te abre a futuro.
- **Grupos de WhatsApp:** Cada materia tiene un botón para unirte a su grupo de estudio de WhatsApp.
- **Carpeta de Recursos de Drive:** En la parte superior de la malla está el acceso directo al banco de parciales, talleres y guías.

¿Deseas consultar los prerrequisitos de alguna materia en específico? Solo dime su nombre (ej: *"Prerrequisitos de Hidráulica"* o *"Prerrequisitos de Tratamiento de Aguas"*).`,
        chips: ['Prerrequisitos de Hidráulica', 'Prerrequisitos de Tratamiento de Aguas', 'Materias de primer semestre', 'Drive de recursos de estudio'],
      };
    }

    // ------------------------------------------------------------------------
    // 3. Grupos de WhatsApp de estudio por materia
    // ------------------------------------------------------------------------
    const esConsultaWpp = /whatsapp|wpp|chat|chats|grupo de estudio|comunidad de estudio/.test(preguntaNorm);
    const esConsultaSemillero = /semillero|semilleros|grupo estudiantil|grupos estudiantiles|amet|polygesta|minka|oceanicos/.test(preguntaNorm);

    if (esConsultaWpp && !esConsultaSemillero) {
      const materiaWpp = buscarAsignaturaPorTexto(preguntaNorm);

      if (materiaWpp) {
        if (materiaWpp.whatsapp) {
          return {
            texto: `Aquí tienes el grupo de estudio de WhatsApp para **${materiaWpp.nombre}** (\`${materiaWpp.codigo}\`):

👉 [Entrar al grupo de WhatsApp de ${materiaWpp.nombre}](${materiaWpp.whatsapp})

Recuerda que también puedes ver todas las materias con grupo de estudio directamente en la [Malla Curricular](malla.html).`,
            chips: [`Prerrequisitos de ${materiaWpp.nombre}`, 'Ver Malla Curricular', 'Drive de recursos de estudio'],
          };
        } else {
          return {
            texto: `Actualmente **${materiaWpp.nombre}** (\`${materiaWpp.codigo}\`) no tiene un enlace de WhatsApp registrado en la web.

Si tú o tus compañeros tienen el grupo de este semestre, escríbele a Emmanuel para que lo añadamos al portal:
- WhatsApp del repre: [${ENLACES_OFICIALES.telefonoRepre}](${ENLACES_OFICIALES.wppRepre})`,
            chips: [`Prerrequisitos de ${materiaWpp.nombre}`, 'Ver Malla Curricular', 'Drive de recursos de estudio'],
          };
        }
      }

      return {
        texto: `Los grupos de WhatsApp de estudio están organizados por materia dentro de nuestra [Malla Curricular](malla.html). 

Al hacer clic sobre cualquier asignatura que tenga el ícono de WhatsApp podrás unirte directamente a su comunidad. Si buscas una materia en específico, solo dime por ejemplo: *"pásame el wpp de Hidrología"* o *"grupo de Mecánica de Fluidos"*.`,
        chips: ['WhatsApp de Hidrología', 'WhatsApp de Mecánica de Fluidos', 'WhatsApp de Tratamiento de Aguas', 'Ver Malla Curricular'],
      };
    }

    // ------------------------------------------------------------------------
    // 4. Drive / Banco de Recursos / Parciales anteriores
    // ------------------------------------------------------------------------
    const esReporteONotas = /reporte|calificaciones|notas parciales|30\s*%|60\s*%|100\s*%/.test(preguntaNorm);
    if (!esReporteONotas && (/drive|material de estudio|materiales|parciales viejos|parciales anteriores|talleres|apuntes|guias|banco de recursos|carpeta de recursos/.test(preguntaNorm) || preguntaNorm === 'parciales')) {
      return {
        texto: `Todo el banco de material de estudio de la carrera está centralizado en la **Carpeta de Recursos de Google Drive de Ingeniería Ambiental**:

📁 **[Abrir la Carpeta de Recursos de Ingeniería Ambiental en Google Drive](${ENLACES_OFICIALES.driveAmbiental})**

Allí encuentras carpetas organizadas por materia con:
- Parciales y quices de semestres anteriores
- Talleres resueltos y guías de laboratorio
- Libros guía, diapositivas y apuntes comunitarios

_Recuerda ingresar siempre con tu correo institucional de la UNAL (\`@unal.edu.co\`)._`,
        chips: ['Ver Malla Curricular', 'WhatsApp de una materia', 'Fechas del calendario'],
      };
    }

    // ------------------------------------------------------------------------
    // 5. Cancelación de materias o cancelación de semestre (empático con repre)
    // ------------------------------------------------------------------------
    const esCancelacionSemestre = /cancelar semestre|cancelacion de semestre|cancelar el periodo|cancelacion de periodo|retirar semestre/.test(preguntaNorm);
    const esCancelacionMaterias = /cancelar materia|cancelar materias|cancelacion de asignatura|cancelacion de asignaturas|hasta cuando puedo cancelar|fechas? de cancelaci(on|ones)|cancelar una materia|como cancelo/.test(preguntaNorm) || (preguntaNorm.includes('cancelar') && !esCancelacionSemestre);

    if (esCancelacionSemestre || esCancelacionMaterias) {
      const fechas = indices.fechasCalendario;
      const cancelSin = fechas.find((f) => /sin descuento/.test(f.actividadNorm));
      const cancelCon = fechas.find((f) => /con descuento/.test(f.actividadNorm));
      const finClases = fechas.find((f) => /finalizacion de clases/.test(f.actividadNorm));

      let fechasTxt = '';
      if (esCancelacionSemestre) {
        fechasTxt = `**Cancelación de Periodo Académico (Semestre completo):**
- Se solicita ante el Consejo de Facultad mediante el [Portal de Solicitudes Estudiantiles SGS](${ENLACES_OFICIALES.sgsMinas}).
- La fecha límite oficial del calendario (2026-2S) es el **${finClases?.fin || '17 de diciembre de 2026'}** (último día de clases).
- No requiere haber aprobado un porcentaje mínimo y te permite solicitar reingreso o reserva según tu situación.`;
      } else {
        fechasTxt = `**Plazos para Cancelar Asignaturas (2026-2S):**
- **Semana 3 (sin pérdida de créditos):** Del ${cancelSin?.inicio || '27 de agosto'} al **${cancelSin?.fin || '10 de septiembre'}**. Los créditos vuelven completos a tu bolsa.
- **Semana 8 (con pérdida de créditos):** Del ${cancelCon?.inicio || '15 de septiembre'} al **${cancelCon?.fin || '22 de octubre'}**. No afecta tu P.A.P.A., pero los créditos de la materia se descuentan de tu bolsa disponible.
- **Cancelación extemporánea (después de semana 8):** Solo procede por fuerza mayor, caso fortuito o motivos de salud justificados a través del [Portal SGS de Minas](${ENLACES_OFICIALES.sgsMinas}).`;
      }

      return {
        texto: `${fechasTxt}

---

💚 **Un mensaje importante de compañera a compañero:**
Si estás pensando en cancelar porque estás pasando por un momento personal difícil, problemas de salud o la carga te está superando, **no estás solo ni tienes que resolverlo en silencio**. 

Emmanuel (nuestro Representante Estudiantil de Ingeniería Ambiental) te puede orientar de forma confidencial para ver si conviene radicar una solicitud extraordinaria, aplazar o buscar un apoyo académico. Escríbele directo a su WhatsApp:
👉 [Escribirle a Emmanuel: ${ENLACES_OFICIALES.telefonoRepre}](${ENLACES_OFICIALES.wppRepre})`,
        chips: ['Bolsa de créditos', 'Portal SGS Minas', 'Calendario académico'],
      };
    }

    // ------------------------------------------------------------------------
    // 5.1 Contacto del Representante Estudiantil (Emmanuel Florez Rodriguez)
    // ------------------------------------------------------------------------
    if (/contacto del representante|contacto del repre|representante estudiantil|hablar con el repre|hablar con emmanuel|contacto emmanuel|quien es el representante|\brepre\b/.test(preguntaNorm)) {
      return {
        texto: `¡Hola! Emmanuel Florez Rodriguez es nuestro **Representante Estudiantil de Ingeniería Ambiental** ante el Comité Asesor y el Consejo de Facultad.

Puedes escribirle con total confianza para:
- Orientación personalizada en trámites ante el Consejo de Facultad o la Vicedecanatura.
- Solicitudes extemporáneas, cancelación por enfermedad o situaciones imprevistas.
- Apoyo y mediación académica o situaciones personales que te estén afectando.
- Proponer ideas, eventos o mejoras para nuestra carrera.

📱 **WhatsApp directo:** [${ENLACES_OFICIALES.telefonoRepre}](${ENLACES_OFICIALES.wppRepre})
📧 **Correo institucional:** \`${ENLACES_OFICIALES.correoRepre}\`
📸 **Instagram de la carrera:** [@ambiental_unalmed](${ENLACES_OFICIALES.igAmbiental})
💬 **Canal oficial de WhatsApp:** [Unirse al canal](${ENLACES_OFICIALES.canalWppAmbiental})

_Recuerda que no estás solo en tu camino por la universidad._`,
        chips: ['Portal SGS Minas', 'Calendario académico', 'Ver Malla Curricular'],
      };
    }

    // ------------------------------------------------------------------------
    // 6. Consultas del Calendario Académico (fechas específicas o generales)
    // ------------------------------------------------------------------------
    const esFinDeClases = /finalizan las clases|finalizacion de clases|terminan las clases|fin de clases|acaban las clases|termina el semestre|acaba el semestre|fin del semestre|ultimo dia de clases|hasta cuando hay clases|cuando terminan|cuando finalizan|fecha de finalizacion/.test(preguntaNorm);
    const esInicioDeClases = /inicio de clases|inician las clases|empiezan las clases|arranque de clases|comienzo de clases|primer dia de clases|cuando empiezan|cuando inician/.test(preguntaNorm);
    const esReporteNotas = /reporte.*notas|notas parciales|cierre de notas|calificaciones|30\s*%|60\s*%|100\s*%/.test(preguntaNorm);
    const esSemanaUniversitaria = /semana universitaria/.test(preguntaNorm);
    const esConsolidacion = /consolidaci(on|ones).*matr(i|i)cula/.test(preguntaNorm);
    const esGeneralCalendario = /calendario|calendario academico|fechas del calendario|fechas clave|\bfechas\b/.test(preguntaNorm);

    const resolverFilaCalendario = () => {
      for (const f of indices.fechasCalendario) {
        if (f.actividadNorm && (preguntaNorm.includes(f.actividadNorm) || (preguntaNorm.length >= 6 && f.actividadNorm.includes(preguntaNorm)))) {
          return f;
        }
      }
      const tramitesMap = [
        { regex: /cambio de tutor/, norm: 'cambio de tutor' },
        { regex: /cancelaci(on|onar).*50|posterior al 50/, norm: 'cancelacion de asignatura(s) posterior al 50 % de avance del periodo' },
        { regex: /cancelaci(on|onar).*periodo|cancelar semestre/, norm: 'cancelacion de periodo academico' },
        { regex: /carga (inferior|minima)|carga academica minima/, norm: 'carga inferior a la minima' },
        { regex: /devoluci(on|onar).*dinero/, norm: 'devolucion de dinero' },
        { regex: /doble titulaci(on|onar) internacional/, norm: 'doble titulacion internacional' },
        { regex: /doble titulaci(on|onar)/, norm: 'doble titulacion' },
        { regex: /no oportuna.*tdg|extemporanea.*tdg/, norm: 'autorizacion de inscripcion/adicion no oportuna de tdg o actividades academicas' },
        { regex: /no oportuna|extemporanea/, norm: 'autorizacion de inscripcion/adicion no oportuna de asignatura(s)' },
        { regex: /modificaci(on|onar).*tdg|modificaci(on|onar).*trabajo de grado/, norm: 'modificacion de trabajo de grado (tdg)' },
        { regex: /movilidad.*(sede|interna)|intercampus entre sedes/, norm: 'movilidad interna entre sedes' },
        { regex: /practica academica|\bpae\b/, norm: 'practica academica especial (pae)' },
        { regex: /reconocimiento.*asignatura|homologaci(on|onar)/, norm: 'reconocimiento de asignatura(s)' },
        { regex: /reposici(on|onar)|apelaci(on|onar)/, norm: 'recurso de reposicion y/o apelacion' },
        { regex: /\breingreso\b/, norm: 'reingreso' },
        { regex: /reserva.*cupo/, norm: 'reserva de cupo adicional' },
        { regex: /retiro.*universidad|retiro definitivo/, norm: 'retiro de la universidad' },
        { regex: /trabajo de grado.*modalidad|inscripcion.*tdg/, norm: 'trabajo de grado (tdg), en cualquiera de sus modalidades' },
        { regex: /\btraslado\b/, norm: 'traslado' },
      ];
      for (const t of tramitesMap) {
        if (t.regex.test(preguntaNorm)) {
          const match = indices.fechasCalendario.find((f) => f.actividadNorm.includes(t.norm));
          if (match) return match;
        }
      }
      return null;
    };

    const filaCal = resolverFilaCalendario();

    if (esFinDeClases) {
      const filaFin = indices.fechasCalendario.find((f) => /finalizacion de clases/.test(f.actividadNorm));
      return {
        texto: `Las clases del periodo académico 2026-2S finalizan oficialmente el **${filaFin?.fin || '17 de diciembre de 2026'}**.

Posterior a esta fecha:
- El reporte del 100 % de calificaciones tiene como límite el **19 de diciembre de 2026**.`,
        chips: ['Reporte de notas parciales', 'Fechas de cancelación', 'Calendario académico'],
      };
    }

    if (esInicioDeClases) {
      const cancelSin = indices.fechasCalendario.find((f) => /sin descuento/.test(f.actividadNorm));
      return {
        texto: `Las clases del periodo académico 2026-2S iniciaron el **${cancelSin?.inicio || '27 de agosto de 2026'}**.

Puedes consultar los plazos restantes del semestre en la sección [Info y Guías](info.html#calendario).`,
        chips: ['Cuándo finalizan las clases', 'Fechas de cancelación', 'Reporte de notas parciales'],
      };
    }

    if (esReporteNotas) {
      const r30 = indices.fechasCalendario.find((f) => /30\s*%/.test(f.actividadNorm));
      const r60 = indices.fechasCalendario.find((f) => /60\s*%/.test(f.actividadNorm));
      const r100 = indices.fechasCalendario.find((f) => /100\s*%/.test(f.actividadNorm));

      return {
        texto: `**Fechas límite para el reporte de calificaciones (2026-2S):**

- **Reporte de notas parciales (30 %):** Límite **${r30?.fin || '1 de octubre de 2026'}**
- **Reporte de notas parciales (60 %):** Límite **${r60?.fin || '5 de noviembre de 2026'}**
- **Reporte final de notas (100 %):** Límite **${r100?.fin || '19 de diciembre de 2026'}**

Recuerda que antes del reporte del 60 % de notas tienes derecho a conocer oportunamente tus evaluaciones previas.`,
        chips: ['Cuándo finalizan las clases', 'Fechas de cancelación', 'Bolsa de créditos'],
      };
    }

    if (esSemanaUniversitaria) {
      return {
        texto: `La **Semana Universitaria** en la UNAL Sede Medellín es un espacio institucional de receso de actividades evaluativas con jornadas culturales, deportivas y ambientales en los campus Volador, Robledo y Río.`,
        chips: ['Calendario académico', 'Ver sección Intercampus', 'Contacto del Representante'],
      };
    }

    if (esConsolidacion) {
      const filaCons = indices.fechasCalendario.find((f) => /consolidacion/.test(f.actividadNorm));
      return {
        texto: `La **Consolidación de matrícula** para el periodo 2026-2S tuvo como fecha límite el **${filaCons?.fin || '14 de septiembre de 2026'}**. A partir de este hito tu matrícula queda en firme y se consolidan tus asignaturas en el SIA.`,
        chips: ['Calendario académico', 'Bolsa de créditos', 'Portal SGS Minas'],
      };
    }

    if (filaCal) {
      const rangoTxt = filaCal.inicio ? `desde el **${filaCal.inicio}** hasta el **${filaCal.fin}**` : `límite el **${filaCal.fin}**`;
      const notaTxt = filaCal.nota ? `\n_Nota: ${filaCal.nota}_` : '';
      return {
        texto: `**${filaCal.actividad} (Periodo ${filaCal.aplica || '2026-2S'}):**
El plazo oficial según el calendario de la Facultad de Minas es ${rangoTxt}.${notaTxt}

Este trámite se radica ante la Gestión de Asuntos Estudiantiles (GAE) a través del [Portal SGS de Minas](${ENLACES_OFICIALES.sgsMinas}).`,
        chips: ['Portal SGS Minas', 'Calendario académico', 'Contacto del Representante'],
      };
    }

    if (esGeneralCalendario) {
      const cancelSin = indices.fechasCalendario.find((f) => /sin descuento/.test(f.actividadNorm));
      const cancelCon = indices.fechasCalendario.find((f) => /con descuento/.test(f.actividadNorm));
      const r60 = indices.fechasCalendario.find((f) => /60\s*%/.test(f.actividadNorm));
      const finClases = indices.fechasCalendario.find((f) => /finalizacion de clases/.test(f.actividadNorm));
      const r100 = indices.fechasCalendario.find((f) => /100\s*%/.test(f.actividadNorm));

      return {
        texto: `**Calendario Académico Oficial de Pregrado (2026-2S):**

- **Adición y cancelación sin descuento de créditos:** ${cancelSin?.inicio || '27-ago'} al **${cancelSin?.fin || '10 de septiembre'}**
- **Cancelación con descuento de créditos:** ${cancelCon?.inicio || '15-sep'} al **${cancelCon?.fin || '22 de octubre'}**
- **Reporte de notas parciales (60 %):** Límite **${r60?.fin || '5 de noviembre'}**
- **Finalización oficial de clases:** **${finClases?.fin || '17 de diciembre'}**
- **Reporte final de notas (100 %):** Límite **${r100?.fin || '19 de diciembre'}**

Puedes ver el calendario interactivo completo con todas las solicitudes estudiantiles en la sección [Info y Guías](info.html#calendario).`,
        chips: ['Fechas de cancelación', 'Cuándo finalizan las clases', 'Reporte de notas parciales'],
      };
    }

    // ------------------------------------------------------------------------
    // 7. Materias de último semestre / Décimo semestre en Ambiental
    // ------------------------------------------------------------------------
    if (/ultimo semestre|ultimos semestres|decimo semestre|semestre 10|10 semestre|materias para graduarme|terminar la carrera/.test(preguntaNorm)) {
      return {
        texto: `En el **10° y último semestre** de Ingeniería Ambiental el plan está estructurado para que culmines tu formación con:

1. **Trabajo de Grado (\`3009230\` - 6 créditos):**
   Es la asignatura central. Tienes varias modalidades para cursarla:
   - **Práctica de Extensión** (\`3010685\`) en una empresa, corporación autónoma regional (CAR) o entidad ambiental.
   - **Proyecto de Investigación** vinculado a un grupo o semillero (como AMET, POLYGESTA, MINKA u Oceánicos).
   - **Cursos de Posgrado** (\`3009231\`) cursando materias de especialización o maestría en Minas.

2. **Créditos de Optativas Profesionales y Disciplinares:**
   Completar los créditos restantes en líneas como Tratamiento de Aguas, Modelación Ambiental, Suelos o Calidad del Aire.

3. **Créditos de Libre Elección:**
   Completar los **35 créditos** de libre elección en materias que te gusten, idiomas o posgrados.

4. **Requisitos de Grado:**
   - Cumplir el requisito de idioma extranjero (Inglés B1/B2 según tu cohorte).
   - Tener aprobados los **174 créditos** exigidos del plan (más nivelaciones si aplicaban).

Si tienes dudas sobre tu cupo de créditos restante, revisa tu avance en la sección [Mi Avance](avance.html).`,
        chips: ['Prerrequisitos de Trabajo de Grado', 'Optativas de Ambiental', 'Ir a Mi Avance'],
      };
    }

    // ------------------------------------------------------------------------
    // 7.1 Optativas de Ingeniería Ambiental
    // ------------------------------------------------------------------------
    if (/optativas de ambiental|materias optativas|asignaturas optativas|disciplinar optativa|\boptativas\b/.test(preguntaNorm)) {
      return {
        texto: `En el plan de estudios de Ingeniería Ambiental tienes varias agrupaciones de optativas para perfilar tu carrera:

- **Ciencias Básicas Optativas (7 cr):** Biología Evolutiva, Física de Electricidad y Magnetismo, Física de Oscilaciones Ondas y Óptica, Química Orgánica.
- **Básicas de Ingeniería Optativas (3 cr):** Fenómenos de Transporte.
- **Tecnologías y Manejo Ambiental (6 cr):** Análisis de Datos Ambientales, Introducción a la Modelación Ambiental.
- **Ciencias Medioambientales (5 cr):** Climatología, Química Atmosférica.
- **Optativas Profesionales (6 cr):** Hidráulica Fluvial, Limnología, Recursos Hidráulicos, Manejo y Conservación de Suelos, Biorremediación, Residuos Sólidos, Calidad del Aire, Acueductos y Alcantarillados.

Puedes consultar la oferta completa y sus créditos en la sección interactiva de la [Malla Curricular](malla.html), y revisar tu avance actual en [Mi Avance](avance.html).`,
        chips: ['Prerrequisitos de materias', 'Ir a Mi Avance', 'Ver Malla Curricular'],
      };
    }

    // ------------------------------------------------------------------------
    // 8. Prerrequisitos de materias específicas
    // ------------------------------------------------------------------------
    const esConsultaPrereq = /prerrequisit|prerequisit|requisito|que pide|que necesito para ver|para matricular|correquisit|abrir|correr/.test(preguntaNorm);
    const materiaEncontrada = buscarAsignaturaPorTexto(preguntaNorm);

    if (materiaEncontrada && (esConsultaPrereq || preguntaNorm.includes(normalizar(materiaEncontrada.nombre)))) {
      const preCodigos = materiaEncontrada.prerrequisitos || [];
      const correqCodigos = materiaEncontrada.correquisitos || [];

      let detallePrereq = '';
      if (preCodigos.length === 0) {
        detallePrereq = `No tiene prerrequisitos. La puedes matricular desde tu primer semestre (según tu cupo de créditos y cita del SIA).`;
      } else {
        const nombresPre = preCodigos.map((cod) => {
          const preMat = indices.materiasPorCodigo.get(cod);
          return preMat ? `• **${preMat.nombre}** (\`${cod}\`)` : `• Asignatura código \`${cod}\``;
        }).join('\n');
        detallePrereq = `**Prerrequisito(s) necesario(s):**\n${nombresPre}`;
      }

      let detalleCorreq = '';
      if (correqCodigos.length > 0) {
        const nombresCorreq = correqCodigos.map((cod) => {
          const cMat = indices.materiasPorCodigo.get(cod);
          return cMat ? `• **${cMat.nombre}** (\`${cod}\`)` : `• Asignatura código \`${cod}\``;
        }).join('\n');
        detalleCorreq = `\n\n**Correquisito(s) (simultáneos):**\n${nombresCorreq}`;
      }

      const semestreTxt = materiaEncontrada.semestre ? `Semestre sugerido: **${materiaEncontrada.semestre}°**` : 'Asignatura Optativa / Elegible';
      const obligatoriaTxt = materiaEncontrada.obligatoria ? 'Obligatoria' : 'Optativa';
      const wspTxt = materiaEncontrada.whatsapp
        ? `\n\n👉 [Unirte al grupo de WhatsApp de estudio](${materiaEncontrada.whatsapp})`
        : '\n\n*(Esta materia no tiene grupo de WhatsApp registrado actualmente en la web).*';

      const chipsPre = preCodigos
        .map((cod) => indices.materiasPorCodigo.get(cod))
        .filter(Boolean)
        .map((m) => `Prerrequisitos de ${m.nombre}`);

      return {
        texto: `### ${materiaEncontrada.nombre} (\`${materiaEncontrada.codigo}\`)

${detallePrereq}${detalleCorreq}

- **Créditos:** ${materiaEncontrada.creditos}
- **Tipología:** ${obligatoriaTxt} (${materiaEncontrada.agrupacion || 'Plan de estudios'})
- **Nivel:** ${semestreTxt}${wspTxt}`,
        chips: chipsPre.length > 0 ? chipsPre : ['Ver Malla Curricular', 'Drive de recursos de estudio'],
      };
    }

    // ------------------------------------------------------------------------
    // 9. Materias por semestre
    // ------------------------------------------------------------------------
    const matchSemestre = preguntaNorm.match(/semestre\s*([1-9]|10)|primer\s*semestre|segundo\s*semestre|tercer\s*semestre|cuarto\s*semestre|quinto\s*semestre|sexto\s*semestre|septimo\s*semestre|octavo\s*semestre|noveno\s*semestre|decimo\s*semestre/);
    if (matchSemestre && (preguntaNorm.includes('materia') || preguntaNorm.includes('asignatura') || preguntaNorm.includes('veo') || preguntaNorm.includes('curso') || preguntaNorm.includes('plan'))) {
      const mapaOrdinales = {
        'primer semestre': 1, 'segundo semestre': 2, 'tercer semestre': 3, 'cuarto semestre': 4,
        'quinto semestre': 5, 'sexto semestre': 6, 'septimo semestre': 7, 'octavo semestre': 8,
        'noveno semestre': 9, 'decimo semestre': 10
      };
      let numSemestre = matchSemestre[1] ? parseInt(matchSemestre[1], 10) : mapaOrdinales[matchSemestre[0]];

      if (numSemestre && numSemestre >= 1 && numSemestre <= 10) {
        const bloquePlan = datos.plan.find((p) => p.semestre === numSemestre);
        const materiasSemestre = datos.asignaturas.filter((a) => a.semestre === numSemestre);

        let listaTxt = '';
        if (bloquePlan?.items) {
          listaTxt = bloquePlan.items.map((item) => {
            if (item.tipo === 'asignatura') {
              const asig = indices.materiasPorCodigo.get(item.codigo);
              if (asig) {
                const preCount = asig.prerrequisitos?.length || 0;
                const preInfo = preCount > 0 ? ` _(pide ${preCount} prerreq.)_` : ' _(sin prerreq.)_';
                return `• **${asig.nombre}** (${asig.creditos} créditos)${preInfo}`;
              }
              return `• Asignatura código \`${item.codigo}\``;
            } else if (item.tipo === 'bolsa') {
              return `• **${item.nombre || 'Asignatura Optativa'}** (${item.creditos} créditos)`;
            }
            return '';
          }).filter(Boolean).join('\n');
        } else {
          listaTxt = materiasSemestre.map((m) => {
            const preCount = m.prerrequisitos?.length || 0;
            const preInfo = preCount > 0 ? ` _(pide ${preCount} prerreq.)_` : ' _(sin prerreq.)_';
            return `• **${m.nombre}** (${m.creditos} créditos)${preInfo}`;
          }).join('\n');
        }

        const creditosTotales = bloquePlan?.creditos || materiasSemestre.reduce((acc, m) => acc + (m.creditos || 0), 0);

        return {
          texto: `### Plan de estudios para Semestre ${numSemestre} (${creditosTotales} créditos sugeridos)

${listaTxt}

Si quieres ver el semáforo de prerrequisitos o unirte al WhatsApp de alguna, puedes pulsar abajo o abrir la [Malla Curricular](malla.html).`,
          chips: materiasSemestre.slice(0, 4).map((m) => `Prerrequisitos de ${m.nombre}`),
        };
      }
    }

    // ------------------------------------------------------------------------
    // 10. Auxilios de Bienestar Universitario
    // ------------------------------------------------------------------------
    if (/auxilio|auxilios|bienestar|apoyo alimentario|apoyo economico|bono de transporte|alojamiento|residencias|almuerzo|almuerzos|subsidio|comida|pbm/.test(preguntaNorm)) {
      return {
        texto: `El Área de Gestión y Fomento Socioeconómico de Bienestar Universitario ofrece varios apoyos para estudiantes de pregrado:

1. **Apoyo Alimentario:**
   Almuerzo diario durante el semestre en los restaurantes universitarios del Campus El Volador y Robledo.
2. **Apoyo Económico Estudiantil:**
   Subsidio monetario semestral para gastos de sostenimiento académico.
3. **Auxilio o Tarifa Estudiantil de Transporte:**
   Tarifa preferencial en la Tarjeta Cívica del Metro de Medellín y auxilios de movilidad.
4. **Alojamiento y Residencias Estudiantiles:**
   Subsidio o cupo de vivienda para estudiantes que provienen de fuera del Área Metropolitana.

**Requisitos principales:**
- Estar matriculado en el semestre vigente.
- Tener evaluado el Puntaje Básico de Matrícula (PBM).
- Postularte dentro de las fechas fijadas en la convocatoria oficial (a inicio de cada semestre).
- Cumplir el compromiso de **Horas de Corresponsabilidad** (mínimo 16 horas semestrales en dependencias de la universidad).

👉 Más información y convocatorias abiertas: [Bienestar UNAL Medellín](${ENLACES_OFICIALES.bienestarMinas})`,
        chips: ['Horas de corresponsabilidad', 'Convenios estudiantiles', 'Calendario académico'],
      };
    }

    // ------------------------------------------------------------------------
    // 11. Convenios y Beneficios
    // ------------------------------------------------------------------------
    const esConvenio = /convenio|convenios|beneficio|beneficios/.test(preguntaNorm);

    if (esConvenio || /kiro|aws|coursera|github|copilot|jetbrains|pycharm|intellij|office|microsoft|matlab|autodesk|revit|autocad|spotify|sapiencia|icetex/.test(preguntaNorm)) {
      if (preguntaNorm.includes('kiro') || preguntaNorm.includes('programar con ia') || preguntaNorm.includes('ia para programar')) {
        return {
          texto: `**Convenio Kiro (AWS) · Programación con IA:**
- **Beneficio:** 1.000 créditos mensuales gratis durante 1 año.
- **¿Qué hace?** Es un entorno de IA desarrollado sobre Amazon Web Services que convierte ideas y especificaciones en código real ejecutable para tus proyectos y materias.
- **¿Cómo activarlo?** Entra a [dned.unal.edu.co](https://dned.unal.edu.co) con tu cuenta de correo institucional de la UNAL.`,
          chips: ['GitHub Student Pack', 'Coursera UNAL', 'Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('coursera') || preguntaNorm.includes('curso') || preguntaNorm.includes('certificacion') || preguntaNorm.includes('diplomado')) {
        return {
          texto: `**Coursera for Campus UNAL:**
- **Beneficio:** Cursos y certificaciones profesionales gratis con universidades internacionales (Google, IBM, Stanford, Michigan, etc.).
- **¿Cómo activarlo?** Inicia sesión en [coursera.org](https://www.coursera.org/) seleccionando "Iniciar sesión con la organización" usando tu correo \`@unal.edu.co\`.`,
          chips: ['Convenio Kiro (AWS)', 'GitHub Student Pack', 'Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('github') || preguntaNorm.includes('copilot') || preguntaNorm.includes('autocompletar')) {
        return {
          texto: `**GitHub Student Developer Pack:**
- **Beneficio:** GitHub Copilot gratis, cuenta GitHub Pro sin costo, dominios gratuitos por un año (.me), créditos en la nube (Azure, DigitalOcean) y herramientas de desarrollo.
- **¿Cómo activarlo?** Postúlate en [education.github.com/pack](https://education.github.com/pack) subiendo tu carnet o certificado de matrícula.`,
          chips: ['JetBrains Student Pack', 'Convenio Kiro (AWS)', 'Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('jetbrains') || preguntaNorm.includes('intellij') || preguntaNorm.includes('pycharm') || preguntaNorm.includes('webstorm') || preguntaNorm.includes('ide')) {
        return {
          texto: `**JetBrains Student Pack:**
- **Beneficio:** Licencias educativas profesionales para IntelliJ IDEA Ultimate, PyCharm Professional, WebStorm, CLion, DataGrip, etc.
- **¿Cómo activarlo?** Regístrate en [jetbrains.com/community/education](https://www.jetbrains.com/community/education/) con tu correo \`@unal.edu.co\`.`,
          chips: ['GitHub Student Pack', 'Microsoft 365', 'Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('office') || preguntaNorm.includes('microsoft') || preguntaNorm.includes('word') || preguntaNorm.includes('excel') || preguntaNorm.includes('onedrive') || preguntaNorm.includes('almacenamiento')) {
        return {
          texto: `**Microsoft 365 Educación:**
- **Beneficio:** Suite completa de Office (Word, Excel, PowerPoint, Teams) para descargar en hasta 5 dispositivos y 1 TB de almacenamiento en la nube en OneDrive.
- **¿Cómo activarlo?** Inicia sesión en [portal.office.com](https://portal.office.com) con tu usuario y contraseña del correo UNAL.`,
          chips: ['MATLAB y Simulink', 'Coursera UNAL', 'Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('matlab') || preguntaNorm.includes('simulink') || preguntaNorm.includes('calculo numerico')) {
        return {
          texto: `**MATLAB y Simulink (Campus-Wide License):**
- **Beneficio:** Acceso ilimitado a todas las toolboxes de MATLAB, Simulink y cursos de MATLAB Academy.
- **¿Cómo activarlo?** Entra al portal de MathWorks UNAL y crea tu cuenta con tu correo institucional.`,
          chips: ['Convenio Kiro (AWS)', 'Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('autodesk') || preguntaNorm.includes('autocad') || preguntaNorm.includes('revit') || preguntaNorm.includes('cad') || preguntaNorm.includes('3d')) {
        return {
          texto: `**Autodesk Education:**
- **Beneficio:** Licencias educativas de 1 año renovables para AutoCAD, Revit, Civil 3D, 3ds Max, Maya e Inventor.
- **¿Cómo activarlo?** Regístrate en [autodesk.com/education](https://www.autodesk.com/education/) verificando tu calidad de estudiante.`,
          chips: ['Ver todos los convenios'],
        };
      }

      if (preguntaNorm.includes('spotify') || preguntaNorm.includes('musica')) {
        return {
          texto: `**Spotify Premium Estudiantes:**
- **Beneficio:** 50 % de descuento en la suscripción mensual de Spotify Premium verificando tu estatus estudiantil a través de SheerID con tu correo UNAL.`,
          chips: ['Ver todos los convenios'],
        };
      }

      return {
        texto: `En la sección de [Convenios](convenios.html) tenemos recopilados los principales beneficios a los que tienes derecho:

- **Herramientas de Ingeniería:** Autodesk Education (AutoCAD, Civil 3D, Revit), MATLAB Campus-Wide.
- **Productividad:** Microsoft 365 con 1 TB de OneDrive y aplicaciones oficiales.
- **Cursos y certificación:** Coursera for Campus con acceso gratuito y certificados incluidos.
- **Programación e IA:** Kiro (AWS) con 1.000 créditos/mes y GitHub Copilot.
- **Bienestar:** Almuerzos estudiantiles, tarifa Metro Cívica y Spotify al 50 %.

Si buscas un beneficio para algo en particular (por ejemplo *"convenio para cursos"*, *"para office"* o *"para autocad"*), dímelo y te paso los pasos exactos.`,
        chips: ['Autodesk Education', 'Coursera UNAL', 'Microsoft 365', 'Auxilios de Bienestar'],
      };
    }

    // ------------------------------------------------------------------------
    // 12. Semilleros y Grupos de Investigación en Ambiental
    // ------------------------------------------------------------------------
    if (esConsultaSemillero) {
      if (preguntaNorm.includes('amet')) {
        return {
          texto: `**AMET · Capítulo Estudiantil de Ingeniería Ambiental:**
Es la asociación y capítulo de estudiantes de Ingeniería Ambiental en la Facultad de Minas. Promueve la articulación académica, la acción climática, educación ambiental y el fortalecimiento de la comunidad de la carrera.

- Instagram: [@ametunalmed](https://www.instagram.com/ametunalmed?stkn=MTZuaTB5Yzk4ZG12Ng==)
- Correo: \`amet_med@unal.edu.co\``,
          chips: ['POLYGESTA', 'MINKA', 'Oceánicos'],
        };
      }

      if (preguntaNorm.includes('polygesta')) {
        return {
          texto: `**POLYGESTA · Política, Legislación y Gestión Ambiental:**
Grupo de investigación y semillero enfocado en economía circular, recuperación y valorización de residuos, marco normativo ambiental y sostenibilidad territorial.

- Instagram: [@gi_polygesta](https://www.instagram.com/gi_polygesta?stkn=MWh3OXU1ODJ5cmpvNA==)
- Correo: \`polygesta_med@unal.edu.co\``,
          chips: ['AMET', 'MINKA', 'Oceánicos'],
        };
      }

      if (preguntaNorm.includes('minka')) {
        return {
          texto: `**MINKA · Sistemas Socioecológicos:**
Semillero de investigación comprometido con el análisis interdisciplinario de las relaciones comunidad-naturaleza, soberanía alimentaria, justicia ambiental y ciencia participativa.

- Instagram: [@minka_unal_med](https://www.instagram.com/minka_unal_med?stkn=MWl2anJtZG15ejhuYQ==)
- Correo: \`sesminka_med@unal.edu.co\``,
          chips: ['AMET', 'POLYGESTA', 'Oceánicos'],
        };
      }

      if (preguntaNorm.includes('oceanicos')) {
        return {
          texto: `**Oceánicos · Grupo de Investigación:**
Grupo pionero en oceanografía física, modelación matemática de costas, hidrodinámica marina, estuarios e ingeniería costera en la Facultad de Minas.

- Instagram: [@oceanicosunalmed](https://www.instagram.com/oceanicosunalmed?stkn=MTJkeGtkNWM4bjJqeg==)
- Correo: \`oceanicos_med@unal.edu.co\``,
          chips: ['AMET', 'POLYGESTA', 'MINKA'],
        };
      }

      return {
        texto: `En Ingeniería Ambiental contamos con semilleros y grupos estudiantiles muy destacados:

1. **AMET:** Capítulo estudiantil de Ingeniería Ambiental (articulación académica, acción climática y comunidad).
2. **POLYGESTA:** Política, legislación, economía circular y gestión ambiental.
3. **MINKA:** Sistemas socioecológicos, soberanía alimentaria y justicia ambiental.
4. **Oceánicos:** Oceanografía física, hidrodinámica marina y modelación de costas.

Puedes conocer más de ellos y sus redes en la sección [Grupos y Semilleros](index.html#grupos).`,
        chips: ['AMET', 'POLYGESTA', 'MINKA', 'Oceánicos'],
      };
    }

    // ------------------------------------------------------------------------
    // 13. P.A.P.A., Citas SIA, Prelación DNINFOA y Bolsa de Créditos
    // ------------------------------------------------------------------------
    if (/citas|cita sia|prelacion|dninfoa|ipa|pappi/.test(preguntaNorm)) {
      return {
        texto: `**¿Cómo se asignan las Citas de Inscripción del SIA?**

La DNINFOA ya no usa el PAPPI para dar citas. Ahora rigen los **4 Grupos de Prelación**:

1. **Grupo 1:** Estudiantes con reconocimientos y distinciones académicas.
2. **Grupo 2:** Estudiantes en permanencia regular ordenados por el **Índice IPA** (que combina tu P.A.P.A. histórico con tu ritmo de créditos aprobados).
3. **Grupo 3:** Estudiantes con bajo avance o periodos suspendidos.
4. **Grupo 4:** Casos especiales y reservas de cupo.

💡 Para consultar tu cita o inscribir materias cuando abra tu turno, ingresa al [Portal SIA](${ENLACES_OFICIALES.sia}).`,
        chips: ['¿Qué es el P.A.P.A.?', 'Bolsa de créditos', 'Calendario académico'],
      };
    }

    if (/papa|promedio acumulado|permanencia/.test(preguntaNorm)) {
      return {
        texto: `El **P.A.P.A. (Promedio Académico Ponderado Acumulado)** es el promedio ponderado de todas las asignaturas que has cursado en la universidad (tanto aprobadas como reprobadas), ponderadas por el número de créditos de cada una.

- Es el promedio que rige tu permanencia (debes mantenerlo en 3.0 o más para no perder el cupo).
- Es el que se toma en cuenta para estímulos de matrícula de honor, dobles titulaciones y admisiones automáticas a posgrados.
- Puedes calcular y simular tu P.A.P.A. en nuestra herramienta [Mi Avance](avance.html).`,
        chips: ['Ir a Mi Avance', 'Citas de inscripción SIA', 'Bolsa de créditos'],
      };
    }

    if (/bolsa|cupo de creditos|creditos disponibles/.test(preguntaNorm)) {
      return {
        texto: `**La Bolsa de Créditos en la UNAL:**

Al ingresar a la carrera recibes un cupo de créditos para cursar tu plan:
- Si apruebas una materia: se consumen sus créditos correspondientes.
- Si cancelas en **Semana 3** (sin pérdida): los créditos se te reintegran inmediatamente a tu bolsa.
- Si cancelas en **Semana 8** o repruebas: los créditos se descuentan de tu bolsa disponible.
- Si se te acaban los créditos antes de graduarte, debes solicitar créditos adicionales ante el Consejo de Facultad en el [Portal SGS](${ENLACES_OFICIALES.sgsMinas}).`,
        chips: ['Fechas de cancelación', 'Ir a Mi Avance', 'Portal SGS Minas'],
      };
    }

    // ------------------------------------------------------------------------
    // 14. Dónde está cada cosa en la página / Tour de la web
    // ------------------------------------------------------------------------
    if (/donde esta|donde veo|donde encuentro|como funciona la pagina|como funciona la web|tour|secciones|ir a mi avance/.test(preguntaNorm)) {
      return {
        texto: `Te enseño qué encuentras en cada rincón del portal de Ingeniería Ambiental:

- **[Inicio](index.html):** Información general del programa, decanatura, perfil del egresado y los grupos estudiantiles y semilleros (AMET, POLYGESTA, MINKA, Oceánicos).
- **[Malla Curricular](malla.html):** Malla interactiva de 10 semestres. Al hacer clic en una materia ves sus prerrequisitos en semáforo, el enlace a su WhatsApp de estudio y el botón para entrar a la **Carpeta de Recursos de Drive**.
- **[Mi Avance](avance.html):** Subes o pegas tu historia académica del SIA. Te calcula tu P.A.P.A. real, créditos pendientes por tipología, desbloquea logros, tu carnet digital oficial y tu título de avance.
- **[Info y Guías](info.html):** Fechas del calendario académico oficial, explicación de los 4 grupos de prelación DNINFOA para citas SIA, bolsa de créditos y trámites de solicitudes SGS.
- **[Convenios](convenios.html):** Guías para reclamar Autodesk, Coursera, GitHub Pack, JetBrains, Microsoft 365, MATLAB y apoyos de Bienestar.
- **[Intercampus](intercampus.html):** Rutas y horarios de los buses gratuitos entre Robledo, Volador y Río.`,
        chips: ['Ver Malla Curricular', 'Ir a Mi Avance', 'Ver todos los convenios', 'Calendario académico'],
      };
    }

    // ------------------------------------------------------------------------
    // 15. Rutas de Bus Intercampus
    // ------------------------------------------------------------------------
    if (/\b(bus|buses|intercampus|transporte|horario bus|robledo|volador)\b|campus del rio|sede del rio|\bel rio\b/.test(preguntaNorm)) {
      return {
        texto: `**Transporte Intercampus UNAL Medellín (100 % Gratuito):**

1. **Ruta Robledo ⇄ Volador:**
   - Sale de la Facultad de Minas (Bloque M3) y llega al Bloque 41 / Portería Coca-Cola en Volador.
   - Opera de lunes a viernes entre las 6:00 a. m. y las 9:00 p. m.
2. **Ruta Río ⇄ Volador:**
   - Conecta la Sede del Río con Campus Volador.
3. **Metro de Medellín:**
   - Cuenta con paradas intermedias de conexión rápida a las estaciones Floresta y Suramericana.

💡 Para subirte solo debes mostrar tu **carnet estudiantil físico o digital**. Puedes revisar paradas y detalles en [Intercampus](intercampus.html).`,
        chips: ['Ver sección Intercampus', 'Calendario académico', 'Semilleros y grupos'],
      };
    }

    // ------------------------------------------------------------------------
    // 16. Trámites administrativos y Solicitudes GAE
    // ------------------------------------------------------------------------
    if (/tramite|tramites|solicitud|solicitudes|gae|sgs|reingreso|traslado|reserva de cupo|doble titulacion/.test(preguntaNorm)) {
      return {
        texto: `Las solicitudes académicas en la Facultad de Minas se radican a través del **Sistema de Gestión de Solicitudes (SGS)** ante la Gestión de Asuntos Estudiantiles (GAE).

Para conocer los requisitos, soportes necesarios y radicar tu caso, entra al portal oficial:
👉 [Portal de Solicitudes Estudiantiles de Minas (SGS)](${ENLACES_OFICIALES.sgsMinas})

Si se trata de un caso complejo o necesitas asesoría antes de radicar, Emmanuel (Representante de Ambiental) te puede orientar personalmente:
- WhatsApp: [${ENLACES_OFICIALES.telefonoRepre}](${ENLACES_OFICIALES.wppRepre})`,
        chips: ['Calendario académico', '¿Qué es el P.A.P.A.?', 'Bolsa de créditos'],
      };
    }

    // ------------------------------------------------------------------------
    // 17. Horas de corresponsabilidad
    // ------------------------------------------------------------------------
    if (/corresponsabilidad|horas de corresponsabilidad|horas bienestar/.test(preguntaNorm)) {
      return {
        texto: `Las **Horas de Corresponsabilidad** son un compromiso formativo y solidario obligatorio para estudiantes beneficiarios de apoyos de Bienestar Universitario (alimentario, económico, residencias).

- Son mínimo **16 horas semestrales**.
- Se pueden pagar apoyando en Bibliotecas (Efe Gómez o Minas), salas de cómputo, vivero, áreas verdes, laboratorios de ambiental o eventos de la facultad.
- Las plazas se publican al inicio de cada periodo por correo o en Bienestar Minas (Bloque M4).`,
        chips: ['Auxilios de Bienestar', 'Calendario académico'],
      };
    }

    // ------------------------------------------------------------------------
    // 18. Profesores / Horarios / Salones en tiempo real
    // ------------------------------------------------------------------------
    if (preguntaNorm.includes('profesor') || preguntaNorm.includes('docente') || preguntaNorm.includes('horario de clase') || preguntaNorm.includes('cupo') || preguntaNorm.includes('salon')) {
      return {
        texto: `Para consultar horarios específicos de clases, profesores asignados, aulas o cupos disponibles en tiempo real, debes revisar directamente en el buscador de la universidad:

👉 [Buscador de Cursos del SIA](${ENLACES_OFICIALES.sia})

Si necesitas material de estudio de la materia o parciales anteriores, los encuentras en nuestra [Carpeta de Recursos de Drive](${ENLACES_OFICIALES.driveAmbiental}).`,
        chips: ['Drive de recursos de estudio', 'Ver Malla Curricular', 'Prerrequisitos de materias'],
      };
    }

    // ------------------------------------------------------------------------
    // 19. Búsqueda en FAQs
    // ------------------------------------------------------------------------
    const terminosBusqueda = extraerTerminos(preguntaNorm);
    if (terminosBusqueda.length > 0 && datos.info?.faq) {
      let mejorFaq = null;
      let mejorPuntajeFaq = 0;

      datos.info.faq.forEach((f) => {
        const pregNorm = normalizar(f.pregunta);
        const respNorm = normalizar(f.respuesta);
        let matches = 0;

        terminosBusqueda.forEach((t) => {
          if (pregNorm.includes(t)) matches += 2.5;
          else if (respNorm.includes(t)) matches += 1;
          else {
            const sim = similitudCadenas(t, pregNorm);
            if (sim > 0.8) matches += 1.5;
          }
        });

        if (matches > mejorPuntajeFaq) {
          mejorPuntajeFaq = matches;
          mejorFaq = f;
        }
      });

      if (mejorFaq && mejorPuntajeFaq >= 2.5) {
        return {
          texto: `**${mejorFaq.pregunta}**

${mejorFaq.respuesta}`,
          chips: ['Citas de inscripción SIA', 'Bolsa de créditos', 'Calendario académico'],
        };
      }
    }

    // ------------------------------------------------------------------------
    // 20. Fallback final
    // ------------------------------------------------------------------------
    return {
      texto: `No tengo el dato exacto de esa consulta en la base del portal, pero no te quedes con la duda:

- Si es sobre trámites o solicitudes de la Facultad, revísalo en el [Portal SGS de Minas](${ENLACES_OFICIALES.sgsMinas}).
- Si es sobre cupos o profesores específicos, consulta en el [Buscador del SIA](${ENLACES_OFICIALES.sia}).
- Para cualquier otra duda personal o académica, escríbele con toda confianza a Emmanuel (Representante Estudiantil de Ingeniería Ambiental):
  👉 WhatsApp: [${ENLACES_OFICIALES.telefonoRepre}](${ENLACES_OFICIALES.wppRepre}) · Correo: \`${ENLACES_OFICIALES.correoRepre}\``,
      chips: ['Drive de recursos de estudio', 'Prerrequisitos de materias', 'Fechas de cancelación', 'WhatsApp de una materia'],
    };
  }

  /* ==========================================================================
     6. AVATAR HOLOGRÁFICO DE CORTANA (HALO REIMAGINADO)
     ========================================================================== */

  function renderizarAvatarCortana() {
    return `<svg class="sofia-cortana-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <!-- Gradiente holográfico: Turquesa Hídrico a Verde Esmeralda Neón -->
        <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00bcc8" />
          <stop offset="50%" stop-color="#028090" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
        <linearGradient id="holoFace" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="60%" stop-color="#c2f5ee" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#8ce7dd" stop-opacity="0.65" />
        </linearGradient>
        <radialGradient id="holoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00bcc8" stop-opacity="0.4" />
          <stop offset="70%" stop-color="#145a32" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Aura holográfica de fondo -->
      <circle cx="50" cy="50" r="48" fill="url(#holoGlow)" />

      <!-- Anillo exterior con segmentos de interfaz digital -->
      <circle cx="50" cy="50" r="46" stroke="url(#holoGradient)" stroke-width="1.8" stroke-dasharray="8 4 14 3 6 4" opacity="0.85" />
      <circle cx="50" cy="50" r="41" stroke="#00bcc8" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.6" />

      <!-- Líneas de datos / Escaneo holográfico -->
      <path d="M15 50 H24 M76 50 H85 M50 15 V24 M50 76 V85" stroke="#00bcc8" stroke-width="1.2" opacity="0.6" />
      <circle cx="50" cy="12" r="1.5" fill="#00bcc8" />
      <circle cx="88" cy="50" r="1.5" fill="#10b981" />

      <!-- Silueta holográfica estilizada de Cortana (cabello y perfil digital) -->
      <path d="M30 46 C28 32 38 23 50 23 C62 23 72 32 70 46 C69 49 68 53 66 56 C64 47 62 39 52 38 C42 39 36 47 34 56 C32 53 31 49 30 46 Z" fill="url(#holoGradient)" opacity="0.95" />
      
      <!-- Rostro elegante holográfico -->
      <path d="M36 46 C36 40 42 36 50 36 C58 36 64 40 64 46 C64 55 58 65 50 69 C42 65 36 55 36 46 Z" fill="url(#holoFace)" />
      
      <!-- Cuello y hombros digitales -->
      <path d="M44 67 L42 77 L31 82 C43 85 57 85 69 82 L58 77 L56 67 Z" fill="url(#holoGradient)" opacity="0.8" />

      <!-- Ojos / Visor de IA brillante -->
      <ellipse cx="44" cy="48" rx="2.5" ry="1.2" fill="#04231f" />
      <ellipse cx="56" cy="48" rx="2.5" ry="1.2" fill="#04231f" />
      <circle cx="44.8" cy="47.6" r="0.8" fill="#00bcc8" />
      <circle cx="56.8" cy="47.6" r="0.8" fill="#00bcc8" />

      <!-- Líneas de circuito neuronal en el rostro de Cortana -->
      <path d="M50 38 V44 M47 54 H53 M50 58 V62" stroke="#028090" stroke-width="1" stroke-linecap="round" opacity="0.75" />
      <path d="M38 52 L42 55 M62 52 L58 55" stroke="#10b981" stroke-width="0.9" opacity="0.7" />

      <!-- Nodo de activación en la frente (chispa de IA) -->
      <circle cx="50" cy="33" r="1.6" fill="#ffffff" />
      <circle cx="50" cy="33" r="3.2" stroke="#00bcc8" stroke-width="0.8" opacity="0.9" />
    </svg>`;
  }

  /* ==========================================================================
     7. INTERFAZ GRÁFICA
     ========================================================================== */

  function crearElementosDOM() {
    if (document.getElementById('sofia-contenedor-global')) return;

    if (!document.getElementById('css-sofia')) {
      const linkCss = document.createElement('link');
      linkCss.id = 'css-sofia';
      linkCss.rel = 'stylesheet';
      linkCss.href = 'css/sofia.css';
      (document.head || document.getElementsByTagName('head')[0] || document.body)?.appendChild(linkCss);
    }

    const wrapGlobal = document.createElement('div');
    wrapGlobal.id = 'sofia-contenedor-global';
    wrapGlobal.innerHTML = `
      <div class="sofia-flotante-wrap" id="sofia-flotante-wrap">
        <div class="sofia-globo-bienvenida" id="sofia-globo" role="tooltip" aria-label="Aviso de sofIA">
          <span class="sofia-globo-texto">👋 ¿Dudas con materias o fechas? <strong>Pregúntale a sofIA</strong></span>
          <button class="sofia-globo-cerrar" id="sofia-globo-cerrar" type="button" aria-label="Cerrar sugerencia">✕</button>
        </div>

        <button class="sofia-boton" id="sofia-btn-toggle" type="button" aria-label="Abrir asistente virtual sofIA" aria-haspopup="dialog" aria-expanded="false">
          <span class="sofia-boton__icono">
            ${renderizarAvatarCortana()}
          </span>
          <span class="sofia-boton__badge" title="sofIA en línea"></span>
        </button>
      </div>

      <aside class="sofia-ventana" id="sofia-ventana" role="dialog" aria-label="Ventana de conversación con sofIA" aria-modal="true" hidden>
        <header class="sofia-cabecera">
          <div class="sofia-cabecera__info">
            <div class="sofia-cabecera__avatar" aria-hidden="true">
              ${renderizarAvatarCortana()}
            </div>
            <div class="sofia-cabecera__titulos">
              <div class="sofia-cabecera__nombre-wrap">
                <span class="sofia-cabecera__nombre">sofIA</span>
                <span class="sofia-tag-ia">UNAL</span>
              </div>
              <span class="sofia-cabecera__subtitulo">
                <span class="sofia-punto-verde" aria-hidden="true"></span>
                En línea · Asistente de Ambiental
              </span>
            </div>
          </div>
          <div class="sofia-cabecera__acciones">
            <button class="sofia-btn-accion" id="sofia-btn-limpiar" type="button" title="Reiniciar conversación" aria-label="Reiniciar conversación">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button class="sofia-btn-accion" id="sofia-btn-cerrar" type="button" title="Cerrar chat" aria-label="Cerrar ventana de sofIA">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </header>

        <div class="sofia-mensajes" id="sofia-mensajes" tabindex="0" aria-live="polite"></div>

        <footer class="sofia-pie">
          <form class="sofia-formulario" id="sofia-form">
            <input
              type="text"
              class="sofia-input"
              id="sofia-input"
              placeholder="Pregúntale a sofIA sobre materias, fechas, WhatsApps..."
              autocomplete="off"
              required
              aria-label="Mensaje para sofIA"
            >
            <button class="sofia-btn-enviar" id="sofia-btn-enviar" type="submit" aria-label="Enviar mensaje">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p class="sofia-aviso-privacidad">sofIA consulta la base oficial del portal de Ingeniería Ambiental UNAL.</p>
        </footer>
      </aside>
    `;

    document.body.appendChild(wrapGlobal);
    vincularEventos();
    cargarHistorialGuardado();
  }

  function formatearMarkdown(texto) {
    if (!texto) return '';
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="sofia-code">$1</code>')
      .replace(/^### (.*$)/gim, '<div class="sofia-tarjeta-dato__titulo">$1</div>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^\s*• (.*$)/gim, '<li>$1</li>')
      .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function agregarMensajeAlDOM(emisor, textoMarkdown, chips = [], animar = true) {
    const contenedor = document.getElementById('sofia-mensajes');
    if (!contenedor) return;

    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const fila = document.createElement('div');
    fila.className = `sofia-fila sofia-fila--${emisor}`;

    const htmlContenido = formatearMarkdown(textoMarkdown);

    let htmlChips = '';
    if (chips && chips.length > 0) {
      htmlChips = `
        <div class="sofia-chips-contenedor">
          <div class="sofia-chips-titulo">Sugerencias:</div>
          <div class="sofia-chips-rejilla">
            ${chips.map((chip) => `<button type="button" class="sofia-chip" data-consulta="${escapeHtml(chip)}">${escapeHtml(chip)}</button>`).join('')}
          </div>
        </div>`;
    }

    if (emisor === 'bot') {
      fila.innerHTML = `
        <div class="sofia-fila__avatar" aria-hidden="true">
          ${renderizarAvatarCortana()}
        </div>
        <div class="sofia-burbuja">
          <div class="sofia-burbuja__cuerpo">${htmlContenido}</div>
          ${htmlChips}
          <span class="sofia-burbuja__hora">${horaFormateada}</span>
        </div>`;
    } else {
      fila.innerHTML = `
        <div class="sofia-burbuja">
          <div class="sofia-burbuja__cuerpo">${htmlContenido}</div>
          <span class="sofia-burbuja__hora">${horaFormateada}</span>
        </div>`;
    }

    contenedor.appendChild(fila);
    contenedor.scrollTop = contenedor.scrollHeight;

    estadoSofia.mensajes.push({ emisor, texto: textoMarkdown, chips });
    guardarHistorial();
  }

  function mostrarIndicadorEscribiendo() {
    const contenedor = document.getElementById('sofia-mensajes');
    if (!contenedor || document.getElementById('sofia-escribiendo-indicador')) return;

    const indicador = document.createElement('div');
    indicador.id = 'sofia-escribiendo-indicador';
    indicador.className = 'sofia-fila sofia-fila--bot';
    indicador.innerHTML = `
      <div class="sofia-fila__avatar" aria-hidden="true">${renderizarAvatarCortana()}</div>
      <div class="sofia-escribiendo">
        <span class="sofia-escribiendo__punto"></span>
        <span class="sofia-escribiendo__punto"></span>
        <span class="sofia-escribiendo__punto"></span>
      </div>`;
    contenedor.appendChild(indicador);
    contenedor.scrollTop = contenedor.scrollHeight;
  }

  function removerIndicadorEscribiendo() {
    const el = document.getElementById('sofia-escribiendo-indicador');
    if (el) el.remove();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     8. HISTORIAL Y SESIÓN
     ========================================================================== */

  function guardarHistorial() {
    try {
      sessionStorage.setItem('ambiental.sofia.historial', JSON.stringify(estadoSofia.mensajes.slice(-20)));
    } catch (_) {}
  }

  function cargarHistorialGuardado() {
    const contenedor = document.getElementById('sofia-mensajes');
    if (!contenedor) return;

    try {
      const guardado = sessionStorage.getItem('ambiental.sofia.historial');
      if (guardado) {
        const lista = JSON.parse(guardado);
        if (Array.isArray(lista) && lista.length > 0) {
          estadoSofia.mensajes = lista;
          contenedor.innerHTML = '';
          lista.forEach((item) => {
            agregarMensajeAlDOM(item.emisor, item.texto, item.chips, false);
          });
          return;
        }
      }
    } catch (_) {}

    const chipsIniciales = [
      'Drive de recursos de estudio',
      'Prerrequisitos de materias',
      'Fechas de cancelación',
      'Cuándo finalizan las clases',
      'WhatsApp de una materia',
      'Semilleros y grupos',
      'Auxilios de Bienestar',
    ];
    agregarMensajeAlDOM(
      'bot',
      `¡Hola! Soy **sofIA**, tu asistente holográfica de **Ingeniería Ambiental** de la UNAL Medellín.

Estoy conectada a toda la información del portal: malla, fechas del calendario de Minas, Carpeta de Drive con parciales y talleres, grupos de WhatsApp de estudio, semilleros (AMET, POLYGESTA, MINKA, Oceánicos), convenios y trámites. ¿En qué te doy una mano?`,
      chipsIniciales,
      false
    );
  }

  /* ==========================================================================
     9. CONTROL Y EVENTOS
     ========================================================================== */

  function abrirSofia() {
    const ventana = document.getElementById('sofia-ventana');
    const btn = document.getElementById('sofia-btn-toggle');
    const globo = document.getElementById('sofia-globo');
    if (!ventana || !btn) return;

    inicializarBaseConocimiento();

    ventana.hidden = false;
    void ventana.offsetWidth;
    ventana.classList.add('is-abierta');
    btn.setAttribute('aria-expanded', 'true');
    estadoSofia.abierto = true;

    if (globo) globo.style.display = 'none';

    setTimeout(() => {
      document.getElementById('sofia-input')?.focus();
      const contenedor = document.getElementById('sofia-mensajes');
      if (contenedor) contenedor.scrollTop = contenedor.scrollHeight;
    }, 200);
  }

  function cerrarSofia() {
    const ventana = document.getElementById('sofia-ventana');
    const btn = document.getElementById('sofia-btn-toggle');
    if (!ventana || !btn) return;

    ventana.classList.remove('is-abierta');
    btn.setAttribute('aria-expanded', 'false');
    estadoSofia.abierto = false;

    setTimeout(() => {
      if (!estadoSofia.abierto) {
        ventana.hidden = true;
      }
    }, 280);
  }

  function procesarConsultaUsuario(texto) {
    const consultaLimpia = (texto || '').trim();
    if (!consultaLimpia) return;

    agregarMensajeAlDOM('usuario', consultaLimpia);

    const input = document.getElementById('sofia-input');
    if (input) input.value = '';

    mostrarIndicadorEscribiendo();

    setTimeout(() => {
      removerIndicadorEscribiendo();
      const respuesta = responderPregunta(consultaLimpia);
      agregarMensajeAlDOM('bot', respuesta.texto, respuesta.chips);
    }, 320);
  }

  function vincularEventos() {
    const btnToggle = document.getElementById('sofia-btn-toggle');
    const btnCerrar = document.getElementById('sofia-btn-cerrar');
    const btnLimpiar = document.getElementById('sofia-btn-limpiar');
    const globoCerrar = document.getElementById('sofia-globo-cerrar');
    const globo = document.getElementById('sofia-globo');
    const formulario = document.getElementById('sofia-form');
    const contenedorMensajes = document.getElementById('sofia-mensajes');

    btnToggle?.addEventListener('click', () => {
      if (estadoSofia.abierto) cerrarSofia();
      else abrirSofia();
    });

    btnCerrar?.addEventListener('click', cerrarSofia);

    globo?.addEventListener('click', (e) => {
      if (e.target.closest('#sofia-globo-cerrar')) return;
      abrirSofia();
    });

    globoCerrar?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (globo) globo.remove();
      sessionStorage.setItem('ambiental.sofia.globo_oculto', '1');
    });

    if (sessionStorage.getItem('ambiental.sofia.globo_oculto') === '1' && globo) {
      globo.remove();
    }

    btnLimpiar?.addEventListener('click', () => {
      sessionStorage.removeItem('ambiental.sofia.historial');
      estadoSofia.mensajes = [];
      cargarHistorialGuardado();
    });

    formulario?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('sofia-input');
      if (input) procesarConsultaUsuario(input.value);
    });

    contenedorMensajes?.addEventListener('click', (e) => {
      const chip = e.target.closest('.sofia-chip');
      if (chip) {
        const consulta = chip.getAttribute('data-consulta');
        if (consulta) procesarConsultaUsuario(consulta);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && estadoSofia.abierto) {
        cerrarSofia();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearElementosDOM);
  } else {
    crearElementosDOM();
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => inicializarBaseConocimiento(), { timeout: 3000 });
  } else {
    setTimeout(inicializarBaseConocimiento, 1500);
  }

  window.sofIA = {
    abrir: abrirSofia,
    cerrar: cerrarSofia,
    preguntar: procesarConsultaUsuario,
    responder: responderPregunta,
    inicializar: inicializarBaseConocimiento,
  };
})();
