import Script from "next/script";
import { analytics } from "@/config/site";

/** Plausible: sin cookies ni datos personales. Solo se carga si está configurado. */
export function Analytics() {
  if (!analytics.plausibleDomain) return null;
  return <Script defer data-domain={analytics.plausibleDomain} src={analytics.plausibleSrc} strategy="afterInteractive" />;
}
