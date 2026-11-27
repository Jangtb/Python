import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Manrope, Space_Grotesk } from "next/font/google";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@/components/layout/Analytics";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600"], variable: "--ff-space-grotesk", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], variable: "--ff-manrope", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--ff-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--ff-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Tecnología, datos y comunidad`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.ecosystemName,
  openGraph: { siteName: site.ecosystemName, locale: site.locale, type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F7F8FA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${spaceGrotesk.variable} ${manrope.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
