/**
 * Tipos del contenido editorial. Son el contrato entre la interfaz y la
 * fuente de contenido (hoy: módulos locales; mañana: un CMS headless).
 * Ver src/server/content/source.ts.
 */

export type VisualKey =
  | "network-request"
  | "cloud-layers"
  | "token-prediction"
  | "auth-factors"
  | "data-information"
  | "energy-grid"
  | "medallion"
  | "governance-loop"
  | "ecosystem";

/** Texto con formato mínimo: **negrita**, *cursiva* y [enlace](https://...) */
export type RichText = string;

export type ArticleBlock =
  | { type: "p"; text: RichText }
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "ul" | "ol"; items: RichText[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; title: string; text: RichText }
  | { type: "figure"; visual: VisualKey; caption: string }
  | { type: "youtube"; videoId: string; title: string }
  | { type: "social"; network: "linkedin" | "instagram" | "tiktok" | "youtube"; url: string; label: string };

export interface Source {
  title: string;
  publisher: string;
  url?: string;
  year?: string;
}

export interface Pillar {
  slug: string;
  number: string;
  name: string;
  description: string;
}

export interface Author {
  name: string;
  role: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  pillar: string;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  author: Author;
  visual: VisualKey;
  featured?: boolean;
  blocks: ArticleBlock[];
  sources: Source[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  related?: string;
}

export interface ExternalResource {
  title: string;
  publisher: string;
  url: string;
  description: string;
  kind: "guía" | "estándar" | "documentación" | "datos abiertos" | "marco de referencia" | "herramienta";
  topic: string;
}

export interface ServiceItem {
  name: string;
  description: string;
}

export interface ServiceGroup {
  slug: string;
  name: string;
  summary: string;
  outcomes: string[];
  items: ServiceItem[];
}

export interface Workshop {
  slug: string;
  title: string;
  summary: string;
  objective: string;
  audience: string[];
  duration: string;
  modality: string;
  level: "Introductorio" | "Intermedio" | "Avanzado";
  contents: string[];
  outcomes: string[];
}
