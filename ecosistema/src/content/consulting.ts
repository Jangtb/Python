import type { ServiceGroup, Workshop } from "./types";

/**
 * PERFIL PROFESIONAL — contenido provisional centralizado.
 * Reemplaza los campos marcados en `provisional` con información real y
 * elimina la clave correspondiente del arreglo: la interfaz deja de mostrar
 * la marca "Provisional" automáticamente.
 */
export const profile = {
  name: "Nombre Apellido",
  headline: "Data & AI Strategy | Architecture | Governance",
  statement:
    "Ayudo a organizaciones a comprender, estructurar y aprovechar sus datos mediante estrategias, arquitecturas y prácticas de gobierno que conectan la tecnología con los objetivos del negocio.",
  shortBio:
    "Texto provisional: aquí va una presentación breve, en primera persona, de dos o tres frases sobre tu trayectoria y lo que te motiva en el trabajo con datos.",
  location: "Ubicación por confirmar · trabajo remoto y presencial",
  photoUrl: null as string | null,
  /** Tecnologías: confirmar solo las respaldadas por experiencia real. */
  stack: ["Azure", "Databricks", "Microsoft Purview", "Power BI", "Python", "SQL"],
  provisional: ["name", "shortBio", "location", "stack", "timeline", "photo"] as string[],
  timeline: [
    { period: "Periodo", role: "Rol", organization: "Organización", summary: "Descripción breve del desafío, tu responsabilidad y lo que cambió gracias a tu trabajo." },
    { period: "Periodo", role: "Rol", organization: "Organización", summary: "Descripción breve del desafío, tu responsabilidad y lo que cambió gracias a tu trabajo." },
    { period: "Periodo", role: "Rol", organization: "Organización", summary: "Descripción breve del desafío, tu responsabilidad y lo que cambió gracias a tu trabajo." },
  ],
};

export function isProvisional(field: string): boolean {
  return profile.provisional.includes(field);
}

export const focusAreas = [
  { name: "Arquitectura de datos", description: "Plataformas que ordenan el flujo de datos desde las fuentes hasta las decisiones." },
  { name: "Ingeniería de datos", description: "Pipelines confiables, mantenibles y observables." },
  { name: "Gobierno de datos", description: "Roles, reglas y procesos que funcionan en la práctica, no solo en el papel." },
  { name: "Calidad y modelado", description: "Datos con significado acordado y reglas de calidad medibles." },
  { name: "Estrategia tecnológica", description: "Prioridades y hojas de ruta conectadas con objetivos del negocio." },
  { name: "Liderazgo técnico", description: "Acompañar equipos, ordenar decisiones y transferir capacidades." },
];

export const principles = [
  {
    title: "Primero el problema, después la herramienta",
    text: "Cada recomendación parte de una pregunta del negocio. La tecnología se elige porque resuelve esa pregunta, no por moda.",
  },
  {
    title: "Avances visibles en semanas, no en años",
    text: "Los programas de datos fracasan cuando tardan demasiado en mostrar valor. Prefiero iteraciones cortas sobre casos concretos.",
  },
  {
    title: "Gobierno que se usa",
    text: "Políticas y roles diseñados con quienes trabajan los datos todos los días, para que formen parte del flujo de trabajo y no lo frenen.",
  },
  {
    title: "Transferir capacidades",
    text: "El objetivo es que tu equipo pueda sostener y evolucionar lo construido. Documentación, acompañamiento y formación son parte del trabajo.",
  },
];

export const engagementSteps = [
  { step: "Conversación inicial", text: "Entendemos el contexto, el desafío y si tiene sentido trabajar juntos. Sin costo." },
  { step: "Propuesta", text: "Alcance, entregables, plazos y forma de trabajo por escrito, ajustados a tu realidad." },
  { step: "Trabajo iterativo", text: "Ciclos cortos con revisiones periódicas y entregables utilizables desde el comienzo." },
  { step: "Cierre y traspaso", text: "Documentación, sesiones de transferencia y recomendaciones para los siguientes pasos." },
];

export const serviceGroups: ServiceGroup[] = [
  {
    slug: "estrategia-y-diagnostico",
    name: "Estrategia y diagnóstico de datos",
    summary: "Para saber dónde estás, a dónde quieres llegar y en qué orden avanzar.",
    outcomes: ["Mapa de situación actual", "Brechas priorizadas", "Hoja de ruta por etapas"],
    items: [
      { name: "Diagnóstico de madurez de datos", description: "Evaluación estructurada de gobierno, calidad, arquitectura, capacidades y cultura, con hallazgos accionables." },
      { name: "Evaluación de capacidades", description: "Revisión de equipos, procesos y herramientas para identificar qué existe, qué falta y qué sobra." },
      { name: "Estrategia de datos", description: "Definición de objetivos, principios y prioridades que alinean las iniciativas de datos con el negocio." },
      { name: "Roadmap de transformación", description: "Plan por etapas con iniciativas, dependencias, responsables y criterios de éxito." },
    ],
  },
  {
    slug: "arquitectura-de-datos",
    name: "Arquitectura de datos",
    summary: "Para construir una plataforma que crezca ordenadamente con la organización.",
    outcomes: ["Arquitectura objetivo documentada", "Modelos de datos", "Decisiones técnicas justificadas"],
    items: [
      { name: "Diseño de arquitectura moderna", description: "Arquitectura objetivo y de transición, considerando fuentes, volumen, costos y capacidades del equipo." },
      { name: "Arquitecturas medallion", description: "Organización en capas (bronze, silver, gold) con responsabilidades y reglas claras para cada una." },
      { name: "Modelado de datos", description: "Modelos dimensionales y de dominio que reflejan cómo funciona el negocio." },
      { name: "Data Warehouse y Data Lakehouse", description: "Evaluación de alternativas y diseño según casos de uso, no según tendencias." },
      { name: "Integración de fuentes", description: "Estrategias de ingesta, frecuencia y manejo de cambios en sistemas de origen." },
      { name: "Data Products", description: "Diseño de productos de datos con dueño, contrato y nivel de servicio definidos." },
    ],
  },
  {
    slug: "gobierno-y-calidad",
    name: "Gobierno y calidad de datos",
    summary: "Para que los datos tengan responsables, significado acordado y calidad medible.",
    outcomes: ["Modelo operativo de gobierno", "Glosario y catálogo inicial", "Reglas de calidad priorizadas"],
    items: [
      { name: "Modelos operativos de gobierno", description: "Estructura de decisiones proporcional al tamaño y la madurez de la organización." },
      { name: "Roles y responsabilidades", description: "Definición práctica de owners, stewards y custodios, con dedicación realista." },
      { name: "Catálogo y diccionario", description: "Glosario de negocio y catálogo técnico, empezando por los datos críticos." },
      { name: "Linaje", description: "Trazabilidad de los datos desde su origen hasta reportes y modelos." },
      { name: "Data Quality", description: "Dimensiones, reglas, umbrales y monitoreo de calidad con foco en impacto." },
      { name: "Data Contracts", description: "Acuerdos explícitos entre productores y consumidores de datos sobre estructura y calidad." },
      { name: "Gestión de metadatos", description: "Prácticas para capturar y mantener contexto técnico y de negocio." },
      { name: "Políticas y estándares", description: "Reglas claras y breves sobre uso, acceso, clasificación y retención." },
    ],
  },
  {
    slug: "data-and-ai",
    name: "Data & AI",
    summary: "Para identificar dónde la IA aporta valor real y preparar los datos que necesita.",
    outcomes: ["Casos de uso evaluados", "Arquitectura de solución", "Criterios de uso responsable"],
    items: [
      { name: "Evaluación de oportunidades de IA", description: "Identificación y priorización de casos según valor, factibilidad y riesgo." },
      { name: "Casos de uso", description: "Definición detallada de problema, datos necesarios, métricas de éxito y riesgos." },
      { name: "Arquitectura de soluciones", description: "Diseño de cómo una solución de IA se integra con los datos y sistemas existentes." },
      { name: "Preparación y gobierno de datos para IA", description: "Calidad, permisos, trazabilidad y documentación de los datos que alimentan modelos." },
      { name: "Automatización y asistentes inteligentes", description: "Exploración de asistentes y automatizaciones con alcance acotado y evaluación explícita." },
    ],
  },
];

export const workshopAudiences = ["Empresas", "Equipos tecnológicos", "Instituciones educativas", "Emprendedores", "Profesionales"];

/** Formatos referenciales: duración y modalidad se ajustan a cada organización. */
export const workshops: Workshop[] = [
  {
    slug: "introduccion-al-gobierno-de-datos",
    title: "Introducción al gobierno de datos",
    summary: "Qué es, para qué sirve y cómo empezar sin crear burocracia.",
    objective: "Que los participantes comprendan los componentes del gobierno de datos y puedan identificar los primeros pasos para su organización.",
    audience: ["Empresas", "Equipos tecnológicos", "Profesionales"],
    duration: "4 horas (formato referencial)",
    modality: "Online o presencial",
    level: "Introductorio",
    contents: [
      "Por qué los datos necesitan reglas y responsables",
      "Componentes: roles, políticas, calidad, metadatos y seguridad",
      "Modelos operativos centralizados, federados e híbridos",
      "Cómo elegir los primeros datos críticos",
      "Ejercicio: mapa de responsables para un caso real",
    ],
    outcomes: ["Vocabulario común en el equipo", "Primer mapa de datos críticos y responsables", "Lista de próximos pasos"],
  },
  {
    slug: "cultura-y-alfabetizacion-de-datos",
    title: "Cultura y alfabetización de datos",
    summary: "Leer, cuestionar y comunicar datos en el trabajo cotidiano.",
    objective: "Desarrollar habilidades básicas para interpretar datos, reconocer errores frecuentes y tomar decisiones informadas.",
    audience: ["Empresas", "Instituciones educativas", "Profesionales"],
    duration: "3 horas (formato referencial)",
    modality: "Online o presencial",
    level: "Introductorio",
    contents: [
      "Dato, información y conocimiento",
      "Preguntas que hacer ante cualquier cifra",
      "Errores comunes: promedios, correlaciones y gráficos engañosos",
      "Cómo comunicar un hallazgo con claridad",
    ],
    outcomes: ["Criterios compartidos para leer datos", "Lista de verificación para revisar reportes"],
  },
  {
    slug: "calidad-de-datos-en-la-practica",
    title: "Calidad de datos en la práctica",
    summary: "Definir, medir y mejorar la calidad con foco en el impacto.",
    objective: "Que el equipo pueda definir reglas de calidad priorizadas, medirlas y establecer un proceso de mejora.",
    audience: ["Equipos tecnológicos", "Empresas"],
    duration: "6 horas en dos sesiones (formato referencial)",
    modality: "Online o presencial",
    level: "Intermedio",
    contents: [
      "Dimensiones de calidad: completitud, unicidad, validez, consistencia, oportunidad",
      "De la expectativa del negocio a la regla medible",
      "Priorización por impacto",
      "Monitoreo, alertas y comunicación de resultados",
      "Ejercicio práctico con datos de ejemplo",
    ],
    outcomes: ["Catálogo inicial de reglas de calidad", "Propuesta de proceso de remediación"],
  },
  {
    slug: "arquitectura-de-datos-moderna",
    title: "Arquitectura de datos moderna",
    summary: "Warehouse, lakehouse y medallion explicados con criterio.",
    objective: "Comprender los patrones de arquitectura actuales y los criterios para elegir entre ellos.",
    audience: ["Equipos tecnológicos", "Profesionales"],
    duration: "6 horas (formato referencial)",
    modality: "Online o presencial",
    level: "Intermedio",
    contents: [
      "Evolución: del data warehouse al lakehouse",
      "Arquitectura medallion: responsabilidades de cada capa",
      "Modelado dimensional y de dominio",
      "Integración, orquestación y observabilidad",
      "Criterios de decisión y errores frecuentes",
    ],
    outcomes: ["Marco de decisión para la arquitectura propia", "Diagrama de arquitectura objetivo preliminar"],
  },
  {
    slug: "introduccion-a-la-inteligencia-artificial",
    title: "Introducción a la inteligencia artificial",
    summary: "Qué es la IA, cómo funciona y dónde puede aportar en tu contexto.",
    objective: "Entregar una comprensión clara y sin tecnicismos innecesarios de la IA y sus aplicaciones.",
    audience: ["Empresas", "Instituciones educativas", "Emprendedores", "Profesionales"],
    duration: "3 horas (formato referencial)",
    modality: "Online o presencial",
    level: "Introductorio",
    contents: [
      "Conceptos clave: aprendizaje automático, modelos de lenguaje, IA generativa",
      "Qué puede y qué no puede hacer la IA hoy",
      "Ejemplos de uso por área",
      "Cómo identificar oportunidades en tu organización",
    ],
    outcomes: ["Lista inicial de oportunidades", "Criterios para evaluar herramientas"],
  },
  {
    slug: "uso-responsable-de-ia",
    title: "Uso responsable de IA",
    summary: "Riesgos, buenas prácticas y criterios para adoptar IA con cuidado.",
    objective: "Establecer criterios prácticos para usar herramientas de IA protegiendo información, personas y reputación.",
    audience: ["Empresas", "Instituciones educativas", "Profesionales"],
    duration: "3 horas (formato referencial)",
    modality: "Online o presencial",
    level: "Introductorio",
    contents: [
      "Riesgos: errores, sesgos, privacidad y propiedad intelectual",
      "Qué información no compartir con herramientas externas",
      "Verificación y supervisión humana",
      "Elementos de una política interna de uso de IA",
    ],
    outcomes: ["Borrador de lineamientos de uso de IA", "Checklist de verificación"],
  },
  {
    slug: "fundamentos-de-analisis-de-datos",
    title: "Fundamentos de análisis de datos",
    summary: "De la pregunta al hallazgo: un proceso de análisis ordenado.",
    objective: "Aplicar un proceso básico de análisis: formular preguntas, preparar datos, analizar y comunicar.",
    audience: ["Emprendedores", "Profesionales", "Instituciones educativas"],
    duration: "6 horas en dos sesiones (formato referencial)",
    modality: "Online o presencial",
    level: "Introductorio",
    contents: [
      "Formular buenas preguntas",
      "Preparar y limpiar datos",
      "Estadística descriptiva esencial",
      "Visualización efectiva",
      "Comunicación de resultados",
    ],
    outcomes: ["Un análisis completo sobre datos de ejemplo", "Plantilla de proceso de análisis"],
  },
  {
    slug: "datos-para-la-toma-de-decisiones",
    title: "Datos para la toma de decisiones",
    summary: "Para líderes: cómo pedir, leer y usar datos al decidir.",
    objective: "Que líderes y jefaturas integren datos en sus decisiones con criterio y conozcan sus límites.",
    audience: ["Empresas", "Emprendedores"],
    duration: "3 horas (formato referencial)",
    modality: "Online o presencial",
    level: "Introductorio",
    contents: [
      "Indicadores que importan y métricas de vanidad",
      "Cómo formular una pregunta a un equipo de datos",
      "Incertidumbre y calidad de la evidencia",
      "Rituales de revisión de indicadores",
    ],
    outcomes: ["Tablero de indicadores priorizado", "Preguntas guía para revisar reportes"],
  },
];
