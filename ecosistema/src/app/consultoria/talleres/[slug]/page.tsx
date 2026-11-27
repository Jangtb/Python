import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contactChannels } from "@/config/site";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageHero } from "@/components/ui/primitives";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { contentSource } from "@/lib/content";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await contentSource.listWorkshops()).map((w) => ({ slug: w.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const w = await contentSource.getWorkshop((await params).slug);
  return w ? pageMetadata({ title: `Taller: ${w.title}`, description: `${w.summary} ${w.objective}`, path: `/consultoria/talleres/${w.slug}` }) : {};
}

export default async function WorkshopPage({ params }: { params: Params }) {
  const w = await contentSource.getWorkshop((await params).slug);
  if (!w) notFound();
  const quoteHref = `/contacto?tipo=taller&ref=${encodeURIComponent(w.title)}`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: w.title,
          description: w.objective,
          url: absoluteUrl(`/consultoria/talleres/${w.slug}`),
          inLanguage: "es",
          educationalLevel: w.level,
          provider: { "@type": "Organization", name: "Datos con Datos" },
        }}
      />
      <PageHero
        eyebrow={`Taller · ${w.level}`}
        title={w.title}
        lead={w.summary}
        breadcrumbs={[{ name: "Consultoría", href: "/consultoria" }, { name: "Talleres", href: "/consultoria/talleres" }, { name: w.title }]}
      />
      <section className="section">
        <div className="container split split--aside">
          <div className="stack stack--lg">
            <div className="stack">
              <h2 className="h3">Objetivo</h2>
              <p className="lead">{w.objective}</p>
            </div>
            <div className="stack">
              <h2 className="h3">Contenidos</h2>
              <ol className="check-list">
                {w.contents.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </div>
            <div className="stack">
              <h2 className="h3">Resultados esperados</h2>
              <ul className="check-list">
                {w.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          </div>
          <aside className="panel stack" aria-label="Ficha del taller" style={{ alignSelf: "start", position: "sticky", top: "calc(var(--header-h) + 72px)" }}>
            <dl className="spec-table">
              <div>
                <dt>Público</dt>
                <dd>{w.audience.join(", ")}</dd>
              </div>
              <div>
                <dt>Duración</dt>
                <dd>{w.duration}</dd>
              </div>
              <div>
                <dt>Modalidad</dt>
                <dd>{w.modality}</dd>
              </div>
              <div>
                <dt>Nivel</dt>
                <dd>{w.level}</dd>
              </div>
            </dl>
            <Link href={quoteHref} className="btn btn--accent btn--block">
              Solicitar cotización
            </Link>
            {contactChannels.schedulingUrl && (
              <a href={contactChannels.schedulingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--block">
                Agendar una conversación
              </a>
            )}
            <WhatsAppLink className="btn btn--secondary btn--block" message={`Hola, me interesa el taller «${w.title}».`} label="Consultar por WhatsApp" />
            <p className="xsmall muted">La cotización considera tamaño del grupo, modalidad y adaptaciones de contenido.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
