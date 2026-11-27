import Link from "next/link";
import type { Metadata } from "next";
import { Visual } from "@/components/diagrams/Visual";
import { CtaBand, PageHero } from "@/components/ui/primitives";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Servicios de consultoría en datos",
  description: "Diagnóstico de madurez, estrategia, arquitectura de datos moderna, gobierno y calidad de datos, y Data & AI.",
  path: "/consultoria/servicios",
});

export default async function ServicesPage() {
  const groups = await contentSource.listServiceGroups();
  return (
    <>
      <PageHero
        eyebrow="Consultoría"
        title="Servicios"
        lead="Cuatro líneas de trabajo que pueden contratarse por separado o combinarse en un programa. Cada propuesta se ajusta al tamaño, la madurez y los objetivos de tu organización."
        breadcrumbs={[{ name: "Consultoría", href: "/consultoria" }, { name: "Servicios" }]}
      >
        <nav aria-label="Líneas de servicio" className="chip-nav">
          {groups.map((g) => (
            <a key={g.slug} href={`#${g.slug}`} className="chip">
              {g.name}
            </a>
          ))}
        </nav>
      </PageHero>

      <section className="section section--tight">
        <div className="container">
          {groups.map((g, i) => (
            <section key={g.slug} id={g.slug} className="service-group" aria-labelledby={`${g.slug}-title`}>
              <div className="stack">
                <span className="service-group__index">0{i + 1} / 0{groups.length}</span>
                <h2 id={`${g.slug}-title`} className="h2" style={{ fontSize: "clamp(1.6rem, 1.3rem + 1vw, 2.1rem)" }}>
                  {g.name}
                </h2>
                <p className="muted">{g.summary}</p>
                <div>
                  <span className="eyebrow eyebrow--plain">Entregables típicos</span>
                  <ul className="check-list small" style={{ marginTop: "var(--space-3)" }}>
                    {g.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
                <Link href={`/contacto?tipo=consultoria&ref=${encodeURIComponent(g.name)}`} className="link-arrow">
                  Consultar por este servicio →
                </Link>
              </div>
              <div className="stack stack--lg">
                {g.slug === "arquitectura-de-datos" && (
                  <figure className="figure__media" style={{ margin: 0 }}>
                    <Visual name="medallion" />
                  </figure>
                )}
                {g.slug === "gobierno-y-calidad" && (
                  <figure className="figure__media" style={{ margin: 0 }}>
                    <Visual name="governance-loop" />
                  </figure>
                )}
                <div className="service-list">
                  {g.items.map((item) => (
                    <div key={item.name} className="service-item">
                      <h3 className="h4">{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
          <p className="xsmall muted" style={{ marginTop: "var(--space-6)" }}>
            El catálogo describe tipos de trabajo y su alcance habitual. Cada propuesta concreta se define después de una conversación inicial.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <CtaBand title="¿No sabes por dónde empezar?" text="Un diagnóstico de madurez suele ser el mejor primer paso: ordena prioridades antes de invertir.">
            <Link href="/contacto?tipo=diagnostico" className="btn btn--light btn--lg">
              Solicitar un diagnóstico
            </Link>
          </CtaBand>
        </div>
      </section>
    </>
  );
}
