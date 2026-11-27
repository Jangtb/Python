import Link from "next/link";
import { categoryName, proposalTypeName } from "@/content/community";
import { formatDate, relativeTime } from "@/lib/dates";
import type { ThreadDetail } from "@/server/services/community";
import type { Viewer } from "@/server/services/accounts";
import { changeStatusAction, moderateCommentAction, moderateThreadAction, setSolutionAction } from "@/server/actions/community";
import { resendVerificationAction } from "@/server/actions/auth";
import { ActionButton } from "@/components/forms/ActionButton";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { Avatar, Breadcrumbs, DemoBadge } from "@/components/ui/primitives";
import { CommentForm } from "./CommentForm";
import { ReportForm } from "./ReportForm";
import { ModerationBadge, StatusBadge } from "./StatusBadge";
import { VoteButton } from "./VoteButton";

function AuthorLink({ handle, name }: { handle: string; name: string }) {
  return handle ? (
    <Link href={`/comunidad/miembros/${handle}`} className="comment__author">
      {name}
    </Link>
  ) : (
    <span className="comment__author">{name}</span>
  );
}

export function ThreadView({ thread, viewer, path, flash }: { thread: ThreadDetail; viewer: Viewer | null; path: string; flash?: string }) {
  const isProposal = thread.kind === "proposal";
  const listHref = isProposal ? "/comunidad/propuestas" : "/comunidad/discusiones";
  const isAuthor = viewer?.user.id === thread.authorId;
  const p = thread.permissions;
  const published = thread.comments.filter((c) => c.moderation === "published").length;

  return (
    <div className="container" style={{ paddingBlock: "var(--space-7) var(--space-10)" }}>
      <Breadcrumbs
        items={[
          { name: "Comunidad", href: "/comunidad" },
          { name: isProposal ? "Propuestas" : "Discusiones", href: listHref },
          { name: categoryName(thread.categorySlug), href: `${listHref}?categoria=${thread.categorySlug}` },
          { name: thread.title },
        ]}
      />

      {flash === "en-revision" && (
        <div className="alert alert--warning" role="status" style={{ marginBottom: "var(--space-5)" }}>
          <div>
            <strong>Tu publicación quedó en revisión.</strong>
            Como tu cuenta es nueva, el equipo de moderación la revisará antes de publicarla. Solo tú puedes verla mientras tanto.
          </div>
        </div>
      )}
      {flash === "publicado" && (
        <div className="alert alert--success" role="status" style={{ marginBottom: "var(--space-5)" }}>
          <div>
            <strong>¡Publicado!</strong> Tu {isProposal ? "propuesta" : "consulta"} ya está visible para la comunidad.
          </div>
        </div>
      )}

      <div className="community-layout">
        <div>
          <article aria-labelledby="thread-title" className="stack stack--lg">
            <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "var(--space-5)", alignItems: "start" }}>
              <VoteButton
                threadId={thread.id}
                voted={thread.viewerVoted}
                count={thread.voteCount}
                canVote={p.canVote}
                isAuthor={isAuthor}
                isLoggedIn={Boolean(viewer)}
                path={path}
                label={isProposal ? "apoyo a esta propuesta" : "esta consulta como útil"}
              />
              <div className="stack">
                <div className="card__meta">
                  {isProposal ? <span className="badge badge--accent">{proposalTypeName(thread.proposalType)}</span> : <StatusBadge status={thread.status} />}
                  <ModerationBadge moderation={thread.moderation} />
                  {thread.locked && (
                    <span className="badge">
                      <LockIcon size={11} /> Cerrado
                    </span>
                  )}
                  {thread.isDemo && <DemoBadge />}
                  <Link href={`${listHref}?categoria=${thread.categorySlug}`} className="tag">
                    {categoryName(thread.categorySlug)}
                  </Link>
                </div>
                <h1 id="thread-title" className="h2">
                  {thread.title}
                </h1>
                <div className="comment__head">
                  <Avatar name={thread.author.displayName} size="sm" />
                  <AuthorLink handle={thread.author.handle} name={thread.author.displayName} />
                  <time dateTime={thread.createdAt}>{formatDate(thread.createdAt)}</time>
                </div>
              </div>
            </div>
            <div className="thread-body">{thread.body}</div>
            {thread.tags.length > 0 && (
              <div className="cluster">
                {thread.tags.map((t) => (
                  <Link key={t} href={`${listHref}?etiqueta=${encodeURIComponent(t)}`} className="tag">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <div className="cluster rule-top" style={{ justifyContent: "space-between" }}>
              <div className="cluster">
                {p.canChangeStatus && !isProposal && thread.status !== "resolved" && thread.status !== "archived" && (
                  <ActionButton action={changeStatusAction} fields={{ threadId: thread.id, status: "resolved", path }}>
                    Marcar como resuelto
                  </ActionButton>
                )}
                {p.canChangeStatus && !isProposal && thread.status === "resolved" && (
                  <ActionButton action={changeStatusAction} fields={{ threadId: thread.id, status: "discussion", path }}>
                    Reabrir
                  </ActionButton>
                )}
              </div>
              {viewer && !isAuthor && thread.moderation === "published" && <ReportForm targetType="thread" targetId={thread.id} path={path} />}
            </div>

            {p.canModerate && (
              <div className="panel stack stack--sm" aria-label="Herramientas de moderación">
                <span className="eyebrow eyebrow--plain">Moderación</span>
                <div className="cluster">
                  {thread.moderation === "pending" && (
                    <>
                      <ActionButton action={moderateThreadAction} fields={{ targetId: thread.id, action: "approve", path }} className="btn btn--sm btn--accent">
                        Aprobar
                      </ActionButton>
                      <ActionButton action={moderateThreadAction} fields={{ targetId: thread.id, action: "reject", path }} confirm="¿Rechazar esta publicación?">
                        Rechazar
                      </ActionButton>
                    </>
                  )}
                  {thread.moderation === "published" && (
                    <ActionButton action={moderateThreadAction} fields={{ targetId: thread.id, action: "hide", path }} confirm="¿Ocultar esta publicación?">
                      Ocultar
                    </ActionButton>
                  )}
                  {(thread.moderation === "hidden" || thread.moderation === "rejected") && (
                    <ActionButton action={moderateThreadAction} fields={{ targetId: thread.id, action: "restore", path }}>
                      Restaurar
                    </ActionButton>
                  )}
                  <ActionButton action={moderateThreadAction} fields={{ targetId: thread.id, action: thread.locked ? "unlock" : "lock", path }}>
                    {thread.locked ? "Reabrir comentarios" : "Cerrar comentarios"}
                  </ActionButton>
                  {thread.status !== "archived" && (
                    <ActionButton action={moderateThreadAction} fields={{ targetId: thread.id, action: "archive", path }} confirm="¿Archivar esta conversación?">
                      Archivar
                    </ActionButton>
                  )}
                </div>
              </div>
            )}
          </article>

          <section aria-labelledby="respuestas" style={{ marginTop: "var(--space-8)" }}>
            <h2 id="respuestas" className="h3" style={{ marginBottom: "var(--space-3)" }}>
              {published === 0 ? "Sin respuestas todavía" : `${published} ${published === 1 ? (isProposal ? "comentario" : "respuesta") : isProposal ? "comentarios" : "respuestas"}`}
            </h2>
            <ol role="list">
              {thread.comments.map((c) => (
                <li key={c.id} id={`c-${c.id}`} className={`comment${c.isSolution ? " comment--solution" : ""}`}>
                  <Avatar name={c.author.displayName} />
                  <div>
                    <div className="comment__head">
                      <AuthorLink handle={c.author.handle} name={c.author.displayName} />
                      {c.author.specialty && <span>{c.author.specialty}</span>}
                      <time dateTime={c.createdAt}>{relativeTime(c.createdAt)}</time>
                      {c.isSolution && (
                        <span className="badge badge--resolved">
                          <CheckIcon size={11} /> Solución
                        </span>
                      )}
                      <ModerationBadge moderation={c.moderation} />
                      {c.isDemo && <DemoBadge />}
                    </div>
                    <div className="comment__body">{c.body}</div>
                    <div className="comment__actions">
                      {p.canMarkSolution && c.moderation === "published" && !c.isSolution && (
                        <ActionButton action={setSolutionAction} fields={{ threadId: thread.id, commentId: c.id, path }} className="text-button" showSuccess={false}>
                          Marcar como solución
                        </ActionButton>
                      )}
                      {p.canMarkSolution && c.isSolution && (
                        <ActionButton action={setSolutionAction} fields={{ threadId: thread.id, commentId: "", path }} className="text-button" showSuccess={false}>
                          Quitar solución
                        </ActionButton>
                      )}
                      {p.canModerate && c.moderation === "pending" && (
                        <ActionButton action={moderateCommentAction} fields={{ targetId: c.id, action: "approve", path }} className="text-button">
                          Aprobar
                        </ActionButton>
                      )}
                      {p.canModerate && c.moderation === "published" && (
                        <ActionButton action={moderateCommentAction} fields={{ targetId: c.id, action: "hide", path }} className="text-button" confirm="¿Ocultar este comentario?">
                          Ocultar
                        </ActionButton>
                      )}
                      {p.canModerate && (c.moderation === "hidden" || c.moderation === "rejected") && (
                        <ActionButton action={moderateCommentAction} fields={{ targetId: c.id, action: "restore", path }} className="text-button">
                          Restaurar
                        </ActionButton>
                      )}
                      {viewer && viewer.user.id !== c.authorId && c.moderation === "published" && <ReportForm targetType="comment" targetId={c.id} path={path} />}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div style={{ marginTop: "var(--space-7)" }}>
              {!viewer ? (
                <div className="panel stack">
                  <p className="h4">Únete a la conversación</p>
                  <p className="small muted">Puedes leer todo sin cuenta. Para responder, crea una cuenta gratuita.</p>
                  <div className="cluster">
                    <Link href={`/cuenta/registro?next=${encodeURIComponent(path)}`} className="btn btn--accent">
                      Crear cuenta
                    </Link>
                    <Link href={`/cuenta/ingresar?next=${encodeURIComponent(path)}`} className="btn btn--secondary">
                      Ingresar
                    </Link>
                  </div>
                </div>
              ) : !viewer.user.emailVerifiedAt ? (
                <div className="alert alert--warning">
                  <div className="stack stack--sm">
                    <span>
                      <strong>Confirma tu correo para participar.</strong> Te enviamos un enlace al registrarte.
                    </span>
                    <ActionButton action={resendVerificationAction} fields={{}}>
                      Reenviar enlace
                    </ActionButton>
                  </div>
                </div>
              ) : !p.canComment ? (
                <p className="alert">
                  <LockIcon size={16} /> Esta conversación no admite nuevos comentarios.
                </p>
              ) : (
                <CommentForm threadId={thread.id} path={path} label={isProposal ? "Tu comentario" : "Tu respuesta"} />
              )}
            </div>
          </section>
        </div>

        <aside className="stack" aria-label="Información de la publicación">
          <div className="panel">
            <dl className="spec-table" style={{ borderTop: 0 }}>
              <div>
                <dt>Publicado</dt>
                <dd>{formatDate(thread.createdAt)}</dd>
              </div>
              <div>
                <dt>Actividad</dt>
                <dd>{relativeTime(thread.lastActivityAt)}</dd>
              </div>
              <div>
                <dt>{isProposal ? "Apoyos" : "Útil para"}</dt>
                <dd>{thread.voteCount}</dd>
              </div>
            </dl>
          </div>
          <div className="panel stack stack--sm">
            <p className="panel__title" style={{ margin: 0 }}>
              ¿Tienes un desafío parecido?
            </p>
            <Link href={isProposal ? "/comunidad/propuestas/nueva" : "/comunidad/discusiones/nueva"} className="btn btn--sm btn--accent">
              {isProposal ? "Proponer una iniciativa" : "Plantear una consulta"}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
