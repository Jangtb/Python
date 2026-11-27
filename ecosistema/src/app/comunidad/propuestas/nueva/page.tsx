import Link from "next/link";
import type { Metadata } from "next";
import { ThreadComposer } from "@/components/community/ThreadComposer";
import { PageHero } from "@/components/ui/primitives";
import { requireViewer } from "@/server/auth/session";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({ title: "Proponer una iniciativa", description: "Propón un proyecto, encuentro o recurso para construir con la comunidad.", path: "/comunidad/propuestas/nueva", noindex: true });

export default async function Page() {
  const viewer = await requireViewer("/comunidad/propuestas/nueva");
  return (
    <>
      <PageHero
        eyebrow="Comunidad de Datos"
        title="Proponer una iniciativa"
        lead="Propón un proyecto, encuentro o recurso para construir con la comunidad."
        breadcrumbs={[{ name: "Comunidad", href: "/comunidad" }, { name: "Propuestas e iniciativas", href: "/comunidad/propuestas" }, { name: "Nueva" }]}
      />
      <section className="section section--tight">
        <div className="container container--narrow">
          {viewer.user.emailVerifiedAt ? (
            <ThreadComposer kind="proposal" />
          ) : (
            <div className="alert alert--warning">
              <div>
                <strong>Confirma tu correo para publicar.</strong> Te enviamos un enlace al registrarte. Puedes solicitar uno nuevo desde{" "}
                <Link href="/cuenta/perfil">tu perfil</Link>.
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
