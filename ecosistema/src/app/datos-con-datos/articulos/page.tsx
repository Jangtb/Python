import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { EmptyState, PageHero } from "@/components/ui/primitives";
import { allTags, contentSource, filterArticles, pillarName } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Artículos",
  description: "Artículos de divulgación tecnológica de Datos con Datos: internet, nube, inteligencia artificial, seguridad digital, ciencia y sociedad.",
  path: "/datos-con-datos/articulos",
});

type Search = Promise<{ q?: string; pilar?: string; etiqueta?: string }>;

export default async function ArticlesPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const [all, pillars] = await Promise.all([contentSource.listArticles(), contentSource.listPillars()]);
  const results = filterArticles(all, { q, pillar: params.pilar, tag: params.etiqueta });
  const tags = allTags(all);
  const filtered = Boolean(q || params.pilar || params.etiqueta);

  return (
    <>
      <PageHero
        eyebrow="Datos con Datos"
        title="Artículos"
        lead="Explicaciones con fuentes, para comprender la tecnología sin simplificarla de más."
        breadcrumbs={[{ name: "Datos con Datos", href: "/datos-con-datos" }, { name: "Artículos" }]}
      />
      <section className="section section--tight">
        <div className="container">
          <form className="filter-bar" role="search" action="/datos-con-datos/articulos" method="get">
            <div className="field">
              <label htmlFor="q" className="field__label">
                Buscar
              </label>
              <input id="q" name="q" type="search" className="input" defaultValue={q} placeholder="Ej.: contraseñas, nube, IA" />
            </div>
            <div className="field">
              <label htmlFor="pilar" className="field__label">
                Pilar
              </label>
              <select id="pilar" name="pilar" className="select" defaultValue={params.pilar ?? ""}>
                <option value="">Todos</option>
                {pillars.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="etiqueta" className="field__label">
                Etiqueta
              </label>
              <select id="etiqueta" name="etiqueta" className="select" defaultValue={params.etiqueta ?? ""}>
                <option value="">Todas</option>
                {tags.map((t) => (
                  <option key={t.tag} value={t.tag}>
                    {t.tag} ({t.count})
                  </option>
                ))}
              </select>
            </div>
            <div className="cluster">
              <button type="submit" className="btn btn--accent">
                Filtrar
              </button>
              {filtered && (
                <Link href="/datos-con-datos/articulos" className="btn btn--ghost">
                  Limpiar
                </Link>
              )}
            </div>
          </form>

          <p className="small muted" role="status" style={{ marginBottom: "var(--space-6)" }}>
            {results.length} {results.length === 1 ? "artículo" : "artículos"}
            {params.pilar ? ` en «${pillarName(params.pilar)}»` : ""}
            {params.etiqueta ? ` con la etiqueta «${params.etiqueta}»` : ""}
            {q ? ` para «${q}»` : ""}
          </p>

          {results.length ? (
            <div className="grid grid--3" style={{ ["--grid-gap" as string]: "var(--space-8) var(--space-6)" }}>
              {results.map((a) => (
                <ArticleCard key={a.slug} article={a} headingLevel={2} />
              ))}
            </div>
          ) : (
            <EmptyState title="No encontramos artículos con esos criterios." action={<Link href="/datos-con-datos/articulos">Ver todos los artículos</Link>}>
              Prueba con otras palabras o quita algún filtro.
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
