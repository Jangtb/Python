import { articles, glossary, learningResources, pillars } from "@/content/dcd";
import { serviceGroups, workshops } from "@/content/consulting";
import type { Article, ArticleBlock, GlossaryTerm, ExternalResource, Pillar, ServiceGroup, Workshop } from "@/content/types";
import { readingMinutes } from "./text";

/**
 * Contrato de la fuente de contenido editorial. La implementación actual lee
 * módulos locales tipados (src/content). Para usar un CMS headless (se
 * recomienda Sanity, ver docs/ARQUITECTURA.md) basta con implementar esta
 * interfaz y exportarla como `contentSource`; las páginas no cambian.
 */
export interface ContentSource {
  listArticles(): Promise<Article[]>;
  getArticle(slug: string): Promise<Article | null>;
  listPillars(): Promise<Pillar[]>;
  listGlossary(): Promise<GlossaryTerm[]>;
  listLearningResources(): Promise<ExternalResource[]>;
  listServiceGroups(): Promise<ServiceGroup[]>;
  listWorkshops(): Promise<Workshop[]>;
  getWorkshop(slug: string): Promise<Workshop | null>;
}

const localSource: ContentSource = {
  async listArticles() {
    return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },
  async getArticle(slug) {
    return articles.find((a) => a.slug === slug) ?? null;
  },
  async listPillars() {
    return pillars;
  },
  async listGlossary() {
    return [...glossary].sort((a, b) => a.term.localeCompare(b.term, "es"));
  },
  async listLearningResources() {
    return learningResources;
  },
  async listServiceGroups() {
    return serviceGroups;
  },
  async listWorkshops() {
    return workshops;
  },
  async getWorkshop(slug) {
    return workshops.find((w) => w.slug === slug) ?? null;
  },
};

export const contentSource: ContentSource = localSource;

/* ----------------------- Utilidades independientes de la fuente ----------------------- */

function plain(text: string): string {
  return text.replace(/\*\*|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function articlePlainText(article: Article): string {
  const parts: string[] = [article.title, article.excerpt];
  for (const b of article.blocks) {
    if (b.type === "p" || b.type === "callout") parts.push(plain(b.text));
    if (b.type === "callout") parts.push(b.title);
    if (b.type === "h2" || b.type === "h3" || b.type === "quote") parts.push(b.text);
    if (b.type === "ul" || b.type === "ol") parts.push(...b.items.map(plain));
  }
  return parts.join(" ");
}

export function articleReadingMinutes(article: Article): number {
  return readingMinutes(articlePlainText(article));
}

export function tableOfContents(blocks: ArticleBlock[]): { id: string; text: string }[] {
  return blocks.filter((b): b is Extract<ArticleBlock, { type: "h2" }> => b.type === "h2").map((b) => ({ id: b.id, text: b.text }));
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export interface ArticleFilter {
  q?: string;
  pillar?: string;
  tag?: string;
}

export function filterArticles(list: Article[], filter: ArticleFilter): Article[] {
  const terms = filter.q ? normalize(filter.q).split(/\s+/).filter(Boolean) : [];
  return list.filter((a) => {
    if (filter.pillar && a.pillar !== filter.pillar) return false;
    if (filter.tag && !a.tags.includes(filter.tag)) return false;
    if (terms.length) {
      const haystack = normalize(`${articlePlainText(a)} ${a.tags.join(" ")}`);
      return terms.every((t) => haystack.includes(t));
    }
    return true;
  });
}

/** Relacionados: mismo pilar o etiquetas compartidas, ponderados. */
export function relatedArticles(article: Article, list: Article[], limit = 3): Article[] {
  return list
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({
      a,
      score: (a.pillar === article.pillar ? 3 : 0) + a.tags.filter((t) => article.tags.includes(t)).length * 2,
    }))
    .sort((x, y) => y.score - x.score || y.a.publishedAt.localeCompare(x.a.publishedAt))
    .slice(0, limit)
    .map((x) => x.a);
}

export function allTags(list: Article[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of list) for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function pillarName(slug: string): string {
  return pillars.find((p) => p.slug === slug)?.name ?? slug;
}
