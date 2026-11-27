import Link from "next/link";
import type { Metadata } from "next";
import { communityGuidelines } from "@/content/community";
import { PageHero } from "@/components/ui/primitives";
import { AUTO_HIDE_REPORTS } from "@/server/services/community";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Normas de la comunidad",
  description: "Normas de convivencia, moderación y protección contra spam de la Comunidad de Datos.",
  path: "/comunidad/normas",
});

export default function GuidelinesPage() {
  return (
    <>
      <PageHero
        eyebrow="Comunidad de Datos"
        title="Normas de la comunidad"
        lead="Queremos conversaciones útiles, respetuosas y seguras. Estas normas explican qué esperamos y cómo moderamos."
        breadcrumbs={[{ name: "Comunidad", href: "/comunidad" }, { name: "Normas" }]}
      />
      <section className="section">
        <div className="container container--narrow prose">
          <h2>Convivencia</h2>
          <ul>
            {communityGuidelines.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <h2>Cómo participar</h2>
          <ul>
            <li>Cualquier persona puede leer el contenido público sin registrarse.</li>
            <li>Para publicar, comentar, votar o inscribirse en eventos se necesita una cuenta con el correo confirmado.</li>
            <li>Las primeras publicaciones de cuentas nuevas pasan por una revisión breve. Una vez aprobadas, las siguientes se publican directamente.</li>
            <li>Las cuentas nuevas pueden incluir un número limitado de enlaces; los comentarios con enlaces se revisan antes de publicarse.</li>
            <li>Existen límites de publicaciones y comentarios por hora para prevenir abusos y publicaciones automatizadas.</li>
          </ul>
          <h2>Reportes y moderación</h2>
          <p>
            Cualquier miembro puede reportar contenido. Cuando {AUTO_HIDE_REPORTS} personas distintas reportan una misma publicación o comentario, se oculta de forma preventiva hasta que el equipo de moderación lo revise.
          </p>
          <p>
            Moderación puede aprobar, ocultar, rechazar, cerrar a comentarios o archivar conversaciones, y suspender cuentas que infrinjan estas normas de forma reiterada. Todas las acciones de moderación quedan registradas.
          </p>
          <h2>Privacidad</h2>
          <p>
            Tu perfil público muestra solo lo que tú decides: nombre, especialidad, biografía, intereses, organización (opcional) y enlaces. Tu correo nunca es público. Más detalles en la <Link href="/privacidad">política de privacidad</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
