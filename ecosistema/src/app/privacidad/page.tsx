import type { Metadata } from "next";
import { PageHero } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacidad",
  description: "Qué datos personales recopila Datos con Datos, para qué los usa y cómo ejercer tus derechos.",
  path: "/privacidad",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacidad" lead="Recopilamos solo lo necesario para que el sitio funcione y para responderte." />
      <section className="section">
        <div className="container container--narrow prose">
          <div className="callout">
            <strong className="callout__title">Borrador base</strong>
            Este texto describe el funcionamiento técnico real del sitio. Debe ser revisado y completado por la persona responsable (identidad del responsable, datos de contacto y legislación aplicable) antes de la publicación.
          </div>
          <h2>Qué datos tratamos</h2>
          <ul>
            <li><strong>Cuenta de la comunidad:</strong> correo, contraseña (almacenada solo como hash irreversible), nombre visible, nombre de usuario y la información de perfil que decidas agregar.</li>
            <li><strong>Participación:</strong> publicaciones, comentarios, votos, reportes e inscripciones a eventos.</li>
            <li><strong>Solicitudes de contacto:</strong> nombre, organización (opcional), correo y el contenido de tu mensaje.</li>
            <li><strong>Boletín:</strong> correo, fecha y texto del consentimiento otorgado.</li>
          </ul>
          <h2>Cookies y analítica</h2>
          <p>Usamos una única cookie técnica para mantener tu sesión iniciada. Si la analítica está activa, usamos Plausible, que no utiliza cookies ni recopila datos personales.</p>
          <p>Los videos de YouTube solo se cargan cuando decides reproducirlos, desde el dominio youtube-nocookie.com.</p>
          <h2>Qué es público</h2>
          <p>Tu perfil muestra solo nombre visible, usuario, especialidad, biografía, intereses, organización (si la agregas), enlaces y tus publicaciones. Tu correo nunca se muestra.</p>
          <h2>Proveedores</h2>
          <p>Según la configuración del sitio, el envío de correos puede realizarse mediante Resend y la gestión del boletín mediante Brevo. Solo se les comparte la información necesaria para cada envío.</p>
          <h2>Tus derechos</h2>
          <p>Puedes editar tu perfil en cualquier momento, darte de baja del boletín desde cualquier envío y solicitar el acceso, la rectificación o la eliminación de tus datos a través del formulario de contacto.</p>
        </div>
      </section>
    </>
  );
}
