import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { Visual } from "@/components/diagrams/Visual";
import { ArticleBody } from "@/components/editorial/ArticleBody";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { JsonLd } from "@/components/ui/JsonLd";
import { Breadcrumbs } from "@/components/ui/primitives";
import { articleReadingMinutes, contentSource, pillarName, relatedArticles, tableOfContents } from "@/lib/content";
import { formatDate } from "@/lib/dates";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const articles = await contentSource.listArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await contentSource.getArticle(slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/datos-con-datos/articulos/${slug}`,
    type: "article",
    publishedTime: article.publishedAt,
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [article, all] = await Promise.all([contentSource.getArticle(slug), contentSource.listArticles()]);
  if (!article) notFound();
  const toc = tableOfContents(article.blocks);
  const related = relatedArticles(article, all);
  const path = `/datos-con-datos/articulos/${slug}`;
  const coverFigure = article.blocks.find((b) => b.type === "figure" && b.visual === article.visual);
  const coverCaption = coverFigure?.type === "figure" ? coverFigure.caption : null;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt ?? article.publishedAt,
          inLanguage: "es",
          author: { "@type": "Organization", name: article.author.name },
          publisher: { "@type": "Organization", name: site.name, url: site.url },
          mainEntityOfPage: absoluteUrl(path),
          articleSection: pillarName(article.pillar),
          keywords: article.tags.join(", "),
          citation: article.sources.map((s) => s.url ?? s.title),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Datos con Datos", path: "/datos-con-datos" },
          { name: "Artículos", path: "/datos-con-datos/articulos" },
          { name: article.title, path },
        ])}
      />

      <header className="article-header">
        <div className="container container--narrow" style={{ maxWidth: "calc(900px + var(--gutter) * 2)" }}>
          <Breadcrumbs items={[{ name: "Datos con Datos", href: "/datos-con-datos" }, { name: "Artículos", href: "/datos-con-datos/articulos" }, { name: pillarName(article.pillar) }]} />
          <Link href={`/datos-con-datos/articulos?pilar=${article.pillar}`} className="badge badge--accent" style={{ textDecoration: "none" }}>
            {pillarName(article.pillar)}
          </Link>
          <h1 className="h1" style={{ marginTop: "var(--space-5)" }}>
            {article.title}
          </h1>
          <p className="lead" style={{ marginTop: "var(--space-5)" }}>
            {article.excerpt}
          </p>
          <div className="article-header__meta">
            <span>
              Por <strong>{article.author.name}</strong>
            </span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            <span>{articleReadingMinutes(article)} min de lectura</span>
          </div>
        </div>
      </header>

      <div className="container">
        <figure style={{ margin: 0 }}>
          <div className="article-cover">
            <Visual name={article.visual} decorative={!coverCaption} />
          </div>
          {coverCaption && (
            <figcaption className="small muted" style={{ marginTop: "var(--space-3)", maxWidth: "80ch" }}>
              {coverCaption}
            </figcaption>
          )}
        </figure>
      </div>

      <div className="container">
        <div className="article-layout">
          <aside className="article-aside" aria-label="Índice del artículo">
            {toc.length > 1 && (
              <nav className="toc article-aside__sticky">
                <span className="eyebrow eyebrow--plain">En este artículo</span>
                <ol>
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`}>{t.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </aside>

          <div>
            <ArticleBody blocks={article.blocks} coverVisual={article.visual} />
            {article.sources.length > 0 && (
              <section className="sources" aria-labelledby="fuentes">
                <h2 id="fuentes" className="h4" style={{ marginBottom: "var(--space-4)" }}>
                  Fuentes consultadas
                </h2>
                <ol>
                  {article.sources.map((s) => (
                    <li key={s.title}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.title}
                        </a>
                      ) : (
                        <span>{s.title}</span>
                      )}
                      . {s.publisher}
                      {s.year ? `, ${s.year}` : ""}.
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <div className="cluster rule-top" style={{ marginTop: "var(--space-7)", justifyContent: "space-between" }}>
              <div className="cluster">
                {article.tags.map((t) => (
                  <Link key={t} href={`/datos-con-datos/articulos?etiqueta=${encodeURIComponent(t)}`} className="tag">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="article-aside">
            <div className="article-aside__sticky stack stack--lg">
              <ShareButtons url={absoluteUrl(path)} title={article.title} />
              <div className="panel stack stack--sm" data-brand="comunidad">
                <span className="eyebrow eyebrow--plain">¿Te quedó una duda?</span>
                <p className="small muted">Plantéala en la Comunidad de Datos y conversa con otras personas.</p>
                <Link href="/comunidad/discusiones/nueva" className="link-arrow">
                  Preguntar en la comunidad →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section--white section--bordered" aria-labelledby="relacionados">
          <div className="container">
            <h2 id="relacionados" className="h2" style={{ marginBottom: "var(--space-7)" }}>
              Sigue leyendo
            </h2>
            <div className="grid grid--3" style={{ ["--grid-gap" as string]: "var(--space-8) var(--space-6)" }}>
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight">
        <div className="container">
          <div className="newsletter">
            <div className="stack">
              <span className="eyebrow">Boletín DCD</span>
              <p className="h2">¿Te sirvió? Recibe el próximo artículo en tu correo.</p>
            </div>
            <NewsletterForm source={`articulo:${slug}`} idPrefix="art-nl" />
          </div>
        </div>
      </section>
    </article>
  );
}
