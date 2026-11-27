import Link from "next/link";
import type { Metadata } from "next";
import { communityGuidelines } from "@/content/community";
import { EventCard } from "@/components/community/EventCard";
import { CategoryPanel, MembersPanel, TagsPanel } from "@/components/community/Sidebar";
import { ThreadRow } from "@/components/community/ThreadRow";
import { ArrowRight } from "@/components/ui/icons";
import { EmptyState, SectionHead } from "@/components/ui/primitives";
import { getViewer } from "@/server/auth/session";
import { listThreads } from "@/server/services/community";
import { listEvents } from "@/server/services/events";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Comunidad de Datos",
  description:
    "Un espacio donde profesionales, líderes, especialistas y personas interesadas en datos comparten desafíos, experiencias, propuestas y soluciones.",
  path: "/comunidad",
});

export default async function CommunityHome() {
  const viewer = await getViewer();
  const [recent, unanswered, featured, proposals, events] = await Promise.all([
    listThreads({ kind: "discussion", sort: "activity", limit: 5 }, viewer),
    listThreads({ kind: "discussion", status: "unanswered", sort: "recent", limit: 3 }, viewer),
    listThreads({ kind: "discussion", sort: "top", limit: 3 }, viewer),
    listThreads({ kind: "proposal", sort: "top", limit: 3 }, viewer),
    listEvents("upcoming", viewer, 3),
  ]);

  return (
    <>
      <header className="page-hero page-hero--brand">
        <div className="container page-hero__grid page-hero__grid--split">
          <div className="stack stack--lg">
            <span className="eyebrow">Comunidad de Datos</span>
            <h1 className="h1">Un lugar para resolver, juntos, los problemas reales de los datos.</h1>
            <p className="lead">
              Profesionales, líderes, especialistas y personas curiosas comparten desafíos, experiencias y propuestas sobre gobierno, arquitectura, calidad, analítica e inteligencia artificial.
            </p>
            <div className="cluster">
              <Link href="/comunidad/discusiones/nueva" className="btn btn--accent btn--lg">
                Plantear un desafío
              </Link>
              {!viewer && (
                <Link href="/cuenta/registro" className="btn btn--secondary btn--lg">
                  Unirme gratis
                </Link>
              )}
            </div>
          </div>
          <div className="panel stack stack--sm">
            <span className="eyebrow eyebrow--plain">Cómo funciona</span>
            <ol className="check-list small">
              <li>Explora conversaciones sin registrarte.</li>
              <li>Crea una cuenta y confirma tu correo para participar.</li>
              <li>Publica desafíos, responde y marca soluciones.</li>
              <li>Propón iniciativas e inscríbete en eventos.</li>
            </ol>
          </div>
        </div>
      </header>

      <section className="section section--tight">
        <div className="container community-layout">
          <div className="stack stack--lg">
            <div>
              <SectionHead
                eyebrow="Actividad"
                title="Discusiones recientes"
                action={
                  <Link href="/comunidad/discusiones" className="link-arrow">
                    Ver todas <span aria-hidden="true"><ArrowRight size={14} /></span>
                  </Link>
                }
              />
              {recent.length ? (
                <div className="thread-list">
                  {recent.map((t) => (
                    <ThreadRow key={t.id} thread={t} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Aún no hay discusiones." action={<Link href="/comunidad/discusiones/nueva">Abre la primera</Link>} />
              )}
            </div>

            <div className="grid grid--2">
              <div>
                <h2 className="h3" style={{ marginBottom: "var(--space-4)" }}>
                  Preguntas sin responder
                </h2>
                {unanswered.length ? (
                  <div className="thread-list">
                    {unanswered.map((t) => (
                      <ThreadRow key={t.id} thread={t} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Todas las preguntas tienen respuesta. ¡Bien!" />
                )}
              </div>
              <div>
                <h2 className="h3" style={{ marginBottom: "var(--space-4)" }}>
                  Más útiles
                </h2>
                {featured.length ? (
                  <div className="thread-list">
                    {featured.map((t) => (
                      <ThreadRow key={t.id} thread={t} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Vota las respuestas útiles para destacarlas." />
                )}
              </div>
            </div>

            <div>
              <SectionHead
                eyebrow="Iniciativas"
                title="Propuestas de la comunidad"
                action={
                  <Link href="/comunidad/propuestas" className="link-arrow">
                    Ver propuestas <span aria-hidden="true"><ArrowRight size={14} /></span>
                  </Link>
                }
              />
              {proposals.length ? (
                <div className="thread-list">
                  {proposals.map((t) => (
                    <ThreadRow key={t.id} thread={t} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Aún no hay propuestas." action={<Link href="/comunidad/propuestas/nueva">Proponer una iniciativa</Link>} />
              )}
            </div>
          </div>

          <aside className="stack" aria-label="Eventos, categorías y miembros">
            <div className="stack">
              <h2 className="eyebrow">Próximos eventos</h2>
              {events.length ? events.map((e) => <EventCard key={e.id} event={e} />) : <EmptyState title="No hay eventos programados." />}
              <Link href="/comunidad/eventos" className="link-arrow">
                Calendario <span aria-hidden="true"><ArrowRight size={14} /></span>
              </Link>
            </div>
            <MembersPanel />
            <TagsPanel />
            <CategoryPanel kind="discussion" basePath="/comunidad/discusiones" />
            <div className="panel">
              <h2 className="panel__title">Normas de convivencia</h2>
              <ul className="check-list xsmall muted">
                {communityGuidelines.slice(0, 3).map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <Link href="/comunidad/normas" className="xsmall">
                Leer todas
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
