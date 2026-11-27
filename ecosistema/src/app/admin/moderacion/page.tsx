import Link from "next/link";
import { reportReasons } from "@/content/community";
import { ActionButton } from "@/components/forms/ActionButton";
import { EmptyState } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/dates";
import { dismissReportsAction, moderateCommentAction, moderateThreadAction } from "@/server/actions/community";
import { requireModeratorPage } from "@/server/auth/session";
import { moderationQueue, type QueueItem } from "@/server/services/community";

function Item({ item, mode }: { item: QueueItem; mode: "pending" | "reported" }) {
  const action = item.targetType === "thread" ? moderateThreadAction : moderateCommentAction;
  const href = `/comunidad/${item.threadKind === "proposal" ? "propuestas" : "discusiones"}/${item.threadId}`;
  const fields = (a: string) => ({ targetId: item.id, action: a, path: "/admin/moderacion" });
  return (
    <article className="card stack stack--sm">
      <div className="card__meta">
        <span className="badge">{item.targetType === "thread" ? "Publicación" : "Comentario"}</span>
        <span>
          {item.author.displayName} · {relativeTime(item.createdAt)}
        </span>
        {item.moderation === "hidden" && <span className="badge badge--danger">Oculto</span>}
      </div>
      <h3 className="h4">{item.title}</h3>
      <p className="small" style={{ whiteSpace: "pre-line", maxHeight: 160, overflow: "auto" }}>
        {item.body}
      </p>
      {item.reports.length > 0 && (
        <ul className="xsmall muted">
          {item.reports.map((r, i) => (
            <li key={i}>
              {reportReasons.find((x) => x.value === r.reason)?.label}
              {r.details ? `: «${r.details}»` : ""}
            </li>
          ))}
        </ul>
      )}
      <div className="cluster">
        {mode === "pending" ? (
          <>
            <ActionButton action={action} fields={fields("approve")} className="btn btn--sm btn--accent">
              Aprobar
            </ActionButton>
            <ActionButton action={action} fields={fields("reject")} confirm="¿Rechazar este contenido?">
              Rechazar
            </ActionButton>
          </>
        ) : (
          <>
            {item.moderation === "hidden" ? (
              <ActionButton action={action} fields={fields("restore")}>
                Restaurar
              </ActionButton>
            ) : (
              <ActionButton action={action} fields={fields("hide")} className="btn btn--sm btn--danger">
                Ocultar
              </ActionButton>
            )}
            <ActionButton action={dismissReportsAction} fields={{ targetId: item.id }}>
              Descartar reportes
            </ActionButton>
          </>
        )}
        <Link href={href} className="xsmall">
          Ver en contexto
        </Link>
      </div>
    </article>
  );
}

export default async function ModerationPage() {
  const { pending, reported } = await moderationQueue(await requireModeratorPage("/admin/moderacion"));
  return (
    <>
      <h1 className="h2">Moderación</h1>
      <section className="stack" aria-labelledby="pendientes">
        <h2 id="pendientes" className="h4">
          Pendientes de revisión ({pending.length})
        </h2>
        {pending.length ? pending.map((i) => <Item key={i.id} item={i} mode="pending" />) : <EmptyState title="No hay contenido pendiente." />}
      </section>
      <section className="stack" aria-labelledby="reportados">
        <h2 id="reportados" className="h4">
          Reportado ({reported.length})
        </h2>
        {reported.length ? reported.map((i) => <Item key={i.id} item={i} mode="reported" />) : <EmptyState title="No hay reportes abiertos." />}
      </section>
    </>
  );
}
