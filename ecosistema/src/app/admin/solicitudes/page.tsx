import { ActionButton } from "@/components/forms/ActionButton";
import { EmptyState } from "@/components/ui/primitives";
import { contactTypes } from "@/validation/schemas";
import { formatDate } from "@/lib/dates";
import { setContactStatusAction } from "@/server/actions/leads";
import { requireAdminPage } from "@/server/auth/session";
import { listContactRequests } from "@/server/services/leads";

const statusLabel = { new: "Nueva", in_progress: "En curso", closed: "Cerrada" };

export default async function RequestsPage() {
  const viewer = await requireAdminPage("/admin/solicitudes");
  const requests = await listContactRequests(viewer);
  return (
    <>
      <h1 className="h2">Solicitudes comerciales</h1>
      {requests.length ? (
        requests.map((r) => (
          <article key={r.id} className="card stack stack--sm">
            <div className="card__meta">
              <span className={`badge ${r.status === "new" ? "badge--pending" : r.status === "closed" ? "badge--resolved" : "badge--accent"}`}>{statusLabel[r.status]}</span>
              <span>{contactTypes.find((t) => t.value === r.type)?.label}</span>
              <span>{formatDate(r.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <h2 className="h4">
              {r.name}
              {r.organization ? ` · ${r.organization}` : ""}
            </h2>
            <p className="small">
              <a href={`mailto:${r.email}`}>{r.email}</a> · Prefiere: {r.contactPreference}
              {r.budget ? ` · Presupuesto: ${r.budget}` : ""}
              {r.reference ? ` · Ref.: ${r.reference}` : ""}
            </p>
            <p className="small" style={{ whiteSpace: "pre-line" }}>
              {r.message}
            </p>
            <div className="cluster">
              {r.status !== "in_progress" && (
                <ActionButton action={setContactStatusAction} fields={{ id: r.id, status: "in_progress" }}>
                  Marcar en curso
                </ActionButton>
              )}
              {r.status !== "closed" && (
                <ActionButton action={setContactStatusAction} fields={{ id: r.id, status: "closed" }}>
                  Cerrar
                </ActionButton>
              )}
            </div>
          </article>
        ))
      ) : (
        <EmptyState title="Aún no hay solicitudes." />
      )}
    </>
  );
}
