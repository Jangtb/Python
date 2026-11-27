import Link from "next/link";
import { ActionButton } from "@/components/forms/ActionButton";
import { ProfileForm } from "@/components/forms/AuthForms";
import { PageHero } from "@/components/ui/primitives";
import { logoutAction, resendVerificationAction } from "@/server/actions/auth";
import { requireViewer } from "@/server/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta" };

const roleLabels = { member: "Miembro", moderator: "Moderación", admin: "Administración" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const viewer = await requireViewer("/cuenta/perfil");
  const { aviso } = await searchParams;
  const { profile: p, user } = viewer;
  return (
    <>
      <PageHero eyebrow={`Mi cuenta · ${roleLabels[user.role]}`} title={`Hola, ${p.displayName.split(" ")[0]}`} lead="Edita la información pública de tu perfil. Tu correo nunca se muestra a otras personas.">
        <div className="cluster">
          <Link href={`/comunidad/miembros/${p.handle}`} className="btn btn--secondary">
            Ver mi perfil público
          </Link>
          {user.role !== "member" && (
            <Link href="/admin" className="btn btn--secondary">
              Panel de administración
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="btn btn--ghost">
              Cerrar sesión
            </button>
          </form>
        </div>
      </PageHero>
      <section className="section section--tight">
        <div className="container container--narrow stack stack--lg">
          {aviso === "sin-permisos" && <p className="alert alert--danger">Tu cuenta no tiene permisos para acceder a esa sección.</p>}
          {!user.emailVerifiedAt && (
            <div className="alert alert--warning">
              <div className="stack stack--sm">
                <span>
                  <strong>Confirma tu correo ({user.email})</strong> para publicar, comentar, votar e inscribirte en eventos.
                </span>
                <ActionButton action={resendVerificationAction} fields={{}}>
                  Reenviar enlace de confirmación
                </ActionButton>
              </div>
            </div>
          )}
          <ProfileForm
            defaults={{
              displayName: p.displayName,
              bio: p.bio,
              specialty: p.specialty,
              interests: p.interests.join(", "),
              organization: p.organization ?? "",
              linkedin: p.links.find((l) => l.label === "LinkedIn")?.url ?? "",
              website: p.links.find((l) => l.label === "Sitio web")?.url ?? "",
            }}
          />
        </div>
      </section>
    </>
  );
}
