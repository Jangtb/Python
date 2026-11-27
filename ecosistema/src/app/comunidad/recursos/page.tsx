import Link from "next/link";
import type { Metadata } from "next";
import { communityResources } from "@/content/community-resources";
import { ArrowUpRight } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Recursos de la comunidad",
  description: "Marcos de referencia, estándares, documentación y datos abiertos seleccionados para profesionales de datos.",
  path: "/comunidad/recursos",
});

export default function CommunityResourcesPage() {
  const topics = Array.from(new Set(communityResources.map((r) => r.topic)));
  return (
    <>
      <PageHero
        eyebrow="Comunidad de Datos"
        title="Recursos compartidos"
        lead="Una selección de marcos, estándares y documentación pública útil para el trabajo con datos. ¿Conoces un recurso valioso? Propónlo a la comunidad."
        breadcrumbs={[{ name: "Comunidad", href: "/comunidad" }, { name: "Recursos" }]}
      >
        <div className="cluster">
          <Link href="/comunidad/propuestas/nueva" className="btn btn--accent">
            Proponer un recurso
          </Link>
        </div>
      </PageHero>
      <section className="section section--tight">
        <div className="container stack stack--lg">
          {topics.map((topic) => (
            <section key={topic} aria-labelledby={`t-${topic}`}>
              <h2 id={`t-${topic}`} className="eyebrow" style={{ marginBottom: "var(--space-4)" }}>
                {topic}
              </h2>
              <ul role="list" className="grid grid--3">
                {communityResources
                  .filter((r) => r.topic === topic)
                  .map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="card card--interactive card__link" style={{ height: "100%" }}>
                        <span className="card__meta">
                          <span className="badge">{r.kind}</span>
                          <span>{r.publisher}</span>
                        </span>
                        <span className="h4 cluster" style={{ ["--cluster-gap" as string]: "0.35rem" }}>
                          {r.title} <ArrowUpRight size={14} />
                        </span>
                        <span className="small muted">{r.description}</span>
                        <span className="visually-hidden">(enlace externo, se abre en una nueva pestaña)</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <p className="xsmall muted">Enlaces a sitios de terceros. Datos con Datos no está afiliado a estas organizaciones.</p>
        </div>
      </section>
    </>
  );
}
