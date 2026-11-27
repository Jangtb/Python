import Link from "next/link";
import { navSections } from "@/config/navigation";
import { site, social } from "@/config/site";
import { BrandGlyph } from "./Brandmark";

const socialLabels: Record<keyof typeof social, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export function Footer() {
  const networks = (Object.keys(social) as (keyof typeof social)[]).filter((k) => social[k]);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col stack">
            <Link href="/" className="brandmark" style={{ color: "#fff" }}>
              <BrandGlyph />
              Datos con Datos
            </Link>
            <p className="small" style={{ maxWidth: "36ch" }}>
              {site.tagline} Divulgación, consultoría y comunidad en torno a los datos y la tecnología.
            </p>
          </div>
          {navSections.map((s) => (
            <div key={s.brand} className="footer-col">
              <h2>{s.label}</h2>
              <ul role="list">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-col">
            <h2>Contacto</h2>
            <ul role="list">
              <li>
                <Link href="/contacto">Escribir</Link>
              </li>
              <li>
                <Link href="/cuenta/registro">Unirme a la comunidad</Link>
              </li>
              {networks.map((k) => (
                <li key={k}>
                  <a href={social[k]!} target="_blank" rel="noopener noreferrer">
                    {socialLabels[k]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Datos con Datos.</span>
          <span>
            <Link href="/privacidad">Privacidad</Link> · <Link href="/comunidad/normas">Normas de la comunidad</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
