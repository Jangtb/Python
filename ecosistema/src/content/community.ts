import type { EventFormat, EventModality, ThreadStatus } from "@/server/store/types";

export interface CommunityCategory {
  slug: string;
  name: string;
  description: string;
}

export const communityCategories: CommunityCategory[] = [
  { slug: "gobierno-de-datos", name: "Gobierno de Datos", description: "Modelos operativos, roles, políticas y estándares." },
  { slug: "arquitectura-de-datos", name: "Arquitectura de Datos", description: "Lakehouse, warehouse, modelado e integración." },
  { slug: "ingenieria-de-datos", name: "Ingeniería de Datos", description: "Pipelines, orquestación, rendimiento y operación." },
  { slug: "data-quality", name: "Data Quality", description: "Reglas, monitoreo, contratos y remediación." },
  { slug: "analitica-y-bi", name: "Analítica y BI", description: "Modelos semánticos, visualización y decisiones." },
  { slug: "inteligencia-artificial", name: "Inteligencia Artificial", description: "Casos de uso, datos para IA y uso responsable." },
  { slug: "data-management", name: "Data Management", description: "Metadatos, catálogo, linaje y datos maestros." },
  { slug: "seguridad-y-privacidad", name: "Seguridad y privacidad", description: "Protección de datos, accesos y cumplimiento." },
  { slug: "estrategia-y-negocio", name: "Estrategia y negocio", description: "Valor, priorización y adopción." },
  { slug: "carrera-y-desarrollo", name: "Carrera y desarrollo profesional", description: "Aprendizaje, roles y crecimiento." },
  { slug: "eventos-y-networking", name: "Eventos y networking", description: "Encuentros, comunidades y colaboración." },
];

export const proposalTypes = [
  { slug: "proyecto", name: "Proyecto colaborativo" },
  { slug: "investigacion", name: "Investigación" },
  { slug: "encuentro", name: "Encuentro" },
  { slug: "taller", name: "Taller" },
  { slug: "herramienta", name: "Herramienta" },
  { slug: "recurso", name: "Recurso compartido" },
  { slug: "regional", name: "Iniciativa regional" },
] as const;

export const threadStatusLabels: Record<ThreadStatus, string> = {
  open: "Abierto",
  discussion: "En discusión",
  resolved: "Resuelto",
  archived: "Archivado",
};

export const eventFormatLabels: Record<EventFormat, string> = {
  charla: "Charla",
  workshop: "Workshop",
  meetup: "Meetup",
  conversatorio: "Conversatorio",
  seminario: "Seminario",
};

export const eventModalityLabels: Record<EventModality, string> = {
  online: "Online",
  presencial: "Presencial",
  hibrida: "Híbrida",
};

export const reportReasons = [
  { value: "spam", label: "Spam o publicidad" },
  { value: "abuso", label: "Lenguaje abusivo u ofensivo" },
  { value: "fuera_de_tema", label: "Fuera de tema" },
  { value: "informacion_personal", label: "Expone información personal" },
  { value: "otro", label: "Otro motivo" },
] as const;

export function categoryName(slug: string): string {
  return communityCategories.find((c) => c.slug === slug)?.name ?? slug;
}

export function proposalTypeName(slug: string | null): string | null {
  if (!slug) return null;
  return proposalTypes.find((p) => p.slug === slug)?.name ?? slug;
}

/** Normas de convivencia visibles en registro y al publicar. */
export const communityGuidelines = [
  "Comparte desafíos reales y da contexto suficiente para que otros puedan ayudar.",
  "No publiques datos personales, credenciales ni información confidencial de tu organización.",
  "Debate ideas, no personas. Se moderan los mensajes ofensivos o discriminatorios.",
  "Evita la autopromoción: los enlaces comerciales sin contexto se consideran spam.",
  "Si una respuesta resolvió tu problema, márcala como solución para ayudar a quien venga después.",
];
