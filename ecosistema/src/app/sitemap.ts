import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { navSections } from "@/config/navigation";
import { contentSource } from "@/lib/content";
import { listEvents } from "@/server/services/events";
import { listThreads } from "@/server/services/community";

export const dynamic = "force-dynamic";

/** Incluye páginas estáticas, artículos, talleres y contenido real de la comunidad (excluye ejemplos). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, workshops, discussions, proposals, events] = await Promise.all([
    contentSource.listArticles(),
    contentSource.listWorkshops(),
    listThreads({ kind: "discussion" }, null),
    listThreads({ kind: "proposal" }, null),
    listEvents("upcoming", null),
  ]);
  const staticPaths = ["/", "/contacto", "/privacidad", "/comunidad/normas", "/consultoria/servicios", ...navSections.flatMap((s) => s.links.map((l) => l.href))];
  const url = (p: string) => `${site.url}${p}`;
  return [
    ...Array.from(new Set(staticPaths)).map((p) => ({ url: url(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...articles.map((a) => ({ url: url(`/datos-con-datos/articulos/${a.slug}`), lastModified: a.updatedAt ?? a.publishedAt, priority: 0.8 })),
    ...workshops.map((w) => ({ url: url(`/consultoria/talleres/${w.slug}`), priority: 0.6 })),
    ...discussions.filter((t) => !t.isDemo).map((t) => ({ url: url(`/comunidad/discusiones/${t.id}`), lastModified: t.lastActivityAt, priority: 0.5 })),
    ...proposals.filter((t) => !t.isDemo).map((t) => ({ url: url(`/comunidad/propuestas/${t.id}`), lastModified: t.lastActivityAt, priority: 0.5 })),
    ...events.filter((e) => !e.isDemo).map((e) => ({ url: url(`/comunidad/eventos/${e.slug}`), priority: 0.6 })),
  ];
}
