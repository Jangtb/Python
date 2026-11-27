import Link from "next/link";
import type { Metadata } from "next";
import { social } from "@/config/site";
import { ArrowUpRight } from "@/components/ui/icons";
import { EmptyState, PageHero, SectionHead } from "@/components/ui/primitives";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Recursos para aprender",
  description: "Glosario tecnológico en lenguaje claro, lecturas recomendadas y material audiovisual de Datos con Datos.",
  path: "/datos-con-datos/recursos",
});

export default async function ResourcesPage() {
  const [glossary, resources] = await Promise.all([contentSource.listGlossary(), contentSource.listLearningResources()]);
  const letters = Array.from(new Set(glossary.map((g) => g.term[0]!.toUpperCase())));
  const channels = [
    { name: "YouTube", url: social.youtube, text: "Explicaciones en video." },
    { name: "Instagram", url: social.instagram, text: "Ideas breves y visuales." },
    { name: "TikTok", url: social.tiktok, text: "Conceptos en un minuto." },
    { name: "LinkedIn", url: social.linkedin, text: "Análisis y conversación profesional." },
  ];
  const activeChannels = channels.filter((c) => c.url);

  return (
    <>
      <PageHero
        eyebrow="Datos con Datos"
        title="Recursos para aprender"
        lead="Un glosario en lenguaje claro y una selección de fuentes confiables para seguir aprendiendo por tu cuenta."
        breadcrumbs={[{ name: "Datos con Datos", href: "/datos-con-datos" }, { name: "Recursos" }]}
      />

      <section className="section" aria-labelledby="glosario">
        <div className="container split split--aside">
          <div>
            <SectionHead id="glosario" eyebrow="Glosario" title="Conceptos esenciales, sin jerga innecesaria." />
            <nav aria-label="Letras del glosario" className="chip-nav" style={{ marginBottom: "var(--space-6)" }}>
              {letters.map((l) => (
                <a key={l} href={`#letra-${l}`} className="chip">
                  {l}
                </a>
              ))}
            </nav>
            <dl className="spec-table">
              {glossary.map((g, i) => {
                const first = i === 0 || glossary[i - 1]!.term[0]!.toUpperCase() !== g.term[0]!.toUpperCase();
                return (
                  <div key={g.term} id={first ? `letra-${g.term[0]!.toUpperCase()}` : undefined}>
                    <dt>
                      <strong style={{ color: "var(--text)" }}>{g.term}</strong>
                    </dt>
                    <dd>
                      {g.definition}
                      {g.related && (
                        <>
                          {" "}
                          <Link href={`/datos-con-datos/articulos/${g.related}`}>Leer más</Link>
                        </>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
          <aside className="stack stack--lg" aria-labelledby="lecturas">
            <h2 id="lecturas" className="eyebrow">
              Fuentes recomendadas
            </h2>
            {resources.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="card card--interactive card__link">
                <span className="card__meta">
                  <span className="badge">{r.kind}</span>
                  <span>{r.publisher}</span>
                </span>
                <span className="h4 cluster" style={{ ["--cluster-gap" as string]: "0.35rem" }}>
                  {r.title} <ArrowUpRight size={14} />
                </span>
                <span className="small muted">{r.description}</span>
              </a>
            ))}
          </aside>
        </div>
      </section>

      <section className="section section--white section--bordered" aria-labelledby="audiovisual">
        <div className="container">
          <SectionHead id="audiovisual" eyebrow="Audiovisual y redes" title="Datos con Datos en otros formatos." />
          {activeChannels.length ? (
            <ul role="list" className="grid grid--4">
              {activeChannels.map((c) => (
                <li key={c.name}>
                  <a href={c.url!} target="_blank" rel="noopener noreferrer" className="card card--interactive card__link" style={{ height: "100%" }}>
                    <span className="h4">{c.name}</span>
                    <span className="small muted">{c.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Los canales audiovisuales aún no están configurados.">
              Se mostrarán aquí al definir NEXT_PUBLIC_YOUTUBE_URL, NEXT_PUBLIC_INSTAGRAM_URL, NEXT_PUBLIC_TIKTOK_URL o NEXT_PUBLIC_LINKEDIN_URL. Los artículos ya admiten videos de YouTube incrustados con carga diferida.
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
