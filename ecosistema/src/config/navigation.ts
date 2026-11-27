export type Brand = "dcd" | "consultoria" | "comunidad";

export interface NavLink {
  href: string;
  label: string;
  description?: string;
}

export interface NavSection {
  brand: Brand;
  href: string;
  label: string;
  verb: string;
  summary: string;
  links: NavLink[];
}

/** Arquitectura de información del ecosistema: una sola fuente para header, footer, móvil y sitemap. */
export const navSections: NavSection[] = [
  {
    brand: "dcd",
    href: "/datos-con-datos",
    label: "Datos con Datos",
    verb: "Explica",
    summary: "Divulgación tecnológica para comprender el mundo digital, con lenguaje claro y rigor.",
    links: [
      { href: "/datos-con-datos", label: "Portada", description: "Lo más reciente y los pilares editoriales." },
      { href: "/datos-con-datos/articulos", label: "Artículos", description: "Explicaciones, análisis y guías prácticas." },
      { href: "/datos-con-datos/recursos", label: "Recursos", description: "Glosarios, guías y material para aprender." },
      { href: "/datos-con-datos/sobre-nosotros", label: "Sobre DCD", description: "Línea editorial y principios." },
    ],
  },
  {
    brand: "consultoria",
    href: "/consultoria",
    label: "Consultoría",
    verb: "Asesora",
    summary: "Estrategia, arquitectura y gobierno de datos conectados con los objetivos del negocio.",
    links: [
      { href: "/consultoria", label: "Enfoque", description: "Cómo trabajo y en qué puedo ayudar." },
      { href: "/consultoria/servicios", label: "Servicios", description: "Diagnóstico, arquitectura, gobierno y Data & AI." },
      { href: "/consultoria/talleres", label: "Talleres", description: "Formación para equipos e instituciones." },
      { href: "/consultoria/experiencia", label: "Experiencia", description: "Trayectoria y forma de trabajo." },
    ],
  },
  {
    brand: "comunidad",
    href: "/comunidad",
    label: "Comunidad",
    verb: "Conecta",
    summary: "Profesionales que comparten desafíos reales, propuestas y encuentros en torno a los datos.",
    links: [
      { href: "/comunidad", label: "Inicio", description: "Actividad reciente y temas populares." },
      { href: "/comunidad/discusiones", label: "Discusiones", description: "Desafíos y preguntas de la práctica." },
      { href: "/comunidad/propuestas", label: "Propuestas", description: "Ideas e iniciativas para construir juntos." },
      { href: "/comunidad/eventos", label: "Eventos", description: "Charlas, workshops y encuentros." },
      { href: "/comunidad/recursos", label: "Recursos", description: "Material compartido por la comunidad." },
    ],
  },
];

export function getNavSection(brand: Brand): NavSection {
  const section = navSections.find((s) => s.brand === brand);
  if (!section) throw new Error(`Sección desconocida: ${brand}`);
  return section;
}
