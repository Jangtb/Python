import Link from "next/link";
import { EventForm } from "@/components/forms/EventForm";
import { ActionButton } from "@/components/forms/ActionButton";
import { formatEventDate } from "@/lib/dates";
import { setEventStatusAction } from "@/server/actions/leads";
import { requireModeratorPage } from "@/server/auth/session";
import { eventRegistrants, listEvents } from "@/server/services/events";

export default async function AdminEventsPage() {
  const viewer = await requireModeratorPage("/admin/eventos");
  const [upcoming, past] = await Promise.all([listEvents("upcoming", viewer), listEvents("past", viewer)]);
  const all = [...upcoming, ...past];
  const registrants = await Promise.all(all.map((e) => eventRegistrants(viewer, e.id)));
  return (
    <>
      <h1 className="h2">Eventos</h1>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Inscritos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {all.map((e, i) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/comunidad/eventos/${e.slug}`}>{e.title}</Link>
                  {e.isDemo && <span className="badge badge--demo" style={{ marginLeft: 6 }}>Ejemplo</span>}
                </td>
                <td className="xsmall">{formatEventDate(e.startsAt, e.timezone)}</td>
                <td>
                  <details className="disclosure">
                    <summary className="text-button">
                      {e.registeredCount}/{e.capacity}
                    </summary>
                    <ul className="xsmall">
                      {registrants[i]!.map((r) => (
                        <li key={r.email}>
                          {r.displayName} · {r.email}
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
                <td>{{ published: "Publicado", draft: "Borrador", cancelled: "Cancelado" }[e.status]}</td>
                <td>
                  {e.status !== "cancelled" ? (
                    <ActionButton action={setEventStatusAction} fields={{ eventId: e.id, status: "cancelled" }} confirm="¿Cancelar este evento?">
                      Cancelar
                    </ActionButton>
                  ) : (
                    <ActionButton action={setEventStatusAction} fields={{ eventId: e.id, status: "published" }}>
                      Reactivar
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel stack">
        <h2 className="h4">Nuevo evento</h2>
        <EventForm />
      </section>
    </>
  );
}
