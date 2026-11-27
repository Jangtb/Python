import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThreadRow } from "@/components/community/ThreadRow";
import { Avatar, Breadcrumbs, DemoBadge, EmptyState } from "@/components/ui/primitives";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/seo";
import { getViewer } from "@/server/auth/session";
import { getMember } from "@/server/services/community";

export const dynamic = "force-dynamic";

type Params = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const m = await getMember(handle, null);
  if (!m) return { title: "Miembro no encontrado" };
  return pageMetadata({
    title: m.profile.displayName,
    description: m.profile.bio || `Perfil de ${m.profile.displayName} en la Comunidad de Datos.`,
    path: `/comunidad/miembros/${handle}`,
    type: "profile",
    noindex: true,
  });
}

/** Perfil público: solo información que el miembro decidió compartir. Nunca se muestra el correo. */
export default async function MemberPage({ params }: { params: Params }) {
  const { handle } = await params;
  const viewer = await getViewer();
  const m = await getMember(handle, viewer);
  if (!m) notFound();
  const p = m.profile;
  return (
    <div className="container" style={{ paddingBlock: "var(--space-7) var(--space-10)" }}>
      <Breadcrumbs items={[{ name: "Comunidad", href: "/comunidad" }, { name: "Miembros" }, { name: p.displayName }]} />
      <div className="community-layout">
        <div className="stack stack--lg">
          <header className="cluster" style={{ ["--cluster-gap" as string]: "1.5rem" }}>
            <Avatar name={p.displayName} size="lg" />
            <div className="stack stack--sm">
              <h1 className="h2">{p.displayName}</h1>
              <p className="muted small">
                @{p.handle}
                {p.specialty && ` · ${p.specialty}`}
                {p.organization && ` · ${p.organization}`}
              </p>
              {m.isDemo && <DemoBadge label="Perfil de ejemplo" />}
            </div>
          </header>
          {p.bio && <p className="lead">{p.bio}</p>}
          <section aria-labelledby="publicaciones">
            <h2 id="publicaciones" className="h3" style={{ marginBottom: "var(--space-4)" }}>
              Publicaciones
            </h2>
            {m.threads.length ? (
              <div className="thread-list">
                {m.threads.map((t) => (
                  <ThreadRow key={t.id} thread={t} />
                ))}
              </div>
            ) : (
              <EmptyState title="Todavía no ha publicado consultas ni propuestas." />
            )}
          </section>
        </div>
        <aside className="panel" style={{ alignSelf: "start" }}>
          <dl className="spec-table" style={{ borderTop: 0 }}>
            <div>
              <dt>Miembro desde</dt>
              <dd>{formatDate(m.joinedAt, { month: "long", year: "numeric" })}</dd>
            </div>
            <div>
              <dt>Publicaciones</dt>
              <dd>{m.threads.length}</dd>
            </div>
            <div>
              <dt>Respuestas</dt>
              <dd>{m.commentCount}</dd>
            </div>
            <div>
              <dt>Soluciones</dt>
              <dd>{m.solutionsCount}</dd>
            </div>
            {p.interests.length > 0 && (
              <div>
                <dt>Intereses</dt>
                <dd className="cluster" style={{ ["--cluster-gap" as string]: "0.3rem" }}>
                  {p.interests.map((i) => (
                    <span key={i} className="tag">
                      {i}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {p.links.length > 0 && (
              <div>
                <dt>Enlaces</dt>
                <dd className="stack stack--sm">
                  {p.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc">
                      {l.label}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
