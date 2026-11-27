import Link from "next/link";
import type { Metadata } from "next";
import { contactChannels, site } from "@/config/site";
import { engagementSteps, focusAreas, isProvisional, principles, profile } from "@/content/consulting";
import { Portrait } from "@/components/consulting/Portrait";
import { ArrowRight } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/JsonLd";
import { CtaBand, Provisional, SectionHead } from "@/components/ui/primitives";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Consultoría en estrategia, arquitectura y gobierno de datos",
  description: profile.statement,
  path: "/consultoria",
  type: "profile",
});

export default async function ConsultingPage() {
  const groups = await contentSource.listServiceGroups();
  return (
    <>
      {/* Schema Person solo cuando la identidad es real (no provisional). */}
      {!isProvisional("name") && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            jobTitle: profile.headline,
            description: profile.statement,
            url: `${site.url}/consultoria`,
            knowsAbout: focusAreas.map((f) => f.name),
          }}
        />
      )}

      <header className="page-hero page-hero--brand">
        <div className="container">
          <div className="split" style={{ alignItems: "center" }}>
            <div style={{ maxWidth: 420, width: "100%" }}>
              <Portrait />
            </div>
            <div className="stack stack--lg">
              <span className="eyebrow">{profile.headline}</span>
              <h1 className="h1">Datos que se entienden, se gobiernan y generan valor.</h1>
              <p className="lead">{profile.statement}</p>
              <p className="small muted">
                <Provisional when={isProvisional("name")}>{profile.name}</Provisional> ·{" "}
                <Provisional when={isProvisional("location")}>{profile.location}</Provisional>
              </p>
              <div className="cluster">
                <Link href="/contacto?tipo=consultoria" className="btn btn--accent btn--lg">
                  Conversemos sobre tu desafío
                </Link>
                {contactChannels.schedulingUrl && (
                  <a href={contactChannels.schedulingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--lg">
                    Agendar una reunión
                  </a>
                )}
                <WhatsAppLink message="Hola, vengo del sitio de Datos con Datos y me gustaría conversar sobre una consultoría." />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" aria-labelledby="enfoque">
        <div className="container split">
          <div className="stack">
            <span className="eyebrow">Enfoque</span>
            <h2 id="enfoque" className="h2">
              Conectar la tecnología con las decisiones del negocio.
            </h2>
            <p className="muted">
              <Provisional when={isProvisional("shortBio")}>{profile.shortBio}</Provisional>
            </p>
          </div>
          <div className="principles">
            {principles.map((p) => (
              <div key={p.title} className="principle">
                <h3 className="h4">{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--white section--bordered" aria-labelledby="areas">
        <div className="container">
          <SectionHead
            id="areas"
            eyebrow="Especialización"
            title="Dónde puedo ayudarte."
            action={
              <Link href="/consultoria/servicios" className="link-arrow">
                Ver catálogo de servicios <span aria-hidden="true"><ArrowRight size={14} /></span>
              </Link>
            }
          />
          <div className="grid grid--4">
            {groups.map((g, i) => (
              <Link key={g.slug} href={`/consultoria/servicios#${g.slug}`} className="card card--interactive card__link">
                <span className="mono muted">0{i + 1}</span>
                <h3 className="h4">{g.name}</h3>
                <p className="small muted">{g.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="proceso">
        <div className="container">
          <SectionHead id="proceso" eyebrow="Cómo trabajamos" title="Un proceso simple y transparente." />
          <ol role="list" className="grid grid--4">
            {engagementSteps.map((s, i) => (
              <li key={s.step} className="rule-top">
                <span className="mono muted">Paso {i + 1}</span>
                <h3 className="h4" style={{ margin: "var(--space-2) 0" }}>
                  {s.step}
                </h3>
                <p className="small muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <CtaBand eyebrow="Primer paso" title="Cuéntame tu contexto." text="Una conversación inicial sin costo para entender el desafío y ver si tiene sentido trabajar juntos.">
            <Link href="/contacto?tipo=consultoria" className="btn btn--light btn--lg">
              Escribir una solicitud
            </Link>
          </CtaBand>
        </div>
      </section>
    </>
  );
}
