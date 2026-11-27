/**
 * Configuración pública del sitio. Todo lo que dependa de datos reales
 * (redes, WhatsApp, agenda, analítica) se lee de variables NEXT_PUBLIC_*;
 * si no existen, la interfaz oculta el elemento o muestra un estado claro.
 */
function pub(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

export const site = {
  name: "Datos con Datos",
  shortName: "DCD",
  ecosystemName: "Ecosistema Datos con Datos",
  tagline: "Comprender la tecnología es comprender nuestro mundo.",
  description:
    "Un espacio para aprender sobre tecnología, compartir conocimiento, resolver desafíos y conectar personas que buscan generar valor a través de los datos y la innovación.",
  url: (pub(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "es_CL",
  lang: "es",
  defaultTimezone: pub(process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE) ?? "America/Santiago",
};

export const social = {
  youtube: pub(process.env.NEXT_PUBLIC_YOUTUBE_URL),
  instagram: pub(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  linkedin: pub(process.env.NEXT_PUBLIC_LINKEDIN_URL),
  tiktok: pub(process.env.NEXT_PUBLIC_TIKTOK_URL),
};

export const contactChannels = {
  /** Número internacional sin "+", espacios ni guiones. Ej.: 56912345678 */
  whatsappNumber: pub(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)?.replace(/\D/g, "") ?? null,
  /** URL pública de agenda (Cal.com u otro proveedor). */
  schedulingUrl: pub(process.env.NEXT_PUBLIC_SCHEDULING_URL),
};

export const analytics = {
  plausibleDomain: pub(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
  plausibleSrc: pub(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC) ?? "https://plausible.io/js/script.tagged-events.js",
};

export const antispam = {
  turnstileSiteKey: pub(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
};
