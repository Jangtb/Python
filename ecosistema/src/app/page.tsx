import Link from "next/link";
import type { Metadata } from "next";
import { navSections } from "@/config/navigation";
import { site } from "@/config/site";
import { EcosystemDiagram } from "@/components/diagrams/Visual";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { ThreadRow } from "@/components/community/ThreadRow";
import { EventCard } from "@/components/community/EventCard";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { ArrowRight } from "@/components/ui/icons";
import { CtaBand, EmptyState, SectionHead } from "@/components/ui/primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { listThreads } from "@/server/services/community";
import { listEvents } from "@/server/services/events";
import { getViewer } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMetadata({
    title: `${site.name} — Tecnología, datos y comunidad`,
    description: site.description,
    path: "/",
  }),
  title: { absolute: `${site.name} — Tecnología, datos y comunidad` },
};

const entryCopy: Record<string, { title: string; text: string; cta: string }> = {
  dcd: {
    title: "Datos con Datos",
    text: "Comprende la tecnología que transforma nuestro mundo.",
    cta: "Leer y aprender",
  },
  consultoria: {
    title: "Consultoría",
    text: "Transforma los datos y la tecnología en valor para tu organización.",
    cta: "Ver servicios",
  },
  comunidad: {
    title: "Comunidad de Datos",
    text: "Conecta, comparte experiencias y construye soluciones con otros profesionales.",
    cta: "Explorar la comunidad",
  },
};

export default async function HomePage() {
  const viewer = await getViewer();
  const [articles, serviceGroups, workshops, threads, events] = await Promise.all([
    contentSource.listArticles(),
    contentSource.listServiceGroups(),
    contentSource.listWorkshops(),
    listThreads({ kind: "discussion", sort: "activity", limit: 3 }, viewer),
    listEvents("upcoming", viewer, 2),
  ]);
  const [lead, ...rest] = articles;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.ecosystemName,
          url: site.url,
          inLanguage: "es",
          description: site.description,
        }}
      />

      {/* — Hero — */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__grid-bg" aria-hidden="true" />
        <div className="container">
          <div className="hero__layout">
            <div className="reveal">
              <span className="eyebrow">Divulgación · Consultoría · Comunidad</span>
              <h1 id="hero-title" className="display hero__title" style={{ marginTop: "1.25rem" }}>
                La tecnología cambia el mundo. <em>Comprenderla</em> nos permite transformarlo.
              </h1>
              <p className="lead hero__lead">
                Un espacio para aprender sobre tecnología, compartir conocimiento, resolver desafíos y conectar personas que buscan generar valor a través de los datos y la innovación.
              </p>
              <div className="cluster hero__meta">
                <Link href="/datos-con-datos" className="btn btn--lg">
                  Empezar a leer
                </Link>
                <Link href="/comunidad" className="btn btn--lg btn--secondary">
                  Conocer la comunidad
                </Link>
              </div>
            </div>
            <figure className="diagram-frame reveal reveal--2">
              <EcosystemDiagram />
              <figcaption className="diagram-frame__caption">
                <span className="mono">Un ciclo, tres iniciativas</span>
                <span className="xsmall">El conocimiento circula entre aprender, aplicar y compartir.</span>
              </figcaption>
            </figure>
          </div>

          <nav className="entries reveal reveal--3" aria-label="Iniciativas del ecosistema">
            {navSections.map((s, i) => {
              const copy = entryCopy[s.brand]!;
              return (
                <Link key={s.brand} href={s.href} className={`entry card__link${s.brand === "consultoria" ? " entry--dark" : ""}`} data-brand={s.brand}>
                  <span className="entry__index">
                    <span className="mono">0{i + 1}</span>
                    <span className="entry__swatch" aria-hidden="true" />
                  </span>
                  <span className="entry__verb">{s.verb}</span>
                  <h2>{copy.title}</h2>
                  <p>{copy.text}</p>
                  <span className="link-arrow">
                    {copy.cta} <span aria-hidden="true"><ArrowRight size={14} /></span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* — DCD — */}
      <section className="section section--white section--bordered" aria-labelledby="dcd-title" data-brand="dcd">
        <div className="container">
          <SectionHead
            id="dcd-title"
            eyebrow="Datos con Datos · Lo más reciente"
            title="Comprender la tecnología es comprender nuestro mundo."
            lead="Explicaciones claras, con rigor y fuentes, sobre las tecnologías que usamos todos los días y las que están cambiando el futuro."
            action={
              <Link href="/datos-con-datos/articulos" className="link-arrow">
                Todos los artículos <span aria-hidden="true"><ArrowRight size={14} /></span>
              </Link>
            }
          />
          {lead ? (
            <div className="split split--aside">
              <ArticleCard article={lead} variant="featured" />
              <div>
                {rest.slice(0, 3).map((a) => (
                  <ArticleCard key={a.slug} article={a} variant="row" />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="Pronto publicaremos los primeros artículos." />
          )}
        </div>
      </section>

      {/* — Consultoría — */}
      <section className="section section--dark" aria-labelledby="consultoria-title" data-brand="consultoria">
        <div className="container">
          <SectionHead
            id="consultoria-title"
            eyebrow="Consultoría · Data & AI Strategy"
            title="Estrategia, arquitectura y gobierno de datos al servicio del negocio."
            lead="Diagnósticos, arquitecturas y modelos de gobierno proporcionales a tu realidad, con foco en avances visibles y en dejar capacidades instaladas."
            action={
              <div className="cluster">
                <Link href="/consultoria/servicios" className="btn btn--light">
                  Ver servicios
                </Link>
                <Link href="/consultoria/talleres" className="link-arrow" style={{ color: "#fff" }}>
                  Talleres <span aria-hidden="true"><ArrowRight size={14} /></span>
                </Link>
              </div>
            }
          />
          <div className="grid grid--4">
            {serviceGroups.map((g, i) => (
              <Link key={g.slug} href={`/consultoria/servicios#${g.slug}`} className="card card--interactive card__link" style={{ minHeight: 210 }}>
                <span className="mono" style={{ color: "var(--text-subtle)" }}>
                  0{i + 1}
                </span>
                <h3 className="h4" style={{ color: "#fff" }}>
                  {g.name}
                </h3>
                <p className="small muted">{g.summary}</p>
              </Link>
            ))}
          </div>
          <div className="rule-top" style={{ marginTop: "var(--space-8)" }}>
            <p className="eyebrow" style={{ marginBottom: "var(--space-4)" }}>
              Talleres destacados
            </p>
            <ul role="list" className="grid grid--3">
              {workshops.slice(0, 3).map((w) => (
                <li key={w.slug}>
                  <Link href={`/consultoria/talleres/${w.slug}`} className="link-arrow" style={{ color: "#fff" }}>
                    {w.title} <span aria-hidden="true"><ArrowRight size={14} /></span>
                  </Link>
                  <p className="xsmall muted">
                    {w.level} · {w.modality}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* — Comunidad — */}
      <section className="section section--brand" aria-labelledby="comunidad-title" data-brand="comunidad">
        <div className="container">
          <SectionHead
            id="comunidad-title"
            eyebrow="Comunidad de Datos · Actividad reciente"
            title="Desafíos reales, conversaciones útiles."
            lead="Profesionales y personas interesadas en los datos comparten problemas, propuestas y encuentros. Explora sin registrarte; participa cuando quieras."
            action={
              <Link href="/comunidad/discusiones/nueva" className="btn btn--accent">
                Plantear un desafío
              </Link>
            }
          />
          <div className="community-layout">
            <div>
              {threads.length ? (
                <div className="thread-list">
                  {threads.map((t) => (
                    <ThreadRow key={t.id} thread={t} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Todavía no hay conversaciones." action={<Link href="/comunidad/discusiones/nueva">Inicia la primera</Link>} />
              )}
              <p style={{ marginTop: "var(--space-4)" }}>
                <Link href="/comunidad/discusiones" className="link-arrow">
                  Ver todas las discusiones <span aria-hidden="true"><ArrowRight size={14} /></span>
                </Link>
              </p>
            </div>
            <aside aria-labelledby="eventos-title" className="stack">
              <h3 id="eventos-title" className="eyebrow">
                Próximos eventos
              </h3>
              {events.length ? (
                events.map((e) => <EventCard key={e.id} event={e} headingLevel={3} />)
              ) : (
                <EmptyState title="No hay eventos programados.">Suscríbete al boletín para enterarte del próximo.</EmptyState>
              )}
              <Link href="/comunidad/eventos" className="link-arrow">
                Calendario completo <span aria-hidden="true"><ArrowRight size={14} /></span>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* — Boletín + contacto — */}
      <section className="section" aria-labelledby="boletin-title">
        <div className="container stack stack--lg">
          <div className="newsletter">
            <div className="stack">
              <span className="eyebrow">Boletín</span>
              <h2 id="boletin-title" className="h2">
                Una carta breve, cuando hay algo que valga la pena.
              </h2>
              <p className="muted">Nuevos artículos, recursos y eventos de la comunidad. Sin spam y con baja en un clic.</p>
            </div>
            <NewsletterForm source="home" />
          </div>
          <CtaBand
            eyebrow="Conversemos"
            title="¿Tienes un desafío con tus datos?"
            text="Cuéntame el contexto y te respondo personalmente con una propuesta de próximos pasos. La primera conversación no tiene costo."
          >
            <Link href="/contacto?tipo=consultoria" className="btn btn--light btn--lg">
              Escribir una solicitud
            </Link>
          </CtaBand>
        </div>
      </section>
    </>
  );
}
