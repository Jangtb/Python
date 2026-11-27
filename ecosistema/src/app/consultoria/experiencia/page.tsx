import Link from "next/link";
import type { Metadata } from "next";
import { focusAreas, isProvisional, profile } from "@/content/consulting";
import { PageHero, Provisional, SectionHead } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Experiencia y enfoque profesional",
  description: "Trayectoria en arquitectura, ingeniería y gobierno de datos, calidad, modelado, estrategia tecnológica y liderazgo técnico.",
  path: "/consultoria/experiencia",
});

export default function ExperiencePage() {
  const timelinePending = isProvisional("timeline");
  return (
    <>
      <PageHero
        eyebrow="Consultoría"
        title="Experiencia y enfoque"
        lead="Una trayectoria construida entre la arquitectura, la ingeniería y el gobierno de datos, con un mismo hilo conductor: que los datos sirvan para decidir mejor."
        breadcrumbs={[{ name: "Consultoría", href: "/consultoria" }, { name: "Experiencia" }]}
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <span className="eyebrow">Trayectoria</span>
            <h2 className="h2">Del dato técnico a la decisión de negocio.</h2>
            {timelinePending && (
              <div className="alert alert--warning">
                <div>
                  <strong>Contenido provisional</strong>
                  La trayectoria se completa en <code>src/content/consulting.ts</code>. No se publican cargos, organizaciones ni logros sin confirmar.
                </div>
              </div>
            )}
          </div>
          <ol role="list" className="timeline">
            {profile.timeline.map((t, i) => (
              <li key={i} className="timeline__item stack stack--sm">
                <span className="mono muted">
                  <Provisional when={timelinePending}>{t.period}</Provisional>
                </span>
                <h3 className="h4">
                  <Provisional when={timelinePending}>
                    {t.role} · {t.organization}
                  </Provisional>
                </h3>
                <p className="small muted">{t.summary}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section section--white section--bordered">
        <div className="container">
          <SectionHead eyebrow="Capacidades" title="Áreas de experiencia." />
          <div className="principles">
            {focusAreas.map((f) => (
              <div key={f.name} className="principle">
                <h3 className="h4">{f.name}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <div className="stack">
            <span className="eyebrow">Plataformas y herramientas</span>
            <h2 className="h3">Tecnología al servicio del problema.</h2>
            <p className="small muted">Las herramientas se eligen según el contexto de cada organización; estas son las plataformas con las que trabajo habitualmente.</p>
          </div>
          <div className="stack">
            <div className="cluster">
              {profile.stack.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
            {isProvisional("stack") && <p className="xsmall muted">Lista provisional: confirmar solo tecnologías respaldadas por experiencia real.</p>}
            <Link href="/contacto?tipo=consultoria" className="btn btn--accent">
              Conversemos
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
