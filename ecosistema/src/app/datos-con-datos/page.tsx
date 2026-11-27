import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { ArrowRight } from "@/components/ui/icons";
import { PageHero, SectionHead } from "@/components/ui/primitives";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Datos con Datos — Divulgación tecnológica",
  description:
    "Datos con Datos es un medio de educación y divulgación tecnológica que ayuda a comprender el mundo digital, desde las herramientas cotidianas hasta las tecnologías que transforman el futuro.",
  path: "/datos-con-datos",
});

export default async function DcdHome() {
  const [articles, pillars] = await Promise.all([contentSource.listArticles(), contentSource.listPillars()]);
  const featured = articles.filter((a) => a.featured);
  const latest = articles.filter((a) => !featured.slice(0, 1).includes(a)).slice(0, 6);
  const counts = Object.fromEntries(pillars.map((p) => [p.slug, articles.filter((a) => a.pillar === p.slug).length]));

  return (
    <>
      <PageHero
        brandSurface
        eyebrow="DCD · Divulgación tecnológica"
        title={site.tagline}
        lead="Un medio de educación y divulgación que ayuda a comprender el mundo digital: desde las herramientas que usamos todos los días hasta las tecnologías que están transformando el futuro. Lenguaje sencillo, rigor técnico y pensamiento crítico."
      >
        <div className="cluster">
          <Link href="/datos-con-datos/articulos" className="btn btn--accent">
            Explorar artículos
          </Link>
          <Link href="/datos-con-datos/sobre-nosotros" className="btn btn--secondary">
            Nuestra línea editorial
          </Link>
        </div>
      </PageHero>

      {featured[0] && (
        <section className="section" aria-label="Artículo destacado">
          <div className="container">
            <span className="eyebrow" style={{ marginBottom: "var(--space-5)" }}>
              Destacado
            </span>
            <div style={{ marginTop: "var(--space-5)" }}>
              <ArticleCard article={featured[0]} variant="featured" headingLevel={2} />
            </div>
          </div>
        </section>
      )}

      <section className="section section--white section--bordered" aria-labelledby="pilares">
        <div className="container">
          <SectionHead id="pilares" eyebrow="Pilares editoriales" title="Seis puertas de entrada al mundo digital." lead="No es un blog de ingeniería: es para cualquier persona que quiera entender la tecnología que la rodea." />
          <ul role="list" className="grid grid--3">
            {pillars.map((p) => (
              <li key={p.slug}>
                <Link href={`/datos-con-datos/articulos?pilar=${p.slug}`} className="card card--interactive card__link" style={{ height: "100%" }}>
                  <span className="mono muted">{p.number}</span>
                  <h3 className="h4">{p.name}</h3>
                  <p className="small muted">{p.description}</p>
                  <span className="card__foot xsmall muted">
                    {counts[p.slug] ?? 0} {counts[p.slug] === 1 ? "artículo" : "artículos"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="recientes">
        <div className="container">
          <SectionHead
            id="recientes"
            eyebrow="Publicaciones recientes"
            title="Lo último en Datos con Datos"
            action={
              <Link href="/datos-con-datos/articulos" className="link-arrow">
                Ver todo <span aria-hidden="true"><ArrowRight size={14} /></span>
              </Link>
            }
          />
          <div className="grid grid--3" style={{ ["--grid-gap" as string]: "var(--space-8) var(--space-6)" }}>
            {latest.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="newsletter">
            <div className="stack">
              <span className="eyebrow">Boletín DCD</span>
              <h2 className="h2">Recibe los nuevos artículos en tu correo.</h2>
            </div>
            <NewsletterForm source="dcd" idPrefix="dcd-nl" />
          </div>
        </div>
      </section>
    </>
  );
}
