import Link from "next/link";
import type { Metadata } from "next";
import { workshopAudiences } from "@/content/consulting";
import { EmptyState, PageHero } from "@/components/ui/primitives";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Talleres y formación en datos e IA",
  description: "Talleres de gobierno de datos, calidad, arquitectura moderna, alfabetización de datos e inteligencia artificial para empresas, equipos e instituciones.",
  path: "/consultoria/talleres",
});

export default async function WorkshopsPage({ searchParams }: { searchParams: Promise<{ publico?: string }> }) {
  const { publico } = await searchParams;
  const all = await contentSource.listWorkshops();
  const list = publico ? all.filter((w) => w.audience.includes(publico)) : all;
  return (
    <>
      <PageHero
        eyebrow="Consultoría · Formación"
        title="Talleres"
        lead="Formación práctica para empresas, equipos tecnológicos, instituciones educativas, emprendedores y profesionales. Los contenidos y la duración se adaptan a cada grupo."
        breadcrumbs={[{ name: "Consultoría", href: "/consultoria" }, { name: "Talleres" }]}
      >
        <nav aria-label="Filtrar por público" className="chip-nav">
          <Link href="/consultoria/talleres" className="chip" aria-current={!publico ? "true" : undefined}>
            Todos
          </Link>
          {workshopAudiences.map((a) => (
            <Link key={a} href={`/consultoria/talleres?publico=${encodeURIComponent(a)}`} className="chip" aria-current={publico === a ? "true" : undefined}>
              {a}
            </Link>
          ))}
        </nav>
      </PageHero>
      <section className="section">
        <div className="container">
          {list.length ? (
            <ul role="list" className="grid grid--2">
              {list.map((w) => (
                <li key={w.slug}>
                  <article className="card card--interactive workshop-card" style={{ height: "100%" }}>
                    <div className="card__meta">
                      <span className="badge badge--accent">{w.level}</span>
                      <span>{w.audience.join(" · ")}</span>
                    </div>
                    <h2 className="h3">
                      <Link href={`/consultoria/talleres/${w.slug}`} className="card__link">
                        {w.title}
                      </Link>
                    </h2>
                    <p className="muted small">{w.summary}</p>
                    <dl className="workshop-card__specs specs card__foot">
                      <div>
                        <dt>Duración</dt>
                        <dd>{w.duration}</dd>
                      </div>
                      <div>
                        <dt>Modalidad</dt>
                        <dd>{w.modality}</dd>
                      </div>
                    </dl>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No hay talleres para ese público por ahora." action={<Link href="/contacto?tipo=taller">Proponer un taller a medida</Link>} />
          )}
        </div>
      </section>
    </>
  );
}
