import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero, SectionHead } from "@/components/ui/primitives";
import { contentSource } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sobre Datos con Datos",
  description: "Línea editorial, principios y propósito de Datos con Datos, medio de educación y divulgación tecnológica.",
  path: "/datos-con-datos/sobre-nosotros",
});

const principles = [
  { title: "Claridad antes que jerga", text: "Explicamos con palabras cotidianas. Si usamos un término técnico, lo definimos." },
  { title: "Rigor y fuentes", text: "Cada afirmación relevante se respalda con fuentes que el lector puede revisar." },
  { title: "Pensamiento crítico", text: "Mostramos beneficios y límites. No vendemos tecnología: la explicamos." },
  { title: "Para todo público", text: "Escribimos para quien quiere entender, no solo para especialistas." },
  { title: "Correcciones visibles", text: "Si cometemos un error, lo corregimos y lo indicamos en el artículo." },
  { title: "Independencia", text: "Las menciones a productos o empresas responden a criterios editoriales, no comerciales." },
];

export default async function AboutPage() {
  const pillars = await contentSource.listPillars();
  return (
    <>
      <PageHero
        brandSurface
        eyebrow="Identidad editorial"
        title="Un medio para comprender el mundo digital."
        lead="Datos con Datos (DCD) es un medio de educación y divulgación tecnológica. Ayudamos a las personas a comprender las herramientas que usan todos los días y las tecnologías que están transformando el futuro."
        breadcrumbs={[{ name: "Datos con Datos", href: "/datos-con-datos" }, { name: "Sobre DCD" }]}
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <span className="eyebrow">Propósito</span>
            <p className="h2">{site.tagline}</p>
          </div>
          <div className="stack stack--lg">
            <p className="lead">
              La tecnología condiciona cómo trabajamos, aprendemos, nos informamos y participamos en sociedad. Comprenderla ya no es un asunto de especialistas: es parte de la ciudadanía.
            </p>
            <p className="muted">
              Por eso DCD combina lenguaje sencillo con rigor técnico. Cada artículo busca responder una pregunta concreta, explicar cómo funciona algo y ofrecer criterios para usarlo mejor. Usamos diagramas que explican en lugar de decorar, y citamos fuentes que cualquiera puede revisar.
            </p>
          </div>
        </div>
      </section>
      <section className="section section--white section--bordered">
        <div className="container">
          <SectionHead eyebrow="Principios editoriales" title="Cómo escribimos." />
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
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Qué cubrimos" title="Seis pilares editoriales." />
          <ul role="list" className="grid grid--3">
            {pillars.map((p) => (
              <li key={p.slug} className="rule-top">
                <span className="mono muted">{p.number}</span>
                <h3 className="h4" style={{ margin: "var(--space-2) 0" }}>
                  <Link href={`/datos-con-datos/articulos?pilar=${p.slug}`}>{p.name}</Link>
                </h3>
                <p className="small muted">{p.description}</p>
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ marginTop: "var(--space-8)" }}>
            ¿Encontraste un error o quieres proponer un tema? <Link href="/contacto?tipo=general">Escríbenos</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
