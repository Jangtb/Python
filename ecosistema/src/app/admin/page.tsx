import Link from "next/link";
import { integrations } from "@/config/env";
import { analytics, contactChannels } from "@/config/site";
import { relativeTime } from "@/lib/dates";
import { requireModeratorPage } from "@/server/auth/session";
import { adminMetrics } from "@/server/services/leads";

export default async function AdminHome() {
  const viewer = await requireModeratorPage("/admin");
  const m = await adminMetrics(viewer);
  const stats = [
    { label: "Pendientes de revisión", value: m.pending, href: "/admin/moderacion" },
    { label: "Reportes abiertos", value: m.openReports, href: "/admin/moderacion" },
    { label: "Solicitudes nuevas", value: m.newRequests, href: "/admin/solicitudes" },
    { label: "Miembros reales", value: m.members },
    { label: "Nuevos (30 días)", value: m.newMembers30 },
    { label: "Discusiones", value: m.discussions },
    { label: "Propuestas", value: m.proposals },
    { label: "Comentarios (30 días)", value: m.comments30 },
    { label: "Suscriptores confirmados", value: m.subscribers },
    { label: "Suscripciones pendientes", value: m.pendingSubscribers },
    { label: "Eventos próximos", value: m.upcomingEvents },
    { label: "Inscripciones activas", value: m.registrations },
  ];
  const status = [
    { name: "Correo transaccional (Resend)", ok: integrations.email },
    { name: "Boletín (Brevo)", ok: integrations.brevo },
    { name: "Antispam Turnstile", ok: integrations.turnstile },
    { name: "Analítica (Plausible)", ok: Boolean(analytics.plausibleDomain) },
    { name: "Agenda en línea", ok: Boolean(contactChannels.schedulingUrl) },
    { name: "WhatsApp", ok: Boolean(contactChannels.whatsappNumber) },
  ];
  return (
    <>
      <h1 className="h2">Resumen</h1>
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <div className="stat__value">{s.value}</div>
            <div className="stat__label">{s.href ? <Link href={s.href}>{s.label}</Link> : s.label}</div>
          </div>
        ))}
      </div>
      <p className="xsmall muted">Métricas calculadas sobre la base de datos del sitio. Las visitas y lecturas se consultan en Plausible cuando está configurado.</p>

      <section className="stack">
        <h2 className="h4">Integraciones</h2>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {status.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.ok ? <span className="badge badge--resolved">Configurado</span> : <span className="badge badge--pending">Pendiente de credenciales</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack">
        <h2 className="h4">Correos recientes</h2>
        <p className="xsmall muted">Registro de envíos. «Local» indica que no hay proveedor configurado y el mensaje no salió del servidor.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Destinatario</th>
                <th>Asunto</th>
                <th>Entrega</th>
                <th>Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {m.outbox.length ? (
                m.outbox.map((o) => (
                  <tr key={o.id}>
                    <td>{o.to}</td>
                    <td>{o.subject}</td>
                    <td>{o.delivered === "resend" ? "Resend" : "Local"}</td>
                    <td>{relativeTime(o.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="muted">
                    Sin envíos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack">
        <h2 className="h4">Registro de moderación</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Objetivo</th>
                <th>Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {m.auditLog.length ? (
                m.auditLog.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.action}</td>
                    <td className="xsmall">
                      {a.targetType} · {a.targetId.slice(0, 8)}
                      {a.note ? ` · ${a.note}` : ""}
                    </td>
                    <td>{relativeTime(a.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="muted">
                    Sin acciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
