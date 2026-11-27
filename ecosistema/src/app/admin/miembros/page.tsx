import Link from "next/link";
import { ActionButton } from "@/components/forms/ActionButton";
import { formatDate } from "@/lib/dates";
import { updateMemberAction } from "@/server/actions/leads";
import { requireAdminPage } from "@/server/auth/session";
import { listMembers } from "@/server/services/leads";

const roleLabel = { member: "Miembro", moderator: "Moderación", admin: "Admin" };

export default async function MembersPage() {
  const viewer = await requireAdminPage("/admin/miembros");
  const members = await listMembers(viewer);
  return (
    <>
      <h1 className="h2">Miembros</h1>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Alta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const self = m.id === viewer.user.id;
              return (
                <tr key={m.id}>
                  <td>
                    <Link href={`/comunidad/miembros/${m.handle}`}>{m.displayName}</Link>
                    {m.isDemo && <span className="badge badge--demo" style={{ marginLeft: 6 }}>Ejemplo</span>}
                  </td>
                  <td className="xsmall">
                    {m.email} {!m.verified && <span className="badge badge--pending">Sin verificar</span>}
                  </td>
                  <td>
                    {roleLabel[m.role]}
                    {m.trustLevel === 0 && <span className="xsmall muted"> · nuevo</span>}
                  </td>
                  <td>{m.status === "active" ? "Activo" : <span className="badge badge--danger">Suspendido</span>}</td>
                  <td className="xsmall">{formatDate(m.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td>
                    {self ? (
                      <span className="xsmall muted">Tu cuenta</span>
                    ) : (
                      <div className="cluster" style={{ ["--cluster-gap" as string]: "0.25rem" }}>
                        {m.role !== "moderator" && (
                          <ActionButton action={updateMemberAction} fields={{ userId: m.id, role: "moderator" }} className="text-button" showSuccess={false}>
                            Hacer moderador
                          </ActionButton>
                        )}
                        {m.role !== "member" && (
                          <ActionButton action={updateMemberAction} fields={{ userId: m.id, role: "member" }} className="text-button" showSuccess={false}>
                            Quitar rol
                          </ActionButton>
                        )}
                        <ActionButton
                          action={updateMemberAction}
                          fields={{ userId: m.id, status: m.status === "active" ? "suspended" : "active" }}
                          className="text-button"
                          confirm={m.status === "active" ? "¿Suspender esta cuenta? Se cerrarán sus sesiones." : undefined}
                          showSuccess={false}
                        >
                          {m.status === "active" ? "Suspender" : "Reactivar"}
                        </ActionButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="xsmall muted">Las cuentas incluidas en ADMIN_EMAILS reciben el rol de administración al registrarse.</p>
    </>
  );
}
