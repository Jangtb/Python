import Link from "next/link";
import type { Metadata } from "next";
import { contactChannels } from "@/config/site";
import { ContactForm } from "@/components/forms/ContactForm";
import { CalendarIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/primitives";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contacto",
  description: "Solicita una consultoría, un diagnóstico, un taller o una asesoría, o propón una colaboración con Datos con Datos.",
  path: "/contacto",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ tipo?: string; ref?: string }> }) {
  const { tipo, ref } = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Conversemos."
        lead="Consultoría, diagnóstico, talleres, asesorías o una idea de colaboración: cuéntame de qué se trata y te respondo personalmente."
      />
      <section className="section">
        <div className="container split split--aside">
          <div>
            {ref && (
              <p className="alert alert--info" style={{ marginBottom: "var(--space-5)" }}>
                <span>
                  Consulta sobre: <strong style={{ display: "inline" }}>{ref.slice(0, 120)}</strong>
                </span>
              </p>
            )}
            <ContactForm defaultType={tipo} reference={ref} />
          </div>
          <aside className="stack stack--lg" aria-label="Otras formas de contacto">
            <div className="panel stack">
              <CalendarIcon size={22} />
              <h2 className="h4">Agenda una reunión</h2>
              {contactChannels.schedulingUrl ? (
                <>
                  <p className="small muted">Elige un horario disponible para una primera conversación de 30 minutos, sin intercambiar correos.</p>
                  <a href={contactChannels.schedulingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--accent">
                    Ver horarios disponibles
                  </a>
                </>
              ) : (
                <p className="small muted">La agenda en línea aún no está habilitada. Indica en el formulario que prefieres una videollamada y te propondré horarios.</p>
              )}
            </div>
            {contactChannels.whatsappNumber && (
              <div className="panel stack">
                <h2 className="h4">¿Prefieres WhatsApp?</h2>
                <p className="small muted">Para consultas breves o coordinar una llamada.</p>
                <WhatsAppLink message="Hola, vengo del sitio de Datos con Datos y quiero hacer una consulta." />
              </div>
            )}
            <div className="stack stack--sm">
              <h2 className="eyebrow">Otras vías</h2>
              <p className="small muted">
                ¿Una pregunta técnica que podría servir a otros? Plantéala en la <Link href="/comunidad/discusiones/nueva">Comunidad de Datos</Link>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
